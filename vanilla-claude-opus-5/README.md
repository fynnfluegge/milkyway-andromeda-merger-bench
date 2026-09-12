# Vanilla Claude Opus 5 — Milkomeda

A browser visualization and restricted N-body simulation generated in the
`vanilla opus-5` benchmark. A single HTML file contains the interface, physics,
WebGL 2 renderer, glow effects, and an eight-billion-year encounter timeline.

[All benchmarks](../README.md)

## Run

From the repository root:

```sh
cd vanilla-claude-opus-5
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Use Python 3 and a browser
with **WebGL 2** enabled. There are no npm dependencies or build steps. The page
requests Google Fonts and has local font fallbacks. Stop the server with
`Ctrl+C`.

## Controls

| Action | Control |
| --- | --- |
| Play / pause / replay | Button or `Space` |
| Restart | Restart button or `R` |
| Playback speed | ½×, 1×, 2×, or 4× buttons |
| Orbit camera | Drag or use arrow keys |
| Zoom | Wheel, pinch, `+` / `=`, or `-` |
| Reset camera | Double-click the scene or press `0` |
| Color stars by their original galaxy | Tint by origin button or `T` |
| Show the Sun tracer | Sun marker button |
| Model explanation | About the model button; `Escape` closes the panel |

The timeline displays progress and event markers; it does not implement seeking.
The HUD reports elapsed time, galaxy separation, radial velocity, and the Sun
tracer's distance from the Milky Way centre. The simulation starts paused when
the browser requests reduced motion.

At 1×, playback targets 120 Myr per real second during the encounter, with a
faster approach phase. The per-frame integration cap can limit the effective
rate on slower devices.

## Model and implementation

- Two truncated isothermal halo potentials with softened cores drive the orbit.
  Their configured rotation speeds are 220 km/s and 250 km/s.
- The halo orbit is precomputed at 1 Myr intervals from a separation of 770 kpc,
  radial velocity −110 km/s, and transverse velocity 32 km/s. A tuned,
  distance-dependent drag term represents dynamical friction.
- Stars initially form rigid, rotating galaxy patterns. Once the centres are
  less than 180 kpc apart, they become live test particles integrated through
  both moving halo potentials with a drift–kick–drift leapfrog.
- The page selects 56,000 particles for a viewport with a dimension below 700 px
  or at most four reported logical processors, otherwise 110,000.
- The Sun marker follows one representative Milky Way particle. It is part of
  this scenario, not a forecast of the Solar System's future trajectory.
- Stars have no mutual gravity. The initial spiral structure is prescribed;
  gas dynamics and star formation are absent.

## Files and orbit tuning

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Complete browser application, including orbit, particles, shaders, and controls |
| [tools/tune-orbit.js](tools/tune-orbit.js) | Headless parameter sweep for the two-halo orbit |

With Node.js installed, run the sweep from this benchmark directory:

```sh
node tools/tune-orbit.js
```

It prints 18 combinations of transverse velocity, drag strength, and drag scale,
including pericentre times/distances and a detected merger time. The page uses
`vt = 32 km/s`, `g0 = 0.0035`, and `Rd = 25 kpc`. The helper prints diagnostics;
it does not edit the page or run the full star simulation. There is no automated
test suite or package manifest in this snapshot.

## Generation usage and cost

Source: recorded usage for the `vanilla opus-5` run.

| Recorded metric | Value |
| --- | --- |
| Total cost | **$6.93 USD** |
| API duration | 18m 59s |
| Wall duration | 34m 15s |
| Code changes during generation | 1,301 lines added, 2 lines removed |

| Model | Input tokens | Output tokens | Cache-read tokens | Cache-write tokens | Reported cost (USD) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `claude-haiku-4-5` | 1.8k | 38 | 0 | 0 | $0.0020 |
| `claude-opus-5` | 1.6k | 92.4k | 2.7m | 324.9k | $6.93 |

`k` means 1,000 tokens and `m` means 1,000,000. The abbreviated counts and model
costs are rounded, so their displayed sum need not equal the reported total
exactly. The source does not provide per-token rates or invoice verification.
The code-change statistics describe the generation session rather than the
current source line count. Browser playback and the local orbit sweep use no
model API and add no model-token cost.
