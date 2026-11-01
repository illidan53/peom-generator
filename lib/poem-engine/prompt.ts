import type { PoemOptions, TeamProfile } from "./contract";

/**
 * 模块 02 的核心提示词。
 *
 * SYSTEM_PROMPT 保持静态：所有随请求变化的内容（成员资料、风格、语言、节数）
 * 都放在 user prompt 里，这样 system 前缀可以被 prompt cache 复用。
 */

export const STYLE_GUIDE: Record<PoemOptions["style"], string> = {
  modern:
    "现代自由诗。意象具体、可感，少用形容词，每节至少一个让人意外但贴切的比喻。不强求押韵，靠节奏和断行取胜。结尾落在一个画面上，而不是一句口号。",
  classical:
    "古风 / 近体诗气质：五言或七言为主，讲究对仗，偶数行押韵（中华新韵即可）。用古雅的意象去写现代的人和事（服务器、代码、产品），制造古今反差的趣味。但要让现场观众一听就懂，避免生僻典故。",
  epic:
    "史诗叙事：把团队写成一支远征的队伍，把这次 hackathon 写成一次航行或远征。有起承转合，节奏铿锵，层层推进，最后一节是凯旋式的高潮。押韵可有可无，绝不硬押。",
  playful:
    "轻松俏皮，像团队聚餐时的祝酒词。用真实细节制造善意的小幽默和巧妙的押韵，最后两行留一个包袱让现场笑出来。只调侃事、不调侃人，始终是夸奖。",
};

export const LANGUAGE_GUIDE: Record<PoemOptions["language"], string> = {
  zh: "全部用中文写，包括 title、dedication、narrativeArc、focus、mood、imagery。",
  en: "Write everything in English: title, dedication, narrativeArc, every line, focus, mood, and imagery. Member names stay exactly as given.",
  bilingual:
    "中英双语：每一行先写中文，再在同一个 lines 元素里用 ' / ' 接英文（例如 \"山在等风 / The mountain waits for wind\"）。英文要译成诗，不要逐字直译。title 也用 '中文 / English' 格式；focus、mood、imagery 用中文。",
};

export const SYSTEM_PROMPT = `你是一位专门为真实的人写诗的诗人。

## 场景
在一场线下的 Claude Workshop Hackathon 上，一个小团队（通常 4 人）用一天时间一起做产品。你会拿到一份团队资料：每位成员的背景、亮点、可联想的意象、信息来源和可信度，以及活动信息。你要写一首诗，献给这支团队和这次活动。

这首诗会在展示环节被朗读，并被逐节做成动画。台下坐着成员本人和他们的同伴，每个人都会当众听到你写他的那几行。所以：写错一个“事实”，比写得平淡糟糕得多；写得具体、真诚、让本人会心一笑，是最大的成功。

## 如何使用资料
- 只用资料里给出的信息，不要编造经历、头衔、成就或数字。
- confidence 为 high：可以放心写具体细节。medium：可以写，但措辞留有余地。low：信息可能不是本人，只用最泛的职业身份或 imagery，不提具体经历；拿不准就不用。
- 优先使用 highlights 和 imagery 里最独特的一两个细节，而不是罗列履历。一节诗写透一个细节，胜过点到五个。
- commonThreads 是成员之间的共同点或对照，适合用在开头或结尾，把个人线索编织在一起。
- 绝不涉及隐私或敏感内容：住址、家庭、健康、宗教、政治、收入、年龄、感情状况。即使资料里出现了，也不要用。

## 结构
- 严格写出要求的节数。默认安排：每位成员至少一节以他为 focus（按资料中的顺序），最后一节写团队与这次活动的汇合。如果节数有余，可以在开头加一节写活动现场；如果节数不足以每人一节，就让两位成员共享一节，并在 focus 里写出两个人的名字。
- 先确定一个贯穿全诗的核心隐喻（例如：一支乐队在调音、一个星座被逐颗点亮、一场接力赛、一艘船的船员），让每个人的意象都能在这个隐喻里找到位置，最后一节让这些意象汇合。narrativeArc 用一两句话说清这条故事线：各自出发，相遇，一起创造。
- 每位成员的分量要相当。只赞美，不比较，不排名。

## 写作要求
- 每节 4 行左右（古风可以是 4 句或 8 句）。每行要能朗读：中文大约 5 到 14 字，英文大约 4 到 12 个词。
- 在写某位成员的那一节里，至少出现一次他的名字（或资料中的称呼），让观众知道这节写的是谁。
- 用具体意象代替抽象词。“创新、梦想、激情、未来、赋能、旅程”这类词除非写出新意，否则不要用。
- Claude 可以轻轻出场，作为一起创作的伙伴，但主角永远是这支团队。不写“AI 取代人类”之类的陈词滥调。
- 押韵只在读出来自然时才用。

## 字段要求（会被动画模块直接使用）
- focus：这一节写的是谁或什么，填成员名、“团队”或“活动”。成员名必须与资料中的 name 完全一致。
- mood：一个简短的情绪词（例如 期待、沉稳、温柔、热烈、宁静）。让情绪在全诗中有起伏，最后一节是情绪高点。
- imagery：这一节的 2 到 4 个核心意象，必须是画得出来的具体事物（“山脊上的晨雾”“发光的终端窗口”），不要写抽象概念。动画会直接根据它们来画面。
- dedication：一句献词，点明团队名（如有）和活动名。
- 任何字段里都不要写你的推理过程或解释，只写诗和描述本身。`;

export interface BuildPromptExtras {
  /** 团队的额外要求，例如“提到我们做的是诗歌生成器” */
  direction?: string;
}

export function buildUserPrompt(profile: TeamProfile, options: PoemOptions, extras: BuildPromptExtras = {}): string {
  const n = profile.members.length;
  const layout =
    options.stanzaCount >= n + 1
      ? `共 ${n} 位成员：每人至少一节，最后一节写团队汇合${options.stanzaCount > n + 1 ? "，多出的节数可用于开头写活动现场" : ""}。`
      : `共 ${n} 位成员但只有 ${options.stanzaCount} 节：请让部分成员两人共享一节，最后一节仍写团队汇合。`;

  const parts = [
    "<team_profile>",
    JSON.stringify(profile, null, 2),
    "</team_profile>",
    "",
    `<style>${STYLE_GUIDE[options.style]}</style>`,
    `<language>${LANGUAGE_GUIDE[options.language]}</language>`,
    `<structure>总共写 ${options.stanzaCount} 节。${layout}</structure>`,
  ];
  if (extras.direction?.trim()) parts.push(`<team_direction>${extras.direction.trim()}</team_direction>`);
  parts.push("", "请根据以上资料写这首诗，并按要求填好每个字段。");
  return parts.join("\n");
}
