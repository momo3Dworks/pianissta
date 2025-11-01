
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube from 'react-youtube';
import { ClientScene } from '@/components/client-scene';
import { InteractionModal } from '@/components/interaction-modal';
import { AudioProvider, useAudio } from '@/contexts/audio-provider';
import { LearningToolbar } from '@/components/LearningToolbar';
import { type LearnableItem, type LearnableChordProgression, getChordNotes, identifyChord, midiNoteToName } from '@/lib/music-theory';
import Image from 'next/image';
import { SettingsMenu, type QualityLevel } from '@/components/SettingsMenu';
import { useSceneLoader, type LoadedAssets } from '@/hooks/use-scene-loader';
import { MidiStatus, type MidiState, type MidiMessage } from '@/components/MidiStatus';
import { ChordInfo } from '@/components/ChordDisplay';
import { gsap } from 'gsap';
import * as THREE from 'three';

type SelectableItem = LearnableItem | LearnableChordProgression;

interface ProgressionState {
    currentChordIndex: number;
    completed: boolean;
}

const midiNoteToKeyName: { [key: number]: string } = {
  // White keys
  48: 'C3', 50: 'D3', 52: 'E3', 53: 'F3', 55: 'G3', 57: 'A3', 59: 'B3',
  60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4',
  72: 'C5', 74: 'D5', 76: 'E5', 77: 'F5', 79: 'G5', 81: 'A5', 83: 'B5',
  84: 'C6', 86: 'D6', 88: 'E6', 89: 'F6', 91: 'G6', 93: 'A6', 95: 'B6',
  96: 'C7',
  // Black keys
  49: 'C_Sharp3', 51: 'D_Sharp3', 54: 'F_Sharp3', 56: 'G_Sharp3', 58: 'A_Sharp3',
  61: 'C_Sharp4', 63: 'D_Sharp4', 66: 'F_Sharp4', 68: 'G_Sharp4', 70: 'A_Sharp4',
  73: 'C_Sharp5', 75: 'D_Sharp5', 78: 'F_Sharp5', 80: 'G_Sharp5', 82: 'A_Sharp5',
  85: 'C_Sharp6', 87: 'D_Sharp6', 90: 'F_Sharp6', 92: 'G_Sharp6', 94: 'A_Sharp6',
};


