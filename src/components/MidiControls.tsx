
"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { AudioLines } from "lucide-react";

interface MidiControlsProps {
    pitchBend: number; // -1 to 1
    modulation: number; // 0 to 1
    volume: number; // 0 to 1
    isYoutubePlaying: boolean;
    toggleYoutubeAudio: () => void;
}

function Wheel({ value, label, springLoaded = false, lastChanged }: { value: number, label: string, springLoaded?: boolean, lastChanged: number }) {
    const position = springLoaded ? (value + 1) / 2 : value;
    const indicatorPosition = `calc(${position * 100}% - 4px)`;
    const [isHot, setIsHot] = useState(false);

    useEffect(() => {
        if (lastChanged > 0) {
            setIsHot(true);
            const timer = setTimeout(() => setIsHot(false), 150);
            return () => clearTimeout(timer);
        }
    }, [lastChanged]);

    return (
        <div className="flex flex-col gap-1 w-24">
            <div className="relative h-4 w-full flex items-center">
                <div className="h-[2px] w-full rounded-full bg-black/30 border-t border-b border-orange-500/20 shadow-[0_0_10px_theme(colors.orange.500/10)]"></div>
                <div 
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_theme(colors.orange.400)] transition-all duration-75 ease-linear",
                        "hover:scale-125",
                        isHot && "shadow-[0_0_12px_3px_theme(colors.orange.300)] scale-110"
                    )}
                    style={{ left: indicatorPosition }}
                ></div>
            </div>
            <p className="text-[10px] font-medium text-center text-orange-200/80">{label}</p>
        </div>
    );
}

function Fader({ value, label, lastChanged }: { value: number, label: string, lastChanged: number }) {
    const position = `calc(${(1 - value) * 100}% - 8px)`;
    const [isHot, setIsHot] = useState(false);

    useEffect(() => {
        if (lastChanged > 0) {
            setIsHot(true);
            const timer = setTimeout(() => setIsHot(false), 150);
            return () => clearTimeout(timer);
        }
    }, [lastChanged]);

    return (
        <div className="flex flex-col items-center gap-2 h-full">
            <p className="text-[10px] font-medium text-orange-200/80">{label}</p>
             <div className="relative h-full w-4 rounded-full flex justify-center items-center">
                <div className="w-[2px] h-full bg-black/30 border-l border-r border-orange-500/20 shadow-[0_0_10px_theme(colors.orange.500/10)]"></div>
                 <div 
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 w-3.5 h-4 bg-orange-400 rounded-sm cursor-pointer transition-all duration-75 ease-linear",
                        "hover:bg-orange-300 shadow-[0_0_10px_theme(colors.orange.400)]",
                         isHot && "shadow-[0_0_12px_3px_theme(colors.orange.300)]"
                    )}
                    style={{ top: position }}
                 ></div>
            </div>
        </div>
    )
}


export function MidiControls({ pitchBend, modulation, volume, isYoutubePlaying, toggleYoutubeAudio }: MidiControlsProps) {
    const [lastPitchChange, setLastPitchChange] = useState(0);
    const [lastModChange, setLastModChange] = useState(0);
    const [lastVolumeChange, setLastVolumeChange] = useState(0);

    // Track changes to trigger visual feedback
    useEffect(() => { if (pitchBend !== 0) setLastPitchChange(Date.now()); }, [pitchBend]);
    useEffect(() => { setLastModChange(Date.now()); }, [modulation]);
    useEffect(() => { setLastVolumeChange(Date.now()); }, [volume]);
    
    return (
        <div className="absolute bottom-4 left-4 z-10 flex items-end gap-4">
            <div className="w-auto rounded-lg border border-orange-500/30 bg-gradient-to-br from-purple-900/50 to-purple-800/50 bg-[length:200%_200%] p-3 text-orange-100 shadow-lg shadow-purple-900/20 backdrop-blur-[6px] flex items-end gap-4 h-36 animate-gradient-shift">
                <div className="h-full">
                    <Fader value={volume} label="Volume" lastChanged={lastVolumeChange} />
                </div>
                <div className="flex flex-col justify-center gap-2 h-full">
                    <Wheel value={pitchBend} label="Pitch Bend" springLoaded lastChanged={lastPitchChange} />
                    <Wheel value={modulation} label="Modulation" lastChanged={lastModChange} />
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleYoutubeAudio}
                className="h-10 w-10 rounded-md bg-black/20 hover:bg-black/40 text-orange-300 hover:text-orange-100"
            >
                <AudioLines className={cn(isYoutubePlaying && "soundwave-icon", "transition-opacity", !isYoutubePlaying && "opacity-50")} />
            </Button>
        </div>
    );
}
