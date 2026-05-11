import { useEffect, useMemo, useRef, useState } from "react";
import { Box, RotateCcw } from "lucide-react";
import * as THREE from "three";
import type { CartonFace, CartonFold, CartonTopology } from "../../geometry/topology/cartonTopology";
import type { Point, Polygon } from "../../types/geometry";

type Props = {
  topology: CartonTopology;
};

type FoldNode = {
  pivot: THREE.Object3D;
  face?: THREE.Mesh;
  axis: "x" | "z";
  targetAngle: number;
};

const flatTo3 = (point: Point, topology: CartonTopology): THREE.Vector3 =>
  new THREE.Vector3(point.x, 0, topology.bodyBottom - point.y);

const polygonShape = (polygon: Polygon, origin: THREE.Vector3, topology: CartonTopology): THREE.Shape => {
  const points = polygon.points.map((point) => flatTo3(point, topology).sub(origin));
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].z);
  points.slice(1).forEach((point) => shape.lineTo(point.x, point.z));
  shape.closePath();
  return shape;
};

const makeFaceMesh = (face: CartonFace, origin: THREE.Vector3, topology: CartonTopology): THREE.Mesh => {
  const geometry = new THREE.ShapeGeometry(polygonShape(face.polygon, origin.clone(), topology));
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    color: face.kind === "body" ? 0xf7fafb : face.kind === "glue" ? 0xffcf70 : face.kind === "tuck" ? 0xe9f2ff : 0xf2f7ff,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: face.kind === "glue" ? 0.72 : 0.94,
  });
  return new THREE.Mesh(geometry, material);
};

const addEdges = (mesh: THREE.Mesh): THREE.LineSegments => {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x1f2933, transparent: true, opacity: 0.5 }),
  );
  mesh.add(lines);
  return lines;
};

const axisKind = (fold: CartonFold): "x" | "z" => (fold.axisKind === "vertical-body" || fold.axisKind === "glue" ? "z" : "x");

const foldProgress = (progress: number, fold: CartonFold): number => {
  /*
   * Body folds close first, dust flaps follow, and tuck flaps close last. This
   * mirrors the physical closure order and exposes wrong hinge directions
   * early when testing the topology.
   */
  if (fold.axisKind === "vertical-body" || fold.axisKind === "glue") {
    return Math.min(1, progress / 0.55);
  }
  if (fold.childFaceId.includes("dust")) {
    return Math.max(0, Math.min(1, (progress - 0.48) / 0.28));
  }
  return Math.max(0, Math.min(1, (progress - 0.65) / 0.35));
};

export const FoldPreview = ({ topology }: Props) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<Record<string, FoldNode>>({});
  const [progress, setProgress] = useState(0.62);

  const bodySize = useMemo(
    () => Math.max(topology.panelAWidth, topology.panelBWidth, topology.height),
    [topology],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f7f8);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
    camera.position.set(topology.panelBWidth * 0.95, -bodySize * 2.2, bodySize * 1.25);
    camera.lookAt(topology.panelBWidth * 0.75, topology.panelAWidth * 0.1, topology.height * 0.45);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.replaceChildren(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(120, -180, 220);
    scene.add(ambient, key);

    const root = new THREE.Group();
    root.position.set(-topology.sequence[2].x - topology.panelBWidth / 2, 0, -topology.height / 2);
    scene.add(root);

    const faceMap = new Map(topology.faces.map((face) => [face.id, face]));
    const foldMap = new Map(topology.folds.map((fold) => [fold.childFaceId, fold]));
    const nodes: Record<string, FoldNode> = {};

    const rootFace = faceMap.get(topology.rootFaceId);
    if (rootFace) {
      const origin = flatTo3(rootFace.polygon.points[0], topology);
      const mesh = makeFaceMesh(rootFace, origin, topology);
      addEdges(mesh);
      mesh.position.copy(origin);
      root.add(mesh);
      nodes[rootFace.id] = { pivot: root, face: mesh, axis: "z", targetAngle: 0 };
    }

    const createNode = (faceId: string): THREE.Object3D => {
      if (nodes[faceId]) return nodes[faceId].pivot;
      const face = faceMap.get(faceId);
      const fold = foldMap.get(faceId);
      if (!face || !fold) return root;

      const parentPivot = createNode(fold.parentFaceId);
      const parentFold = foldMap.get(fold.parentFaceId);
      const axisOrigin = flatTo3(fold.axis.start, topology);
      const parentOrigin = parentFold ? flatTo3(parentFold.axis.start, topology) : new THREE.Vector3(0, 0, 0);
      const pivot = new THREE.Object3D();
      pivot.position.copy(axisOrigin.sub(parentOrigin));
      parentPivot.add(pivot);

      const mesh = makeFaceMesh(face, flatTo3(fold.axis.start, topology), topology);
      addEdges(mesh);
      pivot.add(mesh);

      nodes[faceId] = {
        pivot,
        face: mesh,
        axis: axisKind(fold),
        targetAngle: fold.targetAngle * fold.direction,
      };
      return pivot;
    };

    topology.faces.forEach((face) => createNode(face.id));
    nodesRef.current = nodes;
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      rendererRef.current.setSize(clientWidth, clientHeight);
      cameraRef.current.aspect = clientWidth / Math.max(clientHeight, 1);
      cameraRef.current.updateProjectionMatrix();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
      });
    };
  }, [bodySize, topology]);

  useEffect(() => {
    topology.folds.forEach((fold) => {
      const node = nodesRef.current[fold.childFaceId];
      if (!node) return;
      const angle = node.targetAngle * foldProgress(progress, fold);
      node.pivot.rotation.set(0, 0, 0);
      if (node.axis === "z") node.pivot.rotation.z = angle;
      if (node.axis === "x") node.pivot.rotation.x = angle;
    });
  }, [progress, topology.folds]);

  return (
    <section className="absolute right-5 top-5 hidden w-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel xl:block">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Box size={18} className="text-ink" />
          <div>
            <p className="text-sm font-semibold text-ink">3D fold validator</p>
            <p className="text-xs text-steel">Topology-driven hinge preview</p>
          </div>
        </div>
        <button className="tool-button" onClick={() => setProgress(0)} title="Open flat" aria-label="Open flat">
          <RotateCcw size={15} />
        </button>
      </div>
      <div ref={mountRef} className="h-[240px] bg-mist" />
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-steel">
          <span>Open</span>
          <span>{Math.round(progress * 100)}%</span>
          <span>Closed</span>
        </div>
        <input
          aria-label="Fold progress"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          className="w-full accent-ink"
        />
      </div>
    </section>
  );
};
