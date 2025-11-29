import React, { useState, useEffect, useRef } from 'react';
import { AlignmentData } from '@/types/activity';
import { cn } from '@/lib/utils';

interface KaraokeTranscriptProps {
  transcript: string;
  alignmentData?: AlignmentData;
  currentTime: number;
  voiceId: string;
}

export function KaraokeTranscript({ transcript, alignmentData, currentTime }: KaraokeTranscriptProps) {
  const [activeCharIndex, setActiveCharIndex] = useState(-1);
  const [translateY, setTranslateY] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize Position
  useEffect(() => {
    // Center the text initially (or reset)
    if (containerRef.current && contentRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        // Start with the first line centered?
        // Let's modify the translateY calculation to be relative to the *top* of the content
        // Initial offset to push the text down so the first line is in the middle.
        // Actually, let's rely on the active index calculation to handle 0.
        // But if activeIndex is -1, we force it to 0.
    }
  }, []);

  useEffect(() => {
    if (!alignmentData || !alignmentData.character_end_times_seconds) {
      setActiveCharIndex(-1);
      return;
    }

    // 1. Find Current Character
    let currentCharacterIndex = 0; // Default to first char so it's visible at start
    for (let i = 0; i < alignmentData.character_end_times_seconds.length; i++) {
        const startTime = alignmentData.character_start_times_seconds[i];
        if (currentTime >= startTime) {
            currentCharacterIndex = i;
        } else {
            break; 
        }
    }

    setActiveCharIndex(currentCharacterIndex);

    // 2. Calculate Smooth Offset (Transform)
    if (contentRef.current && containerRef.current) {
      // Fallback: If index is invalid (e.g. -1), use 0
      const targetIndex = currentCharacterIndex === -1 ? 0 : currentCharacterIndex;
      const activeSpan = contentRef.current.children[0].children[targetIndex] as HTMLElement; // content -> p -> spans
      
      if (activeSpan) {
        const containerHeight = containerRef.current.clientHeight;
        const spanTop = activeSpan.offsetTop;
        const spanHeight = activeSpan.clientHeight;

        // Target: Center of container
        // Formula: TranslateY = (ContainerHeight / 2) - (SpanTop + SpanHeight / 2)
        const targetOffset = (containerHeight / 2) - (spanTop + (spanHeight / 2));
        
        setTranslateY(targetOffset);
      }
    }

  }, [currentTime, alignmentData]);

  if (!alignmentData || !alignmentData.characters || alignmentData.characters.length === 0) {
      return <div className="text-slate-500 text-lg leading-relaxed p-8">{transcript}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-64 overflow-hidden w-full select-none" // Reduced height slightly to 64 (16rem) for focus
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 w-full px-4 transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <p className="text-2xl font-bold leading-loose text-center text-slate-300 dark:text-slate-800"> {/* Default color for unplayed */}
          {alignmentData.characters.map((char, index) => {
            const isPlayed = index <= activeCharIndex;
            const isCurrent = index === activeCharIndex; // Specific style for the exact current char?
            
            return (
              <span
                key={index}
                className={cn(
                  "transition-colors duration-100", 
                  isPlayed 
                    ? "text-purple-600 dark:text-purple-400 opacity-100" 
                    : "opacity-40"
                )}
              >
                {char}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
