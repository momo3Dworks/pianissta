
"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LEARNABLE_ITEMS, type LearnableItem, midiNoteToName } from "@/lib/music-theory";
import { cn } from "@/lib/utils";
import { PianoIcon } from "./PianoIcon";

interface LearnMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectItem: (item: LearnableItem | null) => void;
  selectedItem: LearnableItem | null;
}

export function LearnMenu({ isOpen, onOpenChange, onSelectItem, selectedItem }: LearnMenuProps) {

  const handleSelect = (item: LearnableItem) => {
    onSelectItem(item);
    onOpenChange(false);
  };

  const handleClear = () => {
    onSelectItem(null);
    onOpenChange(false);
  }

  const groupedChords: Record<string, LearnableItem[]> = {};
  LEARNABLE_ITEMS.filter(item => item.type === 'Chord').forEach(item => {
    const rootName = midiNoteToName(item.rootNote);
    if (!groupedChords[rootName]) {
      groupedChords[rootName] = [];
    }
    groupedChords[rootName].push(item);
  });

  const groupedModes: Record<string, LearnableItem[]> = {};
  LEARNABLE_ITEMS.filter(item => item.type === 'Mode').forEach(item => {
    const modeName = item.name.split(' ').slice(1).join(' '); // e.g., "Ionian"
    if (!groupedModes[modeName]) {
      groupedModes[modeName] = [];
    }
    groupedModes[modeName].push(item);
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="group fixed top-0 left-1/2 -translate-x-1/2 z-20 h-8 w-32 rounded-t-none rounded-b-lg border-t-0 border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100 flex items-center justify-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">Learn</span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="top" 
        className="h-3/4 bg-purple-950/40 border-b border-orange-500/20 text-orange-100 backdrop-blur-md rounded-b-lg max-w-[1250px] mx-auto overflow-hidden"
      >
        <div className="relative h-full flex flex-col max-w-4xl mx-auto">
            <div 
                className="absolute inset-0 bg-no-repeat bg-center invert opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('/assets/Pianissta_Logo_tiny.webp')", backgroundSize: '97%' }}
            />
          <SheetHeader className="text-center">
            <SheetTitle className="text-orange-100">Learning Mode</SheetTitle>
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

                <AccordionItem value="Chords">
                  <AccordionTrigger className="text-xl font-bold text-orange-200">Chords</AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple">
                      {Object.entries(groupedChords).sort().map(([rootName, items]) => (
                        <AccordionItem value={`chord-${rootName}`} key={`chord-${rootName}`}>
                          <AccordionTrigger>{rootName}</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col items-start gap-1 pl-2">
                              {items.map(item => (
                                <Button
                                  key={item.name}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelect(item)}
                                  className={cn(
                                    "w-full justify-between hover:bg-purple-800/50 text-base h-16 flex",
                                    selectedItem?.name === item.name && "bg-orange-500/30"
                                    )}
                                >
                                  <span>{item.name}</span>
                                  <PianoIcon notesToHighlight={item.notes} className="w-[100px] h-[40px]" />
                                </Button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="Modes">
                  <AccordionTrigger className="text-xl font-bold text-orange-200">Modes</AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple">
                      {Object.entries(groupedModes).sort().map(([modeName, items]) => (
                        <AccordionItem value={`mode-${modeName}`} key={`mode-${modeName}`}>
                          <AccordionTrigger>{modeName}</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col items-start gap-1 pl-2">
                              {items.sort((a,b) => a.rootNote - b.rootNote).map(item => (
                                <Button
                                  key={item.name}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelect(item)}
                                  className={cn(
                                    "w-full justify-between hover:bg-purple-800/50 text-base h-16 flex",
                                    selectedItem?.name === item.name && "bg-orange-500/30"
                                    )}
                                >
                                  <span>{item.name}</span>
                                  <PianoIcon notesToHighlight={item.notes} className="w-[100px] h-[40px]" />
                                </Button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </ScrollArea>
          </div>
          <SheetFooter className="mt-auto py-4">
              <p className="text-xs text-orange-200/50 w-full text-center">
                  © 2025 Pianissta. All Rights Reserved.
              </p>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
