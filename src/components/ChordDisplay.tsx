
"use client";

import { cn } from "@/lib/utils";

export interface ChordInfo {
  name: string;
  notes: string[];
}

interface ChordDisplayProps {
  chordInfo: ChordInfo | null;
}

export function ChordDisplay({ chordInfo }: ChordDisplayProps) {
  if (!chordInfo || chordInfo.notes.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      <div 
        className="flex items-center justify-center gap-3 rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-4 shadow-lg shadow-purple-900/20 backdrop-blur-md"
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
      >
        {chordInfo.notes.map((note, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black/40 shadow-inner">
              <span className="font-mono text-xl font-semibold text-orange-200">
                {note}
              </span>
            </div>
            {index < chordInfo.notes.length - 1 && (
              <span className="text-2xl font-light text-orange-300/70">+</span>
            )}
          </div>
        ))}
        {chordInfo.name && (
          <>
            <span className="ml-2 text-2xl font-light text-orange-300/70">=</span>
            <p className="ml-2 text-xl font-bold text-orange-100/90 tracking-wide drop-shadow-lg">
              {chordInfo.name}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

    