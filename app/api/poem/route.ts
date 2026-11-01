import Anthropic from "@anthropic-ai/sdk";
import { runClaude, isClaudeCliBackend } from "@/lib/claude-cli";

export const maxDuration = 300;

type Member = { name: string; info?: string };

const MODEL = "claude-opus-5-5";

// 与 lib/poem-engine 的七言绝句规则保持一致，只是输出纯文本而不是 JSON
const SYSTEM_PROMPT = `你是一位擅长唐诗格律的中文诗人，为一支 Claude Workshop Hackathon 的团队写一首七言绝句。

## 先了解成员
- 先用网络搜索了解每位团队成员，只使用公开的职业信息。
- 很多名字有同名的人。只有当细节明确对应这个人（同一个 LinkedIn 主页、给出的公司或职位）时才使用；无法确认身份时，只根据用户提供的信息来写，不要套用陌生人的经历。
- 不涉及隐私或敏感内容：住址、家庭、健康、宗教、政治、收入、年龄、感情状况。

## 体裁：七言绝句（唐诗格律）
- 恰好 4 句，每句恰好 7 个汉字（标点不计）。不能出现阿拉伯数字、英文字母或空格，数字要写成汉字。
- 第一、二、四句押平声韵，且同一韵部（平水韵或中华新韵均可）；第三句以仄声字结尾。尽量合乎平仄，但以读起来顺口、意思清楚为先。
- 章法是起承转合：第一句起，第二句承，第三句转（可以写这一天的黑客松、和 Claude 一起创作），第四句合，落到整个团队。
- 人名会破坏格律，所以诗句里不必出现成员名字，而是用每个人最独特的意象来指代他们；如果能自然地嵌入名字里的一个字更好，但绝不硬嵌。
- 用字古雅而好懂，可以化用古典意象写现代的事（服务器、代码、产品），但不用生僻典故。
- 第一、三句句末用“，”，第二、四句句末用“。”。
- 标题也要有古意，2 到 5 个字。

## 输出格式
只输出诗，不要输出搜索过程、说明、注释或来源：
第一行是标题（不加书名号），然后空一行，然后是四句诗，每句一行。`;

const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** 检查是不是一首合格的七言绝句（只查句数和字数；押韵、平仄交给模型）。返回问题清单。 */
function checkJueju(text: string): string[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const [title, ...verses] = lines;
  const problems: string[] = [];
  if (!title) return ["没有输出任何内容。"];
  if (verses.length !== 4) problems.push(`需要恰好 4 句诗（标题之外），实际有 ${verses.length} 行。`);
  verses.forEach((v, i) => {
    const chars = v.replace(/[，。、！？；：,.!?;:“”"'‘’\s]/g, "");
    if (!/^\p{Script=Han}+$/u.test(chars)) problems.push(`第 ${i + 1} 句含有非汉字字符：${v}`);
    else if (chars.length !== 7) problems.push(`第 ${i + 1} 句是 ${chars.length} 个字，需要恰好 7 个字：${v}`);
  });
  return problems;
}

/** 写一版诗，返回纯文本。research 为 true 时允许网络搜索。 */
async function writePoem(prompt: string, research: boolean, signal: AbortSignal): Promise<{ text: string; refused: boolean }> {
  if (isClaudeCliBackend()) {
    // 本地：claude 命令行，用登录的 Claude 账号
    const r = await runClaude({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: MODEL,
      effort: "medium",
      tools: research ? ["WebSearch"] : [],
      signal,
    });
    return { text: r.text, refused: r.stopReason === "refusal" };
  }
  // 部署环境：Claude API + API key
  const message = await new Anthropic().beta.messages
    .stream(
      {
        model: MODEL,
        max_tokens: 64000,
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        tools: research ? [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }] : [],
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    )
    .finalMessage();
  // 只取最后一次搜索之后的文字，避免把搜索过程中的话混进诗里
  const lastTool = message.content.findLastIndex((b) => b.type !== "text" && b.type !== "thinking");
  const text = message.content
    .slice(lastTool + 1)
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { text, refused: message.stop_reason === "refusal" };
}

export async function GET() {
  const cli = isClaudeCliBackend();
  return Response.json({ ok: true, backend: cli ? "cli" : "api", hasKey: cli || hasKey(), form: "jueju" });
}

export async function POST(req: Request) {
  if (!isClaudeCliBackend() && !hasKey()) {
    return new Response("服务器没有配置 ANTHROPIC_API_KEY", { status: 500 });
  }

  const { members, event } = (await req.json()) as { members: Member[]; event: string };
  if (!Array.isArray(members) || members.length === 0) {
    return new Response("请至少填写一位成员", { status: 400 });
  }

  const memberList = members
    .map((m, i) => `${i + 1}. ${m.name}${m.info ? ` (${m.info})` : ""}`)
    .join("\n");
  const userPrompt = `团队成员：\n${memberList}\n\n活动：${event || "Claude Workshop Hackathon"}\n\n请为这个团队写一首七言绝句。`;

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const write = (t: string) => controller.enqueue(enc.encode(t));
      try {
        let { text, refused } = await writePoem(userPrompt, true, req.signal);
        if (refused) {
          write("\n[refused]");
        } else {
          // 格式不合格就让模型改一次（不用再搜索）
          const problems = checkJueju(text);
          if (problems.length > 0) {
            const revision = await writePoem(
              `${userPrompt}\n\n你上一版写的是：\n${text.trim()}\n\n这一版有以下问题，请按同样的输出格式重写一首完整的七言绝句：\n${problems.map((p) => `- ${p}`).join("\n")}`,
              false,
              req.signal,
            );
            if (!revision.refused && revision.text.trim()) ({ text, refused } = revision);
          }
          write(text.trim().replace(/^《(.+)》$/m, "$1"));
        }
      } catch (err) {
        write(`\n[error] ${err instanceof Error ? err.message : String(err)}`);
      }
      controller.close();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
