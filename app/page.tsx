"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_EVENT, DEMO_TEAM, describe } from "@/lib/team";

type Member = { name: string; info: string };
type Status = "idle" | "working" | "done" | "error";

const empty = (): Member[] => Array.from({ length: 4 }, () => ({ name: "", info: "" }));
const demoTeam = (): Member[] => DEMO_TEAM.map((m) => ({ name: m.name, info: describe(m) }));

const STAGES = [
  { after: 0, text: "正在网上查找你们的资料" },
  { after: 7, text: "正在挑选值得入诗的细节" },
  { after: 15, text: "正在寻找把你们连在一起的线索" },
  { after: 22, text: "正在推敲平仄和韵脚" },
];

function Icon({ path, className = "h-5 w-5" }: { path: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  people: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.35-4.35",
  feather: "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8 2 22M17.5 15H9",
  copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  check: "M20 6 9 17l-5-5",
  refresh: "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6",
};

export default function Home() {
  const [members, setMembers] = useState<Member[]>(demoTeam);
  const [event, setEvent] = useState(DEMO_EVENT);
  const [poem, setPoem] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const filled = members.filter((m) => m.name.trim());
  const working = status === "working";

  useEffect(() => {
    if (!working) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [working]);

  useEffect(() => {
    if (!working) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [working]);

  function update(i: number, key: keyof Member, value: string) {
    setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, [key]: value } : m)));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!filled.length || working) return;
    setPoem("");
    setError("");
    setElapsed(0);
    setStatus("working");
    try {
      const res = await fetch("/api/poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: filled, event }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || `请求失败（${res.status}）`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setPoem(text);
      }
      if (/\n\[(error|refused)\]/.test(text)) {
        setError(text.includes("[refused]") ? "Claude 拒绝了这次请求，请换一些信息再试。" : "写诗时出了点问题，请重试。");
        setPoem(text.replace(/\n\[(error|refused)\][\s\S]*$/, ""));
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(poem);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  const [title, ...bodyLines] = poem.trim().split("\n");
  const stanzas = bodyLines.join("\n").trim().split(/\n\s*\n/).filter(Boolean);
  const stage = [...STAGES].reverse().find((s) => elapsed >= s.after) ?? STAGES[0];
  const showSkeleton = working && !poem;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      {/* Hero */}
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Claude Workshop · 黑客松</p>
        <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
          四个人，<br />
          <span className="text-gold-strong">一首诗。</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          告诉我们团队里有谁。Claude 会先了解你们每一个人，再为你们和此刻写一首七言绝句。
        </p>
      </header>

      {/* How it works */}
      <ol className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ICONS.people, title: "介绍团队", text: "每人一个名字，再加一句介绍。" },
          { icon: ICONS.search, title: "Claude 查资料", text: "从网上了解公开的职业背景。" },
          { icon: ICONS.feather, title: "写成一首绝句", text: "四句七言，起承转合，把你们四个人写在一起。" },
        ].map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-ink-raised/60 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-gold">
              <Icon path={s.icon} />
            </span>
            <div>
              <p className="text-sm font-semibold"><span className="mr-1.5 text-muted">0{i + 1}</span>{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Form */}
      <form onSubmit={generate} className="mt-12 rounded-3xl border border-line bg-ink-raised/70 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-3xl font-semibold">你们的团队</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">已填 {filled.length} / 4 人</span>
            <button type="button" disabled={working} onClick={() => setMembers(demoTeam())}
              className="min-h-11 cursor-pointer text-gold underline-offset-4 hover:underline disabled:opacity-50">载入我们的团队</button>
            <button type="button" disabled={working} onClick={() => setMembers(empty())}
              className="min-h-11 cursor-pointer text-muted underline-offset-4 hover:text-text hover:underline disabled:opacity-50">清空</button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {members.map((m, i) => (
            <fieldset key={i} className="rounded-2xl border border-line bg-ink-sunken/60 p-4 transition-colors focus-within:border-line-strong">
              <legend className="sr-only">成员 {i + 1}</legend>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-lg transition-colors ${m.name.trim() ? "bg-gold text-on-gold" : "border border-line-strong text-muted"}`}>
                  {m.name.trim() ? m.name.trim()[0].toUpperCase() : i + 1}
                </span>
                <span className="text-sm font-medium text-muted">成员 {i + 1}</span>
              </div>
              <label htmlFor={`name-${i}`} className="mt-4 block text-sm font-medium">姓名</label>
              <input id={`name-${i}`} value={m.name} onChange={(e) => update(i, "name", e.target.value)}
                autoComplete="off" placeholder="例如：张三" disabled={working}
                className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-3 text-base placeholder:text-muted/60 focus:border-gold focus:outline-none disabled:opacity-60" />
              <label htmlFor={`info-${i}`} className="mt-3 block text-sm font-medium">
                介绍 <span className="font-normal text-muted">（选填）</span>
              </label>
              <input id={`info-${i}`} value={m.info} onChange={(e) => update(i, "info", e.target.value)}
                aria-describedby="info-help" autoComplete="off" placeholder="公司、职位、学校、LinkedIn 链接…" disabled={working}
                className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-3 text-base placeholder:text-muted/60 focus:border-gold focus:outline-none disabled:opacity-60" />
            </fieldset>
          ))}
        </div>
        <p id="info-help" className="mt-3 text-sm text-muted">信息越具体，Claude 越容易找到对的人。</p>

        <label htmlFor="event" className="mt-6 block text-sm font-medium">活动</label>
        <input id="event" value={event} onChange={(e) => setEvent(e.target.value)} disabled={working}
          className="mt-1.5 w-full rounded-xl border border-line bg-ink px-3.5 py-3 text-base focus:border-gold focus:outline-none disabled:opacity-60" />

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={!filled.length || working} aria-busy={working}
            className="inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full bg-gold px-7 text-base font-semibold text-on-gold transition-colors duration-200 hover:bg-gold-strong disabled:cursor-not-allowed disabled:opacity-50">
            {working ? (
              <svg aria-hidden="true" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <Icon path={ICONS.feather} />
            )}
            {working ? "正在写…" : "为我们写诗"}
          </button>
          {!filled.length && <p className="text-sm text-muted">至少填一个名字才能开始。</p>}
          {working && <p className="text-sm text-muted">通常需要 20 到 40 秒。</p>}
        </div>
      </form>

      {/* Result */}
      <section ref={resultRef} aria-live="polite" aria-busy={working} className="scroll-mt-8">
        {status !== "idle" && (
          <div className="mt-12 rounded-3xl border border-line bg-ink-raised/40 px-6 py-10 sm:px-14 sm:py-16">
            {showSkeleton && (
              <div>
                <p className="flex items-center gap-3 text-sm font-medium text-gold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
                  </span>
                  {stage.text}…
                  <span className="text-muted">{elapsed} 秒</span>
                </p>
                <div className="mt-10 space-y-4" aria-hidden="true">
                  <div className="shimmer h-8 w-2/3 rounded-lg bg-line" />
                  {[92, 80, 88, 70, 0, 85, 76, 90].map((w, i) =>
                    w ? <div key={i} className="shimmer h-4 rounded bg-line/80" style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} /> : <div key={i} className="h-3" />,
                  )}
                </div>
              </div>
            )}

            {poem && (
              <article className="mx-auto max-w-2xl">
                <h2 className="rise text-balance font-display text-4xl font-semibold leading-tight text-gold-strong sm:text-5xl">{title}</h2>
                <div className="mt-10 space-y-8 font-display text-xl leading-[1.7] sm:text-2xl">
                  {stanzas.map((st, i) => (
                    <p key={i} className="rise whitespace-pre-line" style={{ animationDelay: `${i * 120}ms` }}>{st}</p>
                  ))}
                </div>
              </article>
            )}

            {error && (
              <p role="alert" className="mx-auto mt-8 max-w-2xl rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
            )}

            {(status === "done" || status === "error") && (
              <div className="mx-auto mt-12 flex max-w-2xl flex-wrap gap-3 border-t border-line pt-8">
                {poem && (
                  <button type="button" onClick={copy}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium transition-colors duration-200 hover:border-gold hover:text-gold">
                    <Icon path={copied ? ICONS.check : ICONS.copy} className="h-4 w-4" />
                    {copied ? "已复制" : "复制诗"}
                  </button>
                )}
                <button type="button" onClick={() => { setStatus("idle"); setPoem(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium transition-colors duration-200 hover:border-gold hover:text-gold">
                  <Icon path={ICONS.refresh} className="h-4 w-4" />
                  重新开始
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="mt-20 text-center text-sm text-muted">做于 Claude Workshop · 由 Claude 驱动</footer>
    </main>
  );
}
