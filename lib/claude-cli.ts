import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Local development runs Claude through the `claude` CLI, signed in with your own
 * Claude account. Deployed environments (Vercel) always use the API key.
 *
 * CLAUDE_BACKEND=cli | api forces one or the other.
 */
export function isClaudeCliBackend(): boolean {
  const forced = process.env.CLAUDE_BACKEND;
  if (forced === "cli") return true;
  if (forced === "api") return false;
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

function cliPath(): string {
  if (process.env.CLAUDE_CLI_PATH) return process.env.CLAUDE_CLI_PATH;
  const local = join(homedir(), ".local", "bin", "claude");
  return existsSync(local) ? local : "claude";
}

/** Empty working directory so the CLI picks up no project files or CLAUDE.md. */
function isolatedCwd(): string {
  const dir = join(tmpdir(), "peom-claude-cli");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export interface RunClaudeArgs {
  prompt: string;
  systemPrompt: string;
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** CLI tool names to allow, e.g. ["WebSearch"]. Empty means no tools. */
  tools?: string[];
  /** JSON Schema for structured output; the parsed object comes back as `structured`. */
  jsonSchema?: object;
  /** Called with final-answer text as it is produced (text from turns that end in a tool call is dropped). */
  onText?: (text: string) => void;
  signal?: AbortSignal;
}

export interface RunClaudeResult {
  text: string;
  structured?: unknown;
  stopReason?: string;
}

export function runClaude(args: RunClaudeArgs): Promise<RunClaudeResult> {
  const { prompt, systemPrompt, model = "claude-opus-5-5", effort = "medium", tools = [], jsonSchema, onText, signal } = args;

  const argv = [
    "-p", prompt,
    "--system-prompt", systemPrompt,
    "--model", model,
    "--effort", effort,
    "--tools", tools.join(","),
    "--strict-mcp-config",
    "--no-session-persistence",
    "--disable-slash-commands",
    "--output-format", "stream-json",
    "--verbose",
    "--include-partial-messages",
  ];
  if (tools.length) argv.push("--allowedTools", tools.join(","));
  if (jsonSchema) argv.push("--json-schema", JSON.stringify(jsonSchema));

  // Never let the CLI fall back to the API key from .env.local: it should bill the signed-in Claude plan.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;

  return new Promise((resolve, reject) => {
    const child = spawn(cliPath(), argv, { cwd: isolatedCwd(), env, stdio: ["ignore", "pipe", "pipe"] });
    const onAbort = () => child.kill("SIGTERM");
    signal?.addEventListener("abort", onAbort, { once: true });

    let buffered = "";
    let pending = "";
    let stderr = "";
    let result: { is_error?: boolean; subtype?: string; result?: string; structured_output?: unknown; stop_reason?: string } | undefined;

    const handle = (line: string) => {
      if (!line.trim()) return;
      let e: { type?: string; event?: { type?: string; delta?: { type?: string; text?: string; stop_reason?: string } } } & Record<string, unknown>;
      try {
        e = JSON.parse(line);
      } catch {
        return;
      }
      if (e.type === "stream_event" && e.event) {
        const ev = e.event;
        if (ev.type === "message_start") pending = "";
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) pending += ev.delta.text;
        if (ev.type === "message_delta" && ev.delta?.stop_reason && ev.delta.stop_reason !== "tool_use") {
          if (pending) onText?.(pending);
          pending = "";
        }
      }
      if (e.type === "result") result = e as typeof result;
    };

    child.stdout.on("data", (chunk: Buffer) => {
      buffered += chunk.toString("utf8");
      let nl;
      while ((nl = buffered.indexOf("\n")) >= 0) {
        handle(buffered.slice(0, nl));
        buffered = buffered.slice(nl + 1);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")));
    child.on("error", (err) => reject(new Error(`无法启动 claude 命令行：${err.message}`)));
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      handle(buffered);
      if (signal?.aborted) return reject(new Error("请求已取消"));
      if (!result) return reject(new Error(`claude 命令行异常退出（${code}）：${stderr.slice(-500)}`));
      if (result.is_error) return reject(new Error(`claude 命令行出错（${result.subtype}）：${result.result ?? stderr.slice(-500)}`));
      resolve({ text: result.result ?? "", structured: result.structured_output, stopReason: result.stop_reason });
    });
  });
}
