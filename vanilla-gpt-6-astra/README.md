# Vanilla GPT-6 Astra — Galactic Encounter

An interactive artistic visualization of a Milky Way–Andromeda merger, generated
in the `vanilla gpt-6-astra` benchmark. React and TypeScript provide the interface;
custom WebGL shaders render the galaxies, with a Canvas 2D overlay for orbital
paths. The application uses Vinext on Vite with a local Node.js server.

[All benchmarks](../README.md)

## Setup and run

Requirements: **Node.js 22.13.0 or newer**, npm, and a browser with WebGL enabled.
Installing dependencies requires access to the configured npm registry. No
hosting account, cloud bindings, or hosting configuration is required.

Run from the repository root:

```sh
cd vanilla-gpt-6-astra
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), or the local URL printed by
the server if that port is in use. `npm ci` uses the included
[package-lock.json](package-lock.json). Stop the server with `Ctrl+C`.

## Available scripts

Run these from this benchmark directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vinext development server |
| `npm run build` | Build the application with Vinext |
| `npm start` | Serve a successful build from `dist/` with Vinext's Node.js production server |
| `npm run lint` | Check the source with Oxlint |
| `npm run format` | Run Oxfmt to format the source |

To build and preview locally, stop the development server and run:

```sh
npm run build
npm start
```

The production server defaults to [http://localhost:3000](http://localhost:3000).
To select another port for either server, pass `-- --port 3001` to `npm run dev`
or `npm start`. The snapshot has no `npm test` script or automated test suite.

## Controls

| Action | Control |
| --- | --- |
| Play / pause | Transport button or `Space` |
| Restart | Restart button or `R` |
| Change speed | Speed button cycles through ½×, 1×, 2×, and 4× |
| Seek | Drag the 0–8 Gyr timeline; arrow keys outside focused interactive controls move by 0.1 Gyr |
| Jump to a chapter | Approach (0), First encounter (3.8), Separation (4.7), or Merger (6.4 Gyr) |
| Orbit | Drag the scene |
| Zoom | Wheel, pinch, or the `+` / `−` camera buttons |
| Reset camera | Crosshair button or Reset camera in View settings |
| Labels and orbital paths | Toggles in View settings |
| Fullscreen | Header fullscreen button, with an immersive-view fallback |
| Close view settings / immersive fallback | `Escape` |

At 1×, the timeline advances by 0.043 Gyr per real second. Playback pauses at
8 Gyr and does not advance while the tab is hidden. Reduced-motion preferences
start playback paused. Milky Way particles are blue-white; Andromeda is gold.

## Visual model and files

The galaxy centres follow a table of orbit control points interpolated with a
cubic spline. Shader formulas deform the particles into tidal structures and a
merged remnant. This is a choreographed visual model with illustrative timing,
sizes, and distances; it does not integrate gravitational forces.

The seeded scene contains 36,000 main particles and 1,800 halo particles per
galaxy, plus 1,600 background points: 77,200 rendered points in total. Direct
evaluation at the selected time allows seeking without replaying physics steps.

| Path | Purpose |
| --- | --- |
| [app/page.tsx](app/page.tsx) | Playback state, timeline, chapters, dialogs, and controls |
| [app/galaxy-scene.tsx](app/galaxy-scene.tsx) | Orbit interpolation, particle generation, WebGL shaders, camera, and path overlay |
| [app/globals.css](app/globals.css) | Application layout and visual styling |
| [app/layout.tsx](app/layout.tsx) | Root layout, font configuration, and metadata |
| [components/ui/](components/ui/) | Shared interface components |
| [vite.config.ts](vite.config.ts) | Local Vinext server and Tailwind configuration |

## Generation usage and cost

Source: recorded usage for the `vanilla gpt-6-astra` run.

The first recorded usage breakdown is:

| Token category | Tokens |
| --- | ---: |
| Fresh input | 106,920 |
| Cached input | 1,763,968 |
| Output | 44,082 |
| **Total, calculated from the three categories** | **1,914,970** |

The source contains two accounting snapshots:

| Scope | Total tokens | Estimated API-equivalent cost (USD) |
| --- | ---: | ---: |
| Initial recorded breakdown above | 1,914,970 | $5.04 |
| Latest recorded total, including the usage lookup | 2,758,108 | Approximately $6.31 |

The later total includes the earlier usage; **do not add the two rows**. The
source describes the first estimate as using standard GPT-6 Astra rates, but
does not list the rates themselves. It supplies no category breakdown for the
later total, cache-write count, API/wall duration, or code-change statistics.
These are recorded API-equivalent estimates, not verified charges or a fresh
pricing calculation. Local visualization playback uses no model API and adds
no model-token cost.
