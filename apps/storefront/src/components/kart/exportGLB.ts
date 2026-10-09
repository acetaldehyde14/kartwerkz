import type { Object3D } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

export async function exportGLB(object: Object3D): Promise<ArrayBuffer> {
  object.updateMatrixWorld(true);
  const result = await new GLTFExporter().parseAsync(object, { binary: true, onlyVisible: true });
  if (!(result instanceof ArrayBuffer)) throw new Error('Expected binary GLB output.');
  return result;
}
export async function downloadGLB(object: Object3D) {
  const data = await exportGLB(object);
  const url = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kartwerkz-custom-kart.glb';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
