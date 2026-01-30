import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChemicalText } from '../ChemicalText';

/**
 * 教学用“近似但有科学性”的卡尔文循环状态机（以环形轨迹演示）：
 * - 固定点（CO₂进入/结合）：C5(RuBP) + CO₂ -> C3×2(3-PGA)
 * - 还原点（ATP/NADPH 到达并参与反应）：C3×2 + ATP/NADPH -> G3P×2 + ADP/NADP+
 * - 环下半部（产出淀粉/糖类的演示位点）：G3P×2 -> (产出淀粉粒) + 再生回 C5（示意）
 *
 * 说明：真实计量更复杂（多分子汇总），这里用“每个载体实例=一套反应包”做可视化简化。
 */
type CarrierState = 'C5' | 'C3x2' | 'G3Px2';
type FreezeReason = 'NONE' | 'NO_CO2_AT_FIXATION' | 'NO_ENERGY_AT_A';

interface Carrier {
  progress: number; // 0~1, 以 A 点为起点，逆时针递增
  state: CarrierState;
  frozen: boolean;
  freezeReason: FreezeReason;
  // 在固定点等待 CO2 结合（CO2 没来/不够时会卡在这里）
  waitingForCO2: boolean;
  // 在还原点等待 ATP/NADPH（任意一个没到就停在还原点）
  waitingForEnergy: boolean;
}

export interface CalvinCycleRingLogicProps {
  isPaused: boolean;
  isLightOn: boolean;
  lightIntensity: number; // 0~50000 lx
  co2Level: number; // 0~1000 μL/L
  showLabels: boolean;
  count?: number; // 默认 5
  radius?: number; // 默认 2.5
  /** 还原点成功反应（消耗ATP+NADPH，生成G3P）时触发，用于在叶绿体模型里生成 ADP/NADP+ 回流动画 */
  onReductionReaction?: () => void;
  /** 还原点可用 ATP/NADPH “对”数量（由外部沿黄色轨道运输并到达还原点后提供） */
  energyPairCount?: number;
  /** 消耗 1 对 ATP/NADPH（反应成功时调用） */
  consumeEnergyPair?: () => void;
  /** 实验三模式：隐藏 CO₂ 粒子和载体分子（只保留轨道和标注） */
  hideParticles?: boolean;
}

const TAU = Math.PI * 2;

// A 点（C3 + ATP/NADPH 结合位点）设定为起点：角度 PI（圆左侧）
const ANGLE_A = Math.PI;
// 固定点：从 A 出发逆时针 3/4 圈 => + 1.5π => 落在圆顶部（π/2）
const ANGLE_FIXATION = Math.PI / 2;

function angleFromProgress(p: number): number {
  return ANGLE_A + p * TAU;
}

function posOnRing(radius: number, p: number): THREE.Vector3 {
  const a = angleFromProgress(p);
  return new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), 0);
}

function isCrossing(prev: number, next: number, target: number): boolean {
  // progress 单调增加但会回绕（1->0）
  if (prev <= next) return prev < target && next >= target;
  // wrap case
  return prev < target || next >= target;
}

type CO2Phase = 'INCOMING' | 'AT_CHECKPOINT' | 'BINDING' | 'DONE';
interface CO2Particle {
  id: string;
  phase: CO2Phase;
  pos: THREE.Vector3;
  // phase 为 INCOMING 时：目标是 checkpoint
  // phase 为 BINDING 时：目标是 carrier 的 group
  targetPos: THREE.Vector3;
  // 可选：绑定的载体索引
  carrierIndex?: number;
  opacity: number;
}

type EnergyPhase = 'INCOMING' | 'AT_REDUCTION' | 'DONE';
interface EnergyParticle {
  id: string;
  phase: EnergyPhase;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  opacity: number;
}

type StarchParticle = {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  opacity: number;
  scale: number;
};

