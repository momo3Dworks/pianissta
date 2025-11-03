
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { AudioLines } from "lucide-react";

const MIDI_COMMANDS: { [key: number]: string } = {
    0x80: 'Note Off',
    0x90: 'Note On',
    0xA0: 'Polyphonic Aftertouch',
    0xB0: 'Control Change',
    0xC0: 'Program Change',
    0xD0: 'Channel Aftertouch',
    0xE0: 'Pitch Bend',
};

export interface MidiMessage {
    command: number;
    channel: number;
    data1: number;
    data2: number;
    timestamp: number;
}

export interface MidiState {
    status: 'pending' | 'connected' | 'disconnected' | 'unavailable' | 'error';
    lastMessage: MidiMessage | null;
    errorMessage?: string;
}

interface MidiStatusProps {
    state: MidiState;
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
}

export function MidiStatus({ state, isYoutubePlaying, toggleYoutubeAudio }: MidiStatusProps) {
    const [isActivity, setActivity] = useState(false);

    useEffect(() => {
        if (state.lastMessage) {
            setActivity(true);
            const timer = setTimeout(() => setActivity(false), 150);
            return () => clearTimeout(timer);
        }
    }, [state.lastMessage]);

    const getStatusInfo = () => {
        switch (state.status) {
            case 'pending':
                return { color: 'bg-yellow-500' };
            case 'connected':
                return { color: 'bg-green-500' };
            case 'disconnected':
                return { color: 'bg-gray-500' };
            case 'unavailable':
            case 'error':
                return { color: 'bg-red-500' };
            default:
                return { color: 'bg-gray-500' };
        }
    };

    const { color } = getStatusInfo();

    return (
        <div 
            className="h-12 flex items-center z-10"
        >
            <div 
                className="bg-gradient-to-br from-purple-900/70 to-black/70 backdrop-blur-md p-3 h-full flex items-center gap-4 rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", color)}></span>
                </div>
                
                <div className={cn(
                    "h-2 w-2 rounded-full bg-orange-400 transition-all duration-100",
                    isActivity ? 'opacity-100 animate-pulse' : 'opacity-40'
                )}></div>
                                
                <div className="border-l border-orange-500/20 pl-4 flex items-center gap-2 text-[11px] text-white">
                    <div className="flex items-center gap-1 w-8">
                        <span>{state.lastMessage ? MIDI_COMMANDS[state.lastMessage.command]?.substring(0,2).toUpperCase() : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1 w-8">
                        <span>{state.lastMessage ? state.lastMessage.channel + 1 : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1 w-8">
                        <span>{state.lastMessage ? state.lastMessage.data1 : '--'}</span>
                    </div>
                    <div className="flex items-center gap-1 w-8">
                        <span>{state.lastMessage ? state.lastMessage.data2 : '--'}</span>
                    </div>
                </div>
                 <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleYoutubeAudio}
                    className="h-8 w-8 rounded-lg bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100 ml-auto"
                >
                    <AudioLines className={cn(isYoutubePlaying && "soundwave-icon", "transition-opacity h-5 w-5", !isYoutubePlaying && "opacity-50")} />
                </Button>
            </div>
        </div>
    );
}
