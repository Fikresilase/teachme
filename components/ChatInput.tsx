"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ArrowUp, Play, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (prompt: string, mode: string) => void;
  isLoading?: boolean;
}

const MODES = [
  { id: "explainer", name: "Explainer", icon: Play, color: "text-yellow-400" },
  {
    id: "text",
    name: "Text Response",
    icon: MessageSquareText,
    color: "text-blue-400",
  },
];

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState(MODES[0]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    onSend(prompt, mode.id);
    setPrompt("");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-2 border border-zinc-800 shadow-2xl transition-all duration-300 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700"
      >
        {/* Mode Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-all duration-200 active:scale-95">
              <mode.icon className={cn("w-4 h-4", mode.color)} />
              <span className="hidden sm:inline">{mode.name}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl"
            side="top"
            align="start"
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 px-2 font-bold">
              Output Type
            </div>
            <div className="grid gap-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    mode.id === m.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                  )}
                >
                  <m.icon className={cn("w-4 h-4", m.color)} />
                  {m.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* The Input */}
        <input
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 placeholder:text-zinc-600 text-sm md:text-base outline-none relative z-10"
          placeholder="What should I explain today?"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!prompt.trim()}
          className={cn(
            "bg-white text-black rounded-xl p-2 transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:scale-100",
            isLoading && "opacity-80",
          )}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
