
"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LoadedAssets } from '@/hooks/use-scene-loader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSRPass } from '../lib/Custom_SSRPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { QualityLevel } from './SettingsMenu';

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
  qualityLevel: QualityLevel;
  onSceneInit: (args: {
    keyMaterials: Record<string, THREE.MeshStandardMaterial>;
    mixer: THREE.AnimationMixer | null;
  }) => void;
  onKeyClick: (note: number) => void;
}

export function SceneContainer({
  assets,
  qualityLevel,
  onSceneInit,
  onKeyClick,
}: SceneContainerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pianoModelRef = useRef<THREE.Group>();
  const ssrPassRef = useRef<SSRPass>();
  const bloomPassRef = useRef<UnrealBloomPass>();

  useEffect(() => {
    if (!ssrPassRef.current || !bloomPassRef.current) return;

    const ssrPass = ssrPassRef.current;
    const bloomPass = bloomPassRef.current;

    switch (qualityLevel) {
      case 'Low':
        bloomPass.enabled = false;
        ssrPass.enabled = false;
        break;
      case 'Medium':
        bloomPass.enabled = true;
        bloomPass.strength = 0.1;
        ssrPass.blur = true;
        ssrPass.opacity = 0.2;
        ssrPass.thickness = 0.8;
        if (ssrPass.material?.uniforms?.uIor) ssrPass.material.uniforms.uIor.value = 1.45;
        ssrPass.maxDistance = 8;
        ssrPass.maxRoughness = 0.1;
        if (ssrPass.material?.uniforms?.uJitter) ssrPass.material.uniforms.uJitter.value = 0.3;

        break;
      case 'High':
        bloomPass.enabled = true;
        bloomPass.strength = 0.2;

        ssrPass.opacity = 0.3;
        ssrPass.thickness = 1.5;
        if (ssrPass.material?.uniforms?.uIor) ssrPass.material.uniforms.uIor.value = 1.25;
        ssrPass.maxDistance = 35;
        ssrPass.maxRoughness = 0.2;
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
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();

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
      switch (qualityLevel) {
        case 'Low':
          pixelRatio = 0.65;
          break;
        case 'Medium':
          pixelRatio = 0.85;
          break;
        case 'High':
          pixelRatio = 1.2;
          break;
        default:
          pixelRatio = 1;
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


      const directionalLight = new THREE.DirectionalLight(0xE7D06E, 0.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0xE7D06E, 0.2);
      scene.add(ambientLight);

      const keyMaterials: Record<string, THREE.MeshStandardMaterial> = {};

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
                keyMaterials[child.name] = newMaterial;
              }
            }
          });
          model.userData.keyMaterials = keyMaterials;
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
        mixer = new THREE.AnimationMixer(pianoModelRef.current);
      }

      onSceneInit({ keyMaterials, mixer });

      if (pianoModelRef.current) {
        const box = new THREE.Box3().setFromObject(pianoModelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.lookAt(center);
      }

      gsap.to(camera.position, {
        x: 0.0,
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
          if (ssrPass) {
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
      ssrPass.enabled = false;
      ssrPassRef.current = ssrPass;

      composer.addPass(ssrPass);

      const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.3, 0.65);
      bloomPassRef.current = bloomPass;
      composer.addPass(bloomPass);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (mixer) {
          mixer.update(delta);
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
              onKeyClick(midiNote);
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
          } catch (e) { /* ignore */ }
        }
      };
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [assets, onSceneInit, onKeyClick]); // Only re-run when these essential, stable props change.

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
