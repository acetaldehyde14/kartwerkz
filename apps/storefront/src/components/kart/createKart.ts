import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Metres; +X right, +Y up, +Z nose. Photo-derived proportions, not CAD. */
export const PANEL_NAMES = [
  'front-bumper',
  'nassau-panel',
  'sidepod-left',
  'sidepod-right',
  'rear-bumper',
] as const;
export type PanelName = (typeof PANEL_NAMES)[number];
export interface KartModel {
  root: T.Group;
  panels: Record<PanelName, T.Mesh<T.BufferGeometry, T.MeshPhysicalMaterial>>;
  dispose: () => void;
}
type V3 = [number, number, number];
const v = (p: V3) => new T.Vector3(...p);

/** A closed section swept across a surface. Seam lies underneath the panel.
 * UV: u follows the long axis; v wraps the cross-section. */
function sweep(nu: number, nv: number, fn: (u: number, a: number) => V3) {
  const p: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) {
      p.push(...fn(i / nu, (j / nv) * Math.PI * 2));
      uv.push(i / nu, j / nv);
    }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j,
        b = a + nv + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  // End caps use their own vertices so their normals do not soften the shell.
  for (const end of [0, 1]) {
    const ring: V3[] = [];
    for (let j = 0; j < nv; j++) ring.push(fn(end, (j / nv) * Math.PI * 2));
    const center = ring.reduce((a, b) => a.add(v(b)), new T.Vector3()).multiplyScalar(1 / nv);
    const ci = p.length / 3;
    p.push(...center.toArray());
    uv.push(end, 0.5);
    for (let j = 0; j <= nv; j++) {
      p.push(...ring[j % nv]);
      uv.push(end, j / nv);
    }
    for (let j = 0; j < nv; j++) {
      if (end) idx.push(ci, ci + j + 1, ci + j + 2);
      else idx.push(ci, ci + j + 2, ci + j + 1);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = T.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const signedPow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p);

// Broad centre and upswept wings with a moulded, flatter base.
function frontBumper() {
  return sweep(112, 40, (u, a) => {
    const x = (u * 2 - 1) * 0.7,
      edge = Math.abs(x) / 0.7;
    const trough = Math.exp(-Math.pow((edge - 0.64) / 0.22, 2));
    const top = 0.242 - 0.067 * trough + 0.025 * Math.pow(edge, 6);
    const bottom = 0.052 + 0.016 * edge;
    const z = 0.892 - 0.28 * Math.pow(edge, 2.35);
    const depth = 0.18 - 0.088 * Math.pow(edge, 1.7);
    const roundEnd = 1 - 0.94 * smoothstep(0.94, 1, edge);
    return [
      x,
      (top + bottom) / 2 - ((top - bottom) / 2) * signedPow(Math.cos(a), 0.72) * roundEnd,
      z - depth * signedPow(Math.sin(a), 0.72) * roundEnd,
    ];
  });
}

// Moulded side pods: flat decal faces, rounded corners, tapered leading edge.
function sidepod(side: number) {
  return sweep(84, 40, (u, a) => {
    const z = -0.52 + u * 0.77;
    const taper = 0.3 + 0.7 * Math.min(smoothstep(0, 0.09, u), 1 - 0.78 * smoothstep(0.8, 1, u));
    const top = 0.282 - 0.027 * smoothstep(0.72, 1, u),
      bottom = 0.069;
    const cx = side * (0.583 - 0.018 * smoothstep(0.75, 1, u));
    return [
      cx + 0.089 * taper * signedPow(Math.sin(a), 0.38),
      (top + bottom) / 2 - ((top - bottom) / 2) * taper * signedPow(Math.cos(a), 0.36),
      z,
    ];
  });
}

// Closed, gently domed shell: the newer Sketchfab reference has a solid fairing.
function nassauPanel() {
  const profile = new T.CatmullRomCurve3([
    new T.Vector3(0.09, 0.244, 0.872),
    new T.Vector3(0.179, 0.27, 0.822),
    new T.Vector3(0.186, 0.343, 0.704),
    new T.Vector3(0.161, 0.45, 0.502),
    new T.Vector3(0.133, 0.554, 0.25),
    new T.Vector3(0.138, 0.605, 0.053),
    new T.Vector3(0.123, 0.59, -0.047),
  ]);
  const g = sweep(100, 40, (u, a) => {
    const p = profile.getPoint(u),
      c = Math.cos(a);
    const depth = 0.012 + 0.047 * Math.sin(Math.PI * u) ** 0.6;
    const y = p.y - depth - depth * signedPow(c, 0.65);
    return [-p.x * signedPow(Math.sin(a), 0.83), y, p.z];
  });
  // Planar template across and along the fairing, independent of its thickness.
  const pos = g.getAttribute('position'),
    uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++)
    uv.setXY(i, (pos.getX(i) + 0.2) / 0.4, (0.872 - pos.getZ(i)) / 0.919);
  uv.needsUpdate = true;
  return g;
}

