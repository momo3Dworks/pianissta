
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
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-lg border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100"
                onClick={() => handleOpenChange('chords', !openMenu)}>
                <Music />
            </Button>
            <LearnMenu
                isOpen={openMenu === 'chords'}
                onOpenChange={(isOpen) => handleOpenChange('chords', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Chords"
                items={chordItems}
                grouping="chordType"
            />

            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-lg border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100"
                onClick={() => handleOpenChange('progressions', !openMenu)}>
                <Workflow />
            </Button>
             <LearnMenu
                isOpen={openMenu === 'progressions'}
                onOpenChange={(isOpen) => handleOpenChange('progressions', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Chord Progressions"
                items={LEARNABLE_CHORD_PROGRESSIONS}
                grouping="genre"
            />

            <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-lg border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100"
                onClick={() => handleOpenChange('modes', !openMenu)}>
                <BarChart3 />
            </Button>
             <LearnMenu
                isOpen={openMenu === 'modes'}
                onOpenChange={(isOpen) => handleOpenChange('modes', isOpen)}
                onSelectItem={onSelectItem}
                selectedItem={selectedItem}
                title="Modes"
                items={modeItems}
                grouping="modeType"
            />
        </div>
    );
}

