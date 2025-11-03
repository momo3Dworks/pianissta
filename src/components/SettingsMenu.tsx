
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Settings, Check } from "lucide-react";

export type QualityLevel = "Low" | "Medium" | "High";

interface SettingsMenuProps {
    qualityLevel: QualityLevel;
    onQualityChange: (level: QualityLevel) => void;
}

const qualityDescriptions: Record<QualityLevel, string> = {
    Low: "Ideal for performance",
    Medium: "Balanced quality and performance",
    High: "Best visual fidelity",
};


export function SettingsMenu({ qualityLevel, onQualityChange }: SettingsMenuProps) {
  return (
    <div className="z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-lg backdrop-blur-md  border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100"
          >
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
            className="w-64 bg-purple-950/80 border-orange-500/30 text-orange-100 backdrop-blur-md rounded-lg"
        >
          <DropdownMenuLabel>Quality Settings</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-orange-500/20" />
          <DropdownMenuRadioGroup value={qualityLevel} onValueChange={(value) => onQualityChange(value as QualityLevel)}>
            {(['Low', 'Medium', 'High'] as QualityLevel[]).map(level => (
                <DropdownMenuRadioItem key={level} value={level} className="focus:bg-purple-800/70 p-3">
                    <div className="flex flex-col">
                        <span>{level}</span>
                        <span className="text-xs text-orange-200/60">{qualityDescriptions[level]}</span>
                    </div>
                </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
