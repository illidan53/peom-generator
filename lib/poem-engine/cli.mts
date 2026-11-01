/**
 * 本地试跑（需要 ANTHROPIC_API_KEY）：
 *   npx tsx lib/poem-engine/cli.mts [team-profile.json] [--style epic] [--lang en] [--stanzas 5] [--json]
 * 不传文件时使用示例团队资料；MOCK=1 时不调用 API。
 */
import { readFileSync } from "node:fs";
import { generatePoem, poemToText } from "./index";
import { TeamProfileSchema, type PoemOptions } from "./contract";
import { exampleTeamProfile } from "./examples";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const file = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const profile = file ? TeamProfileSchema.parse(JSON.parse(readFileSync(file, "utf8"))) : exampleTeamProfile;

const t0 = Date.now();
const poem = await generatePoem({
  profile,
  options: {
    style: flag("--style") as PoemOptions["style"] | undefined,
    language: flag("--lang") as PoemOptions["language"] | undefined,
    stanzaCount: flag("--stanzas") ? Number(flag("--stanzas")) : undefined,
  },
  onProgress: (n) => process.stderr.write(`\r正在写诗… ${n} 字符`),
});
process.stderr.write(`\n用时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n\n`);
console.log(poemToText(poem));
if (args.includes("--json")) console.log(JSON.stringify(poem, null, 2));
