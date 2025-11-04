
"use client";

import { type LearnableItem, type LearnableChordProgression, getChordNotes } from "@/lib/music-theory";
import { Button } from "./ui/button";
import { PianoIcon } from "./PianoIcon";
import { RefreshCcw } from "lucide-react";

type SelectableItem = LearnableItem | LearnableChordProgression;

interface LearningDisplayProps {
  item: SelectableItem | null;
  progressionState?: {
      currentChordIndex: number;
      completed: boolean;
  };
  onProgressionRestart?: () => void;
}

export function LearningDisplay({ item, progressionState, onProgressionRestart }: LearningDisplayProps) {
  if (!item) {
    return null;
  }

  const isProgression = 'genre' in item;
  let notesToHighlight = item.notes;
  let currentChordName: string | null = null;
  
  if (isProgression && progressionState) {
      const progression = item as LearnableChordProgression;
      if (!progressionState.completed) {
          currentChordName = progression.chords_C[progressionState.currentChordIndex];
          if (currentChordName) {
            notesToHighlight = getChordNotes(currentChordName);
          } else {
            notesToHighlight = [];
          }
      }
  }


  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 w-full max-w-lg">
      <div 
        className="flex flex-col items-center gap-4 rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 shadow-lg shadow-purple-900/20 backdrop-blur-md"
      >
        <div className="text-center">
            <p className="text-sm font-medium text-orange-300">Currently Learning:</p>
            <p className="text-xl font-bold text-orange-100 tracking-wide drop-shadow-lg">{item.name}</p>
            {isProgression && (
                <div className="mt-2 flex flex-col items-center">
                    <p className="text-sm text-orange-200/80">{item.chords_C.join(' - ')}</p>
                    {progressionState?.completed ? (
                        <p className="mt-2 text-lg font-bold text-green-400">Progression Completed! 🎉</p>
                    ) : (
                        <p className="mt-1 text-base text-orange-200/90">
                            Acorde {progressionState!.currentChordIndex + 1} de {item.chords_C.length}: 
                            <span className="font-bold text-orange-100"> {currentChordName}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
        <PianoIcon notesToHighlight={notesToHighlight} className="w-[290px]" />
        {isProgression && progressionState?.completed && onProgressionRestart && (
             <Button onClick={onProgressionRestart} size="sm" variant="outline" className="mt-2 bg-purple-800/70 border-orange-500/40 hover:bg-purple-700/80">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Repeat
            </Button>
        )}
      </div>
    </div>
  );
}
