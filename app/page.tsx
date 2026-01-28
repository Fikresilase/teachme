"use client";

import { useState, useRef } from "react";
import { ChatInput } from "@/components/ChatInput";
import { DiagramPlayer } from "@/components/DiagramPlayer";
import { ExplainerScript } from "@/lib/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    script: ExplainerScript | null;
    audio: string | null;
    text: string | null;
  }>({ script: null, audio: null, text: null });

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = async (prompt: string, mode: string) => {
    // 1. Cancel previous request if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Setup new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setData({ script: null, audio: null, text: null });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
        signal: controller.signal,
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (mode === "text") {
        setData({ script: null, audio: null, text: result.text_response });
      } else {
        setData({ script: result.script, audio: result.audio, text: null });
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      console.error(error);
      alert("Failed to generate response. Check your keys or connection.");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 text-white">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[3%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-6xl px-6 py-12 flex flex-col gap-12">
        {/* Combined Hero & Player Area */}
        <div className="flex flex-col gap-8 min-h-[70vh] justify-center pt-10">
          <AnimatePresence mode="wait">
            {!data.script && !data.text && !isLoading ? (
              <motion.header
                key="hero"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="text-center space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 text-zinc-400 text-xs font-semibold tracking-widest uppercase">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>The Geometric Explainer</span>
                </div>

                <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-white">
                  Visual <span className="text-zinc-700">Reasoning.</span>
                  <br />
                  <span className="text-cyan-400 font-handwritten italic">
                    Diagrammed.
                  </span>
                </h1>

                <p className="max-w-2xl mx-auto text-zinc-500 md:text-2xl leading-relaxed font-light">
                  Transform any complex theory into a 3Blue1Brown-style
                  procedural animation. Mathematical precision with a hand-drawn
                  touch.
                </p>
              </motion.header>
            ) : isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-10 py-20"
              >
                <div className="relative w-32 h-32">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 border-t-2 border-l-2 border-cyan-500 rounded-full"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-4 border-b-2 border-r-2 border-purple-500 rounded-full"
                  />
                </div>
                <div className="text-center space-y-4">
                  <p className="text-white font-medium text-2xl tracking-tight">
                    Drafting Geometric Logic...
                  </p>
                  <p className="text-zinc-600 text-sm uppercase tracking-widest">
                    Converting prompt into 100x100 spatial operations
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="w-full flex flex-col items-center gap-8"
              >
                {data.script && data.audio ? (
                  <DiagramPlayer
                    data={data.script}
                    audioUrl={data.audio as string}
                  />
                ) : (
                  <div className="w-full max-w-4xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-[2.5rem] p-12 md:p-20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                        <Bot className="w-8 h-8" />
                      </div>
                      <h2 className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-sm">
                        Synthetic Insight
                      </h2>
                    </div>
                    <div className="relative">
                      <p className="text-zinc-200 text-xl md:text-3xl leading-relaxed whitespace-pre-wrap font-light tracking-tight">
                        {data.text || ""}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    setData({ script: null, audio: null, text: null })
                  }
                  className="group flex items-center gap-3 text-zinc-600 hover:text-white text-xs uppercase tracking-[0.3em] font-bold transition-all py-4"
                >
                  <span className="transition-transform group-hover:-translate-x-1">
                    ←
                  </span>
                  Discard Scene
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input area */}
        <div className="sticky bottom-10 z-[100] w-full flex justify-center">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </main>
  );
}
