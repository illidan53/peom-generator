import type { Poem, TeamProfile } from "./contract";

/** 示例数据：MOCK 模式、本地调试和测试用（与项目结构方案里的 shared/examples 一致） */
export const exampleTeamProfile: TeamProfile = {
  teamName: "四行诗队",
  event: { name: "Claude Workshop Hackathon", topic: "用 Claude 构建有温度的应用", location: "San Francisco", date: "2026-11-01" },
  members: [
    { name: "成员 A", headline: "在服务器与山巅之间往返的后端工程师", background: "多年分布式系统开发经验，负责过高并发服务。周末常去登山，习惯在山顶冲一杯手冲咖啡。", highlights: ["扛住过双十一级别流量", "登顶过四姑娘山", "自己烘咖啡豆"], imagery: ["山脊", "晨雾", "服务器指示灯", "咖啡香"], sources: [], confidence: "medium" },
    { name: "成员 B", headline: "用水彩思考界面的设计师", background: "交互设计师，关注无障碍设计。业余画水彩，作品以海边和城市街景为主。", highlights: ["做过无障碍设计改版", "水彩作品办过小型展览"], imagery: ["水彩晕染", "海岸线", "调色盘"], sources: [], confidence: "medium" },
    { name: "成员 C", headline: "在棋盘与神经网络之间寻找规律的研究者", background: "机器学习方向研究生，研究强化学习。围棋业余五段，常拿棋局类比模型训练。", highlights: ["发表过强化学习论文", "围棋业余五段"], imagery: ["黑白棋子", "星空", "梯度下降的山谷"], sources: [], confidence: "medium" },
    { name: "成员 D", headline: "把产品当马拉松来跑的产品经理", background: "创业公司产品经理，从零做过两款产品。跑过三次全程马拉松，相信长期主义。", highlights: ["三次全马完赛", "从 0 到 1 做过两款产品"], imagery: ["跑道", "终点线", "黎明"], sources: [], confidence: "medium" },
  ],
  commonThreads: ["都在追求耐力与长期主义", "理性与感性的组合：两位工程向、两位人文向"],
};

export const examplePoem: Poem = {
  title: "四行诗",
  language: "zh",
  dedication: "献给四行诗队，于 Claude Workshop Hackathon",
  narrativeArc: "四个人从山、海、棋盘与跑道出发，在同一个下午汇成一条河，写下一个会发光的应用。",
  stanzas: [
    { focus: "成员 A、成员 B", mood: "沉稳", imagery: ["山顶的晨雾", "服务器指示灯", "水彩海岸线"], lines: ["成员 A 把山顶的晨雾装进服务器，", "成员 B 把海岸线晕染成按钮，", "一个守着百万次请求，一个替看不见的人说话。"] },
    { focus: "成员 C、成员 D", mood: "坚韧", imagery: ["星空里的黑白棋子", "黎明的跑道"], lines: ["成员 C 在星空里落下黑白子，", "成员 D 把四十二公里跑成黎明，", "一个教机器思考，一个陪产品长跑。"] },
    { focus: "团队", mood: "热烈", imagery: ["汇成一条的河", "深夜的屏幕灯光"], lines: ["这个下午，山、海、棋盘与跑道汇成一条河，", "我们把彼此写进代码，", "让一首诗，学会了发光。"] },
  ],
};

export const exampleJueju: Poem = {
  title: "灯前花",
  language: "zh",
  dedication: "献给四行诗队，于 Claude Workshop Hackathon",
  narrativeArc: "山海与棋路各自出发，在一天的黑客松里敲下千行代码，最后在灯下开成一树花。",
  stanzas: [
    { focus: "成员 A、成员 B", mood: "沉稳", imagery: ["山巅煮雾", "海上霞光"], lines: ["山巅煮雾海描霞，"] },
    { focus: "成员 C、成员 D", mood: "坚韧", imagery: ["星河里的棋子", "沙上的脚印"], lines: ["棋落星河步踏沙。"] },
    { focus: "活动", mood: "专注", imagery: ["键盘", "滚动的代码"], lines: ["一日同敲千行码，"] },
    { focus: "团队", mood: "热烈", imagery: ["灯下", "一树花开"], lines: ["化作灯前一树花。"] },
  ],
};
