import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { runClaude, isClaudeCliBackend } from "../claude-cli";
import { getModel, isMock, PoemOptionsSchema, PoemSchema, type Poem, type PoemOptions, type TeamProfile } from "./contract";
import { exampleJueju, examplePoem } from "./examples";
import { checkPoem } from "./check";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";

export * from "./contract";
export { SYSTEM_PROMPT, FORM_GUIDE, LANGUAGE_GUIDE, buildUserPrompt } from "./prompt";
export { checkPoem } from "./check";
export { exampleTeamProfile, examplePoem, exampleJueju } from "./examples";

export interface GeneratePoemArgs {
  profile: TeamProfile;
  options?: Partial<PoemOptions>;
  /** 团队的额外要求，会原样放进 prompt，例如“提到我们做的是诗歌生成器” */
  direction?: string;
  client?: Anthropic;
  /** 默认 high。现场赶时间可以用 medium */
  effort?: "low" | "medium" | "high";
  /** 每生成一段文字就回调一次，可用于前端显示“正在写诗…” */
  onProgress?: (chars: number) => void;
  signal?: AbortSignal;
}

/** 结构化输出用的 JSON Schema。API 不接受 $schema 字段，去掉它。 */
const { $schema: _drop, ...POEM_JSON_SCHEMA } = z.toJSONSchema(PoemSchema, { io: "output" }) as Record<string, unknown>;

/** 质检不通过时最多让模型修改几次 */
const MAX_REVISIONS = 1;

/** 模块 02 的唯一入口：TeamProfile -> Poem */
export async function generatePoem({
  profile,
  options,
  direction,
  client,
  effort = "high",
  onProgress,
  signal,
}: GeneratePoemArgs): Promise<Poem> {
  if (isMock()) return options?.style === "jueju" ? exampleJueju : examplePoem;
  if (profile.members.length === 0) throw new Error("团队资料里没有成员");

  const opts = PoemOptionsSchema.parse(options ?? {});

  // 本地开发：通过 claude 命令行（用你登录的 Claude 账号）生成，同样走结构化输出和质检
  if (!client && isClaudeCliBackend()) {
    const basePrompt = buildUserPrompt(profile, opts, { direction });
    let prompt = basePrompt;
    let chars = 0;
    let poem: Poem | undefined;
    for (let attempt = 0; attempt <= MAX_REVISIONS; attempt++) {
      const result = await runClaude({
        prompt,
        systemPrompt: SYSTEM_PROMPT,
        model: getModel(),
        effort,
        jsonSchema: POEM_JSON_SCHEMA,
        signal,
        onText: (t) => {
          chars += t.length;
          onProgress?.(chars);
        },
      });
      if (result.stopReason === "refusal") throw new Error("写诗请求被拒绝");
      poem = PoemSchema.parse(result.structured ?? JSON.parse(result.text));

      const problems = checkPoem(poem, profile, opts);
      if (problems.length === 0 || attempt === MAX_REVISIONS) break;
      prompt = `${basePrompt}\n\n你上一版的输出：\n${JSON.stringify(poem)}\n\n这一版有以下问题，请修改后输出完整的新版本（同样的 JSON 格式）：\n${problems.map((p) => `- ${p}`).join("\n")}`;
    }
    return poem!;
  }
  const anthropic = client ?? new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: buildUserPrompt(profile, opts, { direction }) },
  ];

  let chars = 0;
  let poem: Poem | undefined;

  for (let attempt = 0; attempt <= MAX_REVISIONS; attempt++) {
    const stream = anthropic.beta.messages.stream(
      {
        model: getModel(),
        max_tokens: 16000,
        // 安全分类器误拒时，服务端按拒绝类别自动换模型重跑
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort, format: { type: "json_schema", schema: POEM_JSON_SCHEMA } },
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages,
      },
      { signal },
    );

    stream.on("text", (delta) => {
      chars += delta.length;
      onProgress?.(chars);
    });

    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      throw new Error(`写诗请求被拒绝：${message.stop_details?.explanation ?? "unknown"}`);
    }
    if (message.stop_reason === "max_tokens") {
      throw new Error("诗写到一半超出了 max_tokens，请减少节数后重试");
    }

    const text = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    poem = PoemSchema.parse(JSON.parse(text));

    const problems = checkPoem(poem, profile, opts);
    if (problems.length === 0 || attempt === MAX_REVISIONS) break;

    // 质检没通过：把原回复和问题清单发回去，让模型改一版
    messages.push({ role: "assistant", content: message.content as Anthropic.Beta.BetaContentBlockParam[] });
    messages.push({
      role: "user",
      content: `这一版有以下问题，请修改后输出完整的新版本（同样的 JSON 格式）：\n${problems.map((p) => `- ${p}`).join("\n")}`,
    });
  }

  return poem!;
}

/** 把诗排成纯文本，方便打印或复制 */
export function poemToText(poem: Poem): string {
  const body = poem.stanzas.map((s) => s.lines.join("\n")).join("\n\n");
  return `《${poem.title}》\n\n${body}\n\n—— ${poem.dedication}`;
}
