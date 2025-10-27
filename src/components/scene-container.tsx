
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useAudio } from '@/contexts/audio-provider';
import { MidiStatus, type MidiState } from '@/components/MidiStatus';
import { MidiControls } from '@/components/MidiControls';
import { LoadedAssets } from '@/hooks/use-scene-loader';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, DepthOfFieldEffect, SMAAEffect, SMAAPreset } from 'postprocessing';
import { gsap } from 'gsap';
import { ChordDisplay, type ChordInfo } from './ChordDisplay';
import { identifyChord, midiNoteToName, type LearnableItem } from '@/lib/music-theory';
import { LearningDisplay } from './LearningDisplay';


const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normal;
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hologramFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    // Consistent scanline effect using UVs, now more pronounced
    float scanline = sin(vUv.y * 300.0 + uTime * -5.0) * 0.1 + 0.9;

    // Flicker effect
    float flicker = random(vec2(uTime * 0.5, 0.0)) * 0.4 + 0.6;
    
    // Base glow (rim light effect)
    float glow = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
    glow = pow(glow * 1.2, 2.0);

    vec3 finalColor = uColor * glow * scanline * flicker;
    
    // Increased opacity - base opacity is higher now
    float alpha = glow * scanline * flicker * 0.7 + 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

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
  learningMode: LearnableItem | null;
  onToggleLearnMenu: () => void;
  isLearnMenuOpen: boolean;
  isYoutubePlaying: boolean;
  toggleYoutubeAudio: () => void;
}

