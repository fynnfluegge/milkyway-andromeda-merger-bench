/*
 * Milkomeda — restricted N-body model of the Milky Way / Andromeda encounter.
 *
 * Units: kpc, Gyr, 10^12 solar masses.  G = 4.498e6 kpc^3 / (1e12 Msun Gyr^2).
 *
 * The two galaxies are modelled as Hernquist spheres (dark matter + stars) whose
 * centres orbit each other as a two-body problem with Chandrasekhar dynamical
 * friction.  Stars are massless test particles moving in the combined potential
 * (Toomre & Toomre 1972 style).  This reproduces the tidal tails, bridges and
 * final merger of the real encounter, at a cost that a browser can pay in real
 * time.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GalaxySim = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const G = 4.498e6;          // kpc^3 (1e12 Msun)^-1 Gyr^-2
  const KMS = 1.02271;        // 1 km/s in kpc/Gyr
  const KPC_LY = 3261.6;      // light-years per kpc

  const PARAMS = {
    mw: {
      key: 'mw', name: 'Milky Way',
      mass: 1.3, a: 20,               // Hernquist total mass, scale radius
      Rd: 2.6, Rmax: 15, zd: 0.3,     // exponential disk scale length, cut-off, thickness
      bulgeA: 0.6, bulgeRmax: 3, bulgeFrac: 0.12,
      inc: 0.95, pa: 0.4,             // disk orientation relative to the orbital plane
    },
    m31: {
      key: 'm31', name: 'Andromeda',
      mass: 2.0, a: 28,
      Rd: 5.0, Rmax: 24, zd: 0.4,
      bulgeA: 1.0, bulgeRmax: 4.5, bulgeFrac: 0.15,
      inc: -1.15, pa: 2.3,
    },
    sep0: 780,                // kpc, today
    vRad: -110 * KMS,         // kpc/Gyr, approach speed today
    vTan: 45 * KMS,           // kpc/Gyr, transverse speed today
    lnLambda: 0.5,            // Coulomb logarithm for dynamical friction
    aPair: 20,                // softening of the core-core force
    sigmaFactor: 0.35,        // velocity dispersion as a fraction of sqrt(GM/a)
  };

  // ---------- small helpers ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function erf(x) { // Abramowitz & Stegun 7.1.26
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function chandraF(X) { return erf(X) - (2 * X / Math.sqrt(Math.PI)) * Math.exp(-X * X); }

  // Rotation taking disk-frame coordinates (z = spin axis) to the world frame.
  function diskFrame(inc, pa) {
    const ci = Math.cos(inc), si = Math.sin(inc), cp = Math.cos(pa), sp = Math.sin(pa);
    // R = Rz(pa) * Rx(inc), row-major
    return [
      cp, -sp * ci, sp * si,
      sp, cp * ci, -cp * si,
      0, si, ci,
    ];
  }
  function circVel(M, a, r) { return Math.sqrt(G * M * r) / (r + a); }

  // ---------- core-core orbit ----------
  function relAccel(P, r, v, out) {
    const d = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]);
    const Mt = P.mw.mass + P.m31.mass;
    const soft = d + P.aPair;
    const f = -G * Mt / (soft * soft * d);
    out[0] = f * r[0]; out[1] = f * r[1]; out[2] = f * r[2];

    const s = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (s < 1e-6) return;
    let k = 0;
    const pairs = [[P.mw, P.m31.mass], [P.m31, P.mw.mass]];
    for (let i = 0; i < 2; i++) {
      const gi = pairs[i][0], Mj = pairs[i][1];
      const dd = Math.max(d, 0.25 * gi.a);
      const rho = gi.mass * gi.a / (2 * Math.PI * dd * Math.pow(dd + gi.a, 3));
      const vj = Math.max(s * gi.mass / Mt, 30);           // speed of body j through galaxy i
      const sig = P.sigmaFactor * Math.sqrt(G * gi.mass / gi.a);
      const X = vj / (Math.SQRT2 * sig);
      k += Mj * rho * chandraF(X) / (vj * vj);
    }
    const fr = -4 * Math.PI * G * G * P.lnLambda * k / s;
    out[0] += fr * v[0]; out[1] += fr * v[1]; out[2] += fr * v[2];
  }

  function orbitStep(P, rel, dt, tmp) {
    relAccel(P, rel.r, rel.v, tmp);
    for (let i = 0; i < 3; i++) rel.v[i] += 0.5 * dt * tmp[i];
    for (let i = 0; i < 3; i++) rel.r[i] += dt * rel.v[i];
    relAccel(P, rel.r, rel.v, tmp);
    for (let i = 0; i < 3; i++) rel.v[i] += 0.5 * dt * tmp[i];
  }

  function initialRel(P) {
    return { r: [P.sep0, 0, 0], v: [P.vRad, P.vTan, 0] };
  }

  // Integrate the core-core orbit alone and find pericentre passages and the merger time.
  function precomputeOrbit(P, tMax, dt) {
    dt = dt || 0.001;
    const rel = initialRel(P);
    const tmp = [0, 0, 0];
    const times = [], seps = [];
    let t = 0;
    const every = Math.max(1, Math.round(0.005 / dt));
    let n = 0;
    while (t <= tMax) {
      if (n % every === 0) {
        times.push(t);
        seps.push(Math.sqrt(rel.r[0] ** 2 + rel.r[1] ** 2 + rel.r[2] ** 2));
      }
      orbitStep(P, rel, dt, tmp);
      t += dt; n++;
    }
    // Merger: the moment after which the cores never separate by more than MERGE_SEP again.
    const MERGE_SEP = 20;
    let merge = null;
    for (let i = seps.length - 1; i >= 0; i--) {
      if (seps[i] >= MERGE_SEP) { merge = i + 1 < times.length ? times[i + 1] : null; break; }
    }
    const peri = [];
    for (let i = 1; i < seps.length - 1; i++) {
      if (merge !== null && times[i] >= merge) break;
      if (seps[i] < seps[i - 1] && seps[i] <= seps[i + 1]) {
        if (peri.length === 0 || times[i] - peri[peri.length - 1].t > 0.3) peri.push({ t: times[i], sep: seps[i] });
      }
    }
    return { times, seps, peri, merge };
  }

  // ---------- particle system ----------
  function createSim(P, N, seed) {
    const rng = mulberry32(seed || 7);
    const Mt = P.mw.mass + P.m31.mass;
    const nMW = Math.round(N * P.mw.mass / Mt);
    const nM31 = N - nMW;

    const pos = new Float32Array(3 * N);
    const vel = new Float32Array(3 * N);
    const acc = new Float32Array(3 * N);
    const col = new Float32Array(3 * N);
    const size = new Float32Array(N);
    const gal = new Uint8Array(N);

    const rel = initialRel(P);
    const c1 = [0, 0, 0], c2 = [0, 0, 0], v1 = [0, 0, 0], v2 = [0, 0, 0];
    function updateCentres() {
      const w1 = -P.m31.mass / Mt, w2 = P.mw.mass / Mt;
      for (let i = 0; i < 3; i++) {
        c1[i] = w1 * rel.r[i]; c2[i] = w2 * rel.r[i];
        v1[i] = w1 * rel.v[i]; v2[i] = w2 * rel.v[i];
      }
    }
    updateCentres();

    const palette = {
      mw: { inner: [1.0, 0.82, 0.55], outer: [1.0, 0.93, 0.78], bulge: [1.0, 0.72, 0.42] },
      m31: { inner: [0.58, 0.73, 1.0], outer: [0.80, 0.88, 1.0], bulge: [0.86, 0.80, 0.98] },
    };

    function populate(g, start, count, centre, vcen, galId) {
      const R = diskFrame(g.inc, g.pa);
      const pal = palette[g.key];
      const nBulge = Math.round(count * g.bulgeFrac);
      for (let n = 0; n < count; n++) {
        const i = start + n;
        let lx, ly, lz, lvx, lvy, lvz, c;
        if (n < nBulge) {
          let r;
          do { const s = Math.sqrt(rng()); r = g.bulgeA * s / (1 - s); } while (r > g.bulgeRmax || r < 0.02);
          const th = Math.acos(2 * rng() - 1), ph = 2 * Math.PI * rng();
          lx = r * Math.sin(th) * Math.cos(ph); ly = r * Math.sin(th) * Math.sin(ph); lz = r * Math.cos(th);
          const vc = circVel(g.mass, g.a, r) * (0.55 + 0.45 * rng());
          const th2 = Math.acos(2 * rng() - 1), ph2 = 2 * Math.PI * rng();
          lvx = vc * Math.sin(th2) * Math.cos(ph2); lvy = vc * Math.sin(th2) * Math.sin(ph2); lvz = vc * Math.cos(th2);
          c = pal.bulge;
        } else {
          let Rc;
          do { Rc = -g.Rd * Math.log(rng() * rng()); } while (Rc > g.Rmax || Rc < 0.05);
          const ph = 2 * Math.PI * rng();
          let z = g.zd * Math.atanh(2 * rng() - 1);
          if (!isFinite(z)) z = 0;
          z = Math.max(-4 * g.zd, Math.min(4 * g.zd, z));
          lx = Rc * Math.cos(ph); ly = Rc * Math.sin(ph); lz = z;
          const rr = Math.sqrt(Rc * Rc + z * z);
          const vc = circVel(g.mass, g.a, rr);
          const vt = vc * (1 + 0.05 * gauss(rng));
          const vr = vc * 0.05 * gauss(rng);
          lvx = -Math.sin(ph) * vt + Math.cos(ph) * vr;
          lvy = Math.cos(ph) * vt + Math.sin(ph) * vr;
          lvz = vc * 0.03 * gauss(rng);
          const f = Math.min(1, Rc / g.Rmax);
          c = [pal.inner[0] + (pal.outer[0] - pal.inner[0]) * f,
               pal.inner[1] + (pal.outer[1] - pal.inner[1]) * f,
               pal.inner[2] + (pal.outer[2] - pal.inner[2]) * f];
        }
        // rotate disk frame -> world frame
        const wx = R[0] * lx + R[1] * ly + R[2] * lz;
        const wy = R[3] * lx + R[4] * ly + R[5] * lz;
        const wz = R[6] * lx + R[7] * ly + R[8] * lz;
        const wvx = R[0] * lvx + R[1] * lvy + R[2] * lvz;
        const wvy = R[3] * lvx + R[4] * lvy + R[5] * lvz;
        const wvz = R[6] * lvx + R[7] * lvy + R[8] * lvz;
        pos[3 * i] = centre[0] + wx; pos[3 * i + 1] = centre[1] + wy; pos[3 * i + 2] = centre[2] + wz;
        vel[3 * i] = vcen[0] + wvx; vel[3 * i + 1] = vcen[1] + wvy; vel[3 * i + 2] = vcen[2] + wvz;
        const bright = 0.7 + 0.6 * rng();
        const spark = rng() < 0.025;
        col[3 * i] = c[0] * bright; col[3 * i + 1] = c[1] * bright; col[3 * i + 2] = c[2] * bright;
        size[i] = spark ? 2.4 : 1.0;
        gal[i] = galId;
      }
    }
    populate(P.mw, 0, nMW, c1, v1, 0);
    populate(P.m31, nMW, nM31, c2, v2, 1);

    const GM1 = G * P.mw.mass, GM2 = G * P.m31.mass, a1 = P.mw.a, a2 = P.m31.a;
    function computeAcc() {
      const c1x = c1[0], c1y = c1[1], c1z = c1[2], c2x = c2[0], c2y = c2[1], c2z = c2[2];
      for (let i = 0; i < N; i++) {
        const j = 3 * i;
        const x = pos[j], y = pos[j + 1], z = pos[j + 2];
        let dx = x - c1x, dy = y - c1y, dz = z - c1z;
        let r = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
        let s = r + a1;
        let f = -GM1 / (s * s * r);
        let ax = f * dx, ay = f * dy, az = f * dz;
        dx = x - c2x; dy = y - c2y; dz = z - c2z;
        r = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
        s = r + a2;
        f = -GM2 / (s * s * r);
        acc[j] = ax + f * dx; acc[j + 1] = ay + f * dy; acc[j + 2] = az + f * dz;
      }
    }
    computeAcc();

    const tmp = [0, 0, 0];
    const sim = {
      N, nMW, nM31, pos, vel, col, size, gal, rel, c1, c2, t: 0, P,
      step(dt) {
        const h = 0.5 * dt;
        for (let j = 0; j < 3 * N; j++) {
          vel[j] += h * acc[j];
          pos[j] += dt * vel[j];
        }
        orbitStep(P, rel, dt, tmp);
        updateCentres();
        computeAcc();
        for (let j = 0; j < 3 * N; j++) vel[j] += h * acc[j];
        sim.t += dt;
      },
      separation() {
        return Math.sqrt(rel.r[0] ** 2 + rel.r[1] ** 2 + rel.r[2] ** 2);
      },
    };
    return sim;
  }

  return { G, KMS, KPC_LY, PARAMS, createSim, precomputeOrbit, diskFrame };
});
