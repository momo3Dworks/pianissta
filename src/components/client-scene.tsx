
"use client";

import { useAudio } from '@/contexts/audio-provider';
import { useSceneLoader, type LoadedAssets } from '@/hooks/use-scene-loader';
import { UnifiedLoader } from './unified-loader';
import dynamic from 'next/dynamic';
import { type LearnableItem, type LearnableChordProgression } from '@/lib/music-theory';
import { useCallback } from 'react';
import { QualityLevel } from './SettingsMenu';

const SceneContainer = dynamic(() => import('./scene-container').then(mod => mod.SceneContainer), {
  ssr: false,
});

type SelectableItem = LearnableItem | LearnableChordProgression;

interface ClientSceneProps {
    learningMode: SelectableItem | null;
    progressionState: {
        currentChordIndex: number;
        completed: boolean;
    };
    onProgressionAdvance: (playedNotes: number[]) => boolean;
    onProgressionRestart: () => void;
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
    qualityLevel: QualityLevel;
}

export function ClientScene({ 
    learningMode, 
    progressionState, 
    onProgressionAdvance,
    onProgressionRestart,
    isYoutubePlaying, 
    toggleYoutubeAudio,
    qualityLevel
}: ClientSceneProps) {
  const { isLoaded: isAudioLoaded, progress: audioProgress } = useAudio();
  const { assets, isLoaded: areAssetsLoaded, progress: assetsProgress } = useSceneLoader({ skip: !isAudioLoaded });

  const isFullyLoaded = isAudioLoaded && areAssetsLoaded;

  const memoizedToggleYoutubeAudio = useCallback(toggleYoutubeAudio, [toggleYoutubeAudio]);
  const memoizedProgressionAdvance = useCallback(onProgressionAdvance, [onProgressionAdvance]);
  const memoizedProgressionRestart = useCallback(onProgressionRestart, [onProgressionRestart]);

  if (isFullyLoaded) {
    return <SceneContainer 
        assets={assets as LoadedAssets} 
        learningMode={learningMode}
        progressionState={progressionState}
        onProgressionAdvance={memoizedProgressionAdvance}
        onProgressionRestart={memoizedProgressionRestart}
        isYoutubePlaying={isYoutubePlaying}
        toggleYoutubeAudio={memoizedToggleYoutubeAudio}
        qualityLevel={qualityLevel}
        />;
  }

  let loadingStep = '';
  let progress = 0;

  if (!isAudioLoaded) {
    loadingStep = 'Loading Audio Assets...';
    progress = audioProgress;
  } else if (!areAssetsLoaded) {
    loadingStep = 'Loading 3D Assets...';
    progress = assetsProgress;
  }
  
  return <UnifiedLoader loadingStep={loadingStep} progress={progress} />;
}
