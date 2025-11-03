
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import Image from "next/image";
import { UnifiedLoader } from "./unified-loader";

interface InteractionModalProps {
  onInteract: () => void;
  isLoading: boolean;
  loadingStep: string;
  progress: number;
}

export function InteractionModal({ onInteract, isLoading, loadingStep, progress }: InteractionModalProps) {
  // A simple way to unlock the audio context is to play a silent sound on the first user interaction.
  const unlockAudio = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    audioContext.resume();
  };

  const handleInteraction = () => {
    if (isLoading) return;
    try {
        unlockAudio();
    } catch (e) {
        console.warn("Could not unlock audio context automatically.", e);
    }
    onInteract();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent 
        className="w-full max-w-lg rounded-lg bg-gradient-to-br from-black to-blue-950 p-6 text-orange-100 drop-shadow-lg"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-orange-100 text-center">Learn Piano with me!</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-orange-200/80">
            Click the button to start the interactive piano learning experience.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex justify-center items-center h-48">
            {isLoading ? (
                <UnifiedLoader loadingStep={loadingStep} progress={progress} />
            ) : (
                <Image src="/assets/Pianissta_Logo_tiny.webp" alt="Pianissta Logo" width={300} height={60} priority className="invert" />
            )}
        </div>


        <div className="mt-4 flex justify-center">
          <Button 
            onClick={handleInteraction}
            disabled={isLoading} 
            className="w-[70%] flex justify-center bg-gradient-to-r from-orange-300 to-yellow-200 text-orange-950 font-bold hover:from-orange-400 hover:to-yellow-300 border-none shadow-lg h-[4rem] disabled:opacity-70 disabled:cursor-not-allowed"
          >
              Start Learning
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
