
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

export function SettingsMenu({ qualityLevel, onQualityChange }: SettingsMenuProps) {
  return (
    <div className="absolute top-4 right-4 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-orange-500/30 bg-purple-900/50 hover:bg-purple-800/70 text-orange-200 hover:text-orange-100">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-purple-950/80 border-orange-500/30 text-orange-100 backdrop-blur-md">
          <DropdownMenuLabel>Quality Settings</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-orange-500/20" />
          <DropdownMenuRadioGroup value={qualityLevel} onValueChange={(value) => onQualityChange(value as QualityLevel)}>
            <DropdownMenuRadioItem value="Low" className="focus:bg-purple-800/70">
                Low
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Medium" className="focus:bg-purple-800/70">
                Medium
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="High" className="focus:bg-purple-800/70">
                High
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
