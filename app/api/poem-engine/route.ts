import { z } from "zod";
import { exampleJueju, generatePoem, PoemOptionsSchema, type TeamProfile } from "@/lib/poem-engine";
import { isClaudeCliBackend } from "@/lib/claude-cli";

export const maxDuration = 300;

const Body = z.object({
  teamName: z.string().optional(),
  event: z.object({ name: z.string(), topic: z.string().optional(), date: z.string().optional() }),
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        company: z.string().optional(),
        role: z.string().optional(),
        selfIntro: z.string().optional(),
      }),
    )
    .min(1)
    .max(8),
  options: PoemOptionsSchema.partial().optional(),
  direction: z.string().optional(),
});

// 本地开发用 claude 命令行，不需要 API key；部署环境才需要
const hasKey = () => isClaudeCliBackend() || Boolean(process.env.ANTHROPIC_API_KEY);

export async function GET() {
  return Response.json({ hasKey: hasKey() });
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "请至少填写一位成员的名字" }, { status: 400 });
  const { teamName, event, members, options, direction } = parsed.data;

  // 本地演示没有联网检索：直接用成员自己填写的信息，所以可信度是 high
  const profile: TeamProfile = {
    teamName: teamName?.trim() || undefined,
    event,
    members: members.map((m) => {
      const where = [m.role, m.company].map((s) => s?.trim()).filter(Boolean).join(" @ ");
      const intro = m.selfIntro?.trim();
      return {
        name: m.name.trim(),
        headline: where || intro || "团队成员",
        background: [where, intro].filter(Boolean).join("。") || "成员没有填写更多信息。",
        highlights: intro ? [intro] : [],
        imagery: [],
        sources: [],
        confidence: "high" as const,
      };
    }),
    commonThreads: [],
  };

  if (!hasKey()) {
    return Response.json({ poem: exampleJueju, mock: true });
  }

  try {
    const poem = await generatePoem({ profile, options: { ...options, style: "jueju", language: "zh" }, direction, effort: "medium", signal: req.signal });
    return Response.json({ poem, mock: false });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
