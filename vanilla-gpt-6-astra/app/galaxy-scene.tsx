'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react';

export type SceneHandle = { zoom: (factor: number) => void; reset: () => void };
type Props = { time: MutableRefObject<number>; labels: boolean; trails: boolean; onError: () => void };
type Vec3 = [number, number, number];

// A deliberately illustrative orbit, compressed to keep the encounter in view.
const orbit: [number, ...Vec3][] = [
  [0, -4.2, -.4, 0], [2.2, -2.9, -.85, 0], [3.8, -.3, -.5, .1],
  [4.2, .6, .2, 0], [4.9, 2.25, 1.1, .1], [5.5, 1.6, 1.25, 0],
  [6.1, .4, .6, 0], [6.5, -.6, -.1, 0], [7.0, .15, -.12, 0], [7.5, 0, 0, 0], [8, 0, 0, 0],
];

export function galaxyCenter(time: number, galaxy = 0): Vec3 {
  let i = 0;
  while (i < orbit.length - 2 && time > orbit[i + 1][0]) i++;
  const p0 = orbit[Math.max(0, i - 1)], p1 = orbit[i], p2 = orbit[i + 1], p3 = orbit[Math.min(orbit.length - 1, i + 2)];
  const t = Math.max(0, Math.min(1, (time - p1[0]) / (p2[0] - p1[0])));
  const sign = galaxy === 0 ? 1 : -.83;
  return [1, 2, 3].map(k => sign * .5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t)) as Vec3;
}

const vertexSource = `
precision highp float;
attribute vec4 aData;
attribute vec4 aLook;
uniform float uTime;
uniform float uClock;
uniform float uAspect;
uniform float uZoom;
uniform float uDpr;
uniform float uYaw;
uniform float uPitch;
uniform float uSmall;
uniform vec3 uA;
uniform vec3 uB;
varying mediump vec3 vColor;
varying mediump float vAlpha;
varying mediump float vType;

vec2 rotate(vec2 p, float a) { float c=cos(a), s=sin(a); return vec2(c*p.x-s*p.y,s*p.x+c*p.y); }
void main() {
  float g = aLook.x;
  float radius = aData.x;
  float seed = aData.w;
  float kind = aLook.w;
  vec3 p;
  float size = aLook.y;
  if (g > 1.5) {
    p = aData.xyz;
    p.xy = rotate(p.xy, uYaw * .035);
    p.y += uPitch * .12;
    gl_Position = vec4(p.x / uAspect, p.y, .7, 1.0);
    gl_PointSize = size * uDpr;
    vColor = mix(vec3(.48,.59,.76), vec3(.91,.81,.67), seed);
    vAlpha = aLook.z * (.83 + .17*sin(uClock * .0003 + seed*90.));
    vType = 2.;
    return;
  }
  float merge = smoothstep(5.8, 7.65, uTime);
  float encounter = smoothstep(3.4, 4.5, uTime) * (1. - smoothstep(6.3, 7.8, uTime));
  float angle = aData.y + uTime * (.13 + .23 / (radius + .6)) * mix(1., -.75, g);
  float armStretch = encounter * pow(clamp(radius / 3.5, 0., 1.4), 2.) * (0.3 + .7*seed);
  angle += armStretch * 1.1;
  float r = radius * (1. + armStretch * .6);
  p = vec3(cos(angle)*r, sin(angle)*r, aData.z);
  float tail = smoothstep(.57, .97, seed) * encounter * pow(clamp(radius/3.,0.,1.),3.);
  p.x += sin(angle + g*3.14) * tail * 3.8;
  p.y += cos(angle*.7 + g*3.14) * tail * 2.;
  p.yz = rotate(p.yz, mix(.72, 1.01, g) + encounter*.27);
  p.xy = rotate(p.xy, mix(-.4, .43, g) + uTime*.055);
  vec3 remnant = vec3(cos(aData.y+uTime*.14)*radius*1.18, sin(aData.y+uTime*.14)*radius*.66, sin(seed*123.)*radius*.43);
  remnant.xy = rotate(remnant.xy, -.24);
  p = mix(p, remnant, merge);
  p += mix(uA, uB, g);
  p.xz = rotate(p.xz, uYaw);
  p.yz = rotate(p.yz, uPitch);
  // Portrait views arrange the pair diagonally to retain visible detail.
  p.xy = rotate(p.xy, uSmall * -.55);
  float scale = uZoom * mix(.138,.105,uSmall);
  gl_Position = vec4(p.x*scale/uAspect, (p.y*scale + .055), clamp(-p.z*.025,-.8,.8), 1.);
  gl_PointSize = clamp(size*uDpr*pow(uZoom,.7)*(1.+merge*.18), .65, 90.);
  vec3 cool = mix(vec3(.31,.48,.75), vec3(.67,.79,1.), seed);
  vec3 warm = mix(vec3(.66,.38,.17), vec3(1.,.77,.46), seed);
  vec3 core = mix(vec3(.93,.86,.71), vec3(1.,.88,.67), g);
  vColor = mix(mix(cool,warm,g),core,1.-smoothstep(.08,1.35,radius));
  vColor = mix(vColor, vec3(.89,.73,.51), merge*.4);
  if (seed>.982) vColor = mix(vColor,vec3(.96,.78,.73),.7);
  vAlpha = aLook.z * (1. + .22*encounter) * (1.-merge*.07);
  vType = kind;
}`;