function rearBumper() {
  const s = new T.Shape();
  s.moveTo(-0.66, 0.125);
  s.lineTo(-0.66, 0.245);
  s.quadraticCurveTo(-0.66, 0.278, -0.62, 0.278);
  s.lineTo(-0.23, 0.248);
  s.quadraticCurveTo(-0.2, 0.246, -0.18, 0.274);
  s.lineTo(0.18, 0.274);
  s.quadraticCurveTo(0.2, 0.246, 0.23, 0.248);
  s.lineTo(0.62, 0.278);
  s.quadraticCurveTo(0.66, 0.278, 0.66, 0.245);
  s.lineTo(0.66, 0.125);
  s.quadraticCurveTo(0.66, 0.095, 0.63, 0.095);
  s.lineTo(0.22, 0.122);
  s.quadraticCurveTo(0.19, 0.125, 0.17, 0.106);
  s.lineTo(-0.17, 0.106);
  s.quadraticCurveTo(-0.19, 0.125, -0.22, 0.122);
  s.lineTo(-0.63, 0.095);
  s.quadraticCurveTo(-0.66, 0.095, -0.66, 0.125);
  for (const x of [-0.55, -0.4, -0.27, 0.27, 0.4, 0.55]) {
    const h = new T.Path();
    h.absellipse(x, 0.184, 0.045, 0.034, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new T.ExtrudeGeometry(s, {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    curveSegments: 16,
  });
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++)
    p.setZ(i, -0.865 + p.getZ(i) + 0.045 * Math.pow(Math.abs(p.getX(i)) / 0.66, 2));
  const uv = g.getAttribute('uv');
  for (let i = 0; i < p.count; i++)
    uv.setXY(i, (p.getX(i) + 0.68) / 1.36, (p.getY(i) - 0.08) / 0.21);
  g.computeVertexNormals();
  return g;
}

export function createKart(): KartModel {
  const root = new T.Group();
  root.name = 'Kartwerkz_BlueBody_RedChassis';
  root.userData = {
    units: 'metres',
    reference:
      'Visual approximation from photos and public X30 model previews; not the uploaded ZIP',
    forward: '+Z',
    revision: 2,
  };
  const standard = (color: string, metalness = 0, roughness = 0.5) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const red = standard('#b40921', 0.38, 0.29),
    alloy = standard('#a0a7ad', 0.85, 0.27);
  const dark = standard('#16191c', 0.25, 0.38),
    rubber = standard('#17181a', 0.0, 0.84);
  const gold = standard('#555354', 0.7, 0.3),
    seatMat = standard('#202326', 0.16, 0.45);
  seatMat.side = T.DoubleSide;
  const mesh = (name: string, g: T.BufferGeometry, mat: T.Material, parent: T.Object3D = root) => {
    const m = new T.Mesh(g, mat);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  function tube(
    name: string,
    points: V3[],
    radius = 0.015,
    mat: T.Material = red,
    parent: T.Object3D = root,
  ) {
    const path = new T.CatmullRomCurve3(points.map(v), false, 'centripetal');
    return mesh(
      name,
      new T.TubeGeometry(path, Math.max(16, points.length * 8), radius, 10, false),
      mat,
      parent,
    );
  }
  function rod(
    name: string,
    a: V3,
    b: V3,
    radius: number,
    mat: T.Material,
    parent: T.Object3D = root,
  ) {
    const direction = v(b).sub(v(a));
    const m = mesh(
      name,
      new T.CylinderGeometry(radius, radius, direction.length(), 16),
      mat,
      parent,
    );
    m.position.copy(v(a).add(v(b)).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
    return m;
  }
  function box(name: string, size: V3, position: V3, mat: T.Material, parent: T.Object3D = root) {
    const m = mesh(name, new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.15), mat, parent);
    m.position.set(...position);
    return m;
  }
  const panels = {} as KartModel['panels'];
  const panel = (name: PanelName, g: T.BufferGeometry, color = '#146ce0') => {
    const mat = new T.MeshPhysicalMaterial({
      color,
      metalness: 0.06,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.19,
      side: T.DoubleSide,
    });
    const m = mesh(name, g, mat) as KartModel['panels'][PanelName];
    m.userData = { configurable: true, panel: name };
    panels[name] = m;
    return m;
  };
  panel('front-bumper', frontBumper());
  panel('nassau-panel', nassauPanel());
  panel('sidepod-left', sidepod(-1));
  panel('sidepod-right', sidepod(1));
  const rear = panel('rear-bumper', rearBumper(), '#22262a');
  rear.userData.baseColor = '#22262a';
  // Chassis rails and front yoke: visible through the space between the plastics.
  for (const side of [-1, 1]) {
    tube(
      'chassis-main-' + side,
      [
        [side * 0.29, 0.135, -0.73],
        [side * 0.34, 0.135, -0.47],
        [side * 0.335, 0.135, -0.16],
        [side * 0.3, 0.135, 0.08],
        [side * 0.255, 0.135, 0.34],
        [side * 0.355, 0.15, 0.49],
      ],
      0.016,
    );
    tube(
      'chassis-outer-' + side,
      [
        [side * 0.29, 0.135, -0.66],
        [side * 0.425, 0.14, -0.42],
        [side * 0.425, 0.14, -0.02],
        [side * 0.34, 0.14, 0.27],
        [side * 0.35, 0.15, 0.48],
      ],
      0.016,
    );
    tube(
      'sidepod-mount-' + side,
      [
        [side * 0.34, 0.16, -0.48],
        [side * 0.49, 0.16, -0.48],
        [side * 0.56, 0.16, -0.36],
        [side * 0.56, 0.16, 0.17],
        [side * 0.43, 0.16, 0.21],
        [side * 0.32, 0.16, 0.19],
      ],
      0.009,
      alloy,
    );
    rod('front-stub-' + side, [side * 0.25, 0.15, 0.49], [side * 0.51, 0.14, 0.46], 0.017, red);
    tube(
      'bumper-mount-' + side,
      [
        [side * 0.26, 0.145, 0.44],
        [side * 0.24, 0.15, 0.73],
        [side * 0.43, 0.145, 0.82],
      ],
      0.01,
      alloy,
    );
    rod('seat-stay-' + side, [side * 0.32, 0.14, -0.52], [side * 0.16, 0.34, -0.39], 0.011, alloy);
    rod(
      'rear-bumper-stay-' + side,
      [side * 0.27, 0.16, -0.615],
      [side * 0.38, 0.22, -0.87],
      0.012,
      dark,
    );
  }
  rod('chassis-front-cross', [-0.34, 0.15, 0.49], [0.34, 0.15, 0.49], 0.016, red);
  rod('chassis-rear-cross', [-0.32, 0.135, -0.57], [0.32, 0.135, -0.57], 0.016, red);
  box('floor-tray', [0.52, 0.008, 0.72], [0, 0.112, 0.13], standard('#2a2e32', 0.25, 0.58));
  // Moulded fuel tank and ridged cap below the steering column.
  const tankMat = standard('#dbdfd5', 0.02, 0.43);
  const tank = mesh('fuel-tank', new RoundedBoxGeometry(0.22, 0.255, 0.25, 4, 0.027), tankMat);
  tank.position.set(0, 0.248, 0.03);
  tank.rotation.x = -0.06;
  rod('fuel-cap', [0, 0.368, 0.04], [0, 0.397, 0.04], 0.028, dark);
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI) / 9;
    rod(
      'fuel-cap-rib',
      [0.028 * Math.sin(a), 0.373, 0.04 + 0.028 * Math.cos(a)],
      [0.028 * Math.sin(a), 0.39, 0.04 + 0.028 * Math.cos(a)],
      0.0017,
      dark,
    );
  }
  // Rear axle, hubs and bearings.
  rod('rear-axle', [-0.64, 0.145, -0.615], [0.64, 0.145, -0.615], 0.022, alloy);
  for (const x of [-0.28, 0.28]) {
    box('bearing-carrier', [0.08, 0.08, 0.072], [x, 0.141, -0.615], dark);
  }
  // Tyres: lathed profile gives flat tread and rounded shoulders, not torus tyres.
  function wheel(x: number, z: number, width: number, radius: number) {
    const assembly = new T.Group();
    assembly.name = 'wheel-' + x + '-' + z;
    assembly.position.set(x, radius, z);
    assembly.rotation.z = Math.PI / 2;
    root.add(assembly);
    const w = width / 2;
    const profile = [
      [0.078, -w],
      [radius * 0.84, -w],
      [radius * 0.96, -w * 0.84],
      [radius, -w * 0.55],
      [radius, w * 0.55],
      [radius * 0.96, w * 0.84],
      [radius * 0.84, w],
      [0.078, w],
      [0.074, w * 0.85],
      [0.074, -w * 0.85],
      [0.078, -w],
    ];
    mesh(
      'slick-tyre',
      new T.LatheGeometry(
        profile.map(([r, y]) => new T.Vector2(r, y)),
        48,
      ),
      rubber,
      assembly,
    );
    mesh(
      'wheel-barrel',
      new T.CylinderGeometry(0.071, 0.071, width - 0.025, 40, 1, true),
      gold,
      assembly,
    );
    for (const sign of [-1, 1]) {
      const rim = mesh('rim-lip', new T.TorusGeometry(0.073, 0.004, 8, 40), alloy, assembly);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = sign * (w - 0.009);
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        rod(
          'rim-spoke',
          [0.014 * Math.sin(a), sign * (w - 0.03), 0.014 * Math.cos(a)],
          [0.06 * Math.sin(a), sign * (w - 0.025), 0.06 * Math.cos(a)],
          0.008,
          gold,
          assembly,
        );
      }
      rod('hub', [0, sign * (w - 0.02), 0], [0, sign * (w + 0.012), 0], 0.025, alloy, assembly);
    }
  }
  wheel(-0.55, 0.43, 0.139, 0.143);
  wheel(0.55, 0.43, 0.139, 0.143);
  wheel(-0.56, -0.615, 0.215, 0.145);
  wheel(0.56, -0.615, 0.215, 0.145);
  // Steering tie rods, uprights and an inclined steering wheel.
  for (const side of [-1, 1]) {
    rod('kingpin', [side * 0.445, 0.105, 0.455], [side * 0.445, 0.22, 0.455], 0.013, alloy);
    rod('tie-rod', [side * 0.07, 0.18, 0.3], [side * 0.448, 0.18, 0.403], 0.005, alloy);
    box('pedal', [0.065, 0.016, 0.085], [side * 0.155, 0.16, 0.46], alloy);
  }
  rod('steering-column', [0, 0.17, 0.36], [0, 0.52, -0.115], 0.0105, alloy);
  const steer = new T.Group();
  steer.name = 'steering-wheel';
  steer.position.set(0, 0.52, -0.115);
  steer.rotation.x = -0.64;
  root.add(steer);
  const rim = mesh('steering-grip', new T.TorusGeometry(0.153, 0.013, 12, 64), dark, steer);
  rim.scale.y = 0.87;
  for (const a of [Math.PI / 6, (Math.PI * 5) / 6, Math.PI * 1.5])
    rod(
      'steering-spoke',
      [0, 0, 0],
      [Math.cos(a) * 0.139, Math.sin(a) * 0.122, 0],
      0.012,
      alloy,
      steer,
    );
  box('steering-hub', [0.061, 0.047, 0.022], [0, 0, 0.005], dark, steer);
  box('dash', [0.084, 0.046, 0.025], [0, 0.037, 0.022], dark, steer);
  box(
    'dash-display',
    [0.062, 0.029, 0.002],
    [0, 0.037, 0.036],
    standard('#799691', 0.15, 0.25),
    steer,
  );
  // Open bucket seat: floor, curved sides and tall rear shell.
  const seat = new T.Group();
  seat.name = 'bucket-seat';
  seat.position.set(-0.035, 0, -0.355);
  root.add(seat);
  const sg = new T.BufferGeometry(),
    sp: number[] = [],
    si: number[] = [],
    suv: number[] = [];
  const rings = 18,
    sides = 64;
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j <= sides; j++) {
      const t = i / rings,
        a = (j / sides) * Math.PI * 2;
      const back = Math.max(0, -Math.cos(a));
      const height = 0.215 + 0.345 * smoothstep(0.05, 0.58, back);
      sp.push(
        Math.sin(a) * (0.116 + 0.077 * t),
        0.145 + t * (height - 0.145),
        Math.cos(a) * (0.135 + 0.11 * t) - 0.065 * t,
      );
      suv.push(j / sides, i / rings);
    }
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      si.push(a, b, a + 1, b, b + 1, a + 1);
    }
  sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  sg.setAttribute('uv', new T.Float32BufferAttribute(suv, 2));
  sg.setIndex(si);
  sg.computeVertexNormals();
  mesh('seat-shell', sg, seatMat, seat);
  const base = mesh('seat-base', new T.SphereGeometry(1, 32, 12), seatMat, seat);
  base.position.y = 0.145;
  base.scale.set(0.119, 0.013, 0.139);
  const lip: V3[] = [];
  for (let j = 0; j <= 64; j++) {
    const a = (j / 64) * Math.PI * 2;
    lip.push([
      Math.sin(a) * 0.193,
      0.215 + 0.345 * smoothstep(0.05, 0.58, Math.max(0, -Math.cos(a))),
      Math.cos(a) * 0.245 - 0.065,
    ]);
  }
  tube('seat-rim', lip, 0.006, seatMat, seat);
  // Water-cooled two-stroke silhouette: crankcase, head, intake, expansion chamber.
  const engine = new T.Group();
  engine.name = 'X30-style-engine';
  root.add(engine);
  rod('crankcase', [0.27, 0.245, -0.47], [0.41, 0.245, -0.47], 0.079, alloy, engine);
  rod('clutch-cover', [0.41, 0.245, -0.47], [0.443, 0.245, -0.47], 0.078, dark, engine);
  box('engine-block', [0.125, 0.105, 0.14], [0.335, 0.34, -0.46], alloy, engine);
  const head = mesh(
    'cylinder-head',
    new RoundedBoxGeometry(0.137, 0.1, 0.145, 4, 0.035),
    alloy,
    engine,
  );
  head.position.set(0.335, 0.427, -0.46);
  for (let i = 0; i < 7; i++)
    box('head-cooling-rib', [0.141, 0.004, 0.15], [0.335, 0.39 + i * 0.012, -0.46], alloy, engine);
  for (const x of [0.292, 0.378])
    for (const z of [-0.508, -0.412])
      rod('head-bolt', [x, 0.465, z], [x, 0.48, z], 0.007, dark, engine);
  rod('spark-plug', [0.335, 0.477, -0.46], [0.335, 0.512, -0.46], 0.01, tankMat, engine);
  tube(
    'ignition-lead',
    [
      [0.335, 0.51, -0.46],
      [0.39, 0.52, -0.45],
      [0.4, 0.36, -0.53],
    ],
    0.004,
    dark,
  );
  rod('carburettor', [0.335, 0.278, -0.39], [0.335, 0.268, -0.286], 0.025, alloy);
  const airbox = mesh('airbox', new RoundedBoxGeometry(0.135, 0.094, 0.18, 4, 0.035), dark);
  airbox.position.set(0.335, 0.231, -0.216);
  for (const x of [0.312, 0.358])
    rod('intake-trumpet', [x, 0.269, -0.232], [x, 0.29, -0.176], 0.014, dark);
  const pipeMat = standard('#393330', 0.7, 0.38);
  tube(
    'exhaust-header',
    [
      [0.3, 0.355, -0.52],
      [0.25, 0.32, -0.61],
      [0.18, 0.27, -0.67],
      [0.07, 0.26, -0.69],
    ],
    0.02,
    pipeMat,
  );
  const exp = mesh('expansion-chamber', new T.CylinderGeometry(0.035, 0.066, 0.27, 32), pipeMat);
  exp.rotation.z = Math.PI / 2;
  exp.position.set(-0.07, 0.26, -0.69);
  rod('exhaust-silencer', [-0.21, 0.26, -0.69], [-0.37, 0.26, -0.69], 0.042, dark);
  rod('exhaust-outlet', [-0.37, 0.26, -0.69], [-0.409, 0.265, -0.69], 0.014, alloy);
  // Tall radiator on the opposite side of the seat, with a visible fin matrix.
  const rad = new T.Group();
  rad.name = 'radiator';
  rad.position.set(-0.335, 0.355, -0.34);
  rad.rotation.x = -0.18;
  rad.rotation.z = -0.08;
  root.add(rad);
  box('radiator-core', [0.192, 0.346, 0.031], [0, 0, 0], standard('#545e62', 0.7, 0.48), rad);
  for (let i = 0; i <= 23; i++)
    box(
      'radiator-vertical-fin',
      [0.003, 0.331, 0.007],
      [-0.087 + i * 0.0076, 0, 0.019],
      alloy,
      rad,
    );
  for (let i = 0; i <= 36; i++)
    box(
      'radiator-horizontal-fin',
      [0.178, 0.0015, 0.006],
      [0, -0.158 + i * 0.0088, 0.024],
      dark,
      rad,
    );
  for (const x of [-0.104, 0.104])
    box('radiator-side-tank', [0.018, 0.372, 0.048], [x, 0, 0], alloy, rad);
  for (const y of [-0.182, 0.182])
    box('radiator-header', [0.22, 0.027, 0.052], [0, y, 0], alloy, rad);
  rod('radiator-cap', [0.04, 0.192, 0], [0.04, 0.214, 0], 0.019, dark, rad);
  for (const z of [-0.45, -0.27])
    rod('radiator-bracket', [-0.31, 0.15, z], [-0.335, 0.29, z], 0.008, alloy);
  const hoseMat = standard('#164355', 0.05, 0.48);
  tube(
    'coolant-hose-upper',
    [
      [-0.29, 0.5, -0.32],
      [-0.28, 0.48, -0.52],
      [-0.24, 0.35, -0.7],
      [0.12, 0.32, -0.72],
      [0.29, 0.35, -0.51],
    ],
    0.011,
    hoseMat,
  );
  tube(
    'coolant-hose-lower',
    [
      [-0.37, 0.18, -0.3],
      [-0.29, 0.145, -0.24],
      [0.23, 0.16, -0.28],
      [0.34, 0.25, -0.44],
    ],
    0.01,
    hoseMat,
  );
  rod('brake-disc', [-0.22, 0.145, -0.615], [-0.211, 0.145, -0.615], 0.081, alloy);
  box(
    'brake-caliper',
    [0.054, 0.068, 0.07],
    [-0.216, 0.201, -0.618],
    standard('#3b3d40', 0.6, 0.33),
  );
  rod('drive-sprocket', [0.385, 0.145, -0.615], [0.395, 0.145, -0.615], 0.083, gold);
  tube(
    'chain',
    [
      [0.401, 0.226, -0.615],
      [0.401, 0.291, -0.47],
      [0.401, 0.207, -0.43],
      [0.401, 0.064, -0.595],
      [0.401, 0.07, -0.66],
      [0.401, 0.226, -0.615],
    ],
    0.004,
    dark,
  );
  tube(
    'nassau-support',
    [
      [-0.1, 0.18, 0.27],
      [-0.1, 0.36, 0.11],
      [-0.08, 0.54, -0.01],
    ],
    0.007,
    alloy,
  );
  tube(
    'nassau-support',
    [
      [0.1, 0.18, 0.27],
      [0.1, 0.36, 0.11],
      [0.08, 0.54, -0.01],
    ],
    0.007,
    alloy,
  );
  root.updateMatrixWorld(true);
  return {
    root,
    panels,
    dispose() {
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      root.traverse((o) => {
        if (o instanceof T.Mesh) {
          geometries.add(o.geometry);
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
