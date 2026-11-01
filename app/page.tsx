"use client";

import { useState } from "react";

const empty = () => Array.from({ length: 4 }, () => ({ name: "", info: "" }));

export default function Home() {
  const [members, setMembers] = useState(empty);
  const [event, setEvent] = useState("Claude workshop hackathon");
  const [poem, setPoem] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setPoem("");
    setLoading(true);
    try {
      const res = await fetch("/api/poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: members.filter((m) => m.name.trim()), event }),
      });
      if (!res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setPoem((p) => p + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      setPoem(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Team Poem Generator</h1>
      <div className="grid gap-3">
        {members.map((m, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <input
              className="border rounded px-3 py-2"
              placeholder={`Member ${i + 1} name`}
              value={m.name}
              onChange={(e) => setMembers((ms) => ms.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Company, role, LinkedIn..."
              value={m.info}
              onChange={(e) => setMembers((ms) => ms.map((x, j) => (j === i ? { ...x, info: e.target.value } : x)))}
            />
          </div>
        ))}
        <input className="border rounded px-3 py-2" placeholder="Event" value={event} onChange={(e) => setEvent(e.target.value)} />
      </div>
      <button
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
        disabled={loading || !members.some((m) => m.name.trim())}
        onClick={generate}
      >
        {loading ? "Researching and writing..." : "Generate poem"}
      </button>
      {poem && <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed">{poem}</pre>}
    </main>
  );
}
