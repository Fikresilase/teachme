"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import rough from "roughjs";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface DiagramPlayerProps {
  data: any;
  audioUrl: string;
}

export function DiagramPlayer({ data, audioUrl }: DiagramPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Helper to scale 0-177 logical grid to real pixels preserving 16:9
  const getCoords = useCallback(
    (w: number, h: number, x?: number, y?: number) => ({
      x: ((x || 0) / 177) * w, // Map 0-177 logical space to Screen Width
      y: ((y || 0) / 100) * h, // Map 0-100 logical space to Screen Height
    }),
    [],
  );

  const renderFrame = useCallback(
    (timeMs: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rc = rough.canvas(canvas);
      const { width, height } = canvas;

      // Draw subtle "Blueprint" grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridRows = 10;
      const gridCols = 18;
      const cellW = width / gridCols;
      const cellH = height / gridRows;

      for (let i = 0; i <= gridCols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellW, 0);
        ctx.lineTo(i * cellW, height);
        ctx.stroke();
      }
      for (let i = 0; i <= gridRows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellH);
        ctx.lineTo(width, i * cellH);
        ctx.stroke();
      }

      // Filter operations that have occurred before or at current time
      const opsToRender = data.canvas_operations.filter(
        (op: any) => op.delay_ms <= timeMs,
      );

      opsToRender.forEach((op: any) => {
        const { x, y } = getCoords(width, height, op.x, op.y);
        const { x: w, y: h } = getCoords(width, height, op.width, op.height);
        const stroke = op.color || "#4ADE80";
        const fill = op.fill || "transparent";

        const duration = op.duration_ms || 800;
        const elapsed = timeMs - op.delay_ms;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic Out

        const opts = {
          stroke,
          fill,
          fillStyle:
            fill !== "transparent" && fill !== "" ? "solid" : undefined,
          strokeWidth: 2,
          roughness: op.roughness ?? 0.5,
          bowing: 1.5,
          seed: parseInt(op.id.replace(/\D/g, "")) || 1,
        };

        switch (op.type) {
          case "clear":
            if (elapsed < 100) ctx.clearRect(0, 0, width, height);
            break;
          case "draw_circle":
            rc.circle(x, y, w * ease, opts);
            break;
          case "draw_rect":
            rc.rectangle(x, y, w * ease, h * ease, opts);
            break;
          case "draw_line":
          case "draw_arrow":
            if (op.points && op.points.length >= 4) {
              const p1 = getCoords(width, height, op.points[0], op.points[1]);
              const p2 = getCoords(width, height, op.points[2], op.points[3]);

              const curX = p1.x + (p2.x - p1.x) * ease;
              const curY = p1.y + (p2.y - p1.y) * ease;

              rc.line(p1.x, p1.y, curX, curY, opts);

              if (op.type === "draw_arrow" && progress > 0.8) {
                const arrowEase = (progress - 0.8) / 0.2;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const headLen = 15 * arrowEase;
                rc.line(
                  curX,
                  curY,
                  curX - headLen * Math.cos(angle - Math.PI / 6),
                  curY - headLen * Math.sin(angle - Math.PI / 6),
                  opts,
                );
                rc.line(
                  curX,
                  curY,
                  curX - headLen * Math.cos(angle + Math.PI / 6),
                  curY - headLen * Math.sin(angle + Math.PI / 6),
                  opts,
                );
              }
            }
            break;
          case "write_label":
            ctx.globalAlpha = ease;
            ctx.fillStyle = stroke;
            ctx.font =
              "bold 24px 'Patrick Hand', var(--font-handwritten), cursive";
            ctx.fillText(op.label || "", x, y);
            ctx.globalAlpha = 1.0;
            break;
        }
      });
    },
    [data, getCoords],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const timeMs = audio.currentTime * 1000;
      setProgress(audio.currentTime);
      renderFrame(timeMs);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [renderFrame]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration,
          audioRef.current.currentTime + seconds,
        ),
      );
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (canvasRef.current) {
      const w = 1200;
      canvasRef.current.width = w;
      canvasRef.current.height = (w * 9) / 16;
      renderFrame(0);
    }
  }, [renderFrame]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 group">
      <div className="relative aspect-video w-full bg-[#0a0a0a] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="mb-4">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.01}
              onValueChange={(v) => {
                if (audioRef.current) audioRef.current.currentTime = v[0];
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/10 rounded-full w-12 h-12"
              >
                {isPlaying ? (
                  <Pause className="fill-current" />
                ) : (
                  <Play className="fill-current ml-1" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-5)}
                  className="text-zinc-400 hover:text-white"
                >
                  <SkipBack size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(5)}
                  className="text-zinc-400 hover:text-white"
                >
                  <SkipForward size={20} />
                </Button>
              </div>
              <div className="text-zinc-400 text-sm font-mono">
                <span className="text-white">{formatTime(progress)}</span> /{" "}
                {formatTime(duration)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-400 hover:text-white"
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                className="text-zinc-400 hover:text-white"
              >
                <RotateCcw size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white"
              >
                <Maximize2 size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        muted={isMuted}
        className="hidden"
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center justify-center gap-8 text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">
        <span>Procedural Graphics</span>
        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
        <span>Gemini 2.0 Logic</span>
        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
        <span>Neural Rendering</span>
      </div>
    </div>
  );
}
