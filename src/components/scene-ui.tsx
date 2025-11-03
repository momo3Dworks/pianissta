
"use client";

import { useCallback, useState } from "react";
import { type LearnableItem, type LearnableChordProgression, type SelectableItem } from "@/lib/music-theory";
import { Midi, type Note } from "@tonejs/midi";
import { ChordDisplay, type ChordInfo } from './ChordDisplay';
import { LearningDisplay } from './LearningDisplay';
import { MidiLibrary } from './MidiLibrary';
import { MidiPlayer } from "./MidiPlayer";
import { MidiStatus, type MidiState } from "./MidiStatus";
import { LearningToolbar } from "./LearningToolbar";
import { SettingsMenu, type QualityLevel } from "./SettingsMenu";

interface SceneUIProps {
    learningMode: SelectableItem | null;
    progressionState: {
        currentChordIndex: number;
        completed: boolean;
    };
    onProgressionRestart: () => void;
    currentChord: ChordInfo | null;
    currentMidi: Midi | null;
    onMidiLoaded: (midi: Midi | null) => void;
    onMidiNoteOn: (note: number, velocity: number) => void;
    onMidiNoteOff: (note: number) => void;
    qualityLevel: QualityLevel;
    onQualityChange: (level: QualityLevel) => void;
    onSelectItem: (item: SelectableItem | null) => void;
    midiState: MidiState;
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
}

export function SceneUI({
    learningMode,
    progressionState,
    onProgressionRestart,
    currentChord,
    currentMidi,
    onMidiLoaded,
    onMidiNoteOn,
    onMidiNoteOff,
    qualityLevel,
    onQualityChange,
    onSelectItem,
    midiState,
    isYoutubePlaying,
    toggleYoutubeAudio
}: SceneUIProps) {

    const [playbackTime, setPlaybackTime] = useState(0);

    const handleMidiLoaded = useCallback((midi: Midi | null) => {
        onMidiLoaded(midi);
        if(!midi) {
            setPlaybackTime(0);
        }
    }, [onMidiLoaded]);

    return (
        <>
            <div
                className="fixed top-4 z-20 flex items-center gap-4 opacity-0 animate-slide-in-down"
                style={{
                    animationDelay: '0.2s',
                    left: '32%',
                    transform: 'translateX(-50%)',
                }}
            >
                <div className="hidden min-[790px]:flex">
                    <MidiStatus state={midiState} isYoutubePlaying={isYoutubePlaying} toggleYoutubeAudio={toggleYoutubeAudio} />
                </div>
                <LearningToolbar
                    onSelectItem={onSelectItem}
                    selectedItem={learningMode}
                />
            </div>


            <div
                className="absolute top-4 right-4 z-20 opacity-0 animate-slide-in-down"
                style={{ animationDelay: '0.4s' }}
            >
                <SettingsMenu
                    qualityLevel={qualityLevel}
                    onQualityChange={onQualityChange}
                />
            </div>
            
            <MidiLibrary
                onNoteOn={onMidiNoteOn}
                onNoteOff={onMidiNoteOff}
                onMidiLoaded={handleMidiLoaded}
                onTimeUpdate={setPlaybackTime}
            />

            <LearningDisplay
                item={learningMode}
                progressionState={progressionState}
                onProgressionRestart={onProgressionRestart}
            />
            
            <ChordDisplay chordInfo={currentChord} isMidiPlayerActive={!!currentMidi} />

            {currentMidi && (
                <MidiPlayer midi={currentMidi} currentTime={playbackTime} />
            )}
        </>
    );
}
