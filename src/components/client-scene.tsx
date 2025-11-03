
"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { type LoadedAssets } from '@/hooks/use-scene-loader';
import { type QualityLevel } from './SettingsMenu';
import * as THREE from 'three';

const SceneContainer = dynamic(() => import('./scene-container').then(mod => mod.SceneContainer), {
  ssr: false,
});

interface ClientSceneProps {
    assets: LoadedAssets;
    qualityLevel: QualityLevel;
    onSceneInit: (args: {
        keyMaterials: Record<string, THREE.MeshStandardMaterial>;
        mixer: THREE.AnimationMixer | null;
    }) => void;
    onKeyClick: (note: number) => void;
}

export const ClientScene = memo(function ClientScene({
    assets,
    qualityLevel,
    onSceneInit,
    onKeyClick,
}: ClientSceneProps) {
    return (
        <SceneContainer
            assets={assets}
            qualityLevel={qualityLevel}
            onSceneInit={onSceneInit}
            onKeyClick={onKeyClick}
        />
    );
});

ClientScene.displayName = 'ClientScene';
