import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

type CalvinLabel = 'C5' | 'C3' | 'G3P';

interface InstanceVisual {
  label: CalvinLabel;
  color: string;
}

interface FrozenState {
  frozen: boolean;
  // 冻结时的位置（局部坐标系，位于 cycle group 内）
  pos: THREE.Vector3;
  // 冻结时的视觉
  visual: InstanceVisual;
}

export interface CalvinCycleInstancesProps {
  /** 全局暂停（true 时完全停止运动与冻结逻辑） */
  isPaused: boolean;
  /** 能量是否足够（ATP/NADPH） */
  energyAvailable: boolean;
  /** 实例数量（你要的 5 组分子） */
  count?: number;
  /** 环半径（与原模型一致） */
  radius?: number;
}

const DURATION = 10;
const REDUCTION_ENTRY_T = 3.5; // 还原入口（ATP/NADPH 结合位点附近）

function getVisualForTime(t: number): InstanceVisual {
  // 0-3.5: Fixation; 3.5-7: Reduction; 7-10: Regeneration
  if (t < 3.5) {
    if (t > 1.5) return { label: 'C3', color: '#dc2626' };
    return { label: 'C5', color: '#9333ea' };
  }
  if (t < 7) {
    if (t < 4.0) return { label: 'C3', color: '#dc2626' };
    return { label: 'G3P', color: '#f97316' };
  }
  if (t > 9.4) return { label: 'C5', color: '#9333ea' };
  return { label: 'G3P', color: '#f97316' };
}

function getPosForTime(t: number, radius: number): THREE.Vector3 {
  // Angles: Top (PI/2), Left (PI), Bottom (3PI/2)
  const angleTop = Math.PI / 2;
  const angleLeft = Math.PI;
  const angleBottom = (3 * Math.PI) / 2;
  const angleTopEnd = angleTop + 2 * Math.PI;

  let currentAngle = angleTop;
  if (t < 3.5) {
    const p = t / 3.5;
    currentAngle = THREE.MathUtils.lerp(angleTop, angleLeft, p);
  } else if (t < 7) {
    const p = (t - 3.5) / 3.5;
    currentAngle = THREE.MathUtils.lerp(angleLeft, angleBottom, p);
  } else {
    const p = (t - 7) / 3;
    currentAngle = THREE.MathUtils.lerp(angleBottom, angleTopEnd, p);
  }

  return new THREE.Vector3(radius * Math.cos(currentAngle), radius * Math.sin(currentAngle), 0);
}

export default function CalvinCycleInstances({
  isPaused,
  energyAvailable,
  count = 5,
  radius = 2.5,
}: CalvinCycleInstancesProps) {
  // 每个实例均匀分布（初始状况间隔相当）
  const offsets = useMemo(() => new Array(count).fill(0).map((_, i) => (i * DURATION) / count), [count]);

  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const prevTRef = useRef<number[]>(new Array(count).fill(0));
  const frozenRef = useRef<FrozenState[]>(
    new Array(count).fill(0).map(() => ({
      frozen: false,
      pos: new THREE.Vector3(),
      visual: { label: 'C5', color: '#9333ea' },
    })),
  );

  // 仅用于触发 React 更新（标签文本），位置用 three ref 更新更平滑
  const [labels, setLabels] = useState<InstanceVisual[]>(new Array(count).fill(0).map(() => ({ label: 'C5', color: '#9333ea' })));

  // 当能量恢复：解冻所有实例
  const lastEnergyRef = useRef<boolean>(energyAvailable);
  if (lastEnergyRef.current !== energyAvailable) {
    lastEnergyRef.current = energyAvailable;
    if (energyAvailable) {
      frozenRef.current.forEach((f) => {
        f.frozen = false;
      });
    }
  }

  useFrame((state) => {
    if (isPaused) return;

    const tGlobal = state.clock.elapsedTime;
    const nextLabels = labels.slice();
    let labelsChanged = false;

    for (let i = 0; i < count; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;

      const t = (tGlobal + offsets[i]) % DURATION;
      const prevT = prevTRef.current[i];
      prevTRef.current[i] = t;

      const frozen = frozenRef.current[i];

      // 无能量：实例依次运行到“还原入口位点”后冻结，形成 C3 堆积
      // 检测跨越 3.5s（处理循环回绕）
      const crossedReductionEntry =
        (prevT < REDUCTION_ENTRY_T && t >= REDUCTION_ENTRY_T) ||
        (prevT > t && (prevT < DURATION || t >= 0) && t >= REDUCTION_ENTRY_T); // wrap case

      if (!energyAvailable && !frozen.frozen && crossedReductionEntry) {
        frozen.frozen = true;
        frozen.pos.copy(getPosForTime(REDUCTION_ENTRY_T, radius));
        frozen.visual = { label: 'C3', color: '#dc2626' };
      }

      if (frozen.frozen) {
        grp.position.copy(frozen.pos);
        grp.scale.setScalar(1.05);
        const v = frozen.visual;
        if (nextLabels[i].label !== v.label || nextLabels[i].color !== v.color) {
          nextLabels[i] = v;
          labelsChanged = true;
        }
        continue;
      }

      // 正常运动
      const pos = getPosForTime(t, radius);
      grp.position.copy(pos);

      // 进入“反应窗口”时做轻微闪烁（视觉提示结合/反应）
      if (t > 3.5 && t < 4.0) {
        const p = (t - 3.5) / 0.5;
        const flashScale = 1 + Math.sin(p * Math.PI) * 0.25;
        grp.scale.setScalar(flashScale);
      } else {
        grp.scale.setScalar(1);
      }

      const v = getVisualForTime(t);
      if (nextLabels[i].label !== v.label || nextLabels[i].color !== v.color) {
        nextLabels[i] = v;
        labelsChanged = true;
      }
    }

    if (labelsChanged) setLabels(nextLabels);
  });

  return (
    <group position={[4, 1, 0]}>
      {/* 环 */}
      <mesh>
        <torusGeometry args={[2.5, 0.1, 16, 100]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.3} />
      </mesh>

      {/* 阶段标签 */}
      <Text position={[-2, 2, 0]} fontSize={0.25} color="#4b5563" renderOrder={1000}>
        1. 碳固定 (Fixation)
      </Text>
      <Text position={[-3, -1, 0]} fontSize={0.25} color="#4b5563" renderOrder={1000}>
        2. 还原 (Reduction)
      </Text>
      <Text position={[2, -1, 0]} fontSize={0.25} color="#4b5563" renderOrder={1000}>
        3. 再生 (Regeneration)
      </Text>

      {/* 还原入口位点标注（结合位点） */}
      <group position={getPosForTime(REDUCTION_ENTRY_T, radius).toArray() as any}>
        <mesh>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={energyAvailable ? 0.25 : 0.45} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[0, 0.9, 0]} fontSize={0.2} color="#b91c1c" renderOrder={1000}>
          C3 + ATP/NADPH
        </Text>
      </group>

      {/* 5 个实例 */}
      {new Array(count).fill(0).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial color={labels[i]?.color} emissive={labels[i]?.color} emissiveIntensity={0.55} />
          </mesh>
          <Text position={[0, 0.55, 0]} fontSize={0.28} color="black" outlineWidth={0.02} outlineColor="white" renderOrder={1000}>
            {labels[i]?.label ?? 'C5'}
          </Text>
        </group>
      ))}
    </group>
  );
}


