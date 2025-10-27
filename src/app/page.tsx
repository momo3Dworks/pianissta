"use client";

import { useState, useRef, useCallback } from 'react';
import YouTube from 'react-youtube';
import { ClientScene } from '@/components/client-scene';
import { InteractionModal } from '@/components/interaction-modal';
import { AudioProvider } from '@/contexts/audio-provider';
import { LearnMenu } from '@/components/LearnMenu';
import { type LearnableItem } from '@/lib/music-theory';
import Image from 'next/image';

export default function Home() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [learningMode, setLearningMode] = useState<LearnableItem | null>(null);
  const [isLearnMenuOpen, setIsLearnMenuOpen] = useState(false);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(true);
  const playerRef = useRef<any>(null);

  const handleInteraction = () => {
    setHasInteracted(true);
    if (playerRef.current) {
        playerRef.current.playVideo();
        setIsYoutubePlaying(true);
    }
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(5);
    if (hasInteracted) {
        playerRef.current.playVideo();
        setIsYoutubePlaying(true);
    }
  };

  const toggleYoutubeAudio = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isYoutubePlaying) {
        playerRef.current.pauseVideo();
    } else {
        playerRef.current.playVideo();
    }
    setIsYoutubePlaying(prev => !prev);
  }, [isYoutubePlaying]);

  const onToggleLearnMenu = useCallback(() => {
    setIsLearnMenuOpen(prev => !prev);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background">
      {!hasInteracted ? (
        <InteractionModal onInteract={handleInteraction} />
      ) : (
        <AudioProvider>
            <LearnMenu
                isOpen={isLearnMenuOpen}
                onOpenChange={setIsLearnMenuOpen}
                onSelectItem={setLearningMode}
                selectedItem={learningMode}
            />
          <ClientScene 
            learningMode={learningMode} 
            onToggleLearnMenu={onToggleLearnMenu}
            isLearnMenuOpen={isLearnMenuOpen}
            isYoutubePlaying={isYoutubePlaying}
            toggleYoutubeAudio={toggleYoutubeAudio}
            />
        </AudioProvider>
      )}
       <div className="absolute -z-10 opacity-0">
         <YouTube
            videoId="vPhg6sc1Mk4"
            opts={{
                height: '0',
                width: '0',
                playerVars: {
                    autoplay: 0,
                    loop: 1,
                    playlist: 'vPhg6sc1Mk4',
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                },
            }}
            onReady={onPlayerReady}
            />
       </div>
       <Image
          src="/assets/Pianissta_Logo_tiny.webp"
          alt="Pianissta Logo"
          width={150}
          height={30}
          className="absolute bottom-4 right-4 z-0 opacity-40 pointer-events-none"
          style={{ height: 'auto' }}
        />
    </main>
  );
}
