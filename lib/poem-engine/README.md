# 诗歌引擎（模块 02）

输入团队资料 `TeamProfile`（模块 01 的检索结果），输出结构化的 `Poem`（给模块 03 做动画）。
字段与项目结构方案里的 `shared` 契约一致，见 `contract.ts`。

## 在网站后台调用

```ts
import { generatePoem, PoemOptionsSchema, TeamProfileSchema } from "@/lib/poem-engine";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { profile, options, direction } = await req.json();
  const poem = await generatePoem({
    profile: TeamProfileSchema.parse(profile),
    options: PoemOptionsSchema.partial().parse(options ?? {}),
    direction, // 可选：团队的额外要求
  });
  return Response.json(poem);
}
```

- `options`：`language` zh / en / bilingual，`style` modern / classical / epic / playful，`stanzaCount` 2 到 8（默认 5）。
- `effort`：默认 `high`；现场赶时间可传 `"medium"`。
- 环境变量：`ANTHROPIC_API_KEY`（必需），`CLAUDE_MODEL`（可选，默认 `claude-opus-5-5`），`MOCK=1` 时直接返回示例诗，不调 API。

## 文件

| 文件 | 内容 |
|---|---|
| `prompt.ts` | 核心系统提示词、风格与语言指南、user prompt 构建 |
| `index.ts` | `generatePoem`（结构化输出 + 自动质检修改一次 + 拒绝回退）、`checkPoem`、`poemToText` |
| `contract.ts` | 输入输出 schema（`@peom/shared` 落地后改成从它重新导出） |
| `examples.ts` | 示例团队资料和示例诗 |
| `cli.mts` | 本地试跑 |

## 本地试跑

```bash
MOCK=1 npx tsx lib/poem-engine/cli.mts
ANTHROPIC_API_KEY=sk-... npx tsx lib/poem-engine/cli.mts --style epic --lang bilingual --json
```
