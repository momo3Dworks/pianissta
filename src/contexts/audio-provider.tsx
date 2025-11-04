"use client";
import React, { createContext, useContext } from 'react';
import { useAudioLoader } from '@/hooks/use-audio-loader';

type AudioContextType = {
  audioCache: { [key: string]: HTMLAudioElement };
  isLoaded: boolean;
  progress: number;
};

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const { audioCache, isLoaded, progress } = useAudioLoader();

  return (
    <AudioContext.Provider value={{ audioCache, isLoaded, progress }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
