"use client";

import { useState, useEffect } from 'react';

const noteNames = [
  // White keys
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5", "F5", "G5", "A5", "B5",
  "C6", "D6", "E6", "F6", "G6", "A6", "B6",
  "C7",
  // Black keys
  "C_Sharp3", "D_Sharp3", "F_Sharp3", "G_Sharp3", "A_Sharp3",
  "C_Sharp4", "D_Sharp4", "F_Sharp4", "G_Sharp4", "A_Sharp4",
  "C_Sharp5", "D_Sharp5", "F_Sharp5", "G_Sharp5", "A_Sharp5",
  "C_Sharp6", "D_Sharp6", "F_Sharp6", "G_Sharp6", "A_Sharp6",
];

export const useAudioLoader = () => {
  const [audioCache, setAudioCache] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const totalCount = noteNames.length;
    const cache: { [key: string]: HTMLAudioElement } = {};

    const loadAudio = (noteName: string) => {
      return new Promise<void>((resolve, reject) => {
        const soundPath = `/sounds/piano/${noteName}.mp3`;
        const audio = new Audio(soundPath);
        
        // We consider 'canplaythrough' as the audio being loaded enough for our purposes.
        audio.addEventListener('canplaythrough', () => {
          loadedCount++;
          setProgress((loadedCount / totalCount) * 100);
          resolve();
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
          console.error(`Failed to load audio: ${soundPath}`, e);
          // We resolve even on error to not block the loading process
          // You might want to handle this differently, e.g., by rejecting.
          loadedCount++;
          setProgress((loadedCount / totalCount) * 100);
          resolve();
        });

        cache[soundPath] = audio;
        audio.load(); // Start loading the audio
      });
    };

    const loadAll = async () => {
        const promises = noteNames.map(noteName => loadAudio(noteName));
        await Promise.all(promises);
        setAudioCache(cache);
        setIsLoaded(true);
    }
    
    loadAll();

  }, []);

  return { audioCache, progress, isLoaded };
};
