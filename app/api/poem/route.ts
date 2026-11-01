import Anthropic from "@anthropic-ai/sdk";
import { runClaude, isClaudeCliBackend } from "@/lib/claude-cli";

export const maxDuration = 300;

type Member = { name: string; info?: string };

const MODEL = "claude-opus-5-5";

const SYSTEM_PROMPT =
  "你是一位中文诗人。先用网络搜索了解每位团队成员，只使用公开的职业信息。很多名字有同名的人，只有当细节明确对应这个人（同一个 LinkedIn 主页、给出的公司或职位）时才使用；无法确认身份时，就只根据用户提供的信息来写，不要套用陌生人的经历。然后写一首把这个团队和这次活动联系在一起的现代中文诗。全诗必须用简体中文，专有名词（公司、产品名）可以保留原文。只输出诗：第一行是标题，不加书名号，之后空一行，诗节之间用空行分隔。不要输出搜索过程、说明或来源。";

const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function GET() {
  const cli = isClaudeCliBackend();
  return Response.json({ ok: true, backend: cli ? "cli" : "api", hasKey: cli || hasKey() });
}

export async function POST(req: Request) {
  const cli = isClaudeCliBackend();
  if (!cli && !hasKey()) {
    return new Response("服务器没有配置 ANTHROPIC_API_KEY", { status: 500 });
  }

  const { members, event } = (await req.json()) as { members: Member[]; event: string };
  if (!Array.isArray(members) || members.length === 0) {
    return new Response("请至少填写一位成员", { status: 400 });
  }

  const memberList = members
    .map((m, i) => `${i + 1}. ${m.name}${m.info ? ` (${m.info})` : ""}`)
    .join("\n");
  const userPrompt = `团队成员：\n${memberList}\n\n活动：${event || "Claude Workshop Hackathon"}\n\n请用中文写这首诗。`;

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const write = (t: string) => controller.enqueue(enc.encode(t));
      try {
        if (cli) {
          // Local: the claude CLI, signed in with your Claude account.
          const result = await runClaude({
            prompt: userPrompt,
            systemPrompt: SYSTEM_PROMPT,
            model: MODEL,
            effort: "medium",
            tools: ["WebSearch"],
            onText: write,
            signal: req.signal,
          });
          if (result.stopReason === "refusal") write("\n[refused]");
        } else {
          // Deployed: the Claude API with the API key.
          const stream = new Anthropic().beta.messages.stream({
            model: MODEL,
            max_tokens: 64000,
            output_config: { effort: "medium" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });
          stream.on("text", write);
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") write("\n[refused]");
        }
      } catch (err) {
        write(`\n[error] ${err instanceof Error ? err.message : String(err)}`);
      }
      controller.close();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
