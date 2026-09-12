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
| [Vanilla GPT-6 Astra](vanilla-gpt-6-astra/README.md) | Artistic galaxy animation with scripted paths; React, TypeScript, WebGL, and Vinext; 0–8 Gyr timeline | Local Node.js server and npm | $5.04 |

Gyr means billion years. The two restricted N-body models move massless test
stars through analytic galaxy potentials. The Astra implementation uses
choreographed motion and illustrative distances. These implementation differences
matter when comparing the resulting visuals and behavior.

| Opus 5 | Fable 5.1 | GPT-6 Astra |
| --- | --- | --- |
| <img width="1024" alt="Screenshot 2026-09-12 at 10 48 18" src="https://github.com/user-attachments/assets/2a1895d6-8754-462c-b0cb-dc22318cd379" /> | <img width="1024" alt="Screenshot 2026-09-12 at 10 46 30" src="https://github.com/user-attachments/assets/90c610d0-f8c2-4f6f-b748-0c42d77f428b" /> | <img width="1024" alt="Screenshot 2026-09-12 at 10 43 24" src="https://github.com/user-attachments/assets/32bb163f-c680-4a83-bf21-9efa52dee654" /> |

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
build step to run. Fable needs WebGL and Opus needs WebGL 2.
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
server if that port is in use.
