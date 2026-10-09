import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

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

function frontBumper() {
  return sweep(100, 32, (u, a) => {
    const x = (u * 2 - 1) * 0.705,
      edge = Math.pow(Math.abs(x) / 0.705, 2.5);
    // Ends sweep rearward and rise. Broad, moulded crescent rather than a tube.
    const z = 0.918 - 0.265 * edge;
    const y = 0.164 + 0.067 * edge;
    const halfDepth = 0.128 - 0.067 * Math.pow(edge, 1.5);
    const halfHeight = 0.078 + 0.01 * edge;
    return [x, y - halfHeight * Math.cos(a), z - halfDepth * Math.sin(a)];
  });
}

function sidepod(side: number) {
  return sweep(64, 28, (u, a) => {
    const z = -0.56 + u * 0.91;
    const taper = Math.pow(Math.sin(Math.PI * u), 0.45);
    const w = 0.016 + 0.053 * taper;
    const h = 0.022 + 0.093 * taper;
    return [
      side * (0.599 + 0.014 * Math.sin(u * Math.PI)) + w * Math.sin(a),
      0.214 - h * Math.cos(a),
      z,
    ];
  });
}

/** Extruded outline with an actual through-hole, bent onto a rising fairing.
 * All triangles are subdivided before bending so the long surface stays smooth. */
function nassauPanel() {
  const s = new T.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.12, 0, -0.19, 0.1, -0.184, 0.24);
  s.bezierCurveTo(-0.18, 0.39, -0.135, 0.57, -0.124, 0.75);
  s.bezierCurveTo(-0.124, 0.84, -0.09, 0.87, 0, 0.87);
  s.bezierCurveTo(0.09, 0.87, 0.124, 0.84, 0.124, 0.75);
  s.bezierCurveTo(0.135, 0.57, 0.18, 0.39, 0.184, 0.24);
  s.bezierCurveTo(0.19, 0.1, 0.12, 0, 0, 0);
  const hole = new T.Path();
  hole.absellipse(0, 0.38, 0.079, 0.106, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const handle = new T.Path();
  handle.absellipse(0, 0.796, 0.066, 0.014, 0, Math.PI * 2, true);
  s.holes.push(handle);
  const original = new T.ExtrudeGeometry(s, {
    depth: 0.013,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 32,
  });
  const pos = original.getAttribute('position');
  const points: number[] = [],
    uvs: number[] = [];
  const project = (x: number, t: number, depth: number): V3 => [
    x,
    0.234 +
      0.42 * (t / 0.87) +
      0.045 * Math.sin((t / 0.87) * Math.PI) +
      0.033 * (1 - Math.pow(x / 0.2, 2)) +
      depth,
    0.838 - t,
  ];
  const add = (p: T.Vector3) => {
    points.push(...project(p.x, p.y, p.z));
    // Planar template: left/right in U, nose at V=0, steering end at V=1.
    uvs.push((p.x + 0.2) / 0.4, p.y / 0.87);
  };
  function subdiv(a: T.Vector3, b: T.Vector3, c: T.Vector3, depth: number) {
    if (!depth) {
      add(a);
      add(b);
      add(c);
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5),
      bc = b.clone().add(c).multiplyScalar(0.5),
      ca = c.clone().add(a).multiplyScalar(0.5);
    subdiv(a, ab, ca, depth - 1);
    subdiv(ab, b, bc, depth - 1);
    subdiv(ca, bc, c, depth - 1);
    subdiv(ab, bc, ca, depth - 1);
  }
  for (let i = 0; i < pos.count; i += 3)
    subdiv(
      new T.Vector3().fromBufferAttribute(pos, i),
      new T.Vector3().fromBufferAttribute(pos, i + 1),
      new T.Vector3().fromBufferAttribute(pos, i + 2),
      2,
    );
  original.dispose();
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  const smooth = mergeVertices(g, 0.00001);
  g.dispose();
  smooth.computeVertexNormals();
  return smooth;
}

