
"use client";

import { type LearnableItem } from "@/lib/music-theory";
import { PianoIcon } from "./PianoIcon";

interface LearningDisplayProps {
  item: LearnableItem | null;
}

export function LearningDisplay({ item }: LearningDisplayProps) {
  if (!item) {
    return null;
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-4 shadow-lg shadow-purple-900/20 backdrop-blur-md">
        <div className="text-center">
            <p className="text-sm font-medium text-orange-300">Currently Learning:</p>
            <p className="text-xl font-bold text-orange-100 tracking-wide drop-shadow-lg">{item.name}</p>
        </div>
        <PianoIcon notesToHighlight={item.notes} />
      </div>
    </div>
  );
}
