'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BomRow } from '@/types';

const SCALE = 0.01; // 1 unit = 100 mm
const DEFAULT_SIZE = 2;
const EXPLODE_SPACING = 4;
const PART_COLOR = 0xd97706; // amber

interface TreeNode {
  row: BomRow;
  children: TreeNode[];
}

function buildTree(rows: BomRow[]): TreeNode[] {
  const byParent = new Map<string | null, BomRow[]>();
  for (const r of rows) {
    const p = r.parentId ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(r);
  }
  function build(parentId: string | null): TreeNode[] {
    const list = byParent.get(parentId) ?? [];
    return list.map((r) => ({ row: r, children: build(r.id) }));
  }
  return build(null);
}

function parseDim(v: string | number | undefined): number {
  const n = parseFloat(String(v ?? '')) || 0;
  return n * SCALE || DEFAULT_SIZE * SCALE;
}

function createPartMesh(row: BomRow): THREE.Mesh {
  const w = Math.max(0.1, parseDim(row.dimAP));
  const h = Math.max(0.1, parseDim(row.dimAT));
  const d = Math.max(0.1, parseDim(row.dimAL));
  const geom = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color: PART_COLOR,
    metalness: 0.1,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

function addSubmodulToGroup(
  node: TreeNode,
  parent: THREE.Group,
  baseX: number,
  baseZ: number,
  explode: number,
  level: number,
) {
  const partNodes = node.children.filter((c) => c.row.levelNum === 2);
  let offsetX = 0;
  for (const p of partNodes) {
    const w = parseDim(p.row.dimAP) || DEFAULT_SIZE * SCALE;
    const mesh = createPartMesh(p.row);
    const centerX = offsetX + w / 2;
    const shift = centerX * (1 + explode * 0.5);
    mesh.position.set(shift, 0, 0);
    parent.add(mesh);
    offsetX += w + 0.15 * (1 + explode * 2);
  }
  const submodulOffset = explode * EXPLODE_SPACING * (level + 1);
  parent.position.set(baseX + submodulOffset, 0, baseZ);
}

function collectPartNodes(node: TreeNode, path: number[] = [], collector: Array<{ row: BomRow; path: number[] }> = []) {
  if (node.row.levelNum === 2) {
    collector.push({ row: node.row, path });
  }
  node.children.forEach((child, index) => collectPartNodes(child, [...path, index], collector));
  return collector;
}

function buildAssemblyGroup(bomRows: BomRow[], explode: number): THREE.Group {
  const tree = buildTree(bomRows);
  const roots = tree.filter((n) => n.row.levelNum === 0);
  const root = new THREE.Group();

  if (roots.length === 0) {
    const geom = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true });
    const mesh = new THREE.Mesh(geom, mat);
    root.add(mesh);
    return root;
  }

  roots.forEach((moduleNode, moduleIndex) => {
    const moduleGroup = new THREE.Group();
    const partNodes = collectPartNodes(moduleNode);

    let xOffset = 0;
    partNodes.forEach((part, index) => {
      const mesh = createPartMesh(part.row);
      const width = parseDim(part.row.dimAP) || DEFAULT_SIZE * SCALE;
      const height = parseDim(part.row.dimAT) || DEFAULT_SIZE * SCALE;
      const layer = part.path.length;
      const branchIndex = part.path[0] ?? 0;
      const localIndex = part.path[1] ?? index;
      const zOffset = localIndex * (0.8 + explode * 2.2);
      const yOffset = layer * explode * 0.9 + height / 2;
      const explodeShiftX = branchIndex * explode * EXPLODE_SPACING * 0.9;

      mesh.position.set(xOffset + width / 2 + explodeShiftX, yOffset, zOffset);
      moduleGroup.add(mesh);
      xOffset += width + 0.2 + explode * 0.4;
    });

    if (partNodes.length === 0) {
      const placeholder = createPartMesh(moduleNode.row);
      placeholder.position.set(0, 0.5, 0);
      moduleGroup.add(placeholder);
    }

    moduleGroup.position.set(moduleIndex * (6 + explode * EXPLODE_SPACING * 2), 0, 0);
    root.add(moduleGroup);
  });

  return root;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material?.dispose();
    }
  });
}

export interface Assembly3DViewerProps {
  bomRows: BomRow[];
  className?: string;
}

export function Assembly3DViewer({ bomRows, className = '' }: Assembly3DViewerProps) {
  const [explode, setExplode] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    assemblyGroup: THREE.Group;
    frameId: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0); // slate-200 — tema cerah
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 8, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(10, 15, 10);
    scene.add(dir);

    const groundGeom = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.minDistance = 3;
    controls.maxDistance = 80;

    const assemblyGroup = buildAssemblyGroup(bomRows, explode);
    scene.add(assemblyGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      assemblyGroup,
      frameId: 0,
    };

    let frameId = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    sceneRef.current.frameId = frameId;

    const onResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 400;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(sceneRef.current?.frameId ?? 0);
      if (sceneRef.current) {
        disposeGroup(sceneRef.current.assemblyGroup);
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
        if (container.contains(sceneRef.current.renderer.domElement)) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        groundGeom.dispose();
        groundMat.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update assembly when bomRows or explode change
  useEffect(() => {
    const ref = sceneRef.current;
    if (!ref) return;
    ref.scene.remove(ref.assemblyGroup);
    disposeGroup(ref.assemblyGroup);
    const newGroup = buildAssemblyGroup(bomRows, explode);
    ref.assemblyGroup = newGroup;
    ref.scene.add(newGroup);
  }, [bomRows, explode]);

  return (
    <div className={`flex flex-col h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-white ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-800">Skenario Perakitan 3D</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Part → Sub Modul → Modul → Produk
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <span>Rakit</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explode}
              onChange={(e) => setExplode(parseFloat(e.target.value))}
              className="w-28 h-1.5 rounded-full appearance-none bg-slate-200 accent-sky-600"
            />
            <span>Pisah</span>
          </label>
          <span className="text-[10px] text-slate-500 tabular-nums">{Math.round(explode * 100)}%</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-[400px] w-full bg-slate-200" />
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Modul</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Sub Modul</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Part</span>
        <span className="ml-auto">Geser slider untuk melihat pemisahan komponen</span>
      </div>
    </div>
  );
}
