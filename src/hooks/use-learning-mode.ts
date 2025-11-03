
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { type LearnableItem, type LearnableChordProgression, getChordNotes } from '@/lib/music-theory';

type SelectableItem = LearnableItem | LearnableChordProgression;

interface ProgressionState {
    currentChordIndex: number;
    completed: boolean;
}

export function useLearningMode() {
    const [currentItem, setCurrentItem] = useState<SelectableItem | null>(null);
    const [progressionState, setProgressionState] = useState<ProgressionState>({ currentChordIndex: 0, completed: false });
    const [activeNotes, setActiveNotes] = useState<number[]>([]);
    const [isCorrectChord, setIsCorrectChord] = useState(false);

    const selectItem = useCallback((item: SelectableItem | null) => {
        setCurrentItem(item);
        setProgressionState({ currentChordIndex: 0, completed: false });
        setActiveNotes([]);
        setIsCorrectChord(false);
    }, []);

    const restartProgression = useCallback(() => {
        setProgressionState({ currentChordIndex: 0, completed: false });
        setActiveNotes([]);
        setIsCorrectChord(false);
    }, []);

    const notesToHighlight = useMemo(() => {
        if (!currentItem) return [];

        if ('genre' in currentItem) { // It's a chord progression
            const progression = currentItem as LearnableChordProgression;
            if (!progressionState.completed) {
                const currentChordName = progression.chords_C[progressionState.currentChordIndex];
                if (currentChordName) {
                    return getChordNotes(currentChordName);
                }
            }
        } else { // It's a single chord/scale
            return currentItem.notes;
        }
        return [];
    }, [currentItem, progressionState]);

    const checkCompletedChord = useCallback(() => {
        if (!currentItem || notesToHighlight.length === 0 || activeNotes.length === 0) {
            return false;
        }

        const playedPitchClasses = [...new Set(activeNotes.map(n => n % 12))].sort((a, b) => a - b);
        const targetPitchClasses = [...new Set(notesToHighlight.map(n => n % 12))].sort((a, b) => a - b);
        
        if (playedPitchClasses.length !== targetPitchClasses.length) {
            return false;
        }

        const isCorrect = targetPitchClasses.every((note, index) => note === playedPitchClasses[index]);
        
        if (isCorrect) {
            setIsCorrectChord(true);
            setTimeout(() => setIsCorrectChord(false), 1000); // Reset after 1s
            
            if ('genre' in currentItem) { // Progression mode
                const progression = currentItem as LearnableChordProgression;
                 if (progressionState.currentChordIndex < progression.chords_C.length - 1) {
                    setTimeout(() => {
                        setProgressionState(p => ({ ...p, currentChordIndex: p.currentChordIndex + 1 }));
                    }, 1000);
                } else {
                    setTimeout(() => {
                        setProgressionState(p => ({ ...p, completed: true }));
                    }, 1000);
                }
            }
        }
        
        return isCorrect;
    }, [currentItem, notesToHighlight, activeNotes, progressionState.currentChordIndex]);

    useEffect(() => {
        if(activeNotes.length > 0) {
            checkCompletedChord();
        }
    }, [activeNotes, checkCompletedChord]);


    const handleNoteOn = useCallback((note: number) => {
        setActiveNotes(prev => {
            if (prev.includes(note)) return prev;
            return [...prev, note];
        });
    }, []);

    const handleNoteOff = useCallback((note: number) => {
        setActiveNotes(prev => prev.filter(n => n !== note));
    }, []);

    return {
        currentItem,
        notesToHighlight,
        progressionState,
        isCorrectChord,
        selectItem,
        handleNoteOn,
        handleNoteOff,
        restartProgression,
        activeNotes
    };
}

    