
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import Image from "next/image";

interface InteractionModalProps {
  onInteract: () => void;
}

export function InteractionModal({ onInteract }: InteractionModalProps) {
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
    try {
        unlockAudio();
    } catch (e) {
        console.warn("Could not unlock audio context automatically.", e);
    }
    onInteract();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="w-full max-w-lg rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/80 to-purple-800/80 p-6 text-orange-100 shadow-lg shadow-purple-900/20 backdrop-blur-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-orange-100">Learn Piano with me!</AlertDialogTitle>
          <AlertDialogDescription className="text-orange-200/80">
            Click the button below to start the experience. This is required to enable audio playback.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button 
              onClick={handleInteraction} 
              className="w-full flex justify-center bg-gradient-to-r from-orange-300 to-yellow-200 text-orange-950 font-bold hover:from-orange-400 hover:to-yellow-300 border border-orange-300/50 shadow-lg h-[6rem]"
            >
              <Image src="/assets/Pianissta_Logo_tiny.webp" alt="Pianissta Logo" width={200} height={40} priority />
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
