// Dictation with a speech model that is already on this computer. Anything can
// be used that Handy installs (Canary, Whisper-family GGUFs, Parakeet through
// its own engines): this runs Handy's headless command line, so the model stays
// where Handy put it and nothing extra is downloaded here.

import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { settings } from "./core.js";

const TIMEOUT = 180_000;
/** Listing the models starts the app once, so the answer is kept for a while. */
const FRESH_MS = 60_000;

let probed = null;

function problem(message, status = 503) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Runs Handy's command line and resolves with its stdout (its logs go to stderr). */
function cli(binary, args) {
  return new Promise((resolve, reject) => {
    execFile(binary, args, { timeout: TIMEOUT, maxBuffer: 8 << 20 }, (error, stdout, stderr) => {
      if (!error) return resolve(String(stdout));
      if (error.code === "ENOENT") return reject(problem(`There's no dictation program at ${binary}.`));
      if (error.killed) return reject(problem("Dictation took too long and stopped."));
      const said = String(stderr)
        .split("\n")
        .map((line) => line.replace(/^\[[^\]]*\]\s*/g, "").trim())
        .filter(Boolean)
        .pop();
      reject(problem(`Dictation failed${said ? `: ${said}` : "."}`, 422));
    });
  });
}

/** The last JSON object on stdout, after any chatter. Exported for the smoke test. */
export function readTranscription(stdout) {
  const lines = String(stdout).split("\n").map((line) => line.trim()).filter((line) => line.startsWith("{"));
  for (const line of lines.reverse()) {
    try {
      const value = JSON.parse(line);
      if (typeof value?.text === "string") return { text: value.text.trim(), model: String(value.model ?? ""), ms: Number(value.best_ms) || 0 };
    } catch {}
  }
  throw problem("The dictation program didn't send back any text.", 502);
}

/** Which program to run: the one in Settings, else whatever `handy` is on PATH. */
const binary = () => String(settings.dictationBinary ?? "").trim() || "handy";

/**
 * What dictation can use right now. `{ ok, binary, model, models, note }`; the
 * models come from Handy's own registry, so the ones not installed are shown as
 * such instead of being offered.
 */
export async function dictationInfo({ refresh = false } = {}) {
  if (!refresh && probed && Date.now() - probed.at < FRESH_MS) return probed.info;
  const program = binary();
  let info;
  try {
    const list = JSON.parse(await cli(program, ["--list-models", "--json"]));
    const models = (Array.isArray(list) ? list : [])
      .filter((m) => m && typeof m.id === "string" && m.is_downloaded !== false)
      .map((m) => ({ id: m.id, label: String(m.name ?? m.id), size: Number(m.size_mb) || 0 }));
    const chosen = settings.dictationModel || models[0]?.id || "";
    info = { ok: true, binary: program, model: chosen, models, note: models.length ? "" : "Handy has no speech model installed yet." };
  } catch (e) {
    info = { ok: false, binary: program, model: "", models: [], note: e.message };
  }
  probed = { at: Date.now(), info };
  return info;
}

/** The last answer, without starting the program: cheap enough for every state push. */
export const cachedDictation = () => probed?.info ?? { ok: false, binary: binary(), model: "", models: [], note: "Checking for a dictation program…" };

/** Transcribes a WAV file (16 kHz mono) with the local speech model. */
export async function localTranscribe(wav) {
  const info = await dictationInfo();
  if (!info.ok) throw problem(`${info.note} Dictation needs Eyes and ears, or Handy with a speech model.`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "liquid-agent-dictation-"));
  const file = path.join(dir, "speech.wav");
  try {
    fs.writeFileSync(file, wav);
    const args = ["--transcribe-file", file, "--json"];
    if (settings.dictationModel) args.push("--model", settings.dictationModel);
    const said = readTranscription(await cli(info.binary, args));
    if (!said.text) throw problem("I didn't hear anything in that recording. Try again a little closer to the mic.", 422);
    return said.text;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