function MainContent() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [learningMode, setLearningMode] = useState<SelectableItem | null>(null);
  const [progressionState, setProgressionState] = useState<ProgressionState>({ currentChordIndex: 0, completed: false });
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('Medium');
  const playerRef = useRef<any>(null);

  const { audioCache, isLoaded: isAudioLoaded, progress: audioProgress } = useAudio();
  const { assets, isLoaded: areAssetsLoaded, progress: assetsProgress } = useSceneLoader({ skip: !isAudioLoaded });

  const isFullyLoaded = isAudioLoaded && areAssetsLoaded;

  const [midiState, setMidiState] = useState<MidiState>({ status: 'pending', lastMessage: null });
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [currentChord, setCurrentChord] = useState<ChordInfo | null>(null);

  const keyMaterialsRef = useRef<{ [keyName: string]: THREE.MeshStandardMaterial }>({});
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const activeAnimationsRef = useRef<{ [note: number]: THREE.AnimationAction }>({});
  const masterVolume = 1;


  let loadingStep = '';
  let loadingProgress = 0;
  if (!isAudioLoaded) {
    loadingStep = 'Loading Audio Assets...';
    loadingProgress = audioProgress;
  } else if (!areAssetsLoaded) {
    loadingStep = 'Loading 3D Assets...';
    loadingProgress = assetsProgress;
  }

  const handleInteraction = () => {
    setHasInteracted(true);
    if (playerRef.current) {
        playerRef.current.playVideo();
        setIsYoutubePlaying(true);
    }
  };

  const handleSelectItem = (item: SelectableItem | null) => {
    setLearningMode(item);
    setProgressionState({ currentChordIndex: 0, completed: false });
  }

  const getNotesToHighlight = useCallback(() => {
    if (!learningMode) return [];
    
    if ('genre' in learningMode) {
      const progression = learningMode as LearnableChordProgression;
      if (!progressionState.completed) {
        const currentChordName = progression.chords_C[progressionState.currentChordIndex];
        if (currentChordName) {
            return getChordNotes(currentChordName);
        }
      }
    } else {
      return learningMode.notes;
    }
    return [];
  }, [learningMode, progressionState]);

  const updateKeyVisuals = useCallback((note: number, isPressed: boolean, velocity: number = 100) => {
    const keyName = midiNoteToKeyName[note];
    if (!keyName || !assets.animations) return;

    // --- Material/Emissive Update ---
    const material = keyMaterialsRef.current[keyName] as THREE.MeshStandardMaterial;
    if (material) {
        gsap.killTweensOf(material);
        if (isPressed) {
            const isBlackKey = keyName.includes('_Sharp');
            const intensity = 2 + (velocity / 127) * 6;
            material.emissive.set(isBlackKey ? '#FFA500' : '#0504AA');
            gsap.to(material, { emissiveIntensity: intensity, duration: 0.1 });
        } else {
            const notesToHighlight = getNotesToHighlight();
            if (notesToHighlight.includes(note)) {
                material.emissive.set('#87CEEB'); // Learning color
                gsap.to(material, { emissiveIntensity: 1.5, duration: 0.3 });
            } else {
                gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
            }
        }
    }

    // --- Animation Update ---
    const animationName = `${keyName}Action`;
    const clip = THREE.AnimationClip.findByName(assets.animations, animationName);
    if(clip && mixerRef.current) {
        let action = activeAnimationsRef.current[note];
        if (!action) {
            action = mixerRef.current.clipAction(clip);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            activeAnimationsRef.current[note] = action;
        }
        
        action.paused = false;
        if (isPressed) {
            action.timeScale = 1.5;
            action.reset().play();
        } else {
            if (action.isRunning()) {
              action.timeScale = -1.5;
            } else { // If not running, play it backwards from the end
              action.reset().play();
              action.time = action.getClip().duration;
              action.timeScale = -1.5;
            }
        }
    }
  }, [assets.animations, getNotesToHighlight, mixerRef, activeAnimationsRef, keyMaterialsRef]);

  const playNoteAudio = useCallback((noteName: string, velocity: number) => {
    if (!isAudioLoaded || !audioCache || !noteName) return;
    const soundPath = `/sounds/piano/${noteName}.mp3`;
    const audio = audioCache[soundPath];
    
    if (audio) {
      audio.currentTime = 0;
      audio.volume = (velocity / 127) * masterVolume;
      audio.play().catch(e => console.error(`Error playing sound ${soundPath}:`, e));
    } else {
      console.warn(`Audio not found in cache for: ${soundPath}`)
    }
  }, [audioCache, isAudioLoaded, masterVolume]);


  const onProgressionAdvance = useCallback((playedNotes: number[]) => {
    if (!learningMode || !('genre' in learningMode) || progressionState.completed) {
        return false;
    }

    const progression = learningMode as LearnableChordProgression;
    const currentChordName = progression.chords_C[progressionState.currentChordIndex];
    if (!currentChordName) return false;

    const currentChordNotes = getChordNotes(currentChordName).map(n => n % 12).sort();
    const playedNoteClasses = [...new Set(playedNotes.map(n => n % 12))].sort();

    const isCorrect = currentChordNotes.length > 0 && 
                      currentChordNotes.length === playedNoteClasses.length && 
                      currentChordNotes.every((note, index) => note === playedNoteClasses[index]);

    if (isCorrect) {
        if (progressionState.currentChordIndex < progression.chords_C.length - 1) {
            setProgressionState(prev => ({ ...prev, currentChordIndex: prev.currentChordIndex + 1 }));
        } else {
            setProgressionState(prev => ({ ...prev, completed: true }));
        }
        return true;
    }
    return false;
  }, [learningMode, progressionState]);


  const restartProgression = useCallback(() => {
    setProgressionState({ currentChordIndex: 0, completed: false });
  }, []);

  const handleNoteOn = useCallback((note: number, velocity = 100) => {
    setActiveNotes(prev => {
        if (prev.includes(note)) return prev;
        const newNotes = [...prev, note];
        setCurrentChord(identifyChord(newNotes));
        return newNotes;
    });
  }, []);

  const handleNoteOff = useCallback((note: number) => {
    setActiveNotes(prev => {
        const notesPlayed = [...prev];
        const newNotes = prev.filter(n => n !== note);

        if (newNotes.length === 0 && notesPlayed.length > 0) {
            // Only advance progression when all keys are released
            if (learningMode && onProgressionAdvance(notesPlayed)) {
                 setCurrentChord({ name: "Good job!", notes: [] });
                 setTimeout(() => setCurrentChord(identifyChord(newNotes)), 1000);
            }
        }
        
        setCurrentChord(identifyChord(newNotes));
        return newNotes;
    });
  }, [onProgressionAdvance, learningMode]);


  const handleMidiMessage = useCallback((message: WebMidi.MIDIMessageEvent) => {
    const [command, data1, data2] = message.data;
    const commandType = command & 0xF0;
    const channel = command & 0x0F;

    let messageData = { command: commandType, channel, data1, data2, timestamp: Date.now() };
    setMidiState(prevState => ({ ...prevState, lastMessage: messageData }));

    switch (commandType) {
        case 0x90: // Note On
            if (data2 > 0) {
              handleNoteOn(data1, data2);
              playNoteAudio(midiNoteToKeyName[data1], data2);
              updateKeyVisuals(data1, true, data2);
            } else { // Note Off message sent as Note On with velocity 0
              handleNoteOff(data1);
              updateKeyVisuals(data1, false);
            }
            break;
        case 0x80: // Note Off
            handleNoteOff(data1);
            updateKeyVisuals(data1, false);
            break;
    }
  }, [handleNoteOn, handleNoteOff, playNoteAudio, updateKeyVisuals]);


  useEffect(() => {
    let midiAccess: WebMidi.MIDIAccess | null = null;
    
    const onMIDISuccess = (ma: WebMidi.MIDIAccess) => {
        midiAccess = ma;
        setMidiState({ status: 'connected', lastMessage: null });

        if (midiAccess.inputs.size === 0) {
            setMidiState({ status: 'disconnected', lastMessage: null });
        } else {
             midiAccess.inputs.forEach(input => {
                input.onmidimessage = handleMidiMessage;
            });
        }
      
        const onStateChange = (event: WebMidi.MIDIConnectionEvent) => {
          if (event.port.type === 'input') {
            const input = event.port as WebMidi.MIDIInput;
            if (event.port.state === 'connected') {
              input.onmidimessage = handleMidiMessage;
              if(midiAccess?.inputs.size > 0) {
                setMidiState({ status: 'connected', lastMessage: null });
              }
            } else if (event.port.state === 'disconnected') {
              input.onmidimessage = null;
              if (midiAccess?.inputs.size === 0) {
                setMidiState({ status: 'disconnected', lastMessage: null });
              }
            }
          }
        };

        midiAccess.addEventListener('statechange', onStateChange);

        return () => {
             if (midiAccess) {
                midiAccess.removeEventListener('statechange', onStateChange);
                midiAccess.inputs.forEach(input => {
                    input.onmidimessage = null;
                });
            }
        }
    };

    const onMIDIFailure = (msg: string) => {
        setMidiState({ status: 'error', lastMessage: null, errorMessage: msg });
    };

    if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, () => onMIDIFailure('Permission denied or MIDI not supported.'));
    } else {
       setMidiState({ status: 'unavailable', lastMessage: null, errorMessage: 'Web MIDI API is not supported in this browser.'});
    }
}, [handleMidiMessage]);


  useEffect(() => {
    if (learningMode && 'genre' in learningMode) {
      setProgressionState({ currentChordIndex: 0, completed: false });
    }
  }, [learningMode]);

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(4);
    if (hasInteracted) {
        playerRef.current.playVideo();
        setIsYoutubePlaying(true);
    }
  };

  const toggleYoutubeAudio = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isYoutubePlaying) {
        playerRef.current.pauseVideo();
    } else {
        playerRef.current.playVideo();
    }
    setIsYoutubePlaying(prev => !prev);
  }, [isYoutubePlaying]);

  const handleQualityChange = useCallback((level: QualityLevel) => {
    setQualityLevel(level);
  }, []);

  const onSceneInit = useCallback((initArgs: {
      keyMaterials: typeof keyMaterialsRef.current;
      mixer: typeof mixerRef.current;
  }) => {
      keyMaterialsRef.current = initArgs.keyMaterials;
      mixerRef.current = initArgs.mixer;
  }, []);

  const onKeyClick = useCallback((note: number) => {
    handleNoteOn(note);
    playNoteAudio(midiNoteToKeyName[note], 100);
    updateKeyVisuals(note, true, 100);
    setTimeout(() => {
      handleNoteOff(note);
      updateKeyVisuals(note, false);
    }, 150);
  }, [handleNoteOn, playNoteAudio, updateKeyVisuals, handleNoteOff]);


  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {!hasInteracted ? (
        <InteractionModal 
          onInteract={handleInteraction}
          isLoading={!isFullyLoaded}
          loadingStep={loadingStep}
          progress={loadingProgress}
        />
      ) : (
          <>
            <div
              className="fixed top-4 z-20 flex items-center gap-4 opacity-0 animate-slide-in-down"
              style={{
                animationDelay: '0.2s',
                left: '35%',
                transform: 'translateX(-50%)',
              }}
            >
                <div className="hidden min-[790px]:flex">
                    <MidiStatus state={midiState} isYoutubePlaying={isYoutubePlaying} toggleYoutubeAudio={toggleYoutubeAudio} />
                </div>
                <LearningToolbar
                    onSelectItem={handleSelectItem}
                    selectedItem={learningMode}
                />
            </div>


            <div 
              className="absolute top-4 right-4 z-20 opacity-0 animate-slide-in-down"
              style={{ animationDelay: '0.4s' }}
            >
              <SettingsMenu
                  qualityLevel={qualityLevel}
                  onQualityChange={handleQualityChange}
              />
            </div>


            <ClientScene 
              assets={assets as LoadedAssets}
              learningMode={learningMode}
              progressionState={progressionState}
              onProgressionRestart={restartProgression}
              qualityLevel={qualityLevel}
              onSceneInit={onSceneInit}
              onKeyClick={onKeyClick}
              getNotesToHighlight={getNotesToHighlight}
              updateKeyVisuals={updateKeyVisuals}
              currentChord={currentChord}
              />
        </>
      )}
       <div className="absolute -z-10 opacity-0">
         <YouTube
            videoId="vPhg6sc1Mk4"
            opts={{
                height: '0',
                width: '0',
                playerVars: {
                    autoplay: 0,
                    loop: 1,
                    playlist: 'vPhg6sc1Mk4',
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                },
            }}
            onReady={onPlayerReady}
            />
       </div>
       <Image
          src="/assets/Pianissta_Logo_tiny.webp"
          alt="Pianissta Logo"
          width={83}
          height={17}
          priority
          className="absolute bottom-4 right-4 z-0 opacity-40 pointer-events-none invert"
        />
    </main>
  );
}


export default function Home() {
    return (
        <AudioProvider>
            <MainContent />
        </AudioProvider>
    )
}

    

    

    
