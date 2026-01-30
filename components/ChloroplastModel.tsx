import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChemicalText } from './3d/ChemicalText';
import { ElectronSwarm } from './3d/ElectronSwarm';
import CalvinCycleRingLogic from './3d/calvin/CalvinCycleRingLogic';
import { SimulationState, ModelVisibility, O2SourceExperimentState, ElectronFlowExperimentState, ModelBuildState, CalvinPlaceholderState } from '../types';

// --- 2. Energy Transport System ---
// 说明：旧的"ATP/NADPH 循环粒子（同时显示 ADP/NADP+）"已移除，避免与卡尔文环内的教学逻辑重复。
// 这里仅保留轨道（虚线）与"还原反应产生的 ADP/NADP+ 回流粒子"。

interface EnergyCycleSystemProps {
  active: boolean;
  loopDuration?: number;
  showLabels?: boolean;
  /** ATP/NADPH（合并球）沿黄色轨道进入还原点 */
  energyInSpawns?: Array<{ id: string }>;
  onEnergyArrive?: (id: string) => void;
  /** 已到达还原点堆积的 ATP/NADPH 粒子 */
  energyAtReduction?: Array<{ id: string }>;
  /** 还原点生成的回流产物（ADP/NADP+），沿既有 backwardPath 回流到类囊体 */
  returnSpawns?: Array<{ id: string; type: 'ADP/NADP+' }>;
  onReturnDone?: (id: string) => void;
}

const ReturnParticle = ({
  type,
  pathBackward,
  duration = 3.6, // 降低30%速度（时间增加约43%）
  onDone,
  showLabels = true,
}: {
  type: 'ADP/NADP+';
  pathBackward: [number, number, number][];
  duration?: number;
  onDone: () => void;
  showLabels?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(...pathBackward.map((v) => new THREE.Vector3(...v))),
    [pathBackward],
  );
  const doneRef = useRef(false);

  const color = '#fb7185';
  const emissive = '#ef4444';

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const t = Math.min(1, (state.clock.elapsedTime - startRef.current) / duration);
    const pos = new THREE.Vector3();
    curve.getPointAt(t, pos);
    groupRef.current.position.copy(pos);
    if (t >= 1 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
    });

    return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
      {showLabels && (
          <Text position={[0, 0.28, 0]} fontSize={0.22} color="#111827" outlineWidth={0.01} outlineColor="white" renderOrder={1000}>
            ADP/NADP+ ✕2
          </Text>
        )}
    </group>
  );
};

const EnergyInParticle = ({
  pathForward,
  duration = 2.9, // 降低30%速度（时间增加约43%）
  onArrive,
  showLabels = true,
}: {
  pathForward: [number, number, number][];
  duration?: number;
  onArrive: () => void;
  showLabels?: boolean;
}) => {
    const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(...pathForward.map((v) => new THREE.Vector3(...v))),
    [pathForward],
  );
  const doneRef = useRef(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const t = Math.min(1, (state.clock.elapsedTime - startRef.current) / duration);
    const pos = new THREE.Vector3();
    curve.getPointAt(t, pos);
        groupRef.current.position.copy(pos);
    if (t >= 1 && !doneRef.current) {
      doneRef.current = true;
      onArrive();
        }
    });

    return (
        <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#a3e635" emissive="#22d3ee" emissiveIntensity={0.25} />
            </mesh>
      {showLabels && (
        <Text position={[0, 0.3, 0]} fontSize={0.22} color="#111827" outlineWidth={0.01} outlineColor="white" renderOrder={1000}>
          ATP/NADPH ✕ 2
            </Text>
      )}
        </group>
    );
};

const EnergyCycleSystem = ({
  active,
  loopDuration = 10,
  showLabels = true,
  energyInSpawns = [],
  onEnergyArrive,
  energyAtReduction = [],
  returnSpawns = [],
  onReturnDone,
}: EnergyCycleSystemProps) => {
    // Exact paths matching the static lines
    // Grana Output (Left) -> Calvin Reduction (Right)
    const forwardPath: [number, number, number][] = [
        [-1.8, 0.5, 0], // Start: Near Grana
        [0.35, 2.5, 0], // Control: High Arc
        [2.5, 0.5, 0]   // End: Calvin Left Edge
    ];
    
    // Calvin Reduction (Right) -> Grana Input (Left)
    const backwardPath: [number, number, number][] = [
        [2.5, 0.5, 0],  // Start: Calvin Left Edge
        [0.35, -1.5, 0],// Control: Low Arc
        [-1.8, 0.5, 0]  // End: Near Grana
    ];

    // 还原点位置（与卡尔文环的还原点对齐）
    const reductionPos = new THREE.Vector3(2.5, 0.5, 0);

    return (
        <group>
            {/* 轨道示意（已有）：黄色为进入；红色为回流 */}
            <QuadraticBezierLine 
                start={forwardPath[0] as any} mid={forwardPath[1] as any} end={forwardPath[2] as any} 
                color="#eab308" lineWidth={2} transparent opacity={active ? 0.4 : 0.1} dashed={true}
            />
            <QuadraticBezierLine 
                start={backwardPath[0] as any} mid={backwardPath[1] as any} end={backwardPath[2] as any} 
                color="#f87171" lineWidth={2} transparent opacity={active ? 0.4 : 0.1} dashed={true}
            />
            {/* ATP/NADPH 进入粒子：沿黄色轨道运动，到达还原点后计入可用库存 */}
            {energyInSpawns.map((s) => (
              <EnergyInParticle key={s.id} pathForward={forwardPath} onArrive={() => onEnergyArrive?.(s.id)} showLabels={showLabels} />
            ))}
            {/* 已到达还原点堆积的 ATP/NADPH 粒子（有光照但没有 C3 时会持续堆积） */}
            {/* 注意：堆积的粒子只显示球体，不显示文字标签，避免文字重叠显得很密 */}
            {energyAtReduction.map((s, idx) => {
              // 堆积效果：稍微错开位置，形成堆积视觉
              const offsetX = (idx % 3) * 0.15 - 0.15;
              const offsetY = Math.floor(idx / 3) * 0.15;
              const pos = reductionPos.clone().add(new THREE.Vector3(offsetX, offsetY, 0));
              return (
                <group key={s.id} position={pos.toArray() as any}>
                  <mesh>
                    <sphereGeometry args={[0.16, 16, 16]} />
                    <meshStandardMaterial color="#a3e635" emissive="#22d3ee" emissiveIntensity={0.25} />
                  </mesh>
                  {/* 堆积的粒子不显示文字标签，避免文字重叠 */}
                </group>
              );
            })}
            {/* 回流粒子：复用既有 backwardPath（红色虚线轨道） */}
            {returnSpawns.map((s) => (
              <ReturnParticle
                key={s.id}
                type={s.type}
                pathBackward={backwardPath}
                onDone={() => onReturnDone?.(s.id)}
                showLabels={showLabels}
              />
            ))}
        </group>
    );
};

// --- 3. Structural Components ---

