
"use client";

import { useState } from "react";
import { Music, Workflow, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { LearnMenu } from "./LearnMenu";
import { LEARNABLE_ITEMS, LEARNABLE_CHORD_PROGRESSIONS, type LearnableItem, type LearnableChordProgression } from "@/lib/music-theory";

type SelectableItem = LearnableItem | LearnableChordProgression;

interface LearningToolbarProps {
    onSelectItem: (item: SelectableItem | null) => void;
    selectedItem: SelectableItem | null;
}

export function LearningToolbar({ onSelectItem, selectedItem }: LearningToolbarProps) {
    const [openMenu, setOpenMenu] = useState<'chords' | 'progressions' | 'modes' | null>(null);

    const handleOpenChange = (menu: 'chords' | 'progressions' | 'modes', isOpen: boolean) => {
        if (isOpen) {
            setOpenMenu(menu);
        } else if (openMenu === menu) {
            setOpenMenu(null);
        }
    }

    const chordItems = LEARNABLE_ITEMS.filter(item => item.type === 'Chord');
    const modeItems = LEARNABLE_ITEMS.filter(item => item.type === 'Mode');

    return (
        <>
            <div className="relative group">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-none border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100 backdrop-blur-md"
                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                    onClick={() => handleOpenChange('chords', !openMenu)}>
                    <Music />
                </Button>
                <span className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-light text-sm pointer-events-none">
                    Chords
                </span>
            </div>
            <LearnMenu
                isOpen={openMenu === 'chords'}
                onOpenChange={(isOpen) => handleOpenChange('chords', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Chords"
                items={chordItems}
                grouping="chordType"
            />

            <div className="relative group">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-none border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100 backdrop-blur-md"
                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                    onClick={() => handleOpenChange('progressions', !openMenu)}>
                    <Workflow />
                </Button>
                 <span className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-light text-sm pointer-events-none">
                    Progressions
                </span>
            </div>
             <LearnMenu
                isOpen={openMenu === 'progressions'}
                onOpenChange={(isOpen) => handleOpenChange('progressions', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Chord Progressions"
                items={LEARNABLE_CHORD_PROGRESSIONS}
                grouping="genre"
            />

            <div className="relative group">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-none border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100 backdrop-blur-md"
                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                    onClick={() => handleOpenChange('modes', !openMenu)}>
                    <BarChart3 />
                </Button>
                <span className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-light text-sm pointer-events-none">
                    Modes
                </span>
            </div>
             <LearnMenu
                isOpen={openMenu === 'modes'}
                onOpenChange={(isOpen) => handleOpenChange('modes', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Modes"
                items={modeItems}
                grouping="modeType"
            />
        </>
    );
}
