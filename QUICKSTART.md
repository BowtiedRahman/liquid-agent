# Quickstart and how-to

Liquid Agent is a private AI agent that runs on your own computer and is driven from your browser. It talks to a local llama.cpp engine running your choice of GGUF model, and it can run commands, read and write files, search the web, set reminders and click around websites for you. Nothing leaves the machine except the downloads you ask for and the web searches you ask for.

- [Install](#install)
- [First run](#first-run)
- [Use a model you already have](#use-a-model-you-already-have)
- [Everyday use](#everyday-use)
- [Approvals and safety](#approvals-and-safety)
- [Voice, pictures and your screen](#voice-pictures-and-your-screen)
- [Make it faster](#make-it-faster)
- [Where your files live](#where-your-files-live)
- [Settings map](#settings-map)
- [Troubleshooting](#troubleshooting)

## Install

**One command** (macOS or Linux; installs into `~/.liquid-agent`, adds a `liquid-agent` command and an app entry):

```bash
curl -fsSL https://raw.githubusercontent.com/BowtiedRahman/liquid-agent/main/install.sh | bash
```

**From a clone** (this is what you want if you plan to change the code):

```bash
git clone https://github.com/BowtiedRahman/liquid-agent
cd liquid-agent
npm ci && npm run build && npm start      # needs Node.js 22 or newer
```

On macOS you can also double-click **Liquid Agent.command**, on Linux run `scripts/start.sh`.

Either way the app opens at <http://127.0.0.1:8170> and only listens on `127.0.0.1`.

Requirements: an Apple silicon Mac with macOS 14+, or 64-bit Linux with glibc 2.35+ (Ubuntu 22.04, Debian 12, Fedora 36 or newer). About 4 GB free for everything, or 1.1 GB for chat only.

## First run

The setup screen asks three things:

1. **What to download.** *Everything* (engine, Everyday brain, Eyes and ears, safety helper, web helper) or *Just chat* (engine and Everyday brain). *Everything* also turns on *Approve for Me* once the safety helper is ready.
2. **Model size.** *Smaller* / *Balanced* / *Best* — bigger answers better and needs more memory. The suggestion is based on this computer's RAM.
3. **Your name** (used to greet you and to pick memories).

You can start with *Just chat* and add the rest later in **Settings → Downloads → Get**.

Downloads are resumable: close the window, restart the app, and it picks up where it stopped.

## Use a model you already have

If you already have a GGUF model on disk — downloaded from Hugging Face earlier, quantized yourself, fine-tuned, whatever — the app runs it in place. Nothing is downloaded, nothing is copied into the app's folder, and nothing is deleted when you switch away.

1. Go to **Settings → Advanced → Everyday brain model → Use a file on this computer**.
2. Type one or more paths, one per line:
   - a single file: `/home/you/models/LFM3-1.7B-Q4_K_M.gguf`
   - a folder: `~/models` (every `.gguf` in it is offered)
   - a path with `~` is fine, and so is a folder of split files such as `model-Q4_K_M-00001-of-00002.gguf` plus `...-00002-of-00002.gguf`.
3. Click **Use these models**. Each file's GGUF header is checked (architecture, context length, chat template, whether it has a thinking mode), then the model is loaded.

The loaded model is shown in the row and in **Downloads → Everyday brain**. If you gave several files, pick between them with the **Size** dropdown there — that is how one folder of models works as a switcher. The choice survives restarts.

**Hugging Face cache files are fine too.** Anything you pulled with `hf download` lives in `~/.cache/huggingface/hub/models--<org>--<name>/snapshots/<revision>/`; point the modal at that `snapshots/<revision>` folder (or at the `.gguf` inside it). Files there are symlinks into `blobs/`, and the app follows them, so nothing is duplicated.

What you still need: the llama.cpp engine (**~30 MB**, installed from *Settings → Downloads → AI engine*). It is a program, not a model; without it no GGUF can run. That download is the only network traffic when you bring your own model.

**Switch back** with **Use built-in** on the same row: the app keeps the built-in LFM3 1.7B as an option, and your files stay where they are.

**Vision and audio models are not used this way.** Only text GGUFs run in this slot; projectors (`mmproj-*.gguf`) and audio models are skipped. Voice and pictures need **Eyes and ears** (LFM3 Omni 2B) from Downloads.

## Everyday use

- **Chat** — type in the box, Enter sends, Shift+Enter makes a new line. Markdown, tables, code with a copy button and math all render.
- **Thinking** — a model whose template has a reasoning mode shows *Thinking for a better answer…*; expand it to read the reasoning. A model without one answers straight away.
- **Tools** — the agent decides on its own when to run a command, read or write a file, search the web, open an app or a link, set a reminder, use the clipboard, or drive a browser. Each action shows up as a step in the reply you can inspect.
- **Routines** — saved prompts you can run with one click or on a schedule.
- **Memory and For You** — *Memory* holds small facts about you; only relevant ones are put in the prompt. *For You* suggests things based on them.
- **Activity** — a log of every action and who approved it.
- **Stop** — while it is thinking or streaming, the composer's send button becomes a stop button.

## Approvals and safety

**Settings → Safety** picks the mode:

| Mode | What it does |
| --- | --- |
| **Ask for Approval** | Every action waits for your yes. The default. |
| **Approve for Me** | The **Auto 200M** classifier checks each action and only asks when it isn't sure. |
| **Full Auto** | Actions run without asking. Destructive commands still ask. |

*Approve for Me* needs the safety helper (**Downloads → Safety helper**, Auto 200M INT4, ~900 MB, runs on the CPU through a private Python). While a model you added yourself is answering, Full Auto behaves like Approve for Me, because an untested model may call tools it shouldn't.

## Voice, pictures and your screen

These go through **Eyes and ears** (LFM3 Omni 2B, **Downloads → Get**), which listens, thinks and talks back in one model — except dictation, which can also use a speech model you already have:

- **Voice chat** — hold a conversation; talk over it to interrupt. Turn the camera on and it also sees what you show it.
- **Dictate** — the microphone in the composer turns speech into text.
- **Read answers aloud** — enable it in Settings → Voice, or press the speaker on a message.
- **Pictures and your screen** — attach an image or ask it to look at your screen.

Without Eyes and ears, chat still works; voice chat and read-aloud answer with a short error. On Linux, audio and microphone additionally need `ffmpeg` (and a working PulseAudio/PipeWire input).

### Dictation with a speech model you already have

**Dictate** works without Eyes and ears if [Handy](https://handy.computer) is installed and has a speech model (Canary, Whisper-family GGUFs, Parakeet). Liquid Agent runs Handy's own headless command line (`handy --transcribe-file … --json`), so the model stays where Handy keeps it: nothing is downloaded, converted or copied.

1. Install Handy and download a speech model inside it once (`handy-app` → Settings → Models). Canary 180M Flash is a good pick: 208 MB, roughly 4× faster than real time on a 2-core laptop.
2. Liquid Agent finds `handy` on your `PATH` by itself. If it lives somewhere else, put the path in **Settings → Advanced → Dictation on this computer** and press **Check**.
3. Hotkey to record, or click the microphone in the composer; the text appears in the box.

Notes:

- With more than one model installed in Handy, the same row lets you pick which one Liquid Agent uses. Leaving it alone uses whichever model Handy has selected.
- If **Eyes and ears** is running, it transcribes instead — it hears longer, messier audio better. Stop it in Downloads to hand dictation back to the local model.
- **Keep takes under about 60–70 seconds.** Handy's batch path transcribes one take at a time and holds about a minute of speech per pass; a longer take comes back with only its start. For meeting-length audio, use Handy's own loop mode, which chunks long audio itself.
- Voice chat and read-aloud still need Eyes and ears: they are a single model listening and talking at once, which a transcribe-only model can't do.

## Make it faster

Answers are limited by the machine, not the app. Rough levers, cheapest first:

1. **Pick a smaller quant.** Q4_K_M or Q4_0 is the sweet spot for a 1.7–3B model; Q8_0/F16 is 2–4× slower and bigger.
2. **Keep the context small.** *Settings → Advanced → Memory for each chat* is how many tokens of the conversation go to the model (6000 by default). Every extra token costs prompt time on every message, so start a new chat instead of growing one forever.
3. **Use the built-in engine flavor that matches the hardware.** On Linux the app picks Vulkan when a real GPU driver is present and CPU otherwise. Force it with `LIQUID_AGENT_GPU=cpu` (or `vulkan`, or `cuda` for NVIDIA, driver 525+) **before starting**, then remove and reinstall the AI engine in Downloads so the matching build is fetched. If a GPU build can't start a model, the app retries on the CPU by itself.
4. **Give the model the cores.** llama.cpp uses the physical cores by default; nothing to configure.
5. **Smaller model, better speed.** A 1.7B Q4 at ~6 tok/s generation on a dual-core laptop is normal; a 2.6B is slower again.

Reference point (4-core / 7 GB Linux laptop, no usable GPU, LFM3 1.7B Q4_K_M): ~13 tok/s prompt processing, ~6 tok/s generation, ~1.6 GB RAM at 32k context.

## Where your files live

| What | Linux | macOS |
| --- | --- | --- |
| Settings, chats, memory, logs, engine, downloaded models | `~/.local/share/liquid-agent` (or `$XDG_DATA_HOME/liquid-agent`) | `~/Library/Application Support/LiquidAgent` |
| Models you added from this computer | left exactly where they are | left exactly where they are |

`Settings → Downloads → Show files` opens that folder. Set `LIQUID_AGENT_HOME` before starting to use a different one.

Logs per part: `logs/small.log`, `logs/omni.log`, `logs/guardian.log`, `logs/browser.log`. They are the first place to look when something won't start.

Useful environment variables:

| Variable | Effect |
| --- | --- |
| `LIQUID_AGENT_HOME` | Data folder (settings, chats, models, logs). |
| `LIQUID_AGENT_PORT` | Port to listen on (default 8170). |
| `LIQUID_AGENT_GPU` | `cpu`, `vulkan` or `cuda` on Linux; picks the engine build. |
| `HF_TOKEN` / `HUGGING_FACE_HUB_TOKEN` | Token for gated or private Hugging Face models. |

## Settings map

- **General** — name, personality, theme, home folder for files, notifications, updates, version.
- **Voice** — voice, read answers aloud, microphone.
- **Safety** — approval mode and the safety helper.
- **Downloads** — every part: **AI engine**, **Everyday brain**, **Eyes and ears**, **Safety helper**, **Web helper**. Each row has its size picker, Start/Stop, and Remove. `Get everything` fills in what's missing.
- **Advanced** — the Everyday brain model (built-in, from Hugging Face, or a file on this computer), dictation with a program on this computer, context budget, tool output kept, most steps per answer, creativity, delete all chats.

## Troubleshooting

**Nothing answers / "The model isn't answering".** Check **Downloads** — the Everyday brain should say *Ready*. If it says *Failed*, open `logs/small.log`. A model that no longer exists at its path shows as *Missing*: point the modal at it again.

**It says the port is in use.** Something else holds it — the app uses 8170 for the interface and 8180/8181 for the two models. Quit the other program and click **Try again**. `LIQUID_AGENT_PORT=8200` moves only the interface; the models stay on 8180 and 8181.

**Answers are correct but slow.** See [Make it faster](#make-it-faster). An old GPU whose driver reports incomplete Vulkan support (for example Intel Ivy Bridge) is not usable by llama.cpp; run the CPU build.

**The microphone does nothing.** Dictation needs **Eyes and ears**, or Handy with a speech model (see [Dictation with a speech model you already have](#dictation-with-a-speech-model-you-already-have)). Check the row in **Settings → Advanced**; if it says *There's no dictation program at …*, fix the path or install Handy. Read-aloud always needs Eyes and ears. On Linux, audio additionally needs `ffmpeg` and a PulseAudio/PipeWire input.

**A tool action never runs.** It is probably waiting for approval — look at the approval dock in the composer, or switch to a different mode in Settings → Safety. Commands that could wipe data always ask, even in Full Auto.

**Reset everything.** Stop the app, then delete the data folder above; the next start shows the setup screen again. Your own model files are unaffected.

**Update.** The one-command install updates itself in the background when nothing is running (Settings → General turns that off); `liquid-agent update` forces it. A clone does not: `git pull && npm ci && npm run build`.
