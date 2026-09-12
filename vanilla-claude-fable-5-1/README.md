# Vanilla Claude Fable 5.1 — Milkomeda

A browser simulation of the Milky Way–Andromeda encounter, generated in the
`vanilla fable-5-1` benchmark. It combines a standalone JavaScript physics module
with a WebGL renderer and a timeline spanning 0–9 billion years.

[All benchmarks](../README.md)

## Run

From the repository root:

```sh
cd vanilla-claude-fable-5-1
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Use Python 3 and a browser
with WebGL enabled. There are no npm dependencies or build steps. Google Fonts
are requested for typography, with local fallback fonts available. Stop the
server with `Ctrl+C`.

## Controls

| Action | Control |
| --- | --- |
| Play / pause | Button or `Space` |
| Restart from today | Restart button or `R` |
| Playback speed | ½×, 1×, 2×, or 4× buttons |
| Seek | Click the timeline or its Today / First pass / Merger / +9 Gyr markers |
| Keyboard seek | Focus the timeline and press `Left` / `Right` to move by 0.5 Gyr |
| Orbit camera | Drag the scene |
| Zoom | Mouse wheel or two-finger pinch |
| Automatic framing | Auto frame button; manual zoom turns it off |
| Model details | About the model panel |

Seeking forward computes the intervening simulation steps. Seeking backward
restarts the deterministic simulation and advances to the requested time, so a
jump may take time to complete. A URL such as
[http://127.0.0.1:8000/#t=4](http://127.0.0.1:8000/#t=4) requests a jump to 4 Gyr
on page load.

At 1×, the base playback rate is 0.11 Gyr per real second, boosted by up to 5×
while the galaxies are far apart. Actual progress depends on browser throughput.
The readouts show elapsed time, galaxy separation, and encounter phase; gold
marks the Milky Way and blue marks Andromeda.

## Model and implementation

- Each galaxy is a Hernquist sphere; their centres move under a softened mutual
  gravitational force and Chandrasekhar dynamical friction.
- Massless test stars feel both galaxy potentials, without star self-gravity,
  gas, or star formation.
- The browser selects 60,000 stars when it reports at least eight logical
  processors, otherwise 40,000. Initial sampling uses seed `7`.
- Units are kpc, Gyr, and `10^12` solar masses. The live integrator uses a
  0.0025 Gyr step; the separate orbit calculation uses 0.001 Gyr steps for event
  markers.
- The configured initial separation is 780 kpc, with radial velocity −110 km/s
  and transverse velocity 45 km/s. These are inputs to this scenario, not a
  prediction that a real merger must occur.

## Files and headless usage

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Interface, styles, shaders, camera, timeline, and animation loop |
| [sim.js](sim.js) | Galaxy parameters, seeded particle sampling, orbit calculation, and integrator |

`sim.js` exports `GalaxySim` in a browser and supports CommonJS in Node.js. From
this benchmark directory, inspect the orbit without opening a browser:

```sh
node -e 'const s = require("./sim.js"); const o = s.precomputeOrbit(s.PARAMS, 9, 0.001); console.log({ passages: o.peri, mergerGyr: o.merge });'
```

This is a diagnostic command; the snapshot does not include an automated test
suite or a package manifest.

## Generation usage and cost

Source: recorded usage for the `vanilla fable-5-1` run.

| Recorded metric | Value |
| --- | --- |
| Total cost | **$4.48 USD** |
| API duration | 10m 0s |
| Wall duration | 35m 5s |
| Code changes during generation | 562 lines added, 0 lines removed |

| Model | Input tokens | Output tokens | Cache-read tokens | Cache-write tokens | Reported cost (USD) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `claude-haiku-4-5` | 1.8k | 35 | 0 | 0 | $0.0020 |
| `claude-fable-5-1` | 356 | 51.0k | 941.4k | 88.8k | $4.48 |

`k` means 1,000 tokens. The abbreviated counts and model costs are rounded, so
their displayed sum need not equal the separately reported total exactly. The
source provides no per-token rates or invoice verification. These figures
describe the recorded generation session; the line-change count is not a count
of the files currently in this folder. Local simulation playback uses no model
API and adds no model-token cost.
