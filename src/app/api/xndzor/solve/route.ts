import { NextResponse } from "next/server";
import { z } from "zod";
import { solveProblem, type SolutionMode } from "@/lib/xndzor-solution";

const schema = z.object({
  text: z.string().min(1).max(2000),
  mode: z.enum(["need", "have"]),
});

/** POST /api/xndzor/solve — demo bundle assembly from natural-language problem. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const bundle = solveProblem(parsed.data.text, parsed.data.mode as SolutionMode);
  return NextResponse.json({ bundle });
}
