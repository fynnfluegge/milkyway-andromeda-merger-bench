// Parameter sweep used to tune the Milky Way–Andromeda orbit in index.html.
//
// Integrates only the relative orbit of the two dark-matter halos, with the same
// potentials, dynamical-friction drag and event detection as the page, and prints
// the pericenter times/distances and merger time for each parameter combination.
//
// Units: kpc and Myr. Values used by the page: vt = 32 km/s, g0 = 0.0035, Rd = 25 kpc,
// which give first passage at ~3.7 Gyr (33 kpc), second at ~4.8 Gyr, merger at ~6.1 Gyr.
//
// Run: node tools/tune-orbit.js

const KMS = 1.0227e-3; // 1 km/s in kpc/Myr
const T_END = 8000;    // Myr

// isothermal halo with a soft core of radius rc, truncated at Rh
function halo(vkms, rc, Rh) {
  const v02 = (vkms * KMS) ** 2;
  return { v02, rc2: rc * rc, Rh2: Rh * Rh, GMh: v02 * Rh ** 3 / (Rh * Rh + rc * rc) };
}
const MW = halo(220, 2.5, 120);
const M31 = halo(250, 3.2, 120);

// |acceleration| / r at squared distance r2 from a halo's center
function kHalo(g, r2) {
  return r2 < g.Rh2 ? g.v02 / (r2 + g.rc2) : g.GMh / (r2 * Math.sqrt(r2));
}

function run(vt, g0, Rd) {
  let x = 770, y = 0, z = 0, vx = -110 * KMS, vy = vt * KMS, vz = 0;
  const Rd2 = Rd * Rd, dt = 1;
  const acc = () => {
    const r2 = x * x + y * y + z * z;
    const k = kHalo(MW, r2) + kHalo(M31, r2);
    const gam = g0 * Rd2 / (r2 + Rd2);
    return [-k * x - gam * vx, -k * y - gam * vy, -k * z - gam * vz];
  };

  const peri = [];
  let live = null, merge = null, prev = Infinity, falling = true;
  for (let i = 0; i <= T_END; i++) {
    const R = Math.hypot(x, y, z);
    if (live === null && R < 180) live = i;
    if (falling && R > prev) { peri.push({ t: i - 1, r: +prev.toFixed(1) }); falling = false; }
    else if (!falling && R < prev) falling = true;
    if (merge === null && peri.length >= 2 && R < 3) merge = i;
    prev = R;

    let a = acc();
    vx += a[0] * dt / 2; vy += a[1] * dt / 2; vz += a[2] * dt / 2;
    x += vx * dt; y += vy * dt; z += vz * dt;
    a = acc();
    vx += a[0] * dt / 2; vy += a[1] * dt / 2; vz += a[2] * dt / 2;
  }
  const passes = peri.slice(0, 3).map((p) => `${(p.t / 1000).toFixed(2)} Gyr @ ${p.r} kpc`).join(', ');
  console.log(`vt=${vt} g0=${g0} Rd=${Rd}  live=${live} Myr  passes: ${passes}  merger=${merge ?? 'none'} Myr`);
}

for (const vt of [25, 32, 40]) {
  for (const g0 of [0.003, 0.0035, 0.0045]) {
    for (const Rd of [18, 25]) run(vt, g0, Rd);
  }
}
