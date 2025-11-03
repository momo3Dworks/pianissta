
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type LearnableItem, type LearnableChordProgression, getChordTypeNameFromItem, getModeTypeNameFromItem, NOTE_NAMES } from "@/lib/music-theory";
import { LearnMenuGrid } from "./LearnMenuGrid";

type SelectableItem = LearnableItem | LearnableChordProgression;
type GroupingMode = 'rootNote' | 'chordType' | 'modeType' | 'genre';

interface LearnMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectItem: (item: SelectableItem | null) => void;
  selectedItem: SelectableItem | null;
  title: string;
  items: LearnableItem[] | LearnableChordProgression[];
  grouping: GroupingMode;
}

export function LearnMenu({ isOpen, onOpenChange, onSelectItem, selectedItem, title, items, grouping }: LearnMenuProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (item: SelectableItem) => {
    onSelectItem(item);
    onOpenChange(false);
    setTimeout(() => setSelectedType(null), 300); // Reset after closing animation
  };

  const handleClear = () => {
    onSelectItem(null);
    onOpenChange(false);
     setTimeout(() => setSelectedType(null), 300);
  }

  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      setTimeout(() => setSelectedType(null), 300);
    }
    onOpenChange(open);
  }

  const groupItems = () => {
    if (grouping === 'genre') {
        const grouped: Record<string, LearnableChordProgression[]> = {};
        (items as LearnableChordProgression[]).forEach(item => {
            const key = item.genre;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        return grouped;
    } else {
        const grouped: Record<string, LearnableItem[]> = {};
        (items as LearnableItem[]).forEach(item => {
            let key: string;
            switch (grouping) {
                case 'chordType':
                    key = getChordTypeNameFromItem(item);
                    break;
                case 'modeType':
                    key = getModeTypeNameFromItem(item);
                    break;
                default:
                    return;
            }
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });
        return grouped;
    }
  };
  
  const groupedItems = groupItems();
  const types = Object.keys(groupedItems).sort();

  const getItemsForSelectedType = () => {
    if (!selectedType) return [];
    
    if (grouping === 'genre') {
        return groupedItems[selectedType] as LearnableChordProgression[];
    }
    return groupedItems[selectedType] as LearnableItem[];
  }
  
  const itemsForSelectedType = getItemsForSelectedType();

  const getItemsBySubKey = () => {
     if (!selectedType) return {};
     if (grouping === 'genre') {
        const itemsByName: Record<string, LearnableChordProgression> = {};
        (itemsForSelectedType as LearnableChordProgression[]).forEach(item => {
            itemsByName[item.name] = item;
        });
        return { items: itemsByName, keys: Object.keys(itemsByName) };
     } else {
        const itemsByRootNote: Record<string, LearnableItem> = {};
        (itemsForSelectedType as LearnableItem[]).forEach(item => {
            if (item.rootNote >= 60 && item.rootNote < 72) {
                const rootName = NOTE_NAMES[item.rootNote % 12];
                itemsByRootNote[rootName] = item;
            }
        });
        return { items: itemsByRootNote, keys: NOTE_NAMES.filter(name => itemsByRootNote[name]) };
     }
  }

  const { items: subItems, keys: subItemKeys } = getItemsBySubKey();


  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <SheetContent 
        side="top" 
        className="h-auto bg-purple-950/40 border-b border-orange-500/20 text-orange-100 backdrop-blur-md rounded-b-lg max-w-4xl w-full mx-auto overflow-hidden"
      >
        <div className="relative h-full flex flex-col">
            <div 
                className="absolute inset-0 bg-no-repeat bg-center invert opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('/assets/Pianissta_Logo_tiny.webp')", backgroundSize: '67%' }}
            />
          <div className="relative h-full flex flex-col w-full">
              <SheetHeader className="text-center">
                <SheetTitle className="text-orange-100">{title}{selectedType ? ` > ${selectedType}`: ''}</SheetTitle>
              </SheetHeader>
              <div className="py-4 flex-1 flex flex-col min-h-0">
                  {selectedItem && !selectedType && (
                      <div className="mb-4 text-center">
                          <p className="text-sm text-orange-300">Currently Learning:</p>
                          <p className="font-bold text-lg text-orange-100">{selectedItem.name}</p>
                          <Button onClick={handleClear} variant="destructive" size="sm" className="mt-2">
                              Stop Learning
                          </Button>
                      </div>
                  )}
                <ScrollArea className="flex-1 pr-4 -mr-4">
                  <div className="relative">
                    {!selectedType ? (
                      <LearnMenuGrid
                        items={types}
                        onItemSelect={setSelectedType}
                        isNoteGrid={false}
                      />
                    ) : (
                      <LearnMenuGrid
                        items={subItemKeys}
                        onItemSelect={(key) => {
                            const item = (subItems as Record<string, SelectableItem>)[key];
                            if (item) handleSelect(item);
                        }}
                        onBack={() => setSelectedType(null)}
                        isNoteGrid={grouping !== 'genre'}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
              <SheetFooter className="mt-auto py-4">
                  <p className="text-xs text-orange-200/50 w-full text-center">
                      © 2025 Pianissta. All Rights Reserved.
                  </p>
              </SheetFooter>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
