
"use client";

import { Midi } from "@tonejs/midi";
import { Play, Square, Music, Library, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";

const AVAILABLE_MIDIS = [
    { name: "Mii Channel Theme", path: "/midis/Mii_Channel.mid" },
    { name: "Star Wars Theme", path: "/midis/StarWars_theme.mid" },
];

interface MidiLibraryProps {
    onNoteOn: (note: number, velocity: number) => void;
    onNoteOff: (note: number) => void;
}

type PlaybackState = 'stopped' | 'playing' | 'loading';

export function MidiLibrary({ onNoteOn, onNoteOff }: MidiLibraryProps) {
    const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
    const [selectedMidi, setSelectedMidi] = useState<{ name: string, path: string } | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const midiRef = useRef<Midi | null>(null);
    const scheduledEventsRef = useRef<number[]>([]);

    const stopPlayback = useCallback(() => {
        if (midiRef.current) {
            const allNotes = midiRef.current.tracks.flatMap(track => track.notes);
            const playingNotes = new Set<number>();
            allNotes.forEach(note => playingNotes.add(note.midi));
            playingNotes.forEach(note => onNoteOff(note));
        }
        scheduledEventsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledEventsRef.current = [];
        setPlaybackState('stopped');
    }, [onNoteOff]);

    const startPlayback = useCallback(async () => {
        if (!selectedMidi) return;
        
        setPlaybackState('loading');
        try {
            const midi = await Midi.fromUrl(selectedMidi.path);
            midiRef.current = midi;
            setPlaybackState('playing');

            const allNotes = midi.tracks.flatMap(track => track.notes);
            allNotes.sort((a, b) => a.time - b.time);

            const timeoutIds: number[] = [];

            allNotes.forEach(note => {
                const noteOnTime = note.time * 1000;
                const noteOffTime = (note.time + note.duration) * 1000;

                const onId = setTimeout(() => {
                    onNoteOn(note.midi, note.velocity * 127);
                }, noteOnTime);
                timeoutIds.push(onId as unknown as number);

                const offId = setTimeout(() => {
                    onNoteOff(note.midi);
                }, noteOffTime);
                timeoutIds.push(offId as unknown as number);
            });
            
            scheduledEventsRef.current = timeoutIds;

            const songEndTime = (midi.duration) * 1000;
            const endId = setTimeout(() => {
                stopPlayback();
            }, songEndTime + 2000); // Add a small buffer
            scheduledEventsRef.current.push(endId as unknown as number);


        } catch (error) {
            console.error("Failed to load or play MIDI file:", error);
            setPlaybackState('stopped');
        }
    }, [selectedMidi, onNoteOn, onNoteOff, stopPlayback]);

    const handleTogglePlayback = () => {
        if (playbackState === 'playing') {
            stopPlayback();
        } else if (playbackState === 'stopped') {
            startPlayback();
        }
    };

    const handleSelectMidi = (midi: { name: string, path: string }) => {
        if (playbackState === 'playing') {
            stopPlayback();
        }
        setSelectedMidi(midi);
        setIsSheetOpen(false);
    }
    
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 rounded-none bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 backdrop-blur-md"
                      style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                    >
                        <Music className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent 
                    side="bottom" 
                    className="bg-purple-950/40 border-t border-orange-500/20 text-orange-100 backdrop-blur-md rounded-none"
                    style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0 90%, 0 10%)' }}
                >
                    <SheetHeader>
                        <SheetTitle className="text-orange-100">MIDI Library</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <div className="flex flex-col gap-2">
                            {AVAILABLE_MIDIS.map((midi) => (
                                <Button
                                    key={midi.path}
                                    variant="ghost"
                                    onClick={() => handleSelectMidi(midi)}
                                    className={cn(
                                        "justify-start text-lg h-14",
                                        selectedMidi?.path === midi.path && "bg-orange-500/20"
                                    )}
                                >
                                    {midi.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Button 
                variant="ghost" 
                size="icon"
                onClick={handleTogglePlayback}
                disabled={playbackState === 'loading' || !selectedMidi}
                className="h-12 w-12 rounded-none bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md"
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
            >
                {playbackState === 'playing' ? <Square className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
        </div>
    );
}

    
