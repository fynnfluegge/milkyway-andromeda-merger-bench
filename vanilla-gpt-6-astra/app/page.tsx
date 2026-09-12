'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Crosshair, Expand, Info, Minus, MousePointer2, Orbit, Pause, Play, Plus, RotateCcw, Settings2, Sparkles, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GalaxyScene, { type SceneHandle } from './galaxy-scene';

const stages = [
  { name: 'The approach', short: 'Approach', time: 0, title: 'A slow dance across the cosmos.', description: 'Two spiral galaxies draw closer, their motion shaped by the invisible pull of gravity.' },
  { name: 'First encounter', short: 'First encounter', time: 3.8, title: 'Gravity begins to reshape everything.', description: 'As the galaxies pass through each other, their spiral arms stretch into long tidal tails.' },
  { name: 'The separation', short: 'Separation', time: 4.7, title: 'Apart, but still bound together.', description: 'The galaxies swing apart. Gravity holds on, drawing their scattered stars into another encounter.' },
  { name: 'The merger', short: 'Merger', time: 6.4, title: 'Two galaxies. A new beginning.', description: 'Their cores settle into one stellar system, surrounded by a vast cloud of intermingled stars.' },
];

export default function Home() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [labels, setLabels] = useState(true);
  const [trails, setTrails] = useState(false);
  const [settings, setSettings] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const scene = useRef<SceneHandle>(null);
  const currentTime = useRef(0);
  const playState = useRef(true);
  const speedState = useRef(1);
  const scrubState = useRef(false);
  const stageIndex = time < 3.8 ? 0 : time < 4.7 ? 1 : time < 6.4 ? 2 : 3;
  const stage = stages[stageIndex];

  useEffect(() => { playState.current = playing; }, [playing]);
  useEffect(() => { speedState.current = speed; }, [speed]);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
    let frame = 0, last = 0, update = 0;
    const tick = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (playState.current && !scrubState.current && !document.hidden) {
        currentTime.current = Math.min(8, currentTime.current + delta * 0.043 * speedState.current);
        if (currentTime.current >= 8) setPlaying(false);
      }
      if (now - update > 90) { setTime(currentTime.current); update = now; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const seek = useCallback((value: number) => { currentTime.current = value; setTime(value); }, []);
  const togglePlay = useCallback(() => {
    if (currentTime.current >= 8) seek(0);
    setPlaying(value => !value);
  }, [seek]);
  const restart = useCallback(() => { seek(0); setPlaying(true); }, [seek]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, input, [role="slider"], [role="dialog"], a')) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
      if (event.key.toLowerCase() === 'r') restart();
      if (event.key === 'ArrowRight') { event.preventDefault(); seek(Math.min(8, currentTime.current + 0.1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); seek(Math.max(0, currentTime.current - 0.1)); }
      if (event.key === 'Escape') { setSettings(false); setImmersive(false); }
    };
    const release = () => { scrubState.current = false; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); };
  }, [restart, seek, togglePlay]);

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setImmersive(value => !value);
    } catch { setImmersive(value => !value); }
  };

  return (
    <main className={`observatory dark ${immersive ? 'is-immersive' : ''}`}>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Galactic Encounter home"><Orbit aria-hidden="true" /><span>GALACTIC<span className="wordmark-light"> ENCOUNTER</span></span></a>
        <div className="header-center"><span className="tiny-star">✦</span> A little perspective on a cosmic scale</div>
        <div className="header-actions">
          <Dialog onOpenChange={open => { if (open) setSettings(false); }}>
            <DialogTrigger className="about-button"><Info size={16} /><span>About the simulation</span><span className="sr-only mobile-about-label">About the simulation</span></DialogTrigger>
            <DialogContent className="about-dialog">
              <DialogHeader><div className="eyebrow">THE SCIENCE BEHIND THE SCENE</div><DialogTitle>A possible future, in motion.</DialogTitle><DialogDescription>This interactive visualization imagines a collision between the Milky Way and Andromeda, from their first approach to a single merged galaxy.</DialogDescription></DialogHeader>
              <p>The stars follow choreographed paths inspired by galactic encounters. The timeline, galaxy sizes, and distances are compressed for exploration; this is an artistic model, not a numerical prediction.</p>
              <p>A collision is not certain. Research reported by NASA in 2025 estimates roughly a 50% chance within the next 10 billion years. Most individual stars would pass each other without colliding.</p>
              <a className="science-link" href="https://science.nasa.gov/missions/hubble/apocalypse-when-hubble-casts-doubt-on-certainty-of-galactic-collision/" target="_blank" rel="noreferrer">Explore the science at NASA <ArrowUpRight size={16} /></a>
              <div className="keyboard-help"><span><kbd>Space</kbd> Play / pause</span><span><kbd>←</kbd><kbd>→</kbd> Seek</span><span><kbd>R</kbd> Restart</span></div>
            </DialogContent>
          </Dialog>
          <span className="header-divider" />
          <button className="icon-button" onClick={fullscreen} aria-label={immersive ? 'Exit immersive view' : 'Enter fullscreen'} title="Fullscreen"><Expand size={18} /></button>
        </div>
      </header>

      <div className="universe" aria-label="Interactive galaxy collision visualization">
        <GalaxyScene ref={scene} time={currentTime} labels={labels} trails={trails} onError={() => { setWebglError(true); setPlaying(false); }} />
        <div className="scene-vignette" />
      </div>

      <section className="scene-heading">
        <div className="eyebrow"><span className="eyebrow-line" /> A COSMIC ENCOUNTER</div>
        <h1>Milky Way <span className="title-times">×</span><br />Andromeda</h1>
        <p>A billion-year story. A front-row seat.</p>
        <div className="scenario-tag"><span /> POSSIBLE MERGER SCENARIO</div>
      </section>

      <aside className="time-readout" aria-label="Simulation time">
        <div className="eyebrow">TIME FROM PRESENT</div>
        <div className="time-number">{time.toFixed(2)}<span>Gyr</span></div>
        <div className="time-caption">{time < 0.02 ? 'Our story begins now' : `${(time * 1000).toLocaleString('en', { maximumFractionDigits: 0 })} million years into the future`}</div>
        <div className="live-state"><span className={playing ? 'status-dot is-live' : 'status-dot'} />{playing ? 'SIMULATION RUNNING' : time >= 8 ? 'JOURNEY COMPLETE' : 'SIMULATION PAUSED'}</div>
      </aside>

      <aside className="galaxy-legend">
        <div className="legend-item"><span className="galaxy-dot blue" /><div><strong>Milky Way</strong><span>Our home galaxy</span></div></div>
        <div className="legend-item"><span className="galaxy-dot gold" /><div><strong>Andromeda</strong><span>Our spiral neighbor</span></div></div>
      </aside>

      <div className="view-controls" aria-label="Camera controls">
        <button className="icon-button" onClick={() => scene.current?.zoom(1.16)} aria-label="Zoom in" title="Zoom in"><Plus size={18} /></button>
        <button className="icon-button" onClick={() => scene.current?.zoom(1 / 1.16)} aria-label="Zoom out" title="Zoom out"><Minus size={18} /></button>
        <span />
        <button className="icon-button" onClick={() => scene.current?.reset()} aria-label="Reset camera" title="Reset camera"><Crosshair size={18} /></button>
      </div>
      <div className="view-hint"><MousePointer2 size={13} /><span>Drag to orbit</span><i /><span>Scroll to explore</span></div>
      {webglError && <div className="scene-error"><Sparkles size={26} /><h2>The stars need a little help.</h2><p>Enable hardware acceleration or try a browser with WebGL support to view the animation.</p><button onClick={() => window.location.reload()}>Try again <RotateCcw size={14} /></button></div>}

      <div className="lower-interface">
        <section className="chapter-caption" aria-live="polite" aria-atomic="true">
          <span className="chapter-number">0{stageIndex + 1}<span> / 04</span></span>
          <div><div className="chapter-name">{stage.name}</div><h2>{stage.title}</h2><p>{stage.description}</p></div>
        </section>
        <section className="playback-panel" aria-label="Simulation playback controls">
          <div className="transport">
            <button className="play-button" onClick={togglePlay} aria-label={playing ? 'Pause simulation' : 'Play simulation'} title={playing ? 'Pause (Space)' : 'Play (Space)'}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button>
            <button className="icon-button restart-button" onClick={restart} title="Restart (R)" aria-label="Restart simulation"><RotateCcw size={18} /></button>
            <span className="transport-divider" />
            <button className="speed-button" onClick={() => setSpeed(value => value === 0.5 ? 1 : value === 1 ? 2 : value === 2 ? 4 : 0.5)} title="Change playback speed" aria-label={`Playback speed ${speed} times. Click to change.`}>{speed}×<ChevronRight size={13} /></button>
          </div>
          <div className="timeline">
            <div className="timeline-heading"><span>THE NEXT 8 BILLION YEARS</span><div><strong>{time.toFixed(2)}</strong><span> / 8.00 Gyr</span></div></div>
            <Slider className="time-slider" value={[time]} min={0} max={8} step={0.01} onValueChange={value => seek(Array.isArray(value) ? value[0] : value)} onPointerDown={() => { scrubState.current = true; }} onValueCommitted={() => { scrubState.current = false; }} aria-label="Time from present in billions of years" />
            <div className="timeline-ticks"><span>Present day</span><span>2 Gyr</span><span>4 Gyr</span><span>6 Gyr</span><span>8 Gyr</span></div>
          </div>
          <div className="settings-wrap">
            <button className={`settings-button ${settings ? 'is-active' : ''}`} onClick={() => setSettings(value => !value)} aria-expanded={settings} aria-controls="view-settings" title="View settings"><Settings2 size={18} /><span>View</span></button>
            {settings && <div className="settings-popover" id="view-settings"><div className="settings-title">Make it your universe<button className="icon-button" aria-label="Close view settings" onClick={() => setSettings(false)}><X size={15} /></button></div><label>Galaxy labels<Switch checked={labels} onCheckedChange={setLabels} aria-label="Show galaxy labels" /></label><label>Orbital paths<Switch checked={trails} onCheckedChange={setTrails} aria-label="Show orbital paths" /></label><button className="reset-view" onClick={() => scene.current?.reset()}><Crosshair size={15} /> Reset camera</button><p>Drag the scene to change your perspective.</p></div>}
          </div>
        </section>
        <nav className="chapter-navigation" aria-label="Jump to an encounter stage">
          {stages.map((item, index) => <button key={item.name} className={index === stageIndex ? 'is-current' : ''} onClick={() => seek(item.time)} aria-current={index === stageIndex ? 'step' : undefined}><span className="stage-indicator">{index < stageIndex ? <Check size={11} /> : `0${index + 1}`}</span><span>{item.short}</span><span className="stage-time">{index === 0 ? 'NOW' : `+${item.time.toFixed(1)} GYR`}</span>{index < 3 && <ChevronRight className="stage-chevron" size={14} />}</button>)}
        </nav>
        <footer className="site-footer"><span><span className="footer-star">✦</span> Perspective changes everything.</span><span>Artistic visualization <span className="footer-dot">·</span> Time & distance are illustrative</span></footer>
      </div>
    </main>
  );
}
