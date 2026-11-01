import type { Poem, PoemOptions, TeamProfile } from "./contract";

const HAN = /\p{Script=Han}/gu;

/**
 * 确定性质检：只检查代码能判断的硬性要求（行数、字数、成员是否都写到），
 * 返回问题清单，空数组表示通过。押韵和平仄不在这里检查。
 */
export function checkPoem(poem: Poem, profile: TeamProfile, options: PoemOptions): string[] {
  const problems: string[] = [];
  const lines = poem.stanzas.flatMap((s) => s.lines);

  if (options.style === "jueju") {
    if (poem.stanzas.length !== 4 || poem.stanzas.some((s) => s.lines.length !== 1)) {
      problems.push(`七言绝句需要 4 节、每节 1 句，实际是 ${poem.stanzas.length} 节、共 ${lines.length} 句。`);
    }
    lines.forEach((line, i) => {
      const han = line.match(HAN)?.length ?? 0;
      if (han !== 7) problems.push(`第 ${i + 1} 句“${line}”有 ${han} 个汉字，应为 7 个。`);
      if (/[A-Za-z0-9]/.test(line)) problems.push(`第 ${i + 1} 句“${line}”里有字母或阿拉伯数字。`);
    });
  } else {
    if (lines.length > 10) problems.push(`全诗 ${lines.length} 行，超过 10 行的上限。`);
    if (poem.stanzas.length < 2 || poem.stanzas.length > 3) {
      problems.push(`现代诗应分 2 到 3 节，实际是 ${poem.stanzas.length} 节。`);
    }
    const text = lines.join("");
    const unnamed = profile.members.map((m) => m.name).filter((name) => !text.includes(name));
    if (unnamed.length > 0) problems.push(`这些成员的名字没有出现在诗句里：${unnamed.join("、")}。`);
  }

  const focusText = poem.stanzas.map((s) => s.focus).join(" ");
  const missing = profile.members.map((m) => m.name).filter((name) => !focusText.includes(name));
  if (missing.length > 0) {
    problems.push(`这些成员没有出现在任何一节的 focus 里：${missing.join("、")}。focus 需与资料中的 name 完全一致。`);
  }
  poem.stanzas.forEach((s, i) => {
    if (s.lines.length === 0) problems.push(`第 ${i + 1} 节没有诗句。`);
    if (s.imagery.length < 2) problems.push(`第 ${i + 1} 节的 imagery 少于 2 个。`);
  });

  return problems;
}
