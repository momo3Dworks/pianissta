
"use client";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface LearnMenuGridProps {
  items: string[];
  onItemSelect: (item: string) => void;
  onBack?: () => void;
  isNoteGrid?: boolean;
}

export function LearnMenuGrid({ items, onItemSelect, onBack, isNoteGrid = false }: LearnMenuGridProps) {
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className={cn(
        "w-full transition-all duration-300 ease-in-out"
    )}>
        {onBack && (
             <Button onClick={onBack} variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
        )}
        <div className={cn(
            "grid gap-3",
            isNoteGrid 
                ? "grid-cols-4 sm:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        )}>
          {items.map((item) => (
            <Button
              key={item}
              variant="outline"
              onClick={() => onItemSelect(item)}
              className="h-20 text-sm md:text-base font-semibold bg-purple-800/30 border-orange-500/30 hover:bg-purple-700/50 rounded-none"
              style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }}
            >
              {item}
            </Button>
          ))}
        </div>
    </div>
  );
}
