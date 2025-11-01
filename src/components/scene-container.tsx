
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useAudio } from '@/contexts/audio-provider';
import { MidiStatus, type MidiState } from '@/components/MidiStatus';
import { MidiControls } from '@/components/MidiControls';
import { LoadedAssets } from '@/hooks/use-scene-loader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ChordDisplay, type ChordInfo } from './ChordDisplay';
import { identifyChord, midiNoteToName, type LearnableItem, type LearnableChordProgression, getChordNotes } from '@/lib/music-theory';
import { LearningDisplay } from './LearningDisplay';
import { MidiLibrary } from './MidiLibrary';
import { QualityLevel } from './SettingsMenu';

type SelectableItem = LearnableItem | LearnableChordProgression;

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

const keyNameToMidiNote: { [key: string]: number } = Object.entries(
  midiNoteToKeyName
).reduce((acc, [key, value]) => ({ ...acc, [value]: parseInt(key) }), {});


interface SceneContainerProps {
  assets: LoadedAssets;
  learningMode: SelectableItem | null;
  isYoutubePlaying: boolean;
  toggleYoutubeAudio: () => void;
  progressionState: {
    currentChordIndex: number;
    completed: boolean;
  };
  onProgressionAdvance: (playedNotes: number[]) => boolean;
  onProgressionRestart: () => void;
  qualityLevel: QualityLevel;
}

