
"use client";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type LearnableItem, type LearnableChordProgression, midiNoteToName, LEARNABLE_ITEMS } from "@/lib/music-theory";
import { cn } from "@/lib/utils";
import { PianoIcon } from "./PianoIcon";
import { Info } from "lucide-react";

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

const getChordTypeName = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return parts.slice(1).join(' ');
    }
    const match = name.match(/^[A-G][#b]?\d*\s*/);
    if (!match) return name; // fallback
    const typeName = name.substring(match[0].length).trim();
    return typeName === '' ? 'Maj' : typeName;
}

export function LearnMenu({ isOpen, onOpenChange, onSelectItem, selectedItem, title, items, grouping }: LearnMenuProps) {

  const handleSelect = (item: SelectableItem) => {
    onSelectItem(item);
    onOpenChange(false);
  };

  const handleClear = () => {
    onSelectItem(null);
    onOpenChange(false);
  }

  const groupItems = () => {
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
      let key: string;
      switch (grouping) {
        case 'chordType':
            key = getChordTypeName(item.name);
            if(key === '') key = 'Maj'; // Handle simple major chords like "C"
            break;
        case 'modeType':
            key = item.name.split(' ').slice(1).join(' '); // e.g., "Ionian"
            break;
        case 'genre':
            key = (item as LearnableChordProgression).genre;
            break;
        case 'rootNote':
        default:
            key = midiNoteToName(item.rootNote);
            break;
      }
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };
  
  const groupedItems = groupItems();

  const isProgression = grouping === 'genre';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="top" 
        className="h-3/4 bg-purple-950/40 border-b border-orange-500/20 text-orange-100 backdrop-blur-md rounded-b-lg max-w-[1250px] mx-auto overflow-hidden"
      >
        <TooltipProvider>
          <div className="relative h-full flex flex-col">
              <div 
                  className="absolute inset-0 bg-no-repeat bg-center invert opacity-10 pointer-events-none"
                  style={{ backgroundImage: "url('/assets/Pianissta_Logo_tiny.webp')", backgroundSize: '97%' }}
              />
            <div className="relative h-full flex flex-col max-w-4xl mx-auto w-full">
                <SheetHeader className="text-center">
                  <SheetTitle className="text-orange-100">{title}</SheetTitle>
                </SheetHeader>
                <div className="py-4 flex-1 flex flex-col min-h-0">
                    {selectedItem && (
                        <div className="mb-4 text-center">
                            <p className="text-sm text-orange-300">Currently Learning:</p>
                            <p className="font-bold text-lg text-orange-100">{selectedItem.name}</p>
                            <Button onClick={handleClear} variant="destructive" size="sm" className="mt-2">
                                Stop Learning
                            </Button>
                        </div>
                    )}
                  <ScrollArea className="flex-1 pr-4">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedItems).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([groupName, itemsInGroup]) => (
                          <AccordionItem value={groupName} key={groupName}>
                              <AccordionTrigger className="text-xl font-bold text-orange-200">{groupName}</AccordionTrigger>
                              <AccordionContent>
                                  <div className="flex flex-col items-start gap-1 pl-2">
                                      {itemsInGroup.sort((a,b) => a.rootNote - b.rootNote).map(item => (
                                          <Button
                                              key={item.name}
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleSelect(item)}
                                              className={cn(
                                                  "w-full justify-between hover:bg-purple-800/50 text-base h-auto py-2 flex items-center",
                                                  selectedItem?.name === item.name && "bg-orange-500/30"
                                              )}
                                          >
                                              <div className="flex-1 flex flex-col items-start text-left">
                                                  <span>{item.name}</span>
                                                  {isProgression && 'chords_C' in item && (
                                                      <span className="text-xs text-orange-300/70">{item.chords_C.join(' - ')}</span>
                                                  )}
                                                   {isProgression && 'difficulty' in item && (
                                                      <span className="text-xs font-semibold text-cyan-300/80 mt-1">{item.difficulty}</span>
                                                  )}
                                              </div>
                                              <div className="flex items-center gap-4">
                                                {isProgression && 'comment' in item && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-orange-200/70 hover:text-orange-100" />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-purple-800/80 border-orange-500/30 text-orange-100">
                                                            <p>{item.comment}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                <PianoIcon notesToHighlight={item.notes} className="w-[100px] h-[40px]" />
                                              </div>
                                          </Button>
                                      ))}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </div>
                <SheetFooter className="mt-auto py-4">
                    <p className="text-xs text-orange-200/50 w-full text-center">
                        © 2025 Pianissta. All Rights Reserved.
                    </p>
                </SheetFooter>
              </div>
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}
