
"use client";

import { useAudio } from '@/contexts/audio-provider';
import { type LoadedAssets } from '@/hooks/use-scene-loader';
import dynamic from 'next/dynamic';
import { type LearnableItem, type LearnableChordProgression } from '@/lib/music-theory';
import { useCallback } from 'react';
import { QualityLevel } from './SettingsMenu';
import { ChordInfo } from './ChordDisplay';
import { MidiState } from './MidiStatus';
import * as THREE from 'three';

const SceneContainer = dynamic(() => import('./scene-container').then(mod => mod.SceneContainer), {
  ssr: false,
});

type SelectableItem = LearnableItem | LearnableChordProgression;

interface ClientSceneProps {
    assets: LoadedAssets;
    learningMode: SelectableItem | null;
    progressionState: {
        currentChordIndex: number;
        completed: boolean;
    };
    onProgressionRestart: () => void;
    qualityLevel: QualityLevel;
    onSceneInit: (args: {
        keyMaterials: Record<string, THREE.MeshStandardMaterial>;
        mixer: THREE.AnimationMixer | null;
    }) => void;
    onKeyClick: (note: number) => void;
    getNotesToHighlight: () => number[];
    updateKeyVisuals: (note: number, isPressed: boolean, velocity?: number) => void;
    currentChord: ChordInfo | null;
}

export function ClientScene({ 
    assets,
    learningMode, 
    progressionState, 
    onProgressionRestart,
    qualityLevel,
    onSceneInit,
    onKeyClick,
    getNotesToHighlight,
    updateKeyVisuals,
    currentChord,
}: ClientSceneProps) {

  const memoizedProgressionRestart = useCallback(onProgressionRestart, [onProgressionRestart]);
  const memoizedOnSceneInit = useCallback(onSceneInit, [onSceneInit]);
  const memoizedOnKeyClick = useCallback(onKeyClick, [onKeyClick]);
  const memoizedGetNotesToHighlight = useCallback(getNotesToHighlight, [getNotesToHighlight]);
  
  return <SceneContainer 
        assets={assets as LoadedAssets} 
        learningMode={learningMode}
        progressionState={progressionState}
        onProgressionRestart={memoizedProgressionRestart}
        qualityLevel={qualityLevel}
        onSceneInit={memoizedOnSceneInit}
        onKeyClick={memoizedOnKeyClick}
        getNotesToHighlight={memoizedGetNotesToHighlight}
        updateKeyVisuals={updateKeyVisuals}
        currentChord={currentChord}
        />;
}

    

    