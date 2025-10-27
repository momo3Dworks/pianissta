"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
}

export function MidiStatus({ state }: MidiStatusProps) {
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
                return { text: 'Connecting...', color: 'bg-yellow-500' };
            case 'connected':
                return { text: 'MIDI Connected', color: 'bg-green-500' };
            case 'disconnected':
                return { text: 'No MIDI Device', color: 'bg-gray-500' };
            case 'unavailable':
                return { text: 'MIDI Not Supported', color: 'bg-red-500' };
            case 'error':
                return { text: 'MIDI Error', color: 'bg-red-500' };
            default:
                return { text: 'Unknown', color: 'bg-gray-500' };
        }
    };

    const { text, color } = getStatusInfo();
    const commandName = state.lastMessage ? MIDI_COMMANDS[state.lastMessage.command] || `Unknown (0x${state.lastMessage.command.toString(16)})` : 'N/A';

    return (
        <div className="absolute top-4 left-4 z-10 w-64 rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 bg-[length:200%_200%] p-3 text-orange-100 shadow-lg shadow-purple-900/20 backdrop-blur-[6px] animate-gradient-shift">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", color, "shadow-[0_0_6px_theme(colors.orange.500)]")}></span>
                    <p className="text-sm font-medium">{text}</p>
                </div>
                 <div className={cn(
                    "h-2 w-2 rounded-full bg-orange-400 transition-all duration-100",
                    isActivity ? 'opacity-100 shadow-[0_0_8px_2px_theme(colors.orange.400)]' : 'opacity-0'
                )}></div>
            </div>
            {state.errorMessage && <p className="mt-1 text-xs text-red-400">{state.errorMessage}</p>}
            <div className="mt-2 border-t border-orange-500/20 pt-2 text-xs">
                <p className="font-semibold text-orange-200/80">Last Message:</p>
                {state.lastMessage ? (
                     <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono">
                        <span className="text-orange-200/60">CMD:</span><span className="truncate">{commandName}</span>
                        <span className="text-orange-200/60">CH:</span><span>{state.lastMessage.channel + 1}</span>
                        <span className="text-orange-200/60">D1:</span><span>{state.lastMessage.data1}</span>
                        <span className="text-orange-200/60">D2:</span><span>{state.lastMessage.data2}</span>
                    </div>
                ) : (
                    <p className="mt-1 font-mono text-orange-200/60">No data received</p>
                )}
            </div>
        </div>
    );
}