// ATP合成酶组件（横向插在类囊体膜上，朝向暗反应方向）
const ATPSynthaseOnMembrane = ({ 
  position, 
  isActive, 
  isBlocked, 
  showLabels 
}: { 
  position: [number, number, number]; 
  isActive: boolean; 
  isBlocked: boolean;
  showLabels: boolean;
}) => {
  const rotorRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (rotorRef.current && isActive && !isBlocked) {
      rotorRef.current.rotation.x += 0.05;
    }
  });
  
  return (
    <group position={position}>
      {/* F0部分：嵌在膜中的跨膜通道（横向穿过膜） */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
        <meshStandardMaterial 
          color={isBlocked ? "#9ca3af" : "#f59e0b"} 
          opacity={0.7} 
          transparent 
        />
      </mesh>
      
      {/* F1部分：伸出到基质侧的催化头部（朝向右侧，指向暗反应） */}
      <group position={[0.25, 0, 0]}>
        {/* 连接杆 */}
        <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
          <meshStandardMaterial color={isBlocked ? "#6b7280" : "#fbbf24"} />
        </mesh>
        
        {/* 催化头部（可旋转，绕X轴） */}
        <group ref={rotorRef} position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial 
              color={isBlocked ? "#9ca3af" : "#fbbf24"} 
              emissive={isBlocked ? "#374151" : "#f59e0b"} 
              emissiveIntensity={isActive && !isBlocked ? 0.4 : 0}
            />
          </mesh>
          {/* 旋转叶片（视觉标识，绕X轴旋转） */}
          {[0, 1, 2].map((i) => (
            <mesh 
              key={i} 
              position={[
                0,
                Math.cos(i * Math.PI * 2 / 3) * 0.11, 
                Math.sin(i * Math.PI * 2 / 3) * 0.11
              ]} 
              rotation={[i * Math.PI * 2 / 3, 0, 0]}
            >
              <boxGeometry args={[0.02, 0.05, 0.03]} />
              <meshStandardMaterial color={isBlocked ? "#d1d5db" : "#fcd34d"} />
            </mesh>
          ))}
        </group>
      </group>
      
      {/* 标签 */}
      {showLabels && (
        <>
          <Text
            position={[0.35, 0.25, 0]}
            fontSize={0.15}
            color={isBlocked ? "#6b7280" : "#f59e0b"}
            outlineWidth={0.01}
            outlineColor="white"
            anchorX="left"
            anchorY="middle"
            renderOrder={1000}
          >
            ATP合成酶
          </Text>
          
          {/* 被抑制标注 */}
          {isBlocked && (
            <ChemicalText
              position={[0.35, 0.05, 0]}
              fontSize={0.12}
              color="#ef4444"
              outlineWidth={0.01}
              outlineColor="white"
              anchorX="left"
              label="(被抑制)"
            />
          )}
        </>
      )}
    </group>
  );
};

const Thylakoid = ({ position, scale = 1, lightIntensity, isHovered, isFeatured }: any) => {
  return (
    <mesh position={position} scale={[scale, 1, scale]} castShadow receiveShadow>
      <cylinderGeometry args={[1.2, 1.2, 0.4, 32]} />
      <meshStandardMaterial 
        color={isHovered ? "#86efac" : "#4ade80"} 
        emissive="#bef264"
        emissiveIntensity={lightIntensity * 0.5} 
        roughness={0.3} 
        metalness={0.1}
        transparent={isFeatured}
        opacity={isFeatured ? 0.5 : 1}
      />
    </mesh>
  );
};

const Granum = ({ 
  position, 
  height = 5, 
  lightIntensity, 
  onClick, 
  active, 
  isFeatured = false,
  showLabels = true,
  electronFlowState 
}: any) => {
  const [hovered, setHover] = useState(false);
  
  // 固定3个圆盘
  const discCount = 3;
  const discSpacing = 0.5;
  
  const discs = useMemo(() => {
    return new Array(discCount).fill(0).map((_, i) => (
      <Thylakoid 
        key={i} 
        position={[0, i * discSpacing, 0]} 
        lightIntensity={lightIntensity} 
        isHovered={hovered || active}
        isFeatured={isFeatured}
      />
    ));
  }, [lightIntensity, hovered, active, isFeatured]);

  // 类囊体内部的氢离子（只在featured的类囊体中显示）
  const hydrogenIons = useMemo(() => {
    if (!isFeatured) return null;
    
    const ions: JSX.Element[] = [];
    for (let i = 0; i < discCount; i++) {
      // 每层3个氢离子，随机分布
      const ionCount = 3;
      for (let j = 0; j < ionCount; j++) {
        const angle = (j / ionCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 0.2 + Math.random() * 0.6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = i * discSpacing + (Math.random() - 0.5) * 0.2;
        
        ions.push(
          <group key={`ion_${i}_${j}`} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      }
    }
    return ions;
  }, [isFeatured]);

  // ATP合成酶（只在featured的类囊体上显示，且只显示1个，插在圆盘边缘）
  const atpSynthase = useMemo(() => {
    if (!isFeatured) return null;
    
    const hasInhibitor = electronFlowState?.additives?.inhibitor || false;
    
    return (
      <ATPSynthaseOnMembrane 
        position={[1.0, discSpacing * 0.5, 0]} 
        isActive={lightIntensity > 0.24}
        isBlocked={hasInhibitor}
        showLabels={showLabels}
      />
    );
  }, [isFeatured, lightIntensity, electronFlowState, showLabels]);

  // H⁺浓度标注已删除

  return (
    <group 
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {discs}
      {hydrogenIons}
      {atpSynthase}
      <group position={[0, discCount * discSpacing * 0.5, 0]}>
        <ElectronSwarm active={lightIntensity > 0.24} radius={1.25} count={12} />
      </group>
      {active && (
         <mesh rotation={[Math.PI/2, 0, 0]} position={[0, -0.2, 0]}>
             <ringGeometry args={[1.4, 1.6, 32]} />
             <meshBasicMaterial color="white" opacity={0.6} transparent side={THREE.DoubleSide} />
         </mesh>
      )}
    </group>
  );
};

// --- 4. Calvin Cycle 3D Animation ---
// 已拆分到 `components/3d/calvin/CalvinCycleInstances.tsx`

// --- 5. Context Molecules Helper ---
// Updated to use ChemicalText for proper formatting
const MoleculeGroup = ({ 
  position, 
  color, 
  label, 
  showLabels = true,
  isIsotopeLabeled = false,
  isotopeSymbol = '',
}: { 
  position: [number, number, number];
  color: string;
  label: string;
  showLabels?: boolean;
  isIsotopeLabeled?: boolean;
  isotopeSymbol?: string;
}) => {
  // 同位素标记时使用红色
  const moleculeColor = isIsotopeLabeled ? '#ef4444' : color;

  // 渲染真实分子结构
  const renderMoleculeStructure = () => {
    switch (label) {
      case 'H₂O': // 水分子：O + 2H
         return (
           <group>
             {/* 氧原子（红色，增大） */}
             <mesh castShadow receiveShadow position={[0, 0, 0]}>
               <sphereGeometry args={[0.22, 24, 24]} />
               <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.2} />
             </mesh>
             {/* 氢原子1（白色，增大并添加边框） */}
             <mesh castShadow receiveShadow position={[-0.26, 0.14, 0]}>
               <sphereGeometry args={[0.12, 16, 16]} />
               <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} roughness={0.3} />
             </mesh>
             {/* 氢原子2（白色，增大并添加边框） */}
             <mesh castShadow receiveShadow position={[0.26, 0.14, 0]}>
               <sphereGeometry args={[0.12, 16, 16]} />
               <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} roughness={0.3} />
             </mesh>
             {/* 化学键（增粗） */}
             <mesh position={[-0.13, 0.07, 0]} rotation={[0, 0, Math.PI/6]}>
               <cylinderGeometry args={[0.015, 0.015, 0.28, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.7} />
             </mesh>
             <mesh position={[0.13, 0.07, 0]} rotation={[0, 0, -Math.PI/6]}>
               <cylinderGeometry args={[0.015, 0.015, 0.28, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.7} />
             </mesh>
           </group>
         );
      
      case 'O₂': // 氧气：O + O
         return (
           <group>
             {/* 氧原子1（红色，增大） */}
             <mesh castShadow receiveShadow position={[-0.15, 0, 0]}>
               <sphereGeometry args={[0.2, 24, 24]} />
               <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.2} />
             </mesh>
             {/* 氧原子2（红色，增大） */}
             <mesh castShadow receiveShadow position={[0.15, 0, 0]}>
               <sphereGeometry args={[0.2, 24, 24]} />
               <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.2} />
             </mesh>
             {/* 双键（增粗） */}
             <mesh position={[0, 0.04, 0]}>
               <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
             <mesh position={[0, -0.04, 0]}>
               <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
           </group>
         );
      
      case 'CO₂': // 二氧化碳：O=C=O
         return (
           <group>
             {/* 碳原子（深灰色，增大） */}
             <mesh castShadow receiveShadow position={[0, 0, 0]}>
               <sphereGeometry args={[0.18, 24, 24]} />
               <meshStandardMaterial color="#4b5563" emissive="#4b5563" emissiveIntensity={0.3} roughness={0.2} />
             </mesh>
             {/* 氧原子1（红色，增大） */}
             <mesh castShadow receiveShadow position={[-0.3, 0, 0]}>
               <sphereGeometry args={[0.2, 24, 24]} />
               <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.2} />
             </mesh>
             {/* 氧原子2（红色，增大） */}
             <mesh castShadow receiveShadow position={[0.3, 0, 0]}>
               <sphereGeometry args={[0.2, 24, 24]} />
               <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.2} />
             </mesh>
             {/* 双键连接（增粗） */}
             <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
             <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
             <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
             <mesh position={[0.15, 0.05, 0]} rotation={[0, 0, Math.PI/2]}>
               <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
               <meshStandardMaterial color="#888888" transparent opacity={0.8} />
             </mesh>
           </group>
         );
      
      case '(CH₂O)':
         return (
           <group>
             <mesh castShadow receiveShadow>
               <sphereGeometry args={[0.25, 32, 32]} />
               <meshStandardMaterial 
                 color="#3b82f6" 
                 emissive="#3b82f6" 
                 emissiveIntensity={0.3} 
                 roughness={0.2} 
               />
             </mesh>
           </group>
         );
      
      default: // 默认情况：单球体
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.4, 32, 32]} />
            <meshStandardMaterial 
              color={moleculeColor} 
              emissive={moleculeColor} 
              emissiveIntensity={0.3} 
              roughness={0.2} 
            />
          </mesh>
        );
    }
  };

  // 获取分子整体大小用于标签定位
  const getMoleculeBounds = (label: string) => {
    switch (label) {
      case 'H₂O':
      case 'O₂':
        return 0.25;
      case 'CO₂':
        return 0.35;
      case '(CH₂O)':
        return 0.35;
      default:
        return 0.4;
    }
  };

  const moleculeBounds = getMoleculeBounds(label);

  return (
    <group position={position}>
      {renderMoleculeStructure()}
      {/* 化学式标签 */}
      {showLabels && (
        <ChemicalText
          position={[0, moleculeBounds + 0.3, 0]}
          fontSize={0.5}
          color={isIsotopeLabeled ? "#dc2626" : "#1f2937"}
          outlineWidth={0.04}
          outlineColor="white"
          anchorY="bottom"
          label={isotopeSymbol || label}
        />
      )}
      {/* 同位素标记：红色文字"有放射性" */}
      {isIsotopeLabeled && showLabels && (
        <Text
          position={[0, -(moleculeBounds + 0.2), 0]}
          fontSize={0.22}
          color="#dc2626"
          outlineWidth={0.02}
          outlineColor="white"
          anchorX="center"
          anchorY="top"
          renderOrder={1000}
        >
          有放射性
        </Text>
      )}
    </group>
  );
};

