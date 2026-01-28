"use client";

import { useEffect, useRef, useState } from "react";
import { annotate } from "rough-notation";
import { Play, RotateCcw, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExplainerPlayer({
  data,
  audioUrl,
}: {
  data: any;
  audioUrl: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Track which annotations we've already drawn
  const drawnAnnotations = useRef<Set<string>>(new Set());
  const activeAnnotations = useRef<any[]>([]);

  // Themes mapping
  const themes = {
    dark: "bg-zinc-950 text-zinc-100",
    light: "bg-[#fdfbf7] text-zinc-800",
    green: "bg-black text-green-400", // The Matrix look
    blue: "bg-slate-900 text-blue-100",
  };

  // Font mapping
  const fonts = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
    handwritten: "font-handwritten",
  };

  const currentTheme =
    themes[data.settings.theme as keyof typeof themes] || themes.dark;
  const currentFont =
    fonts[data.settings.font as keyof typeof fonts] || fonts.sans;

  useEffect(() => {
    let animationFrameId: number;

    const checkTime = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime * 1000;
        setCurrentTime(time);
        triggerAnimations(time);
      }
      animationFrameId = requestAnimationFrame(checkTime);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(checkTime);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const triggerAnimations = (time: number) => {
    data.steps.forEach((step: any) => {
      if (time >= step.delay_ms) {
        // 1. Handle TEXT revealing
        if (step.type === "type_text") {
          const el = document.getElementById(`step-${step.id}`);
          if (el) el.style.opacity = "1";
        }

        // 2. Handle ANNOTATIONS (only draw once)
        if (["highlight", "circle", "box", "arrow"].includes(step.type)) {
          if (!drawnAnnotations.current.has(step.id)) {
            const targetEl = document.getElementById(`step-${step.target_id}`);
            if (targetEl) {
              const annotation = annotate(targetEl, {
                type: step.type === "highlight" ? "highlight" : step.type,
                color:
                  step.color ||
                  (data.settings.theme === "green" ? "#22c55e" : "#F59E0B"),
                multiline: true,
                padding: 2,
                strokeWidth: 2,
              });
              annotation.show();
              activeAnnotations.current.push(annotation);
              drawnAnnotations.current.add(step.id);
            }
          }
        }
      }
    });
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    drawnAnnotations.current = new Set();
    activeAnnotations.current.forEach((a) => {
      try {
        a.hide();
      } catch (e) {}
    });
    activeAnnotations.current = [];

    data.steps.forEach((step: any) => {
      if (step.type === "type_text") {
        const el = document.getElementById(`step-${step.id}`);
        if (el) el.style.opacity = "0";
      }
    });
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 transition-colors duration-1000",
        currentTheme,
      )}
    >
      {/* 1. Header / Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
        <h3 className="text-xs font-bold opacity-50 tracking-[0.2em] uppercase">
          Visual Explainer
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            {isPlaying ? "PAUSE" : "PLAY"}
          </button>
        </div>
      </div>

      {/* 2. The "Paper" */}
      <div
        ref={containerRef}
        className={cn(
          "relative p-8 md:p-16 min-h-[500px] text-2xl md:text-4xl lg:text-5xl leading-relaxed md:leading-[1.6] transition-all",
          currentFont,
        )}
        style={{
          fontFamily:
            data.settings.font === "handwritten"
              ? "var(--font-handwritten)"
              : undefined,
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-wrap gap-x-4 gap-y-3 content-start">
          {data.steps.map((step: any) => {
            if (step.type !== "type_text") return null;

            return (
              <span
                key={step.id}
                id={`step-${step.id}`}
                className="opacity-0 transition-opacity duration-700 ease-out inline-block"
              >
                {step.text}
              </span>
            );
          })}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <div
          className="h-full bg-white/40 transition-all duration-100 ease-linear"
          style={{
            width: `${audioRef.current?.duration ? (currentTime / (audioRef.current.duration * 1000)) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Subtle Grain Overlap */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
