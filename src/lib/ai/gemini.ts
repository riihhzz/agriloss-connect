import "server-only";

/**
 * Klien minimal Google Gemini (REST generateContent).
 * - API key hanya di server (GEMINI_API_KEY).
 * - Model dicoba berurutan (GEMINI_MODELS) — jika satu sibuk/kuota habis, pindah ke berikutnya.
 */

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { functionCall: { id?: string; name: string; args?: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { id?: string; name: string; response: Record<string, unknown> } };

export type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export type FunctionDeclaration = {
  name: string;
  description: string;
  parameters?: { type: "OBJECT"; properties: Record<string, unknown>; required?: string[] };
};

type GenerateOptions = {
  system?: string;
  contents: GeminiContent[];
  tools?: FunctionDeclaration[];
  /** Skema JSON untuk jawaban terstruktur */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
};

const DEFAULT_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"];

export class AiUnavailableError extends Error {}

function models() {
  const fromEnv = process.env.GEMINI_MODELS?.split(",").map((model) => model.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_MODELS;
}

/** Panggil Gemini dan kembalikan konten jawaban kandidat pertama. */
export async function generate({ system, contents, tools, responseSchema, temperature = 0.4 }: GenerateOptions): Promise<GeminiContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiUnavailableError("Fitur AI belum dikonfigurasi (GEMINI_API_KEY kosong).");

  const body = {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
    generationConfig: {
      temperature,
      ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
    },
  };

  let lastError = "";
  for (const model of models()) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

      if (response.status === 429 || response.status === 503 || response.status === 404 || response.status >= 500) {
        lastError = `${model}: HTTP ${response.status}`;
        continue; // coba model berikutnya
      }
      if (!response.ok) {
        lastError = `${model}: HTTP ${response.status} ${await response.text()}`;
        break;
      }

      const data = (await response.json()) as { candidates?: Array<{ content?: GeminiContent }> };
      const content = data.candidates?.[0]?.content;
      if (!content?.parts?.length) {
        lastError = `${model}: jawaban kosong`;
        continue;
      }
      return { role: "model", parts: content.parts };
    } catch (error) {
      lastError = `${model}: ${(error as Error).message}`;
    }
  }

  console.error("[gemini]", lastError);
  throw new AiUnavailableError("Asisten AI sedang sibuk. Coba lagi beberapa saat lagi.");
}

/** Gabungkan semua bagian teks dari jawaban model. */
export function textOf(content: GeminiContent) {
  return content.parts
    .map((part) => ("text" in part ? part.text : ""))
    .join("")
    .trim();
}

/** Pembatas laju sederhana per kunci (per instance server) agar kuota gratis tidak cepat habis. */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit = 12, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}
