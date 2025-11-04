
"use client";

import { cn } from "@/lib/utils";

// Map MIDI note numbers to their position on our SVG piano
const NOTE_POSITIONS: Record<number, string> = {
    // C3 to C7 range
    48: 'C3', 49: 'Db3', 50: 'D3', 51: 'Eb3', 52: 'E3', 53: 'F3', 54: 'Gb3', 55: 'G3', 56: 'Ab3', 57: 'A3', 58: 'Bb3', 59: 'B3',
    60: 'C4', 61: 'Db4', 62: 'D4', 63: 'Eb4', 64: 'E4', 65: 'F4', 66: 'Gb4', 67: 'G4', 68: 'Ab4', 69: 'A4', 70: 'Bb4', 71: 'B4',
    72: 'C5', 73: 'Db5', 74: 'D5', 75: 'Eb5', 76: 'E5', 77: 'F5', 78: 'Gb5', 79: 'G5', 80: 'Ab5', 81: 'A5', 82: 'Bb5', 83: 'B5',
    84: 'C6', 85: 'Db6', 86: 'D6', 87: 'Eb6', 88: 'E6', 89: 'F6', 90: 'Gb6', 91: 'G6', 92: 'Ab6', 93: 'A6', 94: 'Bb6', 95: 'B6',
    96: 'C7'
};

const WHITE_KEYS = [
    { name: 'C3', x: 0 }, { name: 'D3', x: 10 }, { name: 'E3', x: 20 }, { name: 'F3', x: 30 }, { name: 'G3', x: 40 }, { name: 'A3', x: 50 }, { name: 'B3', x: 60 },
    { name: 'C4', x: 70 }, { name: 'D4', x: 80 }, { name: 'E4', x: 90 }, { name: 'F4', x: 100 }, { name: 'G4', x: 110 }, { name: 'A4', x: 120 }, { name: 'B4', x: 130 },
    { name: 'C5', x: 140 }, { name: 'D5', x: 150 }, { name: 'E5', x: 160 }, { name: 'F5', x: 170 }, { name: 'G5', x: 180 }, { name: 'A5', x: 190 }, { name: 'B5', x: 200 },
    { name: 'C6', x: 210 }, { name: 'D6', x: 220 }, { name: 'E6', x: 230 }, { name: 'F6', x: 240 }, { name: 'G6', x: 250 }, { name: 'A6', x: 260 }, { name: 'B6', x: 270 },
    { name: 'C7', x: 280 }
];

const BLACK_KEYS = [
    { name: 'Db3', x: 7 }, { name: 'Eb3', x: 17 }, { name: 'Gb3', x: 37 }, { name: 'Ab3', x: 47 }, { name: 'Bb3', x: 57 },
    { name: 'Db4', x: 77 }, { name: 'Eb4', x: 87 }, { name: 'Gb4', x: 107 }, { name: 'Ab4', x: 117 }, { name: 'Bb4', x: 127 },
    { name: 'Db5', x: 147 }, { name: 'Eb5', x: 157 }, { name: 'Gb5', x: 177 }, { name: 'Ab5', x: 187 }, { name: 'Bb5', x: 197 },
    { name: 'Db6', x: 217 }, { name: 'Eb6', x: 227 }, { name: 'Gb6', x: 247 }, { name: 'Ab6', x: 257 }, { name: 'Bb6', x: 267 }
];

interface PianoIconProps {
  notesToHighlight: number[];
  className?: string;
}

export function PianoIcon({ notesToHighlight, className }: PianoIconProps) {
  const highlightedNoteNames = new Set(notesToHighlight.map(n => NOTE_POSITIONS[n]));
  const uniqueId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg viewBox="0 0 290 60" className={cn("rounded-md border border-orange-500/30", className)}>
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