export function createKart(): KartModel {
  const root = new T.Group();
  root.name = 'Kartwerkz_BlueBody_RedChassis';
  root.userData = {
    units: 'metres',
    reference: 'User-supplied photos; approximate geometry',
    forward: '+Z',
  };
  const standard = (color: string, metalness = 0, roughness = 0.5) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const red = standard('#cc142b', 0.45, 0.28),
    alloy = standard('#b6bcc2', 0.82, 0.27);
  const dark = standard('#16191c', 0.25, 0.38),
    rubber = standard('#17181a', 0.0, 0.84);
  const gold = standard('#998155', 0.73, 0.32),
    seatMat = standard('#bfc4c5', 0.35, 0.35);
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
    const m = mesh(name, new T.BoxGeometry(...size), mat, parent);
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
  const rear = panel(
    'rear-bumper',
    sweep(64, 20, (u, a) => {
      const x = (u * 2 - 1) * 0.65;
      return [
        x,
        0.22 - (0.036 + 0.012 * Math.cos(x * 5)) * Math.cos(a),
        -0.88 - 0.025 * Math.sin(a) + 0.034 * Math.pow(Math.abs(x) / 0.65, 4),
      ];
    }),
    '#22262a',
  );
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
      [side * 0.27, 0.16, -0.65],
      [side * 0.38, 0.22, -0.87],
      0.012,
      dark,
    );
  }
  rod('chassis-front-cross', [-0.34, 0.15, 0.49], [0.34, 0.15, 0.49], 0.016, red);
  rod('chassis-rear-cross', [-0.32, 0.135, -0.57], [0.32, 0.135, -0.57], 0.016, red);
  box('floor-tray', [0.54, 0.007, 0.78], [0, 0.125, 0.08], standard('#60676b', 0.6, 0.45));
  // Fuel tank: translucent cream moulding, centrally under the steering column.
  const tank = mesh(
    'fuel-tank',
    new T.SphereGeometry(1, 24, 16),
    new T.MeshPhysicalMaterial({
      color: '#e4dfc5',
      roughness: 0.38,
      transparent: true,
      opacity: 0.85,
    }),
  );
  tank.scale.set(0.104, 0.135, 0.14);
  tank.position.set(0, 0.255, 0.08);
  rod('fuel-cap', [0, 0.365, 0.07], [0, 0.389, 0.07], 0.027, dark);
  // Rear axle, hubs and bearings.
  rod('rear-axle', [-0.64, 0.139, -0.65], [0.64, 0.139, -0.65], 0.022, alloy);
  for (const x of [-0.28, 0.28]) {
    box('bearing-carrier', [0.08, 0.08, 0.072], [x, 0.141, -0.65], dark);
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
    rod('wheel-barrel', [0, -w + 0.01, 0], [0, w - 0.01, 0], 0.077, gold, assembly);
    for (const sign of [-1, 1]) {
      const rim = mesh('rim-lip', new T.TorusGeometry(0.077, 0.005, 8, 40), alloy, assembly);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = sign * (w - 0.009);
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        rod(
          'rim-spoke',
          [0.014 * Math.sin(a), sign * (w - 0.01), 0.014 * Math.cos(a)],
          [0.067 * Math.sin(a), sign * (w - 0.013), 0.067 * Math.cos(a)],
          0.008,
          gold,
          assembly,
        );
      }
      rod('hub', [0, sign * (w - 0.02), 0], [0, sign * (w + 0.012), 0], 0.025, alloy, assembly);
    }
  }
  wheel(-0.565, 0.455, 0.133, 0.135);
  wheel(0.565, 0.455, 0.133, 0.135);
  wheel(-0.56, -0.65, 0.205, 0.139);
  wheel(0.56, -0.65, 0.205, 0.139);
  // Steering tie rods, uprights and an inclined steering wheel.
  for (const side of [-1, 1]) {
    rod('kingpin', [side * 0.445, 0.105, 0.455], [side * 0.445, 0.22, 0.455], 0.013, alloy);
    rod('tie-rod', [side * 0.07, 0.18, 0.3], [side * 0.448, 0.18, 0.403], 0.005, alloy);
    box('pedal', [0.065, 0.016, 0.085], [side * 0.155, 0.16, 0.46], alloy);
  }
  rod('steering-column', [0, 0.17, 0.36], [0, 0.55, -0.12], 0.01, alloy);
  const steer = new T.Group();
  steer.name = 'steering-wheel';
  steer.position.set(0, 0.545, -0.1);
  steer.rotation.x = -0.64;
  root.add(steer);
  const rim = mesh('steering-grip', new T.TorusGeometry(0.132, 0.014, 12, 48), dark, steer);
  rim.scale.y = 0.87;
  for (const a of [Math.PI / 6, (Math.PI * 5) / 6, Math.PI * 1.5])
    rod(
      'steering-spoke',
      [0, 0, 0],
      [Math.cos(a) * 0.12, Math.sin(a) * 0.105, 0],
      0.012,
      alloy,
      steer,
    );
  box('steering-hub', [0.061, 0.047, 0.022], [0, 0, 0.005], dark, steer);
  box('dash', [0.069, 0.032, 0.023], [0, 0.097, 0.016], dark, steer);
  box(
    'dash-display',
    [0.052, 0.018, 0.002],
    [0, 0.097, 0.029],
    standard('#799691', 0.15, 0.25),
    steer,
  );
  // Open bucket seat: floor, curved sides and tall rear shell.
  const seat = new T.Group();
  seat.name = 'bucket-seat';
  seat.position.set(-0.03, 0, -0.35);
  root.add(seat);
  const sg = new T.BufferGeometry(),
    sp: number[] = [],
    si: number[] = [];
  const rings = 18,
    sides = 64;
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j <= sides; j++) {
      const t = i / rings,
        a = (j / sides) * Math.PI * 2;
      const back = Math.max(0, -Math.cos(a));
      const height = 0.205 + 0.265 * Math.pow(back, 2);
      sp.push(
        Math.sin(a) * (0.105 + 0.065 * t),
        0.145 + t * (height - 0.145),
        Math.cos(a) * (0.105 + 0.09 * t) - 0.05 * t,
      );
    }
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      si.push(a, b, a + 1, b, b + 1, a + 1);
    }
  sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
  sg.setIndex(si);
  sg.computeVertexNormals();
  mesh('seat-shell', sg, seatMat, seat);
  const base = mesh('seat-base', new T.SphereGeometry(1, 32, 12), seatMat, seat);
  base.position.y = 0.145;
  base.scale.set(0.11, 0.013, 0.112);
  const lip: V3[] = [];
  for (let j = 0; j <= 64; j++) {
    const a = (j / 64) * Math.PI * 2;
    lip.push([
      Math.sin(a) * 0.17,
      0.205 + 0.265 * Math.pow(Math.max(0, -Math.cos(a)), 2),
      Math.cos(a) * 0.195 - 0.05,
    ]);
  }
  tube('seat-rim', lip, 0.006, seatMat, seat);
  // Simplified engine/drivetrain, placed on the right of the seat.
  box('engine-crankcase', [0.17, 0.13, 0.21], [0.34, 0.24, -0.48], alloy);
  box('cylinder-block', [0.115, 0.14, 0.13], [0.34, 0.36, -0.48], dark);
  for (let i = 0; i < 8; i++)
    box('cooling-fin', [0.143, 0.007, 0.153], [0.34, 0.303 + i * 0.016, -0.48], alloy);
  rod('spark-plug', [0.34, 0.43, -0.48], [0.34, 0.478, -0.48], 0.012, seatMat);
  const airbox = mesh('airbox', new T.SphereGeometry(1, 24, 16), dark);
  airbox.position.set(0.37, 0.265, -0.2);
  airbox.scale.set(0.093, 0.09, 0.137);
  tube(
    'exhaust-header',
    [
      [0.39, 0.38, -0.51],
      [0.46, 0.32, -0.56],
      [0.43, 0.27, -0.72],
      [0.23, 0.3, -0.77],
    ],
    0.025,
    standard('#57504a', 0.75, 0.42),
  );
  rod('silencer', [0.2, 0.3, -0.77], [-0.05, 0.3, -0.77], 0.038, dark);
  rod('brake-disc', [-0.22, 0.139, -0.65], [-0.21, 0.139, -0.65], 0.083, alloy);
  box('brake-caliper', [0.054, 0.065, 0.07], [-0.214, 0.202, -0.655], dark);
  rod('drive-sprocket', [0.385, 0.139, -0.65], [0.397, 0.139, -0.65], 0.091, gold);
  tube(
    'chain',
    [
      [0.398, 0.222, -0.65],
      [0.398, 0.247, -0.48],
      [0.398, 0.188, -0.43],
      [0.398, 0.064, -0.63],
      [0.398, 0.075, -0.69],
      [0.398, 0.222, -0.65],
    ],
    0.004,
    dark,
  );
  // Black recessed duct behind the central bodywork opening; the hole stays open.
  tube(
    'nassau-support',
    [
      [-0.11, 0.2, 0.33],
      [-0.11, 0.43, 0.1],
      [-0.09, 0.6, -0.01],
    ],
    0.007,
    dark,
  );
  tube(
    'nassau-support',
    [
      [0.11, 0.2, 0.33],
      [0.11, 0.43, 0.1],
      [0.09, 0.6, -0.01],
    ],
    0.007,
    dark,
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
