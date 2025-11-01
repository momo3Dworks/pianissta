
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import YouTube from 'react-youtube';
import { ClientScene } from '@/components/client-scene';
import { InteractionModal } from '@/components/interaction-modal';
import { AudioProvider } from '@/contexts/audio-provider';
import { LearningToolbar } from '@/components/LearningToolbar';
import { type LearnableItem, type LearnableChordProgression, getChordNotes } from '@/lib/music-theory';
import Image from 'next/image';
import { SettingsMenu, type QualityLevel } from '@/components/SettingsMenu';

type SelectableItem = LearnableItem | LearnableChordProgression;

interface ProgressionState {
    currentChordIndex: number;
    completed: boolean;
}

export default function Home() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [learningMode, setLearningMode] = useState<SelectableItem | null>(null);
  const [progressionState, setProgressionState] = useState<ProgressionState>({ currentChordIndex: 0, completed: false });
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('Medium');
  const playerRef = useRef<any>(null);

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

  const handleProgressionAdvance = useCallback((playedNotes: number[]) => {
    if (!learningMode || !('genre' in learningMode) || progressionState.completed) {
        return false;
    }

    const progression = learningMode as LearnableChordProgression;
    
    const currentChordName = progression.chords_C[progressionState.currentChordIndex];
    if (!currentChordName) return false;

    const currentChordNotes = getChordNotes(currentChordName).map(n => n % 12).sort();
    
    const playedNoteClasses = [...new Set(playedNotes.map(n => n % 12))].sort();

    const isCorrect = currentChordNotes.length > 0 && currentChordNotes.length === playedNoteClasses.length && currentChordNotes.every((note, index) => note === playedNoteClasses[index]);

    if (isCorrect) {
        if (progressionState.currentChordIndex < progression.chords_C.length - 1) {
            setProgressionState(prev => ({ ...prev, currentChordIndex: prev.currentChordIndex + 1 }));
        } else {
            setProgressionState(prev => ({ ...prev, completed: true }));
        }
        return true; // Chord was correct
    }
    return false; // Chord was incorrect or incomplete
  }, [learningMode, progressionState]);


  const restartProgression = useCallback(() => {
    setProgressionState({ currentChordIndex: 0, completed: false });
  }, []);

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

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {!hasInteracted ? (
        <InteractionModal onInteract={handleInteraction} />
      ) : (
        <AudioProvider>
            <LearningToolbar
                onSelectItem={handleSelectItem}
                selectedItem={learningMode}
            />
            <SettingsMenu
                qualityLevel={qualityLevel}
                onQualityChange={handleQualityChange}
            />
          <ClientScene 
            learningMode={learningMode}
            progressionState={progressionState}
            onProgressionAdvance={handleProgressionAdvance}
            onProgressionRestart={restartProgression}
            isYoutubePlaying={isYoutubePlaying}
            toggleYoutubeAudio={toggleYoutubeAudio}
            qualityLevel={qualityLevel}
            />
        </AudioProvider>
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
