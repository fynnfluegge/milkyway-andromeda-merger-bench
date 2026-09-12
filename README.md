# Milky Way–Andromeda collision generation benchmarks

Generated browser simulations and visualizations of a possible collision and
merger between the Milky Way and Andromeda. Each top-level project folder is a
separate benchmark output, with its own implementation, controls, and generation
usage record.

The folder names identify three vanilla model runs. This repository contains
their source snapshots and accounting notes; it does not include a shared
generation prompt, automated cross-project benchmark runner, or scoring rubric.

## Benchmarks

| Benchmark | Implementation | Local runtime | Recorded generation cost (USD) |
| --- | --- | --- | --- |
| [Vanilla Claude Fable 5.1](vanilla-claude-fable-5-1/README.md) | Restricted N-body simulation; WebGL; 40,000–60,000 test stars; 0–9 Gyr timeline | Static HTTP server | $4.48 |
| [Vanilla Claude Opus 5](vanilla-claude-opus-5/README.md) | Restricted N-body encounter with a rigid-disc approach phase; WebGL 2; 56,000–110,000 test stars; 0–8 Gyr timeline | Static HTTP server | $6.93 |
| [Vanilla GPT-6 Astra](vanilla-gpt-6-astra/README.md) | Artistic galaxy animation with scripted paths; React, TypeScript, WebGL, and Vinext; 0–8 Gyr timeline | Local Node.js server and npm | $5.04 estimated |

Gyr means billion years. The two restricted N-body models move massless test
stars through analytic galaxy potentials. The Astra implementation uses
choreographed motion and illustrative distances. These implementation differences
matter when comparing the resulting visuals and behavior.

## Run locally

All three benchmarks run locally. Start the static server and Astra's Node.js
server as described below, then open the corresponding URL:

| Benchmark | Local URL | Server |
| --- | --- | --- |
| Fable 5.1 | [Open Fable](http://127.0.0.1:8000/vanilla-claude-fable-5-1/) | Python static server |
| Opus 5 | [Open Opus](http://127.0.0.1:8000/vanilla-claude-opus-5/) | Python static server |
| GPT-6 Astra | [Open Astra](http://localhost:3000/) | Vinext development server |

### Static benchmarks: Fable and Opus

Start one server from this repository's root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Python 3 supplies the server; these two projects need no npm installation or
build step to run. Fable needs WebGL and Opus needs WebGL 2. Both pages request
Google Fonts and use fallback fonts if those requests are unavailable. Stop the
server with `Ctrl+C`.

### GPT-6 Astra

Astra uses React and TypeScript, so Vinext compiles and serves the application
locally. It requires Node.js **22.13.0 or newer**, npm, and WebGL. In a separate
terminal, run these commands from the repository root:

```sh
cd vanilla-gpt-6-astra
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), or the URL printed by the
server if that port is in use. No hosting account, cloud bindings, or hosting
configuration is required. Stop the server with `Ctrl+C`. See the
[Astra README](vanilla-gpt-6-astra/README.md) for production build and local
preview commands.

## Checks and development

The [Opus README](vanilla-claude-opus-5/README.md) documents the orbit parameter
sweep, and the
[Fable README](vanilla-claude-fable-5-1/README.md) includes a headless orbit command.
The [Astra README](vanilla-gpt-6-astra/README.md) documents its build and lint
commands.
There is no root-level npm project or combined test command.

## Usage and cost records

Generation usage and cost tables are transcribed from the recorded run reports.
Each benchmark README reproduces its model breakdown and available duration and
code-change statistics. These are the costs of generating the projects; running
their browser simulations does not call a model API.

Amounts are preserved from the recorded reports, not repriced against current
model rates or verified as actual charges. Astra's cost is an API-equivalent
estimate. In the Claude tables, `k` means 1,000 tokens and `m`
means 1,000,000; rounded token counts and costs should not be treated as exact
invoices or directly comparable measurements of identical work.

The root [.gitignore](.gitignore) covers nested dependencies, generated builds,
tool caches, local environment files, logs, and editor/OS files. Lockfiles and
benchmark records remain eligible for version control.
