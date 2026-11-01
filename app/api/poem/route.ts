import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

type Member = { name: string; info?: string };

export async function GET() {
  return Response.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY is not configured", { status: 500 });
  }

  const { members, event } = (await req.json()) as { members: Member[]; event: string };
  if (!Array.isArray(members) || members.length === 0) {
    return new Response("members is required", { status: 400 });
  }

  const memberList = members
    .map((m, i) => `${i + 1}. ${m.name}${m.info ? ` (${m.info})` : ""}`)
    .join("\n");

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
    system:
      "You are a poet. First research each team member on the web using only public, professional information. Many names are shared by several people, so use a detail only when it clearly matches the person (same LinkedIn profile, company or role as given). If you cannot confirm who someone is, write about them from the details provided instead of borrowing a stranger's biography. Then write one poem that weaves the team together with the event. Output only the poem, with a title on the first line.",
    messages: [
      {
        role: "user",
        content: `Team members:\n${memberList}\n\nEvent: ${event || "Claude workshop hackathon"}`,
      },
    ],
  });

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      stream.on("text", (t) => controller.enqueue(enc.encode(t)));
      try {
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(enc.encode("\n[refused]"));
      } catch (err) {
        controller.enqueue(enc.encode(`\n[error] ${err instanceof Error ? err.message : String(err)}`));
      }
      controller.close();
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
