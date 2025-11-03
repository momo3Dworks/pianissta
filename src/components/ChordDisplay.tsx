
"use client";

import { cn } from "@/lib/utils";

export interface ChordInfo {
  name: string;
  notes: string[];
}

interface ChordDisplayProps {
  chordInfo: ChordInfo | null;
  isMidiPlayerActive: boolean;
}

export function ChordDisplay({ chordInfo, isMidiPlayerActive }: ChordDisplayProps) {
  if (!chordInfo || chordInfo.notes.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "absolute z-10 flex flex-col items-center gap-2 transition-all duration-300 ease-in-out",
      isMidiPlayerActive 
        ? "top-20 left-1/2 -translate-x-1/2 scale-90"
        : "bottom-24 left-1/2 -translate-x-1/2"
    )}>
      <div 
        className="flex items-center justify-center gap-2 border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-3 shadow-lg shadow-purple-900/20 backdrop-blur-md"
      >
        {chordInfo.notes.map((note, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-black/40 shadow-inner">
              <span className="font-mono text-lg font-semibold text-orange-200">
                {note}
              </span>
            </div>
            {index < chordInfo.notes.length - 1 && (
              <span className="text-xl font-light text-orange-300/70">+</span>
            )}
          </div>
        ))}
        {chordInfo.name && (
          <>
            <span className="ml-2 text-xl font-light text-orange-300/70">=</span>
            <p className="ml-2 text-lg font-bold text-orange-100/90 tracking-wide drop-shadow-lg">
              {chordInfo.name}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