export default function CalvinCycleRingLogic({
  isPaused,
  isLightOn,
  lightIntensity,
  co2Level,
  showLabels,
  onReductionReaction,
  energyPairCount = 0,
  consumeEnergyPair,
  count = 5,
  radius = 2.5,
  hideParticles = false,
}: CalvinCycleRingLogicProps) {
  // 5 组分子初始位置分布（等距间隔 0.2，逆时针顺序）：
  // 还原点(0) → 再生点(0.25) → 固定点(0.75) → 还原点(1)
  // 要求：C5在再生点之后，G3P在还原点和再生点之间，C3在固定点和还原点之间
  const carriersRef = useRef<Carrier[]>(
    [
      // G3P：在还原点(0)和再生点(0.25)之间
      { progress: 0.1, state: 'G3Px2' as const, frozen: false, freezeReason: 'NONE' as const, waitingForCO2: false, waitingForEnergy: false },
      // C5：在再生点(0.25)和固定点(0.75)之间
      { progress: 0.3, state: 'C5' as const, frozen: false, freezeReason: 'NONE' as const, waitingForCO2: false, waitingForEnergy: false },
      { progress: 0.5, state: 'C5' as const, frozen: false, freezeReason: 'NONE' as const, waitingForCO2: false, waitingForEnergy: false },
      { progress: 0.7, state: 'C5' as const, frozen: false, freezeReason: 'NONE' as const, waitingForCO2: false, waitingForEnergy: false },
      // C3：在固定点(0.75)和还原点(1/0)之间
      { progress: 0.9, state: 'C3x2' as const, frozen: false, freezeReason: 'NONE' as const, waitingForCO2: false, waitingForEnergy: false },
    ].slice(0, count) as Carrier[],
  );

  const carrierRefs = useRef<(THREE.Group | null)[]>([]);
  const prevProgressRef = useRef<number[]>([]);

  // 初始化 prevProgressRef 为载体的初始 progress，确保第一次检测正确
  React.useEffect(() => {
    prevProgressRef.current = carriersRef.current.map(c => c.progress);
  }, []);

  // 说明：ATP/NADPH 的“沿黄色轨道运输”由外层 `EnergyCycleSystem` 负责，这里只消费到达还原点后的计数。

  // CO2 粒子：可见进入与结合动画（替代"只加 token 的计数器"）
  const fixationP = 0.75; // 固定点位置
  const co2ParticlesRef = useRef<CO2Particle[]>([]);
  const co2AvailableRef = useRef(1); // 已到达 checkpoint、尚未被消耗的 CO2 数量（初始为1，确保一开始就能产生C3）
  // 初始累积值设为 0.7，让第一个 CO₂ 更快释放（约 0.3 秒后）
  const co2AccRef = useRef(0.7);
  
  // 初始化：在固定点放置一个 CO₂ 粒子（只在组件挂载时执行一次）
  React.useEffect(() => {
    const fixationPos = posOnRing(radius, fixationP);
    // 检查是否已经初始化过
    if (co2ParticlesRef.current.length === 0 || !co2ParticlesRef.current.find(p => p.id === 'initial_co2')) {
      co2ParticlesRef.current.push({
        id: 'initial_co2',
        phase: 'AT_CHECKPOINT',
        pos: fixationPos.clone(),
        targetPos: fixationPos.clone(),
        opacity: 1,
      });
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // G3P粒子和葡萄糖粒子（演示产物输出）
  const starchParticlesRef = useRef<StarchParticle[]>([]);
  const g3pCountRef = useRef(0); // 1/3 G3P 计数
  const glucoseCountRef = useRef(0); // 葡萄糖计数

  // UI 展示用
  const [, forceRerender] = useState(0);

  useFrame((state, delta) => {
    if (isPaused) return;

    // 关键修复：避免“同一帧内多个载体同时看到 energyPairCount>0，从而一颗能量触发一群 C3×2 都变 G3P”的竞态
    // 用本帧本地计数做“原子扣减”，保证 1 对 ATP/NADPH 只能驱动 1 个 C3×2 转化
    let availableEnergyPairsThisFrame = energyPairCount;

    // 2) CO2 进入（到达检查点）
    // 平衡点计算：5个载体 × 0.043速度 = 0.215个/秒，每个载体需要1个CO₂
    // 当CO₂浓度=420 μL/L（范围0-1000）时，生成速率应为0.215个/秒
    // 归一化：420/1000 = 0.42，速率 = 0.42 * 系数 = 0.215，所以系数 = 0.512
    const normalizedCO2 = co2Level / 1000; // 归一化到 0-1
    const co2Rate = normalizedCO2 * 0.512; // 平衡系数
    co2AccRef.current += co2Rate * delta;
    if (co2AccRef.current >= 1) {
      const add = Math.floor(co2AccRef.current);
      // 每个 token 生成一个可见 CO2 粒子，从细胞外向 checkpoint 运动
      for (let k = 0; k < add; k++) {
        const start = new THREE.Vector3(radius + 3.2, radius + 2.2, 0); // 右上方细胞外
        const target = posOnRing(radius, 0.75); // 固定点（3/4圈）
        co2ParticlesRef.current.push({
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          phase: 'INCOMING',
          pos: start,
          targetPos: target.clone(),
          opacity: 1,
        });
      }
      co2AccRef.current -= add;
    }

    // 3) 分子沿环逆时针运动（progress 增加）
    // 载体速度调整：从固定点到还原点的时间间隔 = 生成光反应产物的时间间隔
    // 固定点 progress=0.75，还原点 progress=0（或1），间隔 0.25
    // 光反应产物生成速率 0.171 对/秒，每对间隔 5.85 秒
    // 载体速度 = 0.25 / 5.85 = 0.043，确保时间匹配
    const speed = 0.043; // 每秒跑一圈的比例（可调）
    const fixationP = 0.75; // 固定点（CO2结合）
    const starchP = 0.25; // 环下半部中心（产出淀粉示意点，对应圆底部）

    let needUI = false;

    // 2.1) 更新 CO2 粒子运动
    const fixationPos = posOnRing(radius, fixationP);
    const incomingSpeed = 1.54; // 降低30%飞入速度（单位：局部坐标/秒）
    const bindingSpeed = 2.1;
    const particles = co2ParticlesRef.current;
    for (const p of particles) {
      if (p.phase === 'DONE') continue;

      // BINDING 阶段：实时追踪目标载体，确保“一个 CO2 跟一个 G3P 结合”
      const target =
        p.phase === 'INCOMING'
          ? fixationPos
          : p.phase === 'BINDING' && p.carrierIndex !== undefined
            ? carrierRefs.current[p.carrierIndex]?.position ?? p.targetPos
            : p.targetPos;
      const v = target.clone().sub(p.pos);
      const dist = v.length();
      if (dist < 0.05) {
        if (p.phase === 'INCOMING') {
          p.phase = 'AT_CHECKPOINT';
          p.pos.copy(fixationPos);
          co2AvailableRef.current = Math.min(12, co2AvailableRef.current + 1);
          needUI = true;
        } else if (p.phase === 'BINDING') {
          // 结合完成：该载体立刻变成 C3×2（3-PGA），“两个 C3 跑出来”，并允许继续运动
          if (p.carrierIndex !== undefined) {
            const carrier = carriersRef.current[p.carrierIndex];
            carrier.state = 'C3x2';
            carrier.waitingForCO2 = false;
            carrier.freezeReason = 'NONE';
            needUI = true;
          }
          p.phase = 'DONE';
          p.opacity = 0;
          needUI = true;
        }
        continue;
      }

      const step = (p.phase === 'INCOMING' ? incomingSpeed : bindingSpeed) * delta;
      p.pos.add(v.multiplyScalar(Math.min(1, step / dist)));

      // 绑定时淡出
      if (p.phase === 'BINDING') {
        p.opacity = Math.max(0, p.opacity - delta * 1.2);
      }
    }
    // 清理 DONE 粒子
    if (particles.length > 60) {
      co2ParticlesRef.current = particles.filter((p) => p.phase !== 'DONE');
    }

    // 2.2) 更新淀粉粒子（简单抛出+淡出）
    for (const s of starchParticlesRef.current) {
      s.pos.addScaledVector(s.vel, delta);
      s.opacity = Math.max(0, s.opacity - delta * 0.6);
      s.scale = Math.max(0, s.scale - delta * 0.05);
    }
    if (starchParticlesRef.current.length > 80) {
      starchParticlesRef.current = starchParticlesRef.current.filter((s) => s.opacity > 0.02);
    }

    for (let i = 0; i < count; i++) {
      const carrier = carriersRef.current[i];
      const grp = carrierRefs.current[i];
      if (!grp) continue;

      const prevP = prevProgressRef.current[i];

      // 兼容：如果之前因为“无 CO2”被冻住在固定点，现在改为“持续等待 CO2（与门）”，避免永远卡死
      if (carrier.frozen && carrier.freezeReason === 'NO_CO2_AT_FIXATION') {
        carrier.frozen = false;
        carrier.waitingForCO2 = true;
        carrier.progress = fixationP;
        carrier.freezeReason = 'NONE';
      }

      // 兼容：如果之前因为“无能量”被冻住在还原点，现在改为“持续等待 ATP/NADPH（与门）”
      if (carrier.frozen && carrier.freezeReason === 'NO_ENERGY_AT_A') {
        carrier.frozen = false;
        carrier.waitingForEnergy = true;
        carrier.progress = 0;
        carrier.freezeReason = 'NONE';
      }

      if (!carrier.frozen && !carrier.waitingForCO2 && !carrier.waitingForEnergy) {
        carrier.progress = (carrier.progress + speed * delta) % 1;
      }

      const p = carrier.progress;
      prevProgressRef.current[i] = p;

      // 3.1) 到达固定点：C5 + CO2 -> C3×2
      if (!carrier.frozen && carrier.state === 'C5' && isCrossing(prevP, p, fixationP)) {
        // 到达固定点：先对齐到固定点，然后进入“与门等待”
        carrier.progress = fixationP;
        carrier.waitingForCO2 = true;
        needUI = true;
      }

      // 3.1.1) 固定点“与门事件”：
      // 条件A：固定点有 CO2（co2AvailableRef>0）
      // 条件B：此载体为 C5 且在固定点等待
      // AB 同时满足：消耗 1 个 C5 和 1 个 CO2，立刻生成 C3×2，并立刻离开固定点继续运动
      if (carrier.waitingForCO2) {
        // 只允许 C5 在固定点等 CO2；其他状态不应进入此分支
        if (carrier.state === 'C5') {
          if (co2AvailableRef.current > 0) {
            // 消耗 1 个 CO2 粒子（CO2 会在固定点持续停留，直到被消耗）
            const particle = co2ParticlesRef.current.find((p) => p.phase === 'AT_CHECKPOINT');
            if (particle) {
              co2AvailableRef.current -= 1;
              particle.phase = 'DONE';
              particle.opacity = 0;
            }

            // 触发反应：C5 + CO2 -> C3×2，并立刻离开固定点（推进一点点进度，避免看起来“黏住”）
            carrier.state = 'C3x2';
            carrier.waitingForCO2 = false;
            carrier.frozen = false;
            carrier.freezeReason = 'NONE';
            carrier.progress = (fixationP + 0.002) % 1;
            needUI = true;
          } else {
            // 没 CO2：继续停在固定点等待（不永久冻结）
            carrier.progress = fixationP;
            carrier.waitingForCO2 = true;
          }
        } else {
          carrier.waitingForCO2 = false;
        }
      }

      // 3.2) 回到 A 点：逻辑与门 AB
      // 条件A：起点存在 ATP 和 NADPH
      // 条件B：起点存在 C3（这里用 carrier.state === '2C3' 表示“起点有 C3”）
      // AB 发生：C3->G3P；ATP/NADPH->ADP/NADP+（这里用消耗 token + 视觉提示代替回流动画）
      if (isCrossing(prevP, p, 0)) {
        if (carrier.state === 'C3x2') {
          // 到达还原点：先对齐到还原点，然后进入“与门等待”
          carrier.progress = 0;
          carrier.waitingForEnergy = true;
          needUI = true;
        } else {
          // 其他状态在 A 点不需要事件，继续走
        }
      }

      // 3.3) 还原点“与门事件”：
      // 条件A：还原点有 ATP（atpRef>0）
      // 条件B：还原点有 NADPH（nadphRef>0）
      // 条件C：载体是 C3×2 且正在还原点等待
      // ABC 同时满足：消耗 1 ATP 与 1 NADPH，立刻生成 G3P×2，并立刻离开还原点继续运动
      if (carrier.waitingForEnergy) {
        if (carrier.state === 'C3x2') {
          const hasEnergyPair = availableEnergyPairsThisFrame > 0;
          if (hasEnergyPair) {
            // 本帧内先扣减，确保只消耗 1 对就只转化 1 个载体
            availableEnergyPairsThisFrame -= 1;
            consumeEnergyPair?.();
            carrier.state = 'G3Px2';
            carrier.waitingForEnergy = false;
            carrier.frozen = false;
            carrier.freezeReason = 'NONE';
            carrier.progress = 0.002; // 立刻“运出”，避免黏在点上
            needUI = true;
            onReductionReaction?.();
          } else {
            // 原料没到齐：继续停在还原点等待（不永久冻结）
            carrier.progress = 0;
            carrier.waitingForEnergy = true;
          }
        } else {
          carrier.waitingForEnergy = false;
        }
      }

      // 3.4) 环下半部产物输出（淀粉）：当 G3P×2 经过圆底部，输出“淀粉粒”并再生回 C5
      if (!carrier.frozen && carrier.state === 'G3Px2' && isCrossing(prevP, p, starchP)) {
        g3pCountRef.current += 1;
        
        // 每移出6个1/3 G3P产生一个葡萄糖
        if (g3pCountRef.current % 6 === 0) {
          glucoseCountRef.current += 1;
        }
        const emitPos = posOnRing(radius, starchP).add(new THREE.Vector3(0, -0.6, 0)); // 稍微往下偏一点
        starchParticlesRef.current.push({
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          pos: emitPos,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.9 - Math.random() * 0.6, 0),
          opacity: 0.9,
          scale: 1,
        });
        // 再生回 C5（示意）
        carrier.state = 'C5';
        needUI = true;
      }

      // 4) 渲染位置/样式
      const pos = posOnRing(radius, carrier.progress);

      // 视觉优化：当多个 C3×2 在还原点堆积时，把“成对小球”的整体位置稍微错开，避免完全重叠
      // 只在“C3×2 且等待能量且在还原点”时应用错位
      if (carrier.state === 'C3x2' && carrier.waitingForEnergy && Math.abs(carrier.progress) < 1e-6) {
        const waitingIndices = carriersRef.current
          .map((c, idx) => (c.state === 'C3x2' && c.waitingForEnergy && Math.abs(c.progress) < 1e-6 ? idx : -1))
          .filter((idx) => idx >= 0);
        const rank = waitingIndices.indexOf(i);
        if (rank >= 0) {
          const spacing = 0.36;
          const cols = 2;
          const col = rank % cols;
          const row = Math.floor(rank / cols);
          const offset = new THREE.Vector3((col - (cols - 1) / 2) * spacing, row * spacing, 0);
          pos.add(offset);
        }
      }
      grp.position.copy(pos);

      const isStuck = carrier.frozen || carrier.waitingForCO2 || carrier.waitingForEnergy;
      grp.scale.setScalar(isStuck ? 1.08 : 1.0);

      // 视觉：
      // - C5：单紫球
      // - C3×2：双红球（“两个 C3 跑出来”）
      // - G3P×2：双橙球
      const g3p = grp.getObjectByName('g3p') as THREE.Mesh | null;
      const c3a = grp.getObjectByName('c3a') as THREE.Mesh | null;
      const c3b = grp.getObjectByName('c3b') as THREE.Mesh | null;
      const c5 = grp.getObjectByName('c5') as THREE.Mesh | null;

      const isC5 = carrier.state === 'C5';
      const isC3x2 = carrier.state === 'C3x2';
      const isG3Px2 = carrier.state === 'G3Px2';

      if (c5) c5.visible = isC5;
      if (g3p) g3p.visible = false; // 旧单球不再使用（保留节点避免重构引用）
      if (c3a) c3a.visible = isC3x2 || isG3Px2;
      if (c3b) c3b.visible = isC3x2 || isG3Px2;

      // 上色
      const setMeshColor = (m: THREE.Mesh | null, color: string) => {
        if (m?.material && (m.material as any).color) {
          (m.material as THREE.MeshStandardMaterial).color.set(color);
          (m.material as THREE.MeshStandardMaterial).emissive.set(color);
        }
      };
      setMeshColor(c5, '#9333ea');
      if (isC3x2) {
        setMeshColor(c3a, '#dc2626');
        setMeshColor(c3b, '#dc2626');
      } else if (isG3Px2) {
        setMeshColor(c3a, '#f97316');
        setMeshColor(c3b, '#f97316');
      }
    }

    if (needUI) forceRerender((n) => n + 1);
  });

  const aPos = posOnRing(radius, 0);
  const fixationPos = posOnRing(radius, 0.75);
  const starchPos = posOnRing(radius, 0.25);

  // 当多个 C3×2 堆在还原点时，只保留一个 “C3×2” 标签，避免文字堆在一起
  const firstStackedC3AtReductionIdx = carriersRef.current.findIndex(
    (c) => c.state === 'C3x2' && c.waitingForEnergy && Math.abs(c.progress) < 1e-6,
  );

  return (
    <group position={[4, 1, 0]}>
      {/* 环形轨迹 */}
      <mesh renderOrder={-1}>
        <torusGeometry args={[radius, 0.1, 16, 100]} />
        <meshStandardMaterial color="#d1d5db" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      
      {/* 环中央循环箭头指示（逆时针） */}
      <Text position={[0, 0, 0]} fontSize={1.2} color="#ef4444" renderOrder={1000}>
        ↺
      </Text>

      {/* 还原点标注 */}
      <group position={aPos.toArray() as any}>
        <mesh renderOrder={-1}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {showLabels && (
          <Text position={[0, 0.9, 0]} fontSize={0.28} color="#b91c1c" renderOrder={1000}>
            还原点
          </Text>
        )}
        {showLabels && (
          <Text position={[0, -0.9, 0]} fontSize={0.25} color="#111827" renderOrder={1000}>
            ATP/NADPH:{energyPairCount}
          </Text>
        )}
      </group>

      {/* 3/4 圈 CO2 固定点 */}
      <group position={fixationPos.toArray() as any}>
        <mesh renderOrder={-1}>
          <ringGeometry args={[0.5, 0.65, 32]} />
          <meshBasicMaterial color="#6b7280" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {showLabels && (
          <group position={[0, 0.85, 0]}>
            <Text position={[-0.5, 0, 0]} fontSize={0.25} color="#374151" renderOrder={1000} anchorX="right" anchorY="middle">
              固定点：
            </Text>
            <ChemicalText label="CO2" position={[-0.15, 0, 0]} fontSize={0.25} color="#374151" outlineWidth={0.01} outlineColor="white" />
            <Text position={[0.35, 0, 0]} fontSize={0.25} color="#374151" renderOrder={1000} anchorX="left" anchorY="middle">
              (可用:{co2AvailableRef.current})
            </Text>
          </group>
        )}
      </group>

      {/* 环下半部产物（淀粉）区域标注 */}
      <group position={starchPos.toArray() as any}>
        <mesh renderOrder={-1}>
          <ringGeometry args={[0.45, 0.6, 32]} />
          <meshBasicMaterial color="#a16207" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {showLabels && (
          <>
            <Text position={[0, -0.85, 0]} fontSize={0.25} color="#92400e" renderOrder={1000}>
              葡萄糖产出:{glucoseCountRef.current}
            </Text>
            <Text position={[0, -1.1, 0]} fontSize={0.18} color="#92400e" renderOrder={1000}>
              1/3 G3P累计:{g3pCountRef.current}
            </Text>
          </>
        )}
      </group>

      {/* CO2 进入与结合粒子（实验三中隐藏） */}
      {!hideParticles && co2ParticlesRef.current
        .filter((p) => p.phase !== 'DONE')
        .map((p) => (
          <group key={p.id} position={p.pos.toArray() as any}>
            <mesh>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#6b7280" emissive="#6b7280" emissiveIntensity={0.25} transparent opacity={p.opacity} />
            </mesh>
            {showLabels && (
              <group renderOrder={1000}>
                <ChemicalText label="CO2" position={[0, 0.32, 0]} fontSize={0.22} color="#374151" outlineWidth={0.01} outlineColor="white" />
              </group>
            )}
          </group>
        ))}

      {/* 淀粉粒子（输出）（实验三中隐藏） */}
      {!hideParticles && starchParticlesRef.current
        .filter((s) => s.opacity > 0.02)
        .map((s) => (
          <group key={s.id} position={s.pos.toArray() as any} scale={[s.scale, s.scale, s.scale]}>
            <mesh>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.25} transparent opacity={s.opacity} />
            </mesh>
            {showLabels && (
              <Text position={[0, 0.28, 0]} fontSize={0.22} color="#92400e" renderOrder={1000}>
                G3P
              </Text>
            )}
          </group>
        ))}

      {/* 5 个交互实例（载体分子）（实验三中隐藏） */}
      {!hideParticles && new Array(count).fill(0).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            carrierRefs.current[i] = el;
          }}
        >
          {/* C5：单紫球 */}
          <mesh name="c5">
            <sphereGeometry args={[0.33, 24, 24]} />
            <meshStandardMaterial emissiveIntensity={0.6} />
          </mesh>
          {/* 保留旧节点，避免引用错误（现在不显示） */}
          <mesh name="g3p" visible={false}>
            <sphereGeometry args={[0.33, 24, 24]} />
            <meshStandardMaterial emissiveIntensity={0.6} />
          </mesh>

          {/* C3×2 / G3P×2：双球（由 useFrame 控制显隐与颜色） */}
          <mesh name="c3a" position={[-0.18, 0, 0]} visible={false}>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial emissiveIntensity={0.6} />
          </mesh>
          <mesh name="c3b" position={[0.18, 0, 0]} visible={false}>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial emissiveIntensity={0.6} />
          </mesh>
          {showLabels &&
            // C3×2 在还原点堆积时，只显示一个标签
            !(
              carriersRef.current[i]?.state === 'C3x2' &&
              carriersRef.current[i]?.waitingForEnergy &&
              Math.abs(carriersRef.current[i]?.progress ?? 0) < 1e-6 &&
              i !== firstStackedC3AtReductionIdx
            ) && (
            <Text position={[0, 0.55, 0]} fontSize={0.28} color="black" outlineWidth={0.02} outlineColor="white" renderOrder={1000}>
              {carriersRef.current[i]?.state === 'C5'
                ? 'C5'
                : carriersRef.current[i]?.state === 'C3x2'
                  ? 'C3×2'
                  : 'G3P×2'}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}


