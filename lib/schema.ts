import { z } from "zod";

export const ExplainerSchema = z.object({
  title: z.string(),
  narration_text: z.string(),
  canvas_operations: z.array(
    z.object({
      id: z.string(),
      delay_ms: z.number(),
      duration_ms: z.number(),
      type: z.enum([
        "draw_circle",
        "draw_rect",
        "draw_line",
        "draw_arrow",
        "write_label",
        "clear",
      ]),

      // Coordinates (Grid: 0-177 for X, 0-100 for Y)
      x: z.number().nullable(),
      y: z.number().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
      points: z.array(z.number()).nullable(),

      // VISUAL STYLE (The 3B1B Sauce)
      color: z.string().nullable(), // Stroke color
      fill: z.string().nullable(), // Fill color (e.g. "rgba(255,0,0,0.1)")
      roughness: z.number(), // 0 = Perfect geometric, 2 = Sketchy
      label: z.string().nullable(),
    }),
  ),
});

export type ExplainerScript = z.infer<typeof ExplainerSchema>;
