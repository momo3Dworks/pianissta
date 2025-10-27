
"use client";

import { cn } from "@/lib/utils";

// Map MIDI note numbers to their position on our SVG piano
const NOTE_POSITIONS: Record<number, string> = {
    // White keys (C3 to C5)
    48: 'C3', 50: 'D3', 52: 'E3', 53: 'F3', 55: 'G3', 57: 'A3', 59: 'B3',
    60: 'C4', 62: 'D4', 64: 'E4', 65: 'F4', 67: 'G4', 69: 'A4', 71: 'B4',
    72: 'C5',
    // Black keys
    49: 'Db3', 51: 'Eb3', 54: 'Gb3', 56: 'Ab3', 58: 'Bb3',
    61: 'Db4', 63: 'Eb4', 66: 'Gb4', 68: 'Ab4', 70: 'Bb4'
};

const WHITE_KEYS = [
    { name: 'C3', x: 0 }, { name: 'D3', x: 10 }, { name: 'E3', x: 20 },
    { name: 'F3', x: 30 }, { name: 'G3', x: 40 }, { name: 'A3', x: 50 },
    { name: 'B3', x: 60 }, { name: 'C4', x: 70 }, { name: 'D4', x: 80 },
    { name: 'E4', x: 90 }, { name: 'F4', x: 100 }, { name: 'G4', x: 110 },
    { name: 'A4', x: 120 }, { name: 'B4', x: 130 }, { name: 'C5', x: 140 }
];

const BLACK_KEYS = [
    { name: 'Db3', x: 7 }, { name: 'Eb3', x: 17 }, { name: 'Gb3', x: 37 },
    { name: 'Ab3', x: 47 }, { name: 'Bb3', x: 57 }, { name: 'Db4', x: 77 },
    { name: 'Eb4', x: 87 }, { name: 'Gb4', x: 107 }, { name: 'Ab4', x: 117 },
    { name: 'Bb4', x: 127 }
];

interface PianoIconProps {
  notesToHighlight: number[];
  className?: string;
}

export function PianoIcon({ notesToHighlight, className }: PianoIconProps) {
  const highlightedNoteNames = new Set(notesToHighlight.map(n => NOTE_POSITIONS[n]));
  const uniqueId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg viewBox="0 0 150 60" className={cn("rounded-md border border-orange-500/30", className)}>
      <defs>
        <filter id={uniqueId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* White Keys */}
      {WHITE_KEYS.map(key => (
        <rect
          key={key.name}
          x={key.x}
          y="0"
          width="10"
          height="60"
          stroke="#333"
          strokeWidth="0.5"
          className={cn(
            highlightedNoteNames.has(key.name) ? "fill-cyan-400" : "fill-white"
          )}
          style={{
            filter: highlightedNoteNames.has(key.name) ? `url(#${uniqueId})` : "none",
          }}
        />
      ))}

      {/* Black Keys */}
      {BLACK_KEYS.map(key => (
        <rect
          key={key.name}
          x={key.x}
          y="0"
          width="6"
          height="35"
          className={cn(
            "stroke-black stroke-[0.5px]",
            highlightedNoteNames.has(key.name) ? "fill-orange-400" : "fill-black"
          )}
          style={{
            filter: highlightedNoteNames.has(key.name) ? `url(#${uniqueId})` : "none",
          }}
        />
      ))}
    </svg>
  );
}
