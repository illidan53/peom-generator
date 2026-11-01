"use client";

import { useEffect, useState } from "react";
import { DEMO_EVENT, DEMO_TEAM } from "@/lib/team";
import type { Poem } from "@/lib/poem-engine/contract";

type Member = { name: string; company: string; role: string; selfIntro: string };
type Style = "modern" | "classical" | "epic" | "playful";

const blank = (): Member => ({ name: "", company: "", role: "", selfIntro: "" });
const demoTeam = (): Member[] =>
  DEMO_TEAM.map((m) => ({ name: m.name, company: m.company ?? "", role: m.role ?? "", selfIntro: [m.intro, m.linkedin].filter(Boolean).join("，") }));

const SAMPLE: Member[] = [
  { name: "成员 A", company: "某云服务公司", role: "后端工程师", selfIntro: "扛过双十一级别的流量，周末爬山，自己烘咖啡豆" },
  { name: "成员 B", company: "设计工作室", role: "交互设计师", selfIntro: "做无障碍设计，业余画海边的水彩" },
  { name: "成员 C", company: "某大学", role: "强化学习研究生", selfIntro: "围棋业余五段，爱拿棋局类比模型训练" },
  { name: "成员 D", company: "创业公司", role: "产品经理", selfIntro: "跑过三次全马，从零做过两款产品" },
];

const STYLES: { value: Style; label: string }[] = [
  { value: "modern", label: "现代诗" },
  { value: "classical", label: "古风" },
  { value: "epic", label: "史诗" },
  { value: "playful", label: "俏皮" },
];

const input =
  "mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-base placeholder:text-muted/60 focus:border-gold focus:outline-none disabled:opacity-60";

