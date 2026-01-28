import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { ExplainerSchema } from "@/lib/schema";

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log("\n--- NEW PREMIUM GENERATION REQUEST (OPENAI) ---");

  try {
    const body = await req.json();
    const { prompt, mode } = body;

    console.log("PROMPT:", prompt);
    console.log("MODE:", mode);

    if (mode === "text") {
      console.log("Starting OpenAI Text Generation...");
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: prompt,
        system:
          "You are a helpful assistant. Provide a clear, concise text response.",
      });
      console.log("RECIEVED TEXT:", text);
      return Response.json({ text_response: text });
    }

    const systemPrompt = `
      You are a world-class visual animation director (like 3Blue1Brown). 
      Your goal is to create an EXTREMELY AMAZING, 20-SECOND intuitive animation.

      CRITICAL CONSTRAINTS:
      1. DURATION: narration_text MUST be exactly 50-70 words to span ~20 seconds.
      2. PERSPECTIVE: Use pseudo-3D effects (depth lines, perspective boxes).
      3. VISUALS: Use 'fill' properties for solids. Layer backgrounds first.
      4. PRECISION: Round all coordinates to 2 decimal places.
      5. NULLS: If a property (x, y, width, points, etc.) is not applicable to the 'type', you MUST return null for it. DO NOT omit it.

      THE CANVAS (16:9 Aspect Ratio):
      - Logic Grid: X (0-177), Y (0-100).
      - Center: (88, 50).

      PRIMITIVES:
      - 'draw_circle': x, y (center), width (diameter), fill, color (stroke), roughness.
      - 'draw_rect': x, y (top-left), width, height, fill, color, roughness.
      - 'draw_line': points[x1, y1, x2, y2], color, roughness.
      - 'draw_arrow': points[x1, y1, x2, y2], color, roughness.
      - 'write_label': x, y, label, color.
      
      TIMING:
      - Start delay_ms at 0.
      - End around 18000ms. Space operations carefully.
      - Use vibrant hex/rgba: Neon (#4ADE80), Cyan (#22D3EE), Yellow (#FACC15), Pink (#F472B6).
    `;

    console.log("Calling OpenAI GPT-4o for structured script...");

    // 1. Generate Script using OpenAI GPT-4o
    const { object: script } = await generateObject({
      model: openai("gpt-4o", {
        structuredOutputs: true,
      }),
      schema: ExplainerSchema,
      prompt: `Create a Manim-style visual explanation for: "${prompt}"`,
      system: systemPrompt,
    });

    console.log("RECEIVED COMPLETE SCRIPT FROM OPENAI");

    // 2. Audio Generation (Using OpenAI TTS as before)
    console.log("Calling OpenAI TTS (Speed 1.1)...");
    const audioResponse = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        body: JSON.stringify({
          model: "tts-1",
          input: script.narration_text,
          voice: "alloy",
          speed: 1.1,
        }),
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!audioResponse.ok) {
      const errText = await audioResponse.text();
      console.error("TTS Error Response:", errText);
      throw new Error(`TTS Error: ${errText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    console.log("Request completed in", (Date.now() - startTime) / 1000, "s");

    return Response.json({
      script,
      audio: `data:audio/mp3;base64,${audioBase64}`,
    });
  } catch (error: any) {
    console.error("GENERATION ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