// --- Main Component ---

export default function ChloroplastModel({
  showLabels,
  isPaused,
  isLightOn,
  lightIntensity,
  co2Level,
  simState,
  visibility,
  o2ExperimentState,
  electronFlowState,
  onShowWaterPhotolysis,
  modelBuildState,
  calvinPlaceholders,
  onPlaceholderDrop,
  experimentMode,
}: {
  showLabels: boolean;
  isPaused: boolean;
  isLightOn: boolean;
  lightIntensity: number;
  co2Level: number;
  simState: SimulationState;
  visibility?: ModelVisibility;
  o2ExperimentState?: O2SourceExperimentState;
  electronFlowState?: ElectronFlowExperimentState;
  onShowWaterPhotolysis?: () => void;
  modelBuildState?: ModelBuildState;
  calvinPlaceholders?: CalvinPlaceholderState;
  onPlaceholderDrop?: (nodeId: string, itemId: string) => void;
  experimentMode?: string;
}) {
  // 默认可见性配置（实验4：环境因素）
  const defaultVisibility: ModelVisibility = {
    membrane: true,
    basicMolecules: true,
    thylakoid: true,
    electronChain: true,
    atpSynthase: true,
    calvinCycle: true,
    calvinIntermediates: true,
  };

  const vis = visibility || defaultVisibility;
  const beamRef = useRef<THREE.Mesh>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [returnSpawns, setReturnSpawns] = useState<Array<{ id: string; type: 'ADP/NADP+' }>>([]);
  const [energyInSpawns, setEnergyInSpawns] = useState<Array<{ id: string }>>([]);
  // 初始化：还原点只有一个 ATP/NADPH 粒子
  const [energyAtReduction, setEnergyAtReduction] = useState<Array<{ id: string }>>([{ id: 'initial_energy' }]);
  const [energyPairCount, setEnergyPairCount] = useState(1); // 初始为1
  // 初始累积值设为 0.7，与 CO₂ 同步
  // CO₂ 初始值 0.7，ATP/NADPH 也设为 0.7
  // ATP/NADPH 速率系数调整为 0.896，使默认条件下（光照12000 lx，CO₂ 420 μL/L）速率与 CO₂ 一致
  const energyAccRef = useRef(0.7);

  const energyFlowing = !isPaused && isLightOn && simState.atp > 5;
  // 该值仍用于能量运输动画（类囊体->基质）；卡尔文环内的“token逻辑”使用独立模块按强度/浓度驱动
  const energyAvailable = simState.atp > 5 && simState.nadph > 5;

  useFrame((state) => {
    if (beamRef.current) {
        const material = beamRef.current.material as THREE.MeshBasicMaterial;
        const baseOpacity = 0.15;
        const pulse = !isPaused && isLightOn ? Math.sin(state.clock.elapsedTime) * 0.05 : 0;
        // 归一化光照强度用于视觉效果：0-50000 lx -> 0-1
        const normalizedLight = lightIntensity / 50000;
        material.opacity = (baseOpacity + pulse) * normalizedLight;
        beamRef.current.visible = material.opacity > 0.005;
    }
  });

  const handleSelect = (part: string) => {
      setSelectedPart(prev => prev === part ? null : part);
  };

  const handleReductionReaction = () => {
    // 还原反应发生：用一个球表示 ADP/NADP+ 回流（沿已有红色轨道）
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}_adp_nadp`;
    setReturnSpawns((prev) => [...prev, { id, type: 'ADP/NADP+' }]);
  };

  const handleConsumeEnergyPair = () => {
    // 消耗一个已堆积的粒子（从堆积数组中移除）
    setEnergyAtReduction((prev) => {
      if (prev.length > 0) {
        return prev.slice(1);
      }
      return prev;
    });
    setEnergyPairCount((n) => Math.max(0, n - 1));
  };

  const handleEnergyArrive = (id: string) => {
    // 到达还原点：从在途移除，加入堆积数组，库存+1
    setEnergyInSpawns((prev) => prev.filter((p) => p.id !== id));
    setEnergyAtReduction((prev) => [...prev, { id }]);
    setEnergyPairCount((n) => Math.min(12, n + 1));
  };

  // 沿黄色轨道生成 ATP/NADPH（合并球）
  // 注意：在实验二（electron-flow）模式下不生成，避免与实验冲突
  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      // 实验二模式下不生成ATP/NADPH小球
      if (!isPaused && !electronFlowState) {
        // 提高粒子生成速度，与CO₂速率匹配
        // CO₂速率为 normalizedCO2 * 0.512（默认条件：0.215个/秒）
        // ATP/NADPH速率调整为 normalizedLight * 0.896，使默认光照（12000 lx）下速率匹配
        const normalizedLight = (isLightOn ? lightIntensity : 0) / 50000; // 归一化到 0-1
        const rate = normalizedLight * 0.896; // 每秒"对"(ATP+NADPH)，与CO₂速率匹配
        energyAccRef.current += rate / 60; // 近似按 60fps
        if (energyAccRef.current >= 1) {
          const add = Math.floor(energyAccRef.current);
          energyAccRef.current -= add;
          setEnergyInSpawns((prev) => {
            const next = [...prev];
            for (let i = 0; i < add; i++) {
              next.push({ id: `${Date.now()}_${Math.random().toString(16).slice(2)}_energy` });
            }
            return next;
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, isLightOn, lightIntensity, electronFlowState]);

  const handleReturnDone = (id: string) => {
    setReturnSpawns((prev) => prev.filter((p) => p.id !== id));
  };

  // 退出实验二时，清空ATP/NADPH小球堆积
  const prevElectronFlowStateRef = React.useRef<ElectronFlowExperimentState | undefined>(electronFlowState);
  React.useEffect(() => {
    // 检测从实验二退出：从有值变为undefined
    if (prevElectronFlowStateRef.current && !electronFlowState) {
      // 退出实验二，清空已生成的小球
      setEnergyInSpawns([]);
      setEnergyAtReduction([]);
      setReturnSpawns([]);
      energyAccRef.current = 0; // 重置累积值
    }
    prevElectronFlowStateRef.current = electronFlowState;
  }, [electronFlowState]);

  // 判断是否在实验1中，以及同位素标记状态
  const isO2Experiment = o2ExperimentState !== undefined;
  const isH2OLabeled = o2ExperimentState?.selectedLabel === 'h2o';
  const isCO2Labeled = o2ExperimentState?.selectedLabel === 'co2';
  const isExperimentRunning = o2ExperimentState?.isRunning || false;
  
  // 判断两个方案是否都已完成
  const bothSchemesCompleted = o2ExperimentState?.completedSchemes?.co2 && o2ExperimentState?.completedSchemes?.h2o;
  // 使用全局模型状态 OR 实验状态来决定是否显示水的光解
  const showWaterPhotolysis = modelBuildState?.waterPhotolysis || o2ExperimentState?.showWaterPhotolysis || false;

  return (
    <group onClick={() => setSelectedPart(null)}> 
      
      {/* 1. Membranes - 向上移动0.2单位 */}
      {vis.membrane && (
        <mesh position={[0, 0.2, 0]} scale={[8, 3.5, 5]} renderOrder={0}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#a7f3d0" opacity={0.15} transparent roughness={0.8} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      
      {/* 2. Light Reaction (Grana) - 向上移动与轨道连接 */}
      {vis.thylakoid && (
        <group position={[-3, -0.5, 0]}>
          {/* 归一化光照强度用于视觉效果 */}
          {(() => {
            const normalizedLight = lightIntensity / 50000;
            return (
              <>
                <Granum 
                  position={[-2, 0, 1]} 
                  height={3} 
                  lightIntensity={normalizedLight} 
                  onClick={() => handleSelect('granum')} 
                  active={selectedPart === 'granum'}
                  isFeatured={false}
                  showLabels={showLabels}
                />
                <Granum 
                  position={[0, 0, -1]} 
                  height={3} 
                  lightIntensity={normalizedLight} 
                  onClick={() => handleSelect('granum')} 
                  active={selectedPart === 'granum'}
                  isFeatured={false}
                  showLabels={showLabels}
                />
                <Granum 
                  position={[0.5, 0, 1.5]} 
                  height={3} 
                  lightIntensity={normalizedLight} 
                  onClick={() => handleSelect('granum')} 
                  active={selectedPart === 'granum'}
                  isFeatured={true}
                  showLabels={showLabels}
                  electronFlowState={electronFlowState}
                />
              </>
            );
          })()}
          
          <mesh ref={beamRef} position={[0, 4, 0]} renderOrder={10}>
              <cylinderGeometry args={[0.8, 3.5, 8, 32, 1, true]} />
              <meshBasicMaterial color="#fcd34d" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 3. Dark Reaction (Calvin Cycle) */}
      {vis.calvinCycle && (
        <group position={[1, -0.5, 0]}>
           <CalvinCycleRingLogic
             isPaused={calvinPlaceholders ? true : isPaused} // 实验3中暂停动画
             isLightOn={isLightOn}
             lightIntensity={lightIntensity} // 实际值：0-50000 lx
             co2Level={co2Level} // 实际值：0-1000 μL/L
             showLabels={showLabels && !calvinPlaceholders} // 实验3中隐藏内部标签
             count={5}
             onReductionReaction={handleReductionReaction}
             energyPairCount={energyPairCount}
             consumeEnergyPair={handleConsumeEnergyPair}
             hideParticles={!!calvinPlaceholders} // 实验3中隐藏CO₂粒子和载体分子
           />
        </group>
      )}

      {/* 实验3：占位节点（逐步添加） */}
      {calvinPlaceholders && (
        <CalvinPlaceholderMarkers
          placeholders={calvinPlaceholders}
          onDrop={onPlaceholderDrop}
        />
      )}

      {/* 4. Context Molecules */}
      {vis.basicMolecules && (
        <>
          <MoleculeGroup 
            position={[-5, 4, 0]} 
            color="#06b6d4" 
            label="H₂O" 
            showLabels={showLabels}
            isIsotopeLabeled={isH2OLabeled && (isExperimentRunning || o2ExperimentState?.showResult)}
            isotopeSymbol={isH2OLabeled ? "H₂¹⁸O" : ""}
          />
          <MoleculeGroup 
            position={[-5, -4, 0]} 
            color="#93c5fd" 
            label="O₂" 
            showLabels={showLabels}
            isIsotopeLabeled={isH2OLabeled && o2ExperimentState?.showResult}
            isotopeSymbol={isH2OLabeled && o2ExperimentState?.showResult ? "¹⁸O₂" : ""}
          />
          {/* 只在实验4中隐藏(CO₂)，其他实验都显示 */}
          {(isO2Experiment || electronFlowState || calvinPlaceholders || (!isO2Experiment && !electronFlowState && !calvinPlaceholders && experimentMode !== 'env-factors')) && (
            <MoleculeGroup 
              position={[5, 4.3, 0]} 
              color="#fbbf24" 
              label="CO₂" 
              showLabels={showLabels}
              isIsotopeLabeled={isCO2Labeled && (isExperimentRunning || o2ExperimentState?.showResult)}
              isotopeSymbol={isCO2Labeled ? "C¹⁸O₂" : ""}
            />
          )}
          {/* 只在实验4中隐藏(CH₂O)，首页和其他实验都显示 */}
          {(isO2Experiment || electronFlowState || calvinPlaceholders || (!isO2Experiment && !electronFlowState && !calvinPlaceholders && experimentMode !== 'env-factors')) && (
            <MoleculeGroup 
              position={[5, -4, 0]} 
              color="#f472b6" 
              label="(CH₂O)" 
              showLabels={showLabels}
              isIsotopeLabeled={isCO2Labeled && o2ExperimentState?.showResult}
              isotopeSymbol=""
            />
          )}
          
          {/* 实验1：反应箭头（实验开始后保持显示，完成后永久保留） */}
          {((isO2Experiment && (o2ExperimentState?.isRunning || o2ExperimentState?.showResult)) || 
            (bothSchemesCompleted || modelBuildState?.waterPhotolysis)) && (
            <ReactionArrows />
          )}
          
          {/* 实验1：两个方案都完成后显示"水的光解"按钮 */}
          {isO2Experiment && bothSchemesCompleted && !showWaterPhotolysis && (
            <Html position={[-6.5, -3.5, 2]} center>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowWaterPhotolysis?.();
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white 
                  rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all
                  font-bold text-sm whitespace-nowrap border-2 border-white/30"
              >
                水的光解
              </button>
            </Html>
          )}
          
          {/* 水的光解模型 - 显示4e⁻和4H⁺（当ATP合成公式显示时隐藏） */}
          {showWaterPhotolysis && !modelBuildState?.atpSynthase && (
            <WaterPhotolysisModel showLabels={showLabels} />
          )}
        </>
      )}
      
      {/* 5. Energy Cycle (ATP/NADPH Transport) */}
      {/* Note: Coordinates are global to this group to match the layout */}
      {/* 实验3中隐藏能量循环动画，只显示轨道 */}
      {vis.atpSynthase && !calvinPlaceholders && (
        <EnergyCycleSystem
          active={energyFlowing}
          loopDuration={10}
          showLabels={showLabels}
          energyInSpawns={energyInSpawns}
          onEnergyArrive={handleEnergyArrive}
          energyAtReduction={energyAtReduction}
          returnSpawns={returnSpawns}
          onReturnDone={handleReturnDone}
        />
      )}
      
      {/* 实验3中只显示轨道，不显示动画小球 */}
      {vis.atpSynthase && calvinPlaceholders && (
        <EnergyCycleSystem
          active={false}
          loopDuration={10}
          showLabels={false}
          energyInSpawns={[]}
          onEnergyArrive={handleEnergyArrive}
          energyAtReduction={[]}
          returnSpawns={[]}
          onReturnDone={handleReturnDone}
        />
      )}

      {/* 实验1：简化的同位素追踪动画 */}
      {isO2Experiment && o2ExperimentState?.isRunning && isH2OLabeled && (
        <IsotopeTracingAnimation />
      )}

      {/* 实验2：电子的去向 - H⁺浓度可视化 */}
      {electronFlowState && (
        <Experiment2Visualization 
          state={electronFlowState}
          showLabels={showLabels}
        />
      )}

      {/* ATP合成公式（实验2构建ATP合成酶后显示，实验3中移到上方避免遮挡） */}
      {modelBuildState?.atpSynthase && (
        <group position={calvinPlaceholders ? [2.5, 3.6, 0] : [0, 0, 0]}>
          <ATPSynthesisModel showLabels={showLabels} />
        </group>
      )}

      {/* 实验2完成后：显示NADPH合成公式（实验3中移到上方避免遮挡） */}
      {(electronFlowState?.showNADPHFormula || modelBuildState?.nadphFormation) && (
        <group position={calvinPlaceholders ? [2.5, 3.2, 0] : [0, 0, 0]}>
          <NADPHFormationModel showLabels={showLabels} />
        </group>
      )}

    </group>
  );
}

function CalvinPlaceholderMarkers({
  placeholders,
  onDrop,
}: {
  placeholders: CalvinPlaceholderState;
  onDrop?: (nodeId: string, itemId: string) => void;
}) {
  // 坐标：按用户提供位置，四个中间节点统一 X 轴对齐
  const markers: Array<{ id: keyof CalvinPlaceholderState['nodes']; position: [number, number, number] }> = [
    { id: 'c3', position: [3.13, 2.24, 0] },
    { id: 'c5', position: [7.01, -0.91, 0] },
    { id: 'adp', position: [0.33, -0.54, 0] },
    { id: 'atp', position: [0.33, 1.45, 0] },
    { id: 'nadp', position: [0.33, -1.59, 0] },
    { id: 'nadph', position: [0.33, 2.31, 0] },
  ];

  const handleDrop = (nodeId: keyof CalvinPlaceholderState['nodes'], e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && onDrop) {
      onDrop(nodeId, itemId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getAnchor = (pos: [number, number, number], side: 'left' | 'right') => {
    const offsetX = side === 'right' ? 1.05 : -1.05;
    return [pos[0] + offsetX, pos[1], pos[2]] as [number, number, number];
  };

  const nodeOrder: Array<keyof CalvinPlaceholderState['nodes']> = ['nadph', 'atp', 'adp', 'nadp'];
  const positionsById = Object.fromEntries(markers.map((m) => [m.id, m.position])) as Record<
    keyof CalvinPlaceholderState['nodes'],
    [number, number, number]
  >;

  const firstNode = positionsById[nodeOrder[0]];
  const secondNode = positionsById[nodeOrder[1]];
  const thirdNode = positionsById[nodeOrder[2]];
  const fourthNode = positionsById[nodeOrder[3]];

  const ArrowCurve = ({
    start,
    mid,
    end,
    color = '#ef4444',
  }: {
    start: [number, number, number];
    mid: [number, number, number];
    end: [number, number, number];
    color?: string;
  }) => {
    const curve = useMemo(
      () => new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...end),
      ),
      [start, mid, end],
    );
    const points = useMemo(() => curve.getPoints(40), [curve]);
    const endTangent = useMemo(() => {
      const t = 0.98;
      const tangent = curve.getTangent(t).normalize();
      return tangent;
    }, [curve]);

    const arrowLength = 0.18;
    const arrowRadius = 0.07;
    const arrowPos = new THREE.Vector3(...end).add(endTangent.clone().multiplyScalar(-arrowLength * 0.6));
    const arrowQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), endTangent);

    return (
      <group>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} linewidth={4} />
        </line>
        <mesh position={arrowPos.toArray() as any} quaternion={arrowQuat}>
          <coneGeometry args={[arrowRadius, arrowLength, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    );
  };

  return (
    <group>
      {/* 连接箭头：四个节点的双向连线 */}
      {firstNode && fourthNode && (
        <>
          {/* 1 -> 4（右侧 -> 右侧，中段经过(2.26,0.5,0)） */}
          <ArrowCurve
            start={getAnchor(firstNode, 'right')}
            mid={[2.26, 0.5, 0]}
            end={getAnchor(fourthNode, 'right')}
            color="#ef4444"
          />
          {/* 4 -> 1（左侧 -> 左侧，中段经过(-1.8,0.5,0)） */}
          <ArrowCurve
            start={getAnchor(fourthNode, 'left')}
            mid={[-1.8, 0.5, 0]}
            end={getAnchor(firstNode, 'left')}
            color="#ef4444"
          />
        </>
      )}

      {secondNode && thirdNode && (
        <>
          {/* 2 -> 3（右侧 -> 右侧，中段经过(2.26,0.5,0)） */}
          <ArrowCurve
            start={getAnchor(secondNode, 'right')}
            mid={[2.26, 0.5, 0]}
            end={getAnchor(thirdNode, 'right')}
            color="#ef4444"
          />
          {/* 3 -> 2（左侧 -> 左侧，中段经过(-1.8,0.5,0)） */}
          <ArrowCurve
            start={getAnchor(thirdNode, 'left')}
            mid={[-1.8, 0.5, 0]}
            end={getAnchor(secondNode, 'left')}
            color="#ef4444"
          />
        </>
      )}

      {markers.map((marker) => {
        const node = placeholders.nodes[marker.id];
        return (
          <Html key={marker.id} position={marker.position} center transform distanceFactor={10} style={{ pointerEvents: 'auto' }}>
            <div
              onDrop={(e) => handleDrop(marker.id, e)}
              onDragOver={handleDragOver}
              className={`px-3 py-1.5 rounded-md border-2 backdrop-blur shadow-lg transition-all ${
                node.filled ? 'border-green-500 bg-green-50' : 'border-blue-400 bg-blue-50/90'
              }`}
            >
              <div className={`text-xs font-bold text-center whitespace-nowrap ${
                node.filled ? 'text-green-800' : 'text-blue-800'
              }`}>
                {node.label}
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// 实验1简化动画：同位素追踪（H₂^18O飘入 → ^18O₂飘出）
function IsotopeTracingAnimation() {
  const [particles, setParticles] = useState<Array<{
    id: string;
    type: 'h2o' | 'o2';
    progress: number;
    startTime: number;
  }>>([]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    // 生成H2O粒子（第1-2秒）
    if (elapsed < 2 && particles.filter(p => p.type === 'h2o').length < 3) {
      const needCreate = 3 - particles.filter(p => p.type === 'h2o').length;
      if (needCreate > 0 && Math.random() < 0.1) {
        setParticles(prev => [
          ...prev,
          {
            id: `h2o_${Date.now()}_${Math.random()}`,
            type: 'h2o',
            progress: 0,
            startTime: elapsed,
          },
        ]);
      }
    }

    // 生成O2粒子（第3-4秒）
    if (elapsed >= 3 && elapsed < 4 && particles.filter(p => p.type === 'o2').length < 2) {
      const needCreate = 2 - particles.filter(p => p.type === 'o2').length;
      if (needCreate > 0 && Math.random() < 0.15) {
        setParticles(prev => [
          ...prev,
          {
            id: `o2_${Date.now()}_${Math.random()}`,
            type: 'o2',
            progress: 0,
            startTime: elapsed,
          },
        ]);
      }
    }

    // 更新所有粒子的进度
    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          progress: Math.min(1, (elapsed - p.startTime) / 1.5), // 1.5秒飞行时间
        }))
        .filter(p => p.progress < 1) // 移除已完成的粒子
    );
  });

  return (
    <group>
      {particles.map(particle => (
        <IsotopeParticle key={particle.id} particle={particle} />
      ))}
    </group>
  );
}

// 单个同位素粒子
function IsotopeParticle({ particle }: { particle: { type: 'h2o' | 'o2'; progress: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { type, progress } = particle;

  // 计算位置
  const getPosition = (t: number): [number, number, number] => {
    if (type === 'h2o') {
      // H2O：从左上角飘入叶绿体中心
      const startX = -6;
      const startY = 4;
      const endX = 0;
      const endY = 0;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const z = Math.sin(t * Math.PI) * 0.5; // 弧线运动
      return [x, y, z];
    } else {
      // O2：从叶绿体中心飘出到左下角
      const startX = 0;
      const startY = 0;
      const endX = -5;
      const endY = -4;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const z = Math.sin(t * Math.PI) * 0.5; // 弧线运动
      return [x, y, z];
    }
  };

  const position = getPosition(progress);
  const scale = type === 'h2o' ? 0.3 : 0.4;

  useFrame((state) => {
    if (meshRef.current) {
      // 轻微旋转
      meshRef.current.rotation.y += 0.02;
      // 脉动效果
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale * pulse);
    }
  });

  return (
    <group position={position}>
      {/* 红色球体（同位素标记） */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[scale, 16, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* 化学式标签 */}
      <ChemicalText
        position={[0, scale + 0.35, 0]}
        fontSize={0.35}
        color="#dc2626"
        outlineWidth={0.03}
        outlineColor="white"
        anchorY="bottom"
        label={type === 'h2o' ? 'H₂¹⁸O' : '¹⁸O₂'}
      />
      {/* 有放射性标签 */}
      <Text
        position={[0, -scale - 0.15, 0]}
        fontSize={0.2}
        color="#dc2626"
        outlineWidth={0.02}
        outlineColor="white"
        anchorX="center"
        anchorY="top"
        renderOrder={1000}
      >
        有放射性
      </Text>
      
      {/* 粒子轨迹虚线 */}
      <ParticleTrail type={type} progress={progress} />
    </group>
  );
}

// 粒子轨迹虚线组件
function ParticleTrail({ type, progress }: { type: 'h2o' | 'o2'; progress: number }) {
  // 计算轨迹点
  const getTrailPoints = (t: number): [number, number, number][] => {
    const points: [number, number, number][] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const ratio = (i / steps) * t;
      if (type === 'h2o') {
        const startX = -6;
        const startY = 4;
        const endX = 0;
        const endY = 0;
        const x = startX + (endX - startX) * ratio;
        const y = startY + (endY - startY) * ratio;
        const z = Math.sin(ratio * Math.PI) * 0.5;
        points.push([x, y, z]);
      } else {
        const startX = 0;
        const startY = 0;
        const endX = -5;
        const endY = -4;
        const x = startX + (endX - startX) * ratio;
        const y = startY + (endY - startY) * ratio;
        const z = Math.sin(ratio * Math.PI) * 0.5;
        points.push([x, y, z]);
      }
    }
    return points;
  };

  const trailPoints = getTrailPoints(Math.min(progress * 1.2, 1));
  
  return (
    <group>
      {trailPoints.map((point, idx) => {
        if (idx === 0) return null;
        const prevPoint = trailPoints[idx - 1];
        const start = new THREE.Vector3(...prevPoint);
        const end = new THREE.Vector3(...point);
        const mid = start.clone().lerp(end, 0.5);
        const distance = start.distanceTo(end);
        
        return (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...prevPoint, ...point])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ef4444"
              opacity={0.3 * (idx / trailPoints.length)}
              transparent
              linewidth={1}
            />
          </line>
        );
      })}
    </group>
  );
}

// 实验1：反应箭头组件（显示物质进出叶绿体的方向）- 使用2D HTML箭头
function ReactionArrows() {
  const [showInputArrows, setShowInputArrows] = useState(true);
  const [showOutputArrows, setShowOutputArrows] = useState(false);

  useEffect(() => {
    setShowInputArrows(true);
    
    // 1秒后显示输出箭头（与放射性标记的产物同步出现）
    const timer = setTimeout(() => {
      setShowOutputArrows(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <group>
      {/* 输入箭头：H₂O ↓ 叶绿体（垂直向下，X坐标与H₂O对齐，Z=0与环同平面） */}
      {showInputArrows && (
        <Html position={[-5, 3.4, 0]} center transform distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '42px',
            color: '#0891b2',
            transform: 'rotate(90deg)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
          }}>
            →
          </div>
        </Html>
      )}
      
      {/* 输入箭头：CO₂ ↓ 叶绿体（垂直向下，X坐标与CO₂对齐，Z=0与环同平面） */}
      {showInputArrows && (
        <Html position={[5, 3.7, 0]} center transform distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '42px',
            color: '#d97706',
            transform: 'rotate(90deg)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
          }}>
            →
          </div>
        </Html>
      )}
      
      {/* 输出箭头：叶绿体 ↓ O₂（垂直向下，X坐标与O₂对齐，Z=0与环同平面） */}
      {showOutputArrows && (
        <Html position={[-5, -2.8, 0]} center transform distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '42px',
            color: '#3b82f6',
            transform: 'rotate(90deg)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
          }}>
            →
          </div>
        </Html>
      )}
      
      {/* 输出箭头：叶绿体 ↓ (CH₂O)（垂直向下，X坐标与糖对齐，Z=0与环同平面） */}
      {showOutputArrows && (
        <Html position={[5, -2.8, 0]} center transform distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '42px',
            color: '#ec4899',
            transform: 'rotate(90deg)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
          }}>
            →
          </div>
        </Html>
      )}
    </group>
  );
}

// 实验1：水的光解模型 - 显示化学反应方程式：2H₂O → 4e⁻ + 4H⁺ + O₂
function WaterPhotolysisModel({ showLabels }: { showLabels: boolean }) {
  const fontSize = 0.65; // 增大字号
  const subScale = 0.65;
  const supScale = 0.55;
  const subY = -0.15 * fontSize;
  const supY = 0.18 * fontSize;
  
  const commonProps = {
    fontSize,
    outlineWidth: 0.02,
    outlineColor: 'white',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    renderOrder: 1000,
  };

  // 方程式位置：类囊体正上方
  // 类囊体位置：[-3, -1.5, 0]，高度约8，顶部在Y≈2.5
  const baseX = -3.5; // 与类囊体X坐标对齐
  const baseY = 1.5; // 在类囊体正上方
  const baseZ = 1;

  return (
    <group>
      {/* 化学反应方程式：2H₂O → 4e⁻ + 4H⁺ + O₂ */}
      <group position={[baseX, baseY, baseZ]}>
        {/* 2H₂O */}
        <Text {...commonProps} position={[-1.8, 0, 0]} color="#06b6d4">
          2H
        </Text>
        <Text {...commonProps} position={[-1.3, subY, 0]} fontSize={fontSize * subScale} color="#06b6d4">
          2
        </Text>
        <Text {...commonProps} position={[-0.9, 0, 0]} color="#06b6d4">
          O
        </Text>
        
        {/* → */}
        <Text {...commonProps} position={[-0.3, 0, 0]} color="#333">
          →
        </Text>
        
        {/* 光照条件标注 - 在箭头正上方 */}
        <Text
          position={[-0.3, 0.6, 0]}
          fontSize={0.4}
          color="#fbbf24"
          outlineWidth={0.02}
          outlineColor="white"
          anchorX="center"
          anchorY="middle"
          renderOrder={1000}
        >
          光照
        </Text>
        
        {/* 4e⁻ */}
        <Text {...commonProps} position={[0.4, 0, 0]} color="#1e40af">
          4e
        </Text>
        <Text {...commonProps} position={[0.95, supY, 0]} fontSize={fontSize * supScale} color="#1e40af">
          -
        </Text>
        
        {/* + */}
        <Text {...commonProps} position={[1.4, 0, 0]} color="#333">
          +
        </Text>
        
        {/* 4H⁺ */}
        <Text {...commonProps} position={[1.9, 0, 0]} color="#dc2626">
          4H
        </Text>
        <Text {...commonProps} position={[2.45, supY, 0]} fontSize={fontSize * supScale} color="#dc2626">
          +
        </Text>
        
        {/* + */}
        <Text {...commonProps} position={[2.9, 0, 0]} color="#333">
          +
        </Text>
        
        {/* O₂ */}
        <Text {...commonProps} position={[3.4, 0, 0]} color="#3b82f6">
          O
        </Text>
        <Text {...commonProps} position={[3.85, subY, 0]} fontSize={fontSize * subScale} color="#3b82f6">
          2
        </Text>
      </group>
    </group>
  );
}

// =============================================
// 实验2：电子的去向 - 可视化组件
// =============================================

// H⁺粒子组件
function HydrogenIonParticle({ 
  position, 
  isAnimating
}: { 
  position: [number, number, number]; 
  isAnimating: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [offset] = useState(Math.random() * Math.PI * 2);
  
  useFrame((state) => {
    if (meshRef.current && isAnimating) {
      // 添加轻微的浮动动画
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + offset) * 0.1;
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.4} />
      </mesh>
      {/* 删除单独的H⁺标签 */}
    </group>
  );
}

// ATP合成酶可视化
function ATPSynthaseVisual({ 
  position, 
  isActive, 
  isBlocked 
}: { 
  position: [number, number, number]; 
  isActive: boolean; 
  isBlocked: boolean;
}) {
  const rotationRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (rotationRef.current && isActive && !isBlocked) {
      rotationRef.current.rotation.y += 0.03;
    }
  });
  
  const baseColor = isBlocked ? '#9ca3af' : '#f59e0b';
  
  return (
    <group position={position}>
      {/* ATP合成酶底座 */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.4, 16]} />
        <meshStandardMaterial color={baseColor} opacity={isBlocked ? 0.5 : 1} transparent />
      </mesh>
      
      {/* ATP合成酶转子 */}
      <group ref={rotationRef} position={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.6, 8]} />
          <meshStandardMaterial 
            color={isBlocked ? '#6b7280' : '#fbbf24'} 
            emissive={isBlocked ? '#374151' : '#f59e0b'} 
            emissiveIntensity={isActive && !isBlocked ? 0.3 : 0} 
          />
        </mesh>
        {/* 叶片 */}
        {[0, 1, 2, 3].map((i) => (
          <mesh 
            key={i} 
            position={[Math.cos(i * Math.PI / 2) * 0.3, 0, Math.sin(i * Math.PI / 2) * 0.3]} 
            rotation={[0, i * Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.2, 0.5, 0.06]} />
            <meshStandardMaterial color={isBlocked ? '#9ca3af' : '#fcd34d'} />
          </mesh>
        ))}
      </group>
      
      {/* 标签 */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color={isBlocked ? '#6b7280' : '#f59e0b'}
        outlineWidth={0.01}
        outlineColor="white"
        anchorX="center"
        anchorY="middle"
        renderOrder={1000}
      >
        ATP合成酶
      </Text>
      
      {/* 被阻断标志 */}
      {isBlocked && (
        <Text
          position={[0, 0.85, 0]}
          fontSize={0.15}
          color="#ef4444"
          outlineWidth={0.01}
          outlineColor="white"
          anchorX="center"
          anchorY="middle"
        >
          (被抑制)
        </Text>
      )}
    </group>
  );
}

// 实验2主可视化组件
function Experiment2Visualization({ 
  state, 
  showLabels 
}: { 
  state: ElectronFlowExperimentState; 
  showLabels: boolean;
}) {
  const { selectedBuffer, additives, isRunning, showResult, showATPSynthase } = state;
  
  // 类囊体腔位置（与现有类囊体位置一致）
  const thylakoidPos: [number, number, number] = [-3, -1.5, 0];
  
  // 计算当前H⁺浓度状态
  const hasHighInnerH = true; // 默认类囊体腔内[H⁺]高
  const hasLowOuterH = selectedBuffer === 'ph8'; // pH=8时膜外[H⁺]低
  const hasDNP = additives.dnp; // DNP消除梯度
  const hasInhibitor = additives.inhibitor; // 抑制剂阻断ATP合成酶
  
  // 判断是否显示H⁺浓度差
  const showConcentrationGradient = selectedBuffer !== 'none' && (isRunning || showResult);
  
  // 膜外（基质）H⁺粒子位置 - 分散在暗反应区域上方
  const outerHPositions: [number, number, number][] = selectedBuffer === 'ph4'
    ? [
        // pH=4：酸性，H⁺浓度高，分散在暗反应区域
        [0.8, 0.2, 0.3], [1.5, -0.1, 0.9], [1.0, 0.6, 0.5],
        [1.8, 0.1, 1.2], [1.2, 0, 0.1], [2.0, 0.4, 0.7],
        [1.4, 0.5, 1.0], [1.6, 0.3, 0.4],
      ]
    : selectedBuffer === 'ph8'
    ? [
        // pH=8：碱性，H⁺浓度低，只有少量
        [1.4, 0.2, 0.6],
      ]
    : [];
  
  // ATP生成效果
  const atpProduced = hasLowOuterH && hasHighInnerH && !hasDNP && !hasInhibitor && 
                      additives.adp && additives.pi && showResult;

  return (
    <group>
      {/* 实验条件标签已删除 */}

      {/* H⁺浓度标注已删除 */}
      
      {/* 类囊体腔内H⁺已通过featured Granum组件中的氢离子粒子展示 */}
      
      {/* 膜外H⁺粒子 */}
      {showConcentrationGradient && outerHPositions.map((pos, i) => (
        <HydrogenIonParticle 
          key={`outer_h_${i}`} 
          position={pos} 
          isAnimating={isRunning}
        />
      ))}
      
      {/* 统一的氢离子浓度标注 - 3D文字，在氢离子群下方 */}
      {showConcentrationGradient && outerHPositions.length > 0 && (
        <group position={[1.5, -1.2, 0]}>
          {/* H⁺ 标签 */}
          <Text
            position={[-0.15, 0, 0]}
            fontSize={0.4}
            color="#dc2626"
            outlineWidth={0.02}
            outlineColor="white"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            renderOrder={1000}
          >
            H
          </Text>
          <Text
            position={[0.1, 0.15, 0]}
            fontSize={0.25}
            color="#dc2626"
            outlineWidth={0.015}
            outlineColor="white"
            anchorX="left"
            anchorY="middle"
            fontWeight="bold"
            renderOrder={1000}
          >
            +
          </Text>
          
          {/* 浓度标注 */}
          <Text
            position={[0, -0.5, 0]}
            fontSize={0.22}
            color="#666"
            outlineWidth={0.01}
            outlineColor="white"
            anchorX="center"
            anchorY="top"
            renderOrder={1000}
          >
            浓度: 10
          </Text>
          <Text
            position={[0.45, -0.4, 0]}
            fontSize={0.15}
            color="#666"
            outlineWidth={0.01}
            outlineColor="white"
            anchorX="left"
            anchorY="top"
            renderOrder={1000}
          >
            {selectedBuffer === 'ph4' ? '-4' : '-8'}
          </Text>
          <Text
            position={[0.75, -0.5, 0]}
            fontSize={0.22}
            color="#666"
            outlineWidth={0.01}
            outlineColor="white"
            renderOrder={1000}
            anchorX="left"
            anchorY="top"
          >
            mol/L
          </Text>
        </group>
      )}
      
      {/* ATP合成酶已在featured Granum组件中展示 */}
      
      {/* ATP生成动画 */}
      {atpProduced && (
        <group position={[-1, 0.5, 1.5]}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
          </mesh>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.25}
            color="#f59e0b"
            outlineWidth={0.02}
            outlineColor="white"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            ATP
          </Text>
        </group>
      )}

      {/* DNP效果说明已删除 */}
    </group>
  );
}

// ATP合成公式模型
function ATPSynthesisModel({ showLabels }: { showLabels: boolean }) {
  const fontSize = 0.5;
  const subScale = 0.65;
  const supScale = 0.55;
  const subY = -0.12 * fontSize;
  const supY = 0.15 * fontSize;
  
  const commonProps = {
    fontSize,
    outlineWidth: 0.02,
    outlineColor: 'white',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    renderOrder: 1000,
  };

  // 位置：在NADPH公式上方，靠近光反应区域
  const baseX = -2.5; // 往光反应方向移动2个单位
  const baseY = 2.1;
  const baseZ = 1;

  return (
    <group>
      {/* 公式：ADP + Pi → ATP */}
      <group position={[baseX, baseY, baseZ]}>
        {/* ADP - 与2NADP对齐 */}
        <Text {...commonProps} position={[-2.8, 0, 0]} color="#3b82f6">
          ADP
        </Text>
        
        {/* + */}
        <Text {...commonProps} position={[-2.1, 0, 0]} color="#333">
          +
        </Text>
        
        {/* Pi */}
        <Text {...commonProps} position={[-1.6, 0, 0]} color="#3b82f6">
          Pi
        </Text>
        
        {/* → */}
        <Text {...commonProps} position={[-1.0, 0, 0]} color="#333">
          →
        </Text>
        
        {/* ATP合成酶标注 - 在箭头上方，字号减小 */}
        <Text
          position={[-1.0, 0.5, 0]}
          fontSize={0.25}
          color="#3b82f6"
          outlineWidth={0.015}
          outlineColor="white"
          anchorX="center"
          anchorY="middle"
          renderOrder={1000}
        >
          ATP合成酶
        </Text>
        
        {/* ATP */}
        <Text {...commonProps} position={[-0.3, 0, 0]} color="#3b82f6">
          ATP
        </Text>
      </group>
    </group>
  );
}

// 实验2完成后：NADPH合成公式
function NADPHFormationModel({ showLabels }: { showLabels: boolean }) {
  const fontSize = 0.4; // 减小字号
  const subScale = 0.65;
  const supScale = 0.55;
  const subY = -0.12 * fontSize;
  const supY = 0.15 * fontSize;
  
  const commonProps = {
    fontSize,
    outlineWidth: 0.02,
    outlineColor: 'white',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    renderOrder: 1000,
  };

  // 位置：在ATP公式下方，靠近光反应区域
  const baseX = -3.9; // 与ATP公式对齐
  const baseY = 1.2; // 向上移动0.2单位
  const baseZ = 1;

  return (
    <group>
      {/* 公式：NADP⁺ + H⁺ →（电子传递链）NADPH */}
      <group position={[baseX, baseY, baseZ]}>
        {/* NADP⁺ */}
        <Text {...commonProps} position={[-1.5, 0, 0]} color="#9333ea">
          NADP
        </Text>
        <Text {...commonProps} position={[-0.6, supY, 0]} fontSize={fontSize * supScale} color="#9333ea">
          +
        </Text>

        {/* + */}
        <Text {...commonProps} position={[-0.15, 0, 0]} color="#333">
          +
        </Text>

        {/* H⁺ */}
        <Text {...commonProps} position={[0.25, 0, 0]} color="#dc2626">
          H
        </Text>
        <Text {...commonProps} position={[0.6, supY, 0]} fontSize={fontSize * supScale} color="#dc2626">
          +
        </Text>

        {/* → */}
        <Text {...commonProps} position={[1.0, 0, 0]} color="#333">
          →
        </Text>

        {/* 电子传递链标注 */}
        <Text {...commonProps} position={[1.0, 0.4, 0]} fontSize={fontSize * 0.6} color="#333">
          电子传递链
        </Text>

        {/* NADPH - 拉开与箭头的距离 */}
        <Text {...commonProps} position={[2.0, 0, 0]} color="#a855f7">
          NADPH
        </Text>
      </group>

      {/* 标签说明已删除 */}
    </group>
  );
}