export default function PoemPage() {
  const [members, setMembers] = useState<Member[]>(demoTeam);
  const [teamName, setTeamName] = useState("");
  const [eventName, setEventName] = useState(DEMO_EVENT);
  const [style, setStyle] = useState<Style>("modern");
  const [stanzaCount, setStanzaCount] = useState(5);
  const [direction, setDirection] = useState("");

  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [poem, setPoem] = useState<Poem | null>(null);
  const [mock, setMock] = useState(false);

  useEffect(() => {
    fetch("/api/poem-engine")
      .then((r) => r.json())
      .then((d) => setHasKey(Boolean(d.hasKey)))
      .catch(() => setHasKey(false));
  }, []);

  const filled = members.filter((m) => m.name.trim());

  function update(i: number, key: keyof Member, value: string) {
    setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, [key]: value } : m)));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!filled.length || working) return;
    setWorking(true);
    setError("");
    setPoem(null);
    try {
      const res = await fetch("/api/poem-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          event: { name: eventName || "Claude Workshop Hackathon", date: "2026-11-01" },
          members: filled,
          options: { style, stanzaCount },
          direction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
      setPoem(data.poem);
      setMock(Boolean(data.mock));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-12 sm:px-8 sm:pt-16">
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Claude Workshop · 诗歌引擎</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-6xl">
          为你的团队写一首诗
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          填写成员信息，选择风格，Claude 会写一首献给你们和这次活动的中文诗，并逐节播放。
        </p>
        {hasKey === false && (
          <p className="mt-4 inline-block rounded-full border border-line-strong px-4 py-1.5 text-sm text-muted">
            演示模式：未配置 ANTHROPIC_API_KEY，将显示示例诗
          </p>
        )}
      </header>

      <form onSubmit={generate} className="mt-10 rounded-3xl border border-line bg-ink-raised/70 p-5 shadow-2xl shadow-black/30 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold">团队成员</h2>
          <button type="button" onClick={() => { setMembers(SAMPLE); setTeamName("四行诗队"); }}
            className="cursor-pointer text-sm text-gold underline-offset-4 hover:underline">
            填入示例团队
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {members.map((m, i) => (
            <fieldset key={i} className="rounded-2xl border border-line bg-ink-sunken/60 p-4">
              <legend className="sr-only">成员 {i + 1}</legend>
              <label className="block text-sm font-medium">
                姓名
                <input className={input} value={m.name} disabled={working} placeholder={`成员 ${i + 1}`}
                  onChange={(e) => update(i, "name", e.target.value)} />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  公司 / 学校
                  <input className={input} value={m.company} disabled={working}
                    onChange={(e) => update(i, "company", e.target.value)} />
                </label>
                <label className="block text-sm font-medium">
                  职位 / 专业
                  <input className={input} value={m.role} disabled={working}
                    onChange={(e) => update(i, "role", e.target.value)} />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium">
                一句话介绍 <span className="font-normal text-muted">（经历、作品、爱好）</span>
                <input className={input} value={m.selfIntro} disabled={working}
                  onChange={(e) => update(i, "selfIntro", e.target.value)} />
              </label>
            </fieldset>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            队名 <span className="font-normal text-muted">（可选）</span>
            <input className={input} value={teamName} disabled={working} onChange={(e) => setTeamName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            活动
            <input className={input} value={eventName} disabled={working} onChange={(e) => setEventName(e.target.value)} />
          </label>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Choice label="风格" options={STYLES} value={style} onChange={setStyle} disabled={working} />
          <label className="block text-sm font-medium">
            节数：{stanzaCount}
            <input type="range" min={2} max={8} value={stanzaCount} disabled={working}
              onChange={(e) => setStanzaCount(Number(e.target.value))} className="mt-4 w-full accent-[var(--gold)]" />
          </label>
        </div>

        <label className="mt-6 block text-sm font-medium">
          额外要求 <span className="font-normal text-muted">（可选，例如“提到我们做的是诗歌生成器”）</span>
          <input className={input} value={direction} disabled={working} onChange={(e) => setDirection(e.target.value)} />
        </label>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={!filled.length || working}
            className="inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full bg-gold px-7 text-base font-semibold text-on-gold transition-colors hover:bg-gold-strong disabled:cursor-not-allowed disabled:opacity-50">
            {working ? "正在写诗…" : "生成诗"}
          </button>
          {!filled.length && <p className="text-sm text-muted">至少填写一位成员的名字。</p>}
          {working && <p className="text-sm text-muted">通常需要 20 到 60 秒。</p>}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      </form>

      {poem && <PoemPlayer key={JSON.stringify(poem).length + poem.title} poem={poem} mock={mock} />}
    </main>
  );
}

function Choice<T extends string>({ label, options, value, onChange, disabled }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; disabled: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-60 ${
              value === o.value ? "border-gold bg-gold text-on-gold" : "border-line-strong text-muted hover:text-text"
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PoemPlayer({ poem, mock }: { poem: Poem; mock: boolean }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<"story" | "full">("story");
  const [copied, setCopied] = useState(false);
  const total = poem.stanzas.length;
  const stanza = poem.stanzas[current];

  useEffect(() => {
    if (!playing || mode !== "story") return;
    if (current >= total - 1) { setPlaying(false); return; }
    const ms = Math.max(4000, stanza.lines.length * 2500);
    const id = setTimeout(() => setCurrent((c) => c + 1), ms);
    return () => clearTimeout(id);
  }, [playing, mode, current, total, stanza.lines.length]);

  const text = `${poem.title}\n\n${poem.stanzas.map((s) => s.lines.join("\n")).join("\n\n")}\n\n—— ${poem.dedication}`;

  return (
    <section aria-live="polite" className="rise mt-12 rounded-3xl border border-line bg-ink-raised/40 px-5 py-10 sm:px-12 sm:py-14">
      {mock && <p className="mb-6 text-sm text-muted">演示模式：这是示例诗，配置 API key 后会根据你填写的成员生成。</p>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-semibold text-gold-strong sm:text-5xl">{poem.title}</h2>
          <p className="mt-2 text-muted">{poem.dedication}</p>
        </div>
        <div className="flex gap-2">
          {(["story", "full"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${mode === m ? "border-gold text-gold" : "border-line-strong text-muted"}`}>
              {m === "story" ? "逐节播放" : "全文"}
            </button>
          ))}
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="cursor-pointer rounded-full border border-line-strong px-4 py-1.5 text-sm text-muted hover:text-text">
            {copied ? "已复制" : "复制"}
          </button>
        </div>
      </div>

      {mode === "story" ? (
        <div className="mt-10">
          <article key={current} className="rise min-h-[16rem]">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-gold px-3 py-1 font-medium text-on-gold">{stanza.focus}</span>
              <span className="rounded-full border border-line-strong px-3 py-1 text-muted">{stanza.mood}</span>
              {stanza.imagery.map((im) => (
                <span key={im} className="rounded-full border border-line px-3 py-1 text-muted">{im}</span>
              ))}
            </div>
            <div className="mt-8 space-y-2 font-display text-2xl leading-relaxed sm:text-3xl">
              {stanza.lines.map((line, i) => (
                <p key={i} className="rise" style={{ animationDelay: `${i * 450}ms` }}>{line}</p>
              ))}
            </div>
          </article>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
              className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm disabled:opacity-40">上一节</button>
            <button type="button" onClick={() => { if (current >= total - 1) setCurrent(0); setPlaying((p) => !p || current >= total - 1); }}
              className="cursor-pointer rounded-full bg-gold px-5 py-2 text-sm font-semibold text-on-gold">
              {playing ? "暂停" : current >= total - 1 ? "重新播放" : "播放"}
            </button>
            <button type="button" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} disabled={current >= total - 1}
              className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm disabled:opacity-40">下一节</button>
            <div className="flex gap-1.5" aria-label={`第 ${current + 1} 节，共 ${total} 节`}>
              {poem.stanzas.map((_, i) => (
                <button key={i} type="button" onClick={() => setCurrent(i)} aria-label={`第 ${i + 1} 节`}
                  className={`h-2 cursor-pointer rounded-full transition-all ${i === current ? "w-8 bg-gold" : "w-2 bg-line-strong"}`} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-8 font-display text-xl leading-relaxed sm:text-2xl">
          {poem.stanzas.map((s, i) => (
            <div key={i}>{s.lines.map((l, j) => <p key={j}>{l}</p>)}</div>
          ))}
        </div>
      )}

      <p className="mt-12 border-t border-line pt-6 text-sm text-muted">故事线：{poem.narrativeArc}</p>
    </section>
  );
}
