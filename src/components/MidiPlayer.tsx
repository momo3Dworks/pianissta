
"use client";
import React, { useMemo, useState } from 'react';
import { Midi } from '@tonejs/midi';
import { cn } from '@/lib/utils';
import { PanelLeft, PanelRight } from 'lucide-react';
import { Button } from './ui/button';

interface MidiPlayerProps {
  midi: Midi | null;
  currentTime: number;
}

const MIN_NOTE = 48; // C3
const MAX_NOTE = 96; // C7
const WHITE_KEY_WIDTH = 20;
const BLACK_KEY_WIDTH = 12;
const KEYBOARD_HEIGHT = 100;


const noteIsBlack = (midi: number) => {
  const note = midi % 12;
  return note === 1 || note === 3 || note === 6 || note === 8 || note === 10;
};

export function MidiPlayer({ midi, currentTime }: MidiPlayerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const keyInfos = useMemo(() => {
    let x = 0;
    const infos = [];
    for (let i = MIN_NOTE; i <= MAX_NOTE; i++) {
      const isBlack = noteIsBlack(i);
      if (!isBlack) {
        infos.push({ midi: i, x, isBlack: false });
        x += WHITE_KEY_WIDTH;
      }
    }
    x = 0;
    for (let i = MIN_NOTE; i <= MAX_NOTE; i++) {
      const isBlack = noteIsBlack(i);
      if (isBlack) {
        const whiteKeyBelow = infos.find(k => k.midi === i - 1);
        if (whiteKeyBelow) {
            infos.push({ midi: i, x: whiteKeyBelow.x + WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH/2), isBlack: true });
        }
      }
    }
    infos.sort((a,b) => a.midi - b.midi);
    return infos;
  }, []);
  
  if (!midi) return null;

  const totalDuration = midi.duration;
  const pixelsPerSecond = 150; 
  const viewboxHeight = totalDuration * pixelsPerSecond;

  const whiteKeys = keyInfos.filter(k => !k.isBlack);
  const blackKeys = keyInfos.filter(k => k.isBlack);
  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;


  const getNoteX = (midiNote: number): number => {
    const key = keyInfos.find(k => k.midi === midiNote);
    if (!key) return -1;
    return key.isBlack ? key.x + (BLACK_KEY_WIDTH / 4) : key.x;
  };
  
  const notes = midi.tracks.flatMap(track => track.notes);

  return (
    <div 
      className={cn(
        "fixed z-20 h-64 bg-black/50 backdrop-blur-md border border-orange-500/20 rounded-lg w-full max-w-[1010px] transition-all duration-500 ease-in-out",
        "bottom-4",
        isCollapsed ? "translate-x-[-100%] left-[-1rem] right-[100%]" : "left-1/2 -translate-x-1/2"
      )}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
            "absolute top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/60 text-orange-200 transition-all duration-500 ease-in-out backdrop-blur-md",
            isCollapsed ? "left-[100%] ml-4 rounded-l-md" : "left-0 rounded-r-none"
        )}
      >
        {isCollapsed ? <PanelRight /> : <PanelLeft />}
      </Button>
      <div className="w-full h-full relative overflow-y-auto overflow-x-hidden rounded-lg">
        <svg
          className="absolute top-0 left-0"
          width={totalWidth}
          height={viewboxHeight + KEYBOARD_HEIGHT}
          style={{ transform: `translateY(-${Math.max(0, viewboxHeight - (currentTime * pixelsPerSecond) - (256-KEYBOARD_HEIGHT) )}px)`}}
        >
            <defs>
                <linearGradient id="note-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00BCD4" />
                    <stop offset="100%" stopColor="#80DEEA" />
                </linearGradient>
                <linearGradient id="note-gradient-playing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB74D" />
                    <stop offset="100%" stopColor="#FFCC80" />
                </linearGradient>
            </defs>

          {/* Notes */}
          {notes.map((note, i) => {
            const x = getNoteX(note.midi);
            if (x === -1) return null;

            const y = (totalDuration - (note.time + note.duration)) * pixelsPerSecond;
            const height = note.duration * pixelsPerSecond;
            const isPlaying = currentTime >= note.time && currentTime < note.time + note.duration;

            return (
              <rect
                key={i}
                className={cn("midi-player-note", isPlaying && "playing")}
                x={x}
                y={y}
                width={noteIsBlack(note.midi) ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH -1}
                height={height}
                rx="2"
              />
            );
          })}

        </svg>
      </div>

       <div className="absolute bottom-0 left-0 right-0 h-[100px] z-10 pointer-events-none rounded-b-lg overflow-hidden">
          <svg width={totalWidth} height={KEYBOARD_HEIGHT} className="absolute bottom-0 left-0">
            {/* Piano Roll Keys */}
            {whiteKeys.map(({ midi, x }) => (
              <rect
                key={midi}
                className="midi-player-key white"
                x={x}
                y={0}
                width={WHITE_KEY_WIDTH}
                height={KEYBOARD_HEIGHT}
              />
            ))}
            {blackKeys.map(({ midi, x }) => (
              <rect
                key={midi}
                className="midi-player-key black"
                x={x}
                y={0}
                width={BLACK_KEY_WIDTH}
                height={KEYBOARD_HEIGHT * 0.6}
              />
            ))}

            <line
                className="midi-player-timeline"
                x1={0}
                y1={0}
                x2={totalWidth}
                y2={0}
            />
          </svg>
        </div>
    </div>
  );
}
