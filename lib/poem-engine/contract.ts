/**
 * 模块 02 的输入输出契约。
 *
 * 这是「项目结构」方案里 shared/src/index.ts 的 TeamProfile / Poem 部分的副本，
 * 字段完全一致。等 @peom/shared 包落地后，把本文件的导出改成
 *   export * from "@peom/shared";
 * 即可，其余代码不用动。
 */
import { z } from "zod";

export const EventContextSchema = z.object({
  name: z.string().describe("活动名称，例如 Claude Workshop Hackathon"),
  topic: z.string().optional().describe("本次 hackathon 的主题"),
  location: z.string().optional(),
  date: z.string().optional(),
});
export type EventContext = z.infer<typeof EventContextSchema>;

export const MemberProfileSchema = z.object({
  name: z.string(),
  headline: z.string().describe("一句话概括此人"),
  background: z.string().describe("生平与职业背景摘要，3-5 句"),
  highlights: z.array(z.string()).describe("适合入诗的具体细节：经历、作品、地点、爱好"),
  imagery: z.array(z.string()).describe("可以联想到的意象，例如 灯塔、代码、山川"),
  sources: z.array(z.string()).describe("信息来源 URL"),
  confidence: z.enum(["high", "medium", "low"]).describe("检索结果是否确定是本人"),
});
export type MemberProfile = z.infer<typeof MemberProfileSchema>;

export const TeamProfileSchema = z.object({
  teamName: z.string().optional(),
  event: EventContextSchema,
  members: z.array(MemberProfileSchema),
  commonThreads: z.array(z.string()).describe("成员之间的共同点或有趣的对照"),
});
export type TeamProfile = z.infer<typeof TeamProfileSchema>;

export const PoemOptionsSchema = z.object({
  language: z.enum(["zh", "en", "bilingual"]).default("zh"),
  style: z.enum(["modern", "jueju"]).default("modern").describe("现代诗（10 行以内）/ 七言绝句"),
});
export type PoemOptions = z.infer<typeof PoemOptionsSchema>;

export const StanzaSchema = z.object({
  lines: z.array(z.string()),
  focus: z.string().describe("这一节写的是谁或什么，例如 成员名 / 团队 / 活动"),
  mood: z.string().describe("情绪基调，例如 期待、热烈、宁静"),
  imagery: z.array(z.string()).describe("这一节的核心意象，给 03 做画面用"),
});
export type Stanza = z.infer<typeof StanzaSchema>;

export const PoemSchema = z.object({
  title: z.string(),
  language: z.enum(["zh", "en", "bilingual"]),
  stanzas: z.array(StanzaSchema),
  dedication: z.string().describe("献词，例如 献给 XX 队"),
  narrativeArc: z.string().describe("整首诗的故事线，一两句话"),
});
export type Poem = z.infer<typeof PoemSchema>;

export const DEFAULT_MODEL = "claude-opus-5-5";
export const getModel = () => process.env.CLAUDE_MODEL || DEFAULT_MODEL;
export const isMock = () => process.env.MOCK === "1" || process.env.MOCK === "true";