export function SceneContainer({ assets, learningMode, onToggleLearnMenu, isLearnMenuOpen, isYoutubePlaying, toggleYoutubeAudio }: SceneContainerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { audioCache, isLoaded } = useAudio();
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const activeAnimationsRef = useRef<{ [note: number]: THREE.AnimationAction }>({});
  const pianoModelRef = useRef<THREE.Group>();
  const sunMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const keyMaterialsRef = useRef<{ [keyName: string]: THREE.MeshStandardMaterial }>({});
  const hologramMaterialsRef = useRef<{ [keyName: string]: THREE.ShaderMaterial }>({});
  const onOffButtonMaterialRef = useRef<THREE.MeshStandardMaterial>();

  const [midiState, setMidiState] = useState<MidiState>({ status: 'pending', lastMessage: null });
  const [pitchBend, setPitchBend] = useState(0); // -1 to 1
  const [modulation, setModulation] = useState(0); // 0 to 1
  const [masterVolume, setMasterVolume] = useState(1); // 0 to 1

  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [currentChord, setCurrentChord] = useState<ChordInfo | null>(null);

  const [sunColor, setSunColor] = useState('#ffddaa');
  const [sunIntensity, setSunIntensity] = useState(1.3);

  useEffect(() => {
    if (activeNotes.length > 0) {
      const chord = identifyChord(activeNotes);
      setCurrentChord(chord);
    } else {
      setCurrentChord(null);
    }
  }, [activeNotes]);

   const revertAllToOriginalMaterial = useCallback(() => {
    if (!pianoModelRef.current) return;
    pianoModelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && keyMaterialsRef.current[child.name]) {
            child.material = keyMaterialsRef.current[child.name];
        }
    });
  }, []);

  const applyHologramToNote = useCallback((note: number) => {
      const keyName = midiNoteToKeyName[note];
      if (keyName) {
          const keyObject = pianoModelRef.current?.getObjectByName(keyName) as THREE.Mesh;
          if (keyObject) {
              if (!hologramMaterialsRef.current[keyName]) {
                  const isBlackKey = keyName.includes('_Sharp');
                  const hologramMaterial = new THREE.ShaderMaterial({
                      uniforms: {
                          uTime: { value: 0 },
                          uColor: { value: new THREE.Color(isBlackKey ? '#FF8C00' : '#00FFFF') }
                      },
                      vertexShader,
                      fragmentShader: hologramFragmentShader,
                      transparent: true,
                      blending: THREE.AdditiveBlending,
                      depthWrite: false,
                  });
                  hologramMaterialsRef.current[keyName] = hologramMaterial;
              }
              keyObject.material = hologramMaterialsRef.current[keyName];
          }
      }
  }, []);

  useEffect(() => {
    revertAllToOriginalMaterial();
    if (learningMode && pianoModelRef.current) {
        const notesToHighlight = learningMode.notes;
        notesToHighlight.forEach(note => {
           applyHologramToNote(note);
        });
    }
}, [learningMode, revertAllToOriginalMaterial, applyHologramToNote]);

  // Handle On/Off button glow based on menu state
  useEffect(() => {
    if (onOffButtonMaterialRef.current) {
        gsap.to(onOffButtonMaterialRef.current, {
            emissiveIntensity: isLearnMenuOpen ? 5 : 0.5,
            duration: 0.3
        });
    }
  }, [isLearnMenuOpen]);

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

  const handleNoteOn = useCallback((note: number, velocity: number) => {
    setActiveNotes(prev => {
        if (prev.includes(note)) return prev;
        return [...prev, note].sort((a, b) => a - b)
    });

    const keyName = midiNoteToKeyName[note];
    if (!keyName) {
      console.log(`No key mapping for MIDI note: ${note}`);
      return;
    }
    
    playNoteAudio(keyName, velocity);

    const keyObject = pianoModelRef.current?.getObjectByName(keyName) as THREE.Mesh;
    const originalMaterial = keyMaterialsRef.current[keyName];

    if (keyObject && originalMaterial) {
        gsap.killTweensOf(originalMaterial);
        keyObject.material = originalMaterial;
        const isBlackKey = keyName.includes('_Sharp');
        originalMaterial.emissive.set(isBlackKey ? '#FFA500' : '#0504AA');
        originalMaterial.emissiveIntensity = 8;
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
      action.clampWhenFinished = true;
      action.timeScale = 1;
      action.play();
      activeAnimationsRef.current[note] = action;
    } else {
      console.warn(`Animation or Mixer not found for: ${animationName}`);
    }
  }, [playNoteAudio, assets.animations]);

  const handleNoteOff = useCallback((note: number) => {
    setActiveNotes(prev => prev.filter(n => n !== note));

    const keyName = midiNoteToKeyName[note];
    if (!keyName) return;
    
    const keyObject = pianoModelRef.current?.getObjectByName(keyName) as THREE.Mesh;
    const material = keyMaterialsRef.current[keyName] as THREE.MeshStandardMaterial;

    if (keyObject && material) {
        gsap.killTweensOf(material);
        material.emissiveIntensity = 0;

        if (learningMode && learningMode.notes.includes(note)) {
            applyHologramToNote(note);
        }
    }

    const action = activeAnimationsRef.current[note];
    if (action) {
        action.paused = false;
        action.timeScale = -1;
        action.play();
        delete activeAnimationsRef.current[note];
    }
  }, [learningMode, applyHologramToNote]);

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
    if (sunMaterialRef.current) {
        sunMaterialRef.current.emissive.set(sunColor);
        sunMaterialRef.current.emissiveIntensity = sunIntensity;
    }
  }, [sunColor, sunIntensity]);

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
      navigator.requestMIDIAccess().then(onMIDISuccess, () => onMIDIFailure('Permission denied or MIDI not supported.'));
    } else {
       setMidiState({ status: 'unavailable', lastMessage: null, errorMessage: 'Web MIDI API is not supported in this browser.'});
    }
}, [handleMidiMessage]);


  useEffect(() => {
    if (!mountRef.current || !assets || !assets.models) return;

    let renderer: WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let composer: EffectComposer | null = null;
    let animationFrameId: number;

    const dofEffectRef = { current: null as DepthOfFieldEffect | null };

    const initScene = async () => {
      const currentMount = mountRef.current!;
      
      const scene = new THREE.Scene();
      if (assets.envMap) {
        scene.environment = assets.envMap;
        scene.background = assets.envMap;
      }
      
      const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 5.1, 3);

      renderer = new WebGLRenderer({ antialias: false, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
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

      const directionalLight = new THREE.DirectionalLight(0xE7D06E, 2);
      directionalLight.position.set(15, 1, 3);
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
        if (key === 'Sun') {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              sunMaterialRef.current = child.material;
              sunMaterialRef.current.emissive.set(sunColor);
              sunMaterialRef.current.emissiveIntensity = sunIntensity;
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

      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      
      const bloomEffect = new BloomEffect({
        intensity: 2,
        luminanceThreshold: 1.3,
        luminanceSmoothing: 0.25,
      });

      const dofEffect = new DepthOfFieldEffect(camera, {
        focusDistance: 0.0,
        focalLength: 0.048,
        bokehScale: 2.0,
        height: 480
      });
      dofEffectRef.current = dofEffect;


      const smaaEffect = new SMAAEffect({
          preset: SMAAPreset.MEDIUM
      });
      
      const effects: any[] = [bloomEffect, dofEffect, smaaEffect];

      const effectPass = new EffectPass(camera, ...effects);
      composer.addPass(effectPass);


      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();
        const elapsedTime = clockRef.current.getElapsedTime();

        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }

        Object.values(hologramMaterialsRef.current).forEach(mat => {
            mat.uniforms.uTime.value = elapsedTime;
        });
        
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
                onToggleLearnMenu();
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
        composer?.dispose();
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
  }, [assets, handleMidiMessage, handleNoteOn, handleNoteOff, onToggleLearnMenu]);

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
       {learningMode && <LearningDisplay item={learningMode} />}
       <ChordDisplay chordInfo={currentChord} />
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