const fragmentSource = `
precision mediump float;
varying mediump vec3 vColor;
varying mediump float vAlpha;
varying mediump float vType;
void main() {
  vec2 p = gl_PointCoord * 2. - 1.;
  float d = dot(p,p);
  if(d > 1.) discard;
  float falloff = exp(-d * mix(4.5, 3.1, step(1.5,vType)));
  falloff *= 1. - smoothstep(.25, 1., d);
  gl_FragColor = vec4(vColor, vAlpha * falloff);
}`;

function rng(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const GalaxyScene = forwardRef<SceneHandle, Props>(function GalaxyScene({ time, labels, trails, onError }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pathCanvas = useRef<HTMLCanvasElement>(null);
  const labelA = useRef<HTMLDivElement>(null);
  const labelB = useRef<HTMLDivElement>(null);
  const camera = useRef({ zoom: 1, yaw: 0, pitch: 0, targetZoom: 1, targetYaw: 0, targetPitch: 0 });
  const options = useRef({ labels, trails });
  const error = useRef(onError);
  options.current = { labels, trails };
  error.current = onError;
  useImperativeHandle(ref, () => ({
    zoom(factor) { camera.current.targetZoom = Math.max(.55, Math.min(2.8, camera.current.targetZoom * factor)); },
    reset() { camera.current.targetZoom = 1; camera.current.targetYaw = 0; camera.current.targetPitch = 0; },
  }), []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance', depth: false });
    if (!gl) { error.current(); return; }
    const shaders: WebGLShader[] = [];
    const makeShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader unavailable');
      shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
      return shader;
    };
    const program = gl.createProgram();
    if (!program) { error.current(); return; }
    try {
      gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
    } catch { gl.deleteProgram(program); shaders.forEach(shader => gl.deleteShader(shader)); error.current(); return; }
    gl.useProgram(program);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST); gl.clearColor(7/255, 8/255, 10/255, 1);

    const random = rng(19770820);
    const data: number[] = [];
    const looks: number[] = [];
    const normal = () => Math.sqrt(-2 * Math.log(Math.max(.0001, random()))) * Math.cos(2*Math.PI*random());
    // Broad, low-opacity particles trace the stellar density; sharp points resolve its stars.
    for (let g = 0; g < 2; g++) {
      const count = 36000;
      for (let i=0; i<count; i++) {
        const core = random() < .25;
        const dust = i < 14000;
        const r = core ? Math.pow(random(), 1.65)*.82 : Math.min(4.3, -.87*Math.log(Math.max(.007, random()*random())));
        const radius = r * (g === 1 ? 1.14 : 1);
        const arm = Math.floor(random()* (g === 0 ? 4 : 2));
        const armAngle = arm * Math.PI * 2 / (g === 0 ? 4 : 2);
        const diffuse = random() < .26;
        const angle = core || diffuse ? random()*Math.PI*2 : armAngle + Math.log(radius+.18)*2.5 + normal()*(.12+.12/(radius+.35));
        const height = normal() * (core ? .24 : .045 + radius*.022);
        const seed = random();
        const bright = random();
        data.push(radius, angle, height, seed);
        looks.push(g, dust ? 9+random()*18 : bright > .995 ? 4+random()*3.5 : .9+random()*1.45, dust ? .014+random()*.021 : .23+bright*.55, dust ? 0 : 1);
      }
      // A fine, extended stellar halo.
      for(let i=0; i<1800; i++) {
        data.push(1+random()*5.5, random()*Math.PI*2, normal()*.35, random());
        looks.push(g, .8+random()*1.2, .08+random()*.14, 1);
      }
    }
    for(let i=0; i<1600; i++) {
      data.push((random()-.5)*7, (random()-.5)*2, 0, random());
      const bright = random();
      looks.push(2, bright>.992 ? 3.2 : .6+random()*1.5, bright>.992 ? .85 : .11+random()*.33, 2);
    }
    const buffers: WebGLBuffer[] = [];
    const attribute = (name: string, values: number[]) => {
      const buffer = gl.createBuffer(); if (!buffer) return;
      buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0);
    };
    attribute('aData', data); attribute('aLook', looks);
    const uniforms = Object.fromEntries(['uTime','uClock','uAspect','uZoom','uDpr','uYaw','uPitch','uSmall','uA','uB'].map(name => [name,gl.getUniformLocation(program,name)]));
    let width=1, height=1, dpr=1, frame=0, disposed=false;
    const resize = () => {
      const rect = el.getBoundingClientRect(); width=Math.max(1,rect.width); height=Math.max(1,rect.height);
      dpr=Math.min(window.devicePixelRatio || 1, 2);
      el.width=Math.round(width*dpr); el.height=Math.round(height*dpr); gl.viewport(0,0,el.width,el.height);
      if(pathCanvas.current) { pathCanvas.current.width=el.width; pathCanvas.current.height=el.height; }
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    let down=false, px=0, py=0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    const pointerDown = (e: PointerEvent) => { pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); down=true; px=e.clientX; py=e.clientY; el.setPointerCapture(e.pointerId); if(pointers.size===2) { const p=[...pointers.values()]; pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); } };
    const pointerMove = (e: PointerEvent) => {
      if(!down || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2) { const p=[...pointers.values()]; const distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); if(pinchDistance>0) camera.current.targetZoom=Math.max(.55,Math.min(2.8,camera.current.targetZoom*distance/pinchDistance)); pinchDistance=distance; }
      else { camera.current.targetYaw+=(e.clientX-px)*.004; camera.current.targetPitch=Math.max(-1.2,Math.min(1.2,camera.current.targetPitch+(e.clientY-py)*.004)); }
      px=e.clientX; py=e.clientY;
    };
    const pointerUp = (e: PointerEvent) => { pointers.delete(e.pointerId); down=pointers.size>0; const p=[...pointers.values()][0]; if(p){px=p.x;py=p.y;} pinchDistance=0; };
    const wheel = (e: WheelEvent) => { e.preventDefault(); camera.current.targetZoom=Math.max(.55,Math.min(2.8,camera.current.targetZoom*Math.exp(-e.deltaY*.001))); };
    const contextLost = (e: Event) => { e.preventDefault(); disposed=true; cancelAnimationFrame(frame); error.current(); };
    el.addEventListener('pointerdown',pointerDown); el.addEventListener('pointermove',pointerMove); el.addEventListener('pointerup',pointerUp); el.addEventListener('pointercancel',pointerUp); el.addEventListener('wheel',wheel,{passive:false}); el.addEventListener('webglcontextlost',contextLost);

    const project = (point: Vec3, small: number) => {
      let [x,y,z]=point; const c=camera.current;
      [x,z]=[x*Math.cos(c.yaw)-z*Math.sin(c.yaw), x*Math.sin(c.yaw)+z*Math.cos(c.yaw)];
      [y,z]=[y*Math.cos(c.pitch)-z*Math.sin(c.pitch), y*Math.sin(c.pitch)+z*Math.cos(c.pitch)];
      [x,y]=[x*Math.cos(small*-.55)-y*Math.sin(small*-.55),x*Math.sin(small*-.55)+y*Math.cos(small*-.55)];
      const scale=c.zoom*(small ? .105 : .138);
      return [(x*scale/(width/height)*.5+.5)*width,(-y*scale*.5+.4725)*height];
    };
    const draw = (now: number) => {
      if(disposed) return;
      const c=camera.current; c.zoom+=(c.targetZoom-c.zoom)*.12; c.yaw+=(c.targetYaw-c.yaw)*.12; c.pitch+=(c.targetPitch-c.pitch)*.12;
      const t=time.current, small=width<700 ? 1 : 0;
      const a=galaxyCenter(t,0), b=galaxyCenter(t,1);
      gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(uniforms.uTime,t); gl.uniform1f(uniforms.uClock,now); gl.uniform1f(uniforms.uAspect,width/height); gl.uniform1f(uniforms.uZoom,c.zoom); gl.uniform1f(uniforms.uDpr,dpr); gl.uniform1f(uniforms.uYaw,c.yaw); gl.uniform1f(uniforms.uPitch,c.pitch); gl.uniform1f(uniforms.uSmall,small); gl.uniform3fv(uniforms.uA,a); gl.uniform3fv(uniforms.uB,b);
      gl.drawArrays(gl.POINTS,0,data.length/4);
      [labelA.current,labelB.current].forEach((label,index) => {
        if(!label) return;
        const p=project(index ? b : a,small);
        const offset=small ? 30 : 46;
        const x=p[0]+offset, y=p[1]+(small ? 30 : 65);
        label.style.transform=`translate(${Math.min(width-(small ? 104 : 140),Math.max(10,x))}px,${y}px)`;
        label.style.opacity=options.current.labels && (index===0 || t<6.7) && p[0]>0 && p[0]<width && p[1]>0 && p[1]<height ? '1':'0';
        if(index===0) { const title=label.querySelector('strong'); const caption=label.querySelector('span'); if(title) title.textContent=t>6.7 ? 'MILKOMEDA' : 'MILKY WAY'; if(caption) caption.textContent=t>6.7 ? 'A new stellar system' : 'Our place in the universe'; }
      });
      const ctx=pathCanvas.current?.getContext('2d');
      if(ctx) {
        ctx.clearRect(0,0,width*dpr,height*dpr);
        if(options.current.trails) {
          ctx.save(); ctx.scale(dpr,dpr); ctx.lineWidth=1; ctx.setLineDash([3,6]);
          for(let g=0;g<2;g++) { ctx.strokeStyle=g===0 ? '#8db7e06b':'#e2b3786b'; ctx.beginPath(); for(let step=0;step<=100;step++) { const p=project(galaxyCenter(step*.08,g),small); if(step===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
          ctx.restore();
        }
      }
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
    return () => { disposed=true; cancelAnimationFrame(frame); observer.disconnect(); el.removeEventListener('pointerdown',pointerDown); el.removeEventListener('pointermove',pointerMove); el.removeEventListener('pointerup',pointerUp); el.removeEventListener('pointercancel',pointerUp); el.removeEventListener('wheel',wheel); el.removeEventListener('webglcontextlost',contextLost); buffers.forEach(buffer=>gl.deleteBuffer(buffer)); shaders.forEach(shader=>gl.deleteShader(shader)); gl.deleteProgram(program); };
  }, [time]);

  return <><canvas ref={canvas} className="galaxy-canvas" tabIndex={0} role="img" aria-label="Blue-white Milky Way and golden Andromeda spiral galaxies. Drag to orbit, scroll or pinch to zoom. Use the timeline below to explore their collision." /><canvas ref={pathCanvas} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} aria-hidden="true" /><div className="galaxy-label" ref={labelA} aria-hidden="true"><i /><div><strong>MILKY WAY</strong><span>Our place in the universe</span></div></div><div className="galaxy-label andromeda" ref={labelB} aria-hidden="true"><i /><div><strong>ANDROMEDA</strong><span>Messier 31 · M31</span></div></div></>;
});

export default GalaxyScene;
