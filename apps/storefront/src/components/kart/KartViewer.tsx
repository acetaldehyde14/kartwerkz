'use client';
import {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createKart, type KartModel } from './createKart';
import { applyAppearance, DEFAULT_APPEARANCE, type KartAppearance } from './graphics';
import { downloadGLB } from './exportGLB';

export type ViewPreset = 'perspective' | 'top' | 'front' | 'side' | 'rear';
export interface KartViewerHandle {
  exportGLB: () => Promise<void>;
}
export interface KartViewerProps {
  appearance?: Partial<KartAppearance>;
  view?: ViewPreset;
  autoRotate?: boolean;
  className?: string;
  /**
   * Disable scroll-to-zoom — e.g. when the canvas fills a page section
   * whose scroll should drive something else (a pinned reveal animation)
   * rather than camera distance. Drag-to-orbit stays enabled. Default true.
   */
  enableZoom?: boolean;
  /** Called when geometry is ready; the viewer retains ownership. */
  onReady?: (model: KartModel) => void;
}
const POSITIONS: Record<ViewPreset, [number, number, number]> = {
  perspective: [2.1, 1.95, 2.7],
  top: [0, 3.8, 0.035],
  front: [0, 1.05, 3.65],
  side: [3.65, 1.1, 0],
  rear: [0, 1.2, -3.65],
};

function Scene({
  appearance,
  view,
  autoRotate,
  enableZoom,
  modelRef,
  onReady,
}: {
  appearance: KartAppearance;
  view: ViewPreset;
  autoRotate: boolean;
  enableZoom: boolean;
  modelRef: React.MutableRefObject<KartModel | null>;
  onReady?: (model: KartModel) => void;
}) {
  const { camera, gl, scene, invalidate, size } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const [model, setModel] = useState<KartModel | null>(null);
  useEffect(() => {
    const m = createKart();
    scene.add(m.root);
    modelRef.current = m;
    setModel(m);
    invalidate();
    readyRef.current?.(m);
    return () => {
      scene.remove(m.root);
      m.dispose();
      if (modelRef.current === m) modelRef.current = null;
    };
  }, [scene, modelRef, invalidate]);
  useEffect(() => {
    if (model) {
      const release = applyAppearance(model, appearance);
      invalidate();
      return release;
    }
  }, [model, appearance, invalidate]);
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    controls.current = orbit;
    orbit.target.set(0, 0.22, 0.02);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.minDistance = 1.6;
    orbit.maxDistance = 6;
    orbit.maxPolarAngle = Math.PI * 0.485;
    const changed = () => invalidate();
    orbit.enablePan = false;
    orbit.autoRotateSpeed = 0.65;
    orbit.addEventListener('change', changed);
    return () => {
      orbit.removeEventListener('change', changed);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    if (controls.current) controls.current.enableZoom = enableZoom;
  }, [enableZoom]);
  useEffect(() => {
    const target = new T.Vector3(0, 0.22, 0.02);
    const fit = Math.max(1, Math.min(1.8, 1.15 / (size.width / size.height)));
    camera.position
      .set(...POSITIONS[view])
      .sub(target)
      .multiplyScalar(fit)
      .add(target);
    camera.lookAt(target);
    controls.current?.update();
    invalidate();
  }, [view, camera, invalidate, size.width, size.height]);
  useEffect(() => {
    if (controls.current) controls.current.autoRotate = autoRotate;
    invalidate();
  }, [autoRotate, invalidate]);
  useEffect(() => {
    const room = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(gl);
    const target = pmrem.fromScene(room, 0.04);
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
    room.dispose();
    pmrem.dispose();
    invalidate();
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
      target.dispose();
    };
  }, [gl, scene, invalidate]);
  useFrame((_, delta) => {
    controls.current?.update(delta);
    if (autoRotate) invalidate();
  });
  return (
    <>
      <hemisphereLight args={['#f6f8ff', '#777f82', 0.6]} />
      <directionalLight
        position={[2, 4, 3]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-normalBias={0.018}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.7} color="#d6e4ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]} receiveShadow>
        {/* Kartwerkz is dark-themed throughout (see packages/ui/src/styles/tokens.css)
          — recoloured from the upstream kit's light-studio #d9dcd7 default. */}
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0f1012" roughness={0.95} />
      </mesh>
    </>
  );
}
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" style={{ padding: 24 }}>
        The 3D viewer could not start. Enable WebGL or try another browser.
      </div>
    ) : (
      this.props.children
    );
  }
}
const KartViewer = forwardRef<KartViewerHandle, KartViewerProps>(function KartViewer(
  { appearance, view = 'perspective', autoRotate = false, enableZoom = true, className, onReady },
  ref,
) {
  const modelRef = useRef<KartModel | null>(null);
  // Stable values supplied by the parent prevent unnecessary texture uploads.
  const [merged, setMerged] = useState<KartAppearance>({ ...DEFAULT_APPEARANCE, ...appearance });
  useEffect(() => setMerged({ ...DEFAULT_APPEARANCE, ...appearance }), [appearance]);
  useImperativeHandle(
    ref,
    () => ({
      async exportGLB() {
        if (!modelRef.current) throw new Error('The model is still loading.');
        await downloadGLB(modelRef.current.root);
      },
    }),
    [],
  );
  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 320 }}
      aria-label="Interactive 3D kart viewer"
    >
      <ViewerBoundary>
        <Canvas
          shadows
          frameloop="demand"
          dpr={[1, 1.75]}
          camera={{ position: POSITIONS.perspective, fov: 35, near: 0.05, far: 100 }}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0a0a0b');
            gl.toneMapping = T.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1;
          }}
          fallback={<p>WebGL is unavailable. Enable hardware acceleration to view the kart.</p>}
        >
          <Scene
            appearance={merged}
            view={view}
            autoRotate={autoRotate}
            enableZoom={enableZoom}
            modelRef={modelRef}
            onReady={onReady}
          />
        </Canvas>
      </ViewerBoundary>
    </div>
  );
});
export default KartViewer;
