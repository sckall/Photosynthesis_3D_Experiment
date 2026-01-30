import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ChloroplastModel from './ChloroplastModel';
import { SimulationState, ModelVisibility, O2SourceExperimentState, ElectronFlowExperimentState, ModelBuildState, CalvinPlaceholderState } from '../types';

interface ViewportProps {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  isPaused: boolean;
  isLightOn: boolean;
  lightIntensity: number;
  co2Level: number;
  simState: SimulationState;
  modelVisibility?: ModelVisibility;
  o2ExperimentState?: O2SourceExperimentState;
  electronFlowState?: ElectronFlowExperimentState;
  onShowWaterPhotolysis?: () => void;
  modelBuildState?: ModelBuildState;
  calvinPlaceholders?: CalvinPlaceholderState;
  onPlaceholderDrop?: (nodeId: string, itemId: string) => void;
  isSelectionMode?: boolean;  // 是否为实验选择界面
  isFirstLoad?: boolean;  // 是否为首次加载
  experimentMode?: string;  // 实验模式
}

export default function Viewport({
  showLabels,
  setShowLabels,
  isPaused,
  isLightOn,
  lightIntensity,
  co2Level,
  simState,
  modelVisibility,
  o2ExperimentState,
  electronFlowState,
  onShowWaterPhotolysis,
  modelBuildState,
  calvinPlaceholders,
  onPlaceholderDrop,
  isSelectionMode = false,
  isFirstLoad = false,
  experimentMode,
}: ViewportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [coordOverlay, setCoordOverlay] = useState<{
    x: number;
    y: number;
    z: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  return (
    <div
      className="flex-1 relative bg-gradient-to-br from-green-50 to-blue-50/30 min-h-0"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 实验选择界面的欢迎标题（仅首次加载时显示） */}
      {isSelectionMode && isFirstLoad && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-cyan-600 
            tracking-tight drop-shadow-2xl text-center whitespace-nowrap animate-fade-in">
            光合作用模拟实验
          </h1>
        </div>
      )}

      {/* 浮动标签切换按钮 */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="bg-white/80 backdrop-blur border border-green-200 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-white transition-colors flex items-center gap-2"
        >
          <i className={`fas ${showLabels ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          {showLabels ? '隐藏标注' : '显示标注'}
        </button>
      </div>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-green-50/80">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
            <p className="text-green-700 font-bold">正在加载 3D 模型...</p>
          </div>
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        onCreated={() => {
          // 延迟隐藏加载指示器，确保模型已渲染
          setTimeout(() => setIsLoading(false), 500);
        }}
      >
        <Suspense fallback={null}>
          <RightClickCoords onPick={setCoordOverlay} />
          <PerspectiveCamera 
            makeDefault 
            position={
              isSelectionMode ? [0, 4, 18] : 
              calvinPlaceholders ? [0, 4, 15] : 
              [0, 4, 13]
            } 
            fov={40} 
          />
          <Environment preset="park" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <group position={[0, 0, 0]}>
            <ChloroplastModel
              showLabels={showLabels}
              isPaused={isPaused}
              isLightOn={isLightOn}
              lightIntensity={isLightOn ? lightIntensity : 0} // 实际值：0-50000 lx
              co2Level={co2Level} // 实际值：0-1000 μL/L
              simState={simState}
              visibility={modelVisibility}
              o2ExperimentState={o2ExperimentState}
              electronFlowState={electronFlowState}
              onShowWaterPhotolysis={onShowWaterPhotolysis}
              modelBuildState={modelBuildState}
              calvinPlaceholders={calvinPlaceholders}
              onPlaceholderDrop={onPlaceholderDrop}
              experimentMode={experimentMode}
            />
          </group>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Suspense>
      </Canvas>

      {/* 右键坐标提示 */}
      {coordOverlay && (
        <div
          className="absolute z-30 bg-white/90 backdrop-blur border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 shadow-lg"
          style={{
            left: Math.max(8, coordOverlay.clientX - 20),
            top: Math.max(8, coordOverlay.clientY - 60),
          }}
        >
          <div className="font-bold text-gray-800 mb-1">点击坐标</div>
          <div>X: {coordOverlay.x.toFixed(2)}</div>
          <div>Y: {coordOverlay.y.toFixed(2)}</div>
          <div>Z: {coordOverlay.z.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

function RightClickCoords({
  onPick,
}: {
  onPick: (value: { x: number; y: number; z: number; clientX: number; clientY: number }) => void;
}) {
  const { gl, camera, raycaster } = useThree();

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera({ x, y }, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 平面
      const point = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(plane, point);

      if (hit) {
        onPick({
          x: point.x,
          y: point.y,
          z: point.z,
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }
    };

    gl.domElement.addEventListener('contextmenu', handleContextMenu);
    return () => {
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, camera, raycaster, onPick]);  return null;
}