export function SceneContainer({ 
    assets, 
    learningMode, 
    isYoutubePlaying,
    toggleYoutubeAudio,
    progressionState,
    onProgressionAdvance,
    onProgressionRestart,
    qualityLevel,
}: SceneContainerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { audioCache, isLoaded } = useAudio();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const activeAnimationsRef = useRef<{ [note: number]: THREE.AnimationAction }>({});
  const pianoModelRef = useRef<THREE.Group>();
  const keyMaterialsRef = useRef<{ [keyName: string]: THREE.MeshStandardMaterial }>({});
  const onOffButtonMaterialRef = useRef<THREE.MeshStandardMaterial>();

  const [midiState, setMidiState] = useState<MidiState>({ status: 'pending', lastMessage: null });
  const [pitchBend, setPitchBend] = useState(0); // -1 to 1
  const [modulation, setModulation] = useState(0); // 0 to 1
  const [masterVolume, setMasterVolume] = useState(1); // 0 to 1

  const activeNotesRef = useRef<number[]>([]);
  const [currentChord, setCurrentChord] = useState<ChordInfo | null>(null);

  const ssrPassRef = useRef<SSRPass>();
  const bloomPassRef = useRef<UnrealBloomPass>();

  const flashCorrectChord = useCallback(() => {
    setCurrentChord({ name: "Good job!", notes: [] });
    setTimeout(() => setCurrentChord(null), 1000);
  }, []);

  const playNoteAudio = useCallback((noteName: string, velocity: number) => {
    if (!isLoaded || !audioCache) return;
    const soundPath = `/sounds/piano/${noteName}.mp3`;
    const audio = audioCache[soundPath];
    
    if (audio) {
      audio.currentTime = 0;
      audio.volume = (velocity / 127) * masterVolume;
      audio.play().catch(e => console.error(`Error playing sound ${soundPath}:`, e));
    } else {
      console.warn(`Audio not found in cache for: ${soundPath}`)
    }
  }, [audioCache, isLoaded, masterVolume]);
  
  const applyEmissiveToNote = useCallback((note: number, turnOff = false) => {
    const keyName = midiNoteToKeyName[note];
    if (keyName) {
        const keyObject = pianoModelRef.current?.getObjectByName(keyName) as THREE.Mesh;
        if (keyObject && keyMaterialsRef.current[keyName]) {
            const material = keyMaterialsRef.current[keyName];
            keyObject.material = material;
            gsap.killTweensOf(material);
            if (turnOff) {
                gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
            } else {
                material.emissive.set('#87CEEB'); // Light blue for learning
                gsap.to(material, { emissiveIntensity: 1.5, duration: 0.3 });
            }
        }
    }
  }, []);

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

  const handleNoteOff = useCallback((note: number) => {
    activeNotesRef.current = activeNotesRef.current.filter(n => n !== note);
    setCurrentChord(identifyChord(activeNotesRef.current));

    const notesToHighlight = getNotesToHighlight();
    
    const keyName = midiNoteToKeyName[note];
    if (!keyName) return;

    const action = activeAnimationsRef.current[note];
    if (action) {
        action.paused = false;
        action.timeScale = -1.5;
        action.play();
        delete activeAnimationsRef.current[note];
    }
    
    const material = keyMaterialsRef.current[keyName] as THREE.MeshStandardMaterial;
    if (material) {
        gsap.killTweensOf(material);
        if (notesToHighlight.includes(note)) {
            material.emissive.set('#87CEEB');
            gsap.to(material, { 
                emissiveIntensity: 1.5, 
                duration: 0.3,
            });
        } else {
            gsap.to(material, { emissiveIntensity: 0, duration: 0.3 });
        }
    }
  }, [getNotesToHighlight]);

  const handleNoteOn = useCallback((note: number, velocity: number) => {
    const activeAndNewNotes = [...new Set([...activeNotesRef.current, note])];

    if (learningMode && 'genre' in learningMode && onProgressionAdvance(activeAndNewNotes)) {
        flashCorrectChord();
    }

    if (!activeNotesRef.current.includes(note)) {
        activeNotesRef.current.push(note);
    }
    setCurrentChord(identifyChord(activeNotesRef.current));
    
    const keyName = midiNoteToKeyName[note];
    if (!keyName) return;
    
    playNoteAudio(keyName, velocity);

    const keyObject = pianoModelRef.current?.getObjectByName(keyName) as THREE.Mesh;
    const originalMaterial = keyMaterialsRef.current[keyName];

    if (keyObject && originalMaterial) {
        gsap.killTweensOf(originalMaterial);
        keyObject.material = originalMaterial;
        const isBlackKey = keyName.includes('_Sharp');
        originalMaterial.emissive.set(isBlackKey ? '#FFA500' : '#0504AA');
        gsap.to(originalMaterial, { emissiveIntensity: 8, duration: 0.1, onComplete: () => {
             const notesToHighlight = getNotesToHighlight();
             if(!notesToHighlight.includes(note)) {
                 gsap.to(originalMaterial, { emissiveIntensity: 0, duration: 0.3 });
             } else {
                 // If it is a learning key, restore its blue glow after flashing
                 originalMaterial.emissive.set('#87CEEB');
                 gsap.to(originalMaterial, { emissiveIntensity: 1.5, duration: 0.3 });
             }
        }});
    }

    if (activeAnimationsRef.current[note]) {
        activeAnimationsRef.current[note].stop();
    }
    
    const animationName = `${keyName}Action`;
    const clip = THREE.AnimationClip.findByName(assets.animations, animationName);
    
    if (clip && mixerRef.current) {
      const action = mixerRef.current.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.timeScale = 1.5;
      action.play();
      activeAnimationsRef.current[note] = action;
    }
  }, [playNoteAudio, assets.animations, getNotesToHighlight, learningMode, onProgressionAdvance, flashCorrectChord]);

   const revertAllKeyMaterials = useCallback(() => {
    if (!pianoModelRef.current) return;
    Object.values(keyMaterialsRef.current).forEach(material => {
        gsap.killTweensOf(material);
        material.emissiveIntensity = 0;
        material.emissive.set(0x000000);
    });
  }, []);

  useEffect(() => {
    revertAllKeyMaterials();
    const notesToHighlight = getNotesToHighlight();
    notesToHighlight.forEach(note => {
        applyEmissiveToNote(note);
    });
}, [learningMode, progressionState, revertAllKeyMaterials, getNotesToHighlight, applyEmissiveToNote]);

 const handleMidiMessage = useCallback((message: WebMidi.MIDIMessageEvent) => {
    const [command, data1, data2] = message.data;
    const commandType = command & 0xF0;
    const channel = command & 0x0F;

    let messageData = { command: commandType, channel, data1, data2, timestamp: Date.now() };
    setMidiState(prevState => ({ ...prevState, lastMessage: messageData }));

    switch (commandType) {
      case 0x90:
        if (data2 > 0) handleNoteOn(data1, data2);
        else handleNoteOff(data1);
        break;
      case 0x80:
        handleNoteOff(data1);
        break;
      case 0xB0:
        if (data1 === 1) setModulation(data2 / 127);
        else if (data1 === 7) setMasterVolume(data2 / 127);
        break;
      case 0xE0:
        const bendValue = (data2 << 7) | data1;
        const normalizedBend = (bendValue - 8192) / 8192;
        setPitchBend(normalizedBend);
        break;
    }
  }, [handleNoteOn, handleNoteOff]);


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

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, () => onMIDIFailure('Permission denied or MIDI not supported.'));
    } else {
       setMidiState({ status: 'unavailable', lastMessage: null, errorMessage: 'Web MIDI API is not supported in this browser.'});
    }
}, [handleMidiMessage]);

  useEffect(() => {
    if (!ssrPassRef.current || !bloomPassRef.current) return;

    const ssrPass = ssrPassRef.current;
    const bloomPass = bloomPassRef.current;
    
    switch(qualityLevel) {
        case 'Low':
            bloomPass.enabled = false;
            ssrPass.enabled = false;
            break;
        case 'Medium':
            bloomPass.enabled = true;
            bloomPass.strength = 0.1;
            
            ssrPass.opacity = 0.02;
            ssrPass.thickness = 0.1;
            if (ssrPass.material?.uniforms?.uIor) ssrPass.material.uniforms.uIor.value = 1.45;
            ssrPass.maxDistance = 10;
            ssrPass.maxRoughness = 0.1;
            if (ssrPass.material?.uniforms?.uJitter) ssrPass.material.uniforms.uJitter.value = 0.3;
            
            break;
        case 'High':
            bloomPass.enabled = true;
            bloomPass.strength = 0.2;

            ssrPass.opacity = 0.02;
            ssrPass.thickness = 0.1;
            if (ssrPass.material?.uniforms?.uIor) ssrPass.material.uniforms.uIor.value = 1.25;
            ssrPass.maxDistance = 50;
            ssrPass.maxRoughness = 0.1;
            if (ssrPass.material?.uniforms?.uJitter) ssrPass.material.uniforms.uJitter.value = 0.5;

            break;
    }

  }, [qualityLevel]);

  useEffect(() => {
    if (!mountRef.current || !assets || !assets.models) return;

    let renderer: WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let composer: EffectComposer | null = null;
    let animationFrameId: number;

    const initScene = async () => {
      const currentMount = mountRef.current!;
      
      const scene = new THREE.Scene();
      if (assets.envMap) {
        scene.environment = assets.envMap;
        scene.background = assets.envMap;
      }
      
      const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 2, 8);

      renderer = new WebGLRenderer({ antialias: false, alpha: true });
      
      let pixelRatio;
      switch(qualityLevel) {
        case 'Low':
            pixelRatio = 1;
            break;
        case 'Medium':
            pixelRatio = Math.min(window.devicePixelRatio, 1.5);
            break;
        case 'High':
            pixelRatio = Math.min(window.devicePixelRatio, 2);
            break;
        default:
            pixelRatio = Math.min(window.devicePixelRatio, 1.5);
            break;
      }
      renderer.setPixelRatio(pixelRatio);

      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      currentMount.appendChild(renderer.domElement);
      
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.maxPolarAngle = Math.PI / 2;
      controls.minAzimuthAngle = -Math.PI * (4 / 9);
      controls.maxAzimuthAngle = Math.PI * (4 / 9);


      const directionalLight = new THREE.DirectionalLight(0xE7D06E, 1);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      const ambientLight = new THREE.AmbientLight(0xE7D06E, 0.6);
      scene.add(ambientLight);

      Object.entries(assets.models!).forEach(([key, gltf]) => {
        const model = gltf.scene;
        
        model.position.set(0, -1, 0);
        scene.add(model);

        if (key === 'PIANO') {
          pianoModelRef.current = model;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                if (keyNameToMidiNote[child.name]) {
                    const newMaterial = child.material.clone() as THREE.MeshStandardMaterial;
                    newMaterial.emissive = new THREE.Color(0x000000);
                    newMaterial.emissiveIntensity = 0;
                    child.material = newMaterial;
                    keyMaterialsRef.current[child.name] = newMaterial;
                }
                if (child.name === 'On_Off') {
                    const onOffMaterial = child.material.clone() as THREE.MeshStandardMaterial;
                    onOffMaterial.emissive = new THREE.Color(0xff00ff);
                    onOffMaterial.emissiveIntensity = 0.5;
                    child.material = onOffMaterial;
                    onOffButtonMaterialRef.current = onOffMaterial;
                }
            }
          });
        }
        if (key === 'Domain') {
          model.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                  if (child.material.name === 'Curtain' || child.material.name === 'Domain_1') {
                      child.userData.excludeFromSSR = true;
                  }
              }
          });
        }
      });
      
      if (assets.animations && assets.animations.length > 0 && pianoModelRef.current) {
        mixerRef.current = new THREE.AnimationMixer(pianoModelRef.current);
      }
      
      if (pianoModelRef.current) {
        const box = new THREE.Box3().setFromObject(pianoModelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.lookAt(center);
      }

      gsap.to(camera.position, {
        x: -0.1,
        y: 6,
        z: 2,
        duration: 4,
        onUpdate: () => {
            controls?.update();
        },
        onComplete: () => {
            if (qualityLevel === 'Low' || !ssrPassRef.current) return;
            
            const ssrPass = ssrPassRef.current;
            const targetOpacity = qualityLevel === 'Medium' ? 0.1 : 0.2;
            
            ssrPass.enabled = true;
            if(ssrPass) {
                gsap.to(ssrPass, {
                    opacity: targetOpacity,
                    duration: 0.2, // 2-second fade-in
                    ease: 'power1.inOut'
                });
            }
        }
      });

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      const meshesToReflect: THREE.Mesh[] = [];
        scene.traverse(obj => {
            if (obj instanceof THREE.Mesh && !obj.userData.excludeFromSSR) {
                meshesToReflect.push(obj);
            }
        });

      const ssrPass = new SSRPass({
        renderer,
        scene,
        camera,
        width: currentMount.clientWidth,
        height: currentMount.clientHeight,
        groundReflector: null,
        selects: meshesToReflect,
      });
       // Start with SSR disabled, it will be faded in after the intro animation.
      ssrPass.enabled = false;
      ssrPassRef.current = ssrPass;
      
      composer.addPass(ssrPass);
      
      const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.2, 0.3, 0.65 );
      bloomPassRef.current = bloomPass;
      composer.addPass(bloomPass);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();

        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }

        controls?.update();
        composer?.render(delta);
      }
      animate();

      const handleResize = () => {
        if (mountRef.current && renderer) {
          const { clientWidth, clientHeight } = mountRef.current;
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight);
          composer?.setSize(clientWidth, clientHeight);
        }
      };
      
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onClick = (event: MouseEvent) => {
        if (!pianoModelRef.current || !renderer) return;

        event.preventDefault();
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObject(pianoModelRef.current, true);

        if (intersects.length > 0) {
          let intersectedObject = intersects[0].object;
          if (intersectedObject instanceof THREE.Mesh) {
              const objectName = intersectedObject.name;
              
              if (objectName === 'On_Off') {
                return;
              }

              const midiNote = keyNameToMidiNote[objectName];
              if (midiNote) {
                  handleNoteOn(midiNote, 100);
                  setTimeout(() => handleNoteOff(midiNote), 150);
              }
          }
        }
      };

      renderer.domElement.addEventListener('click', onClick);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (renderer?.domElement) {
          renderer.domElement.removeEventListener('click', onClick);
        }
        cancelAnimationFrame(animationFrameId);
        controls?.dispose();
        if (composer) {
            composer.passes.forEach(pass => pass.dispose?.());
        }
        renderer?.dispose();
        if (currentMount && renderer?.domElement) {
          try {
            currentMount.removeChild(renderer.domElement);
          } catch(e) { /* ignore */ }
        }
      };
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [assets, handleMidiMessage, handleNoteOn, handleNoteOff, qualityLevel]);

  return (
    <div className="absolute inset-0 w-full h-full">
       <MidiStatus state={midiState} />
       <MidiControls 
          pitchBend={pitchBend} 
          modulation={modulation}
          volume={masterVolume}
          isYoutubePlaying={isYoutubePlaying}
          toggleYoutubeAudio={toggleYoutubeAudio}
        />
       <MidiLibrary
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
        />
       <LearningDisplay 
          item={learningMode} 
          progressionState={progressionState}
          onProgressionRestart={onProgressionRestart}
        />
       <ChordDisplay chordInfo={currentChord} />
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
    

    