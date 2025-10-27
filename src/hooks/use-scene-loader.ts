
"use client";

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';


const ASSETS_TO_LOAD = {
    models: {
        PIANO: '/models/PIANO.glb',
        Domain: '/models/Domain.glb',
        BackLight: '/models/BackLight.glb',
        stand: '/models/stand.glb',
        Sun: '/models/Sun.glb',
    },
    envMap: '/assets/piano_hdr_1_2k.hdr',
    fonts: {}
};

export interface LoadedAssets {
    models: { [key: string]: GLTF };
    animations: THREE.AnimationClip[];
    envMap: THREE.DataTexture;
    fonts: { [key: string]: Font };
}

export const useSceneLoader = ({ skip = false } = {}) => {
    const [assets, setAssets] = useState<Partial<LoadedAssets>>({});
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const totalAssetsRef = useRef(0);
    const loadedAssetsCountRef = useRef(0);

    useEffect(() => {
        if (skip) return;

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);
        const rgbeLoader = new RGBELoader();
        const ttfLoader = new TTFLoader();

        const modelEntries = Object.entries(ASSETS_TO_LOAD.models);
        const fontEntries = Object.entries(ASSETS_TO_LOAD.fonts);
        totalAssetsRef.current = modelEntries.length + fontEntries.length + (ASSETS_TO_LOAD.envMap ? 1 : 0);

        const updateProgress = () => {
            loadedAssetsCountRef.current++;
            const newProgress = (loadedAssetsCountRef.current / totalAssetsRef.current) * 100;
            setProgress(newProgress);
        };

        const loadAll = async () => {
            const loadedModels: { [key: string]: GLTF } = {};
            const loadedFonts: { [key: string]: Font } = {};
            const animations: THREE.AnimationClip[] = [];

            // Load Models
            for (const [key, path] of modelEntries) {
                const gltf = await gltfLoader.loadAsync(path);
                loadedModels[key] = gltf;
                if (key === 'PIANO' && gltf.animations) {
                    animations.push(...gltf.animations);
                }
                updateProgress();
            }

            // Load Fonts
            for (const [key, path] of fontEntries) {
                const fontData = await ttfLoader.loadAsync(path);
                loadedFonts[key] = new Font(fontData);
                updateProgress();
            }

            // Load Environment Map
            let envMap: THREE.DataTexture | undefined = undefined;
            if (ASSETS_TO_LOAD.envMap) {
                envMap = await rgbeLoader.loadAsync(ASSETS_TO_LOAD.envMap);
                envMap.mapping = THREE.EquirectangularReflectionMapping;
                updateProgress();
            }


            setAssets({
                models: loadedModels,
                animations,
                envMap,
                fonts: loadedFonts,
            });
            setIsLoaded(true);
        };

        loadAll().catch(error => {
            console.error("Failed to load scene assets:", error);
            // Optionally, handle error state here
        });

    }, [skip]);

    return { assets, progress, isLoaded };
};
