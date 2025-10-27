"use client";

import { useAudio } from '@/contexts/audio-provider';
import { useSceneLoader, type LoadedAssets } from '@/hooks/use-scene-loader';
import { UnifiedLoader } from './unified-loader';
import dynamic from 'next/dynamic';
import { type LearnableItem } from '@/lib/music-theory';
import { useCallback } from 'react';

const SceneContainer = dynamic(() => import('./scene-container').then(mod => mod.SceneContainer), {
  ssr: false,
});

interface ClientSceneProps {
    learningMode: LearnableItem | null;
    isLearnMenuOpen: boolean;
    onToggleLearnMenu: () => void;
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
}

export function ClientScene({ learningMode, isLearnMenuOpen, onToggleLearnMenu, isYoutubePlaying, toggleYoutubeAudio }: ClientSceneProps) {
  const { isLoaded: isAudioLoaded, progress: audioProgress } = useAudio();
  const { assets, isLoaded: areAssetsLoaded, progress: assetsProgress } = useSceneLoader({ skip: !isAudioLoaded });

  const isFullyLoaded = isAudioLoaded && areAssetsLoaded;

  const memoizedToggleLearnMenu = useCallback(onToggleLearnMenu, [onToggleLearnMenu]);
  const memoizedToggleYoutubeAudio = useCallback(toggleYoutubeAudio, [toggleYoutubeAudio]);

  if (isFullyLoaded) {
    return <SceneContainer 
        assets={assets as LoadedAssets} 
        learningMode={learningMode} 
        onToggleLearnMenu={memoizedToggleLearnMenu}
        isLearnMenuOpen={isLearnMenuOpen}
        isYoutubePlaying={isYoutubePlaying}
        toggleYoutubeAudio={memoizedToggleYoutubeAudio}
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
