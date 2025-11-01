
"use client";

interface UnifiedLoaderProps {
  loadingStep: string;
  progress: number;
}

export function UnifiedLoader({ loadingStep, progress }: UnifiedLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-8">
        <div id="piano">
          <div id="white-keys">
            <div className="key" id="press-1"></div>
            <div className="key" id="press-3"></div>
            <div className="key" id="press-5"></div>
            <div className="key" id="press-7"></div>
          </div>
          <div id="black-keys">
            <div className="key" id="press-2"></div>
            <div className="key" id="press-4"></div>
            <div className="key" id="press-6"></div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-foreground">{loadingStep}</p>
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}
