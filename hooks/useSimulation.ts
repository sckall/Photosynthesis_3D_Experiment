import { useState, useEffect, useRef } from 'react';
import { SimulationState, HistoryData } from '../types';
import { MAX_HISTORY, SIM_SPEED, TIME_STEP, INITIAL_STATE } from '../constants';

interface UseSimulationProps {
  lightIntensity: number;
  co2Level: number;
  isLightOn: boolean;
  isPaused: boolean;
}

export function useSimulation({
  lightIntensity,
  co2Level,
  isLightOn,
  isPaused,
}: UseSimulationProps) {
  // 模拟状态（使用 ref 以提升性能）
  const simState = useRef<SimulationState>({ ...INITIAL_STATE });
  const simTimeRef = useRef(0);
  const nextMarkerRef = useRef<string | null>(null);
  const [simTime, setSimTime] = useState(0);

  // 缓慢变化的内部状态（用于平滑曲线切换，模拟生物滞后效应）
  const smoothedLightRef = useRef(isLightOn ? lightIntensity : 0);
  const smoothedCO2Ref = useRef(co2Level);

  // --- 绝对含量模型参数（教学用 a.u.，保证曲线在视图中可读） ---
  // 标准条件（控制台面板中间值）
  const I_STD = 12000; // lx（教学视图）
  const C_STD = 420; // μL/L（教学视图，实际对应内部2100）
  
  // CO2浓度内部放大系数（界面0-1000映射到内部0-5000）
  const CO2_SCALE = 5.0;

  // 绝对池大小（调整C5基准值以避免与P总曲线重叠）
  const C5_BASE = 120;  // 上调以与P总曲线错开
  const C3_BASE = 200;

  // 能量池与前体池（守恒）
  const ENERGY_MAX = 200; // E_max
  const PRECURSOR_TOTAL = 200; // D_total

  // 速率尺度
  const P_MAX = 200; // P_max（a.u.）

  // 半饱和常数（按教学单位取值，让变化更明显）
  const K_I = I_STD; // 光半饱和点约在标准光照附近
  const K_C = 60; // CO2 米氏常数（需根据内部5倍缩放相应调整）
  const EPS = 0.003; // 防止除零（极小值以实现最大C3/C5变化幅度）
  const ALPHA = 0.7; // 能量消耗比例系数
  const CO2_AMPLIFY = 3.8; // CO2影响放大系数（增强波动幅度以更好观察变化）

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const computeAbs = (I: number, C: number) => {
    const fI = I <= 0 ? 0 : I / (I + K_I);
    // CO2浓度内部放大（界面0-1000映射到计算0-5000）
    const C_internal = C * CO2_SCALE;
    const fC = C_internal <= 0 ? 0 : C_internal / (C_internal + K_C);
    
    // 对CO2浓度因子使用幂次变换以增强响应幅度（所有曲线统一使用）
    const fC_enhanced = Math.pow(fC, CO2_AMPLIFY);
    
    // P总：使用增强的CO2因子以放大CO2浓度的影响
    const pTotal = P_MAX * fI * fC_enhanced;
    
    // 能量：增强CO2浓度的影响（使用更大的系数和非线性fC）
    const energy = ENERGY_MAX * (fI * (1 - ALPHA * fC_enhanced * 0.8));
    const precursor = clamp(PRECURSOR_TOTAL - energy, 0, PRECURSOR_TOTAL);

    // C3/C5：使用增强的非线性响应
    const c3Raw = fC_enhanced / (fI + EPS);
    const c5Raw = fI / (fC_enhanced + EPS);

    const fI0 = I_STD / (I_STD + K_I);
    const C_STD_internal = C_STD * CO2_SCALE;
    const fC0 = C_STD_internal / (C_STD_internal + K_C);
    const fC0_enhanced = Math.pow(fC0, CO2_AMPLIFY);
    const c3Raw0 = fC0_enhanced / (fI0 + EPS);
    const c5Raw0 = fI0 / (fC0_enhanced + EPS);

    const c3 = C3_BASE * (c3Raw0 > 0 ? c3Raw / c3Raw0 : 0);
    const c5 = C5_BASE * (c5Raw0 > 0 ? c5Raw / c5Raw0 : 0);

    return {
      c3: clamp(c3, 0, 1000),
      c5: clamp(c5, 0, 1000),
      pTotal: clamp(pTotal, 0, 1000),
      energy: clamp(energy, 0, 1000),
      precursor: clamp(precursor, 0, 1000),
    };
  };

  // 历史数据（React State 用于触发重渲染）——存“绝对含量”
  const [history, setHistory] = useState<HistoryData>(() => {
    const init = computeAbs(I_STD, C_STD);
    return {
      time: new Array(MAX_HISTORY).fill(0),
      c3: new Array(MAX_HISTORY).fill(init.c3),
      c5: new Array(MAX_HISTORY).fill(init.c5),
      pTotal: new Array(MAX_HISTORY).fill(init.pTotal),
      energy: new Array(MAX_HISTORY).fill(init.energy),
      precursor: new Array(MAX_HISTORY).fill(init.precursor),
      markers: new Array(MAX_HISTORY).fill(null) as (string | null)[],
    };
  });

  // 主模拟循环
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const state = simState.current;
      simTimeRef.current += TIME_STEP;
      // 定期更新 simTime 以触发 UI 更新
      if (Math.floor(simTimeRef.current * 2) !== Math.floor(simTime * 2)) {
        setSimTime(simTimeRef.current);
      }

      // --- 1. 输入（光照/CO2）+ 生物滞后平滑（让斜率更小） ---
      const targetLight = isLightOn ? lightIntensity : 0;
      const targetCO2 = co2Level;

      // 平滑处理：每帧向目标值靠近（模拟生物滞后效应）
      // 调整系数控制放缓程度：0.005 使得变化更加极其缓慢平滑，模拟生物反应的迟滞
      smoothedLightRef.current += (targetLight - smoothedLightRef.current) * 0.005;
      smoothedCO2Ref.current += (targetCO2 - smoothedCO2Ref.current) * 0.005;

      const I_abs = smoothedLightRef.current;
      const C_abs = smoothedCO2Ref.current;

      // --- 2. 计算绝对含量（用于曲线图） ---
      const abs = computeAbs(I_abs, C_abs);

      // --- 3. 同步 3D 动画内部量纲（保持“平衡条件下 50”） ---
      state.atp = (I_abs / 50000) * 100;
      state.nadph = (I_abs / 50000) * 100;
      state.c3 = (abs.c3 / C3_BASE) * 50;
      state.c5 = (abs.c5 / C5_BASE) * 50;

      // --- 3. 更新历史数据 (存入相对含量) ---
      const marker = nextMarkerRef.current;
      nextMarkerRef.current = null;

      setHistory((prev) => {
        const shiftAndPush = <T,>(arr: T[], val: T): T[] => {
          const newArr = arr.slice(1);
          newArr.push(val);
          return newArr;
        };
        return {
          time: shiftAndPush(prev.time, parseFloat(simTimeRef.current.toFixed(1))),
          c3: shiftAndPush(prev.c3, abs.c3),
          c5: shiftAndPush(prev.c5, abs.c5),
          pTotal: shiftAndPush(prev.pTotal, abs.pTotal),
          energy: shiftAndPush(prev.energy, abs.energy),
          precursor: shiftAndPush(prev.precursor, abs.precursor),
          markers: shiftAndPush(prev.markers, marker),
        };
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [lightIntensity, co2Level, isLightOn, isPaused]);

  // 设置事件标记
  const setMarker = (marker: string) => {
    nextMarkerRef.current = marker;
  };

  // 重置功能（可选参数允许直接指定目标条件，避免状态更新延迟问题）
  const resetSimulation = (targetLightIntensity?: number, targetCO2Level?: number) => {
    simState.current = { ...INITIAL_STATE };
    simTimeRef.current = 0;
    setSimTime(0);
    // 使用传入的目标值，如果未提供则使用当前值
    const targetLight = targetLightIntensity !== undefined 
      ? targetLightIntensity 
      : (isLightOn ? lightIntensity : 0);
    const targetCO2 = targetCO2Level !== undefined ? targetCO2Level : co2Level;
    
    smoothedLightRef.current = targetLight;
    smoothedCO2Ref.current = targetCO2;
    // 使用目标条件计算初始值（确保准确）
    const init = computeAbs(targetLight, targetCO2);
    setHistory({
      time: new Array(MAX_HISTORY).fill(0),
      c3: new Array(MAX_HISTORY).fill(init.c3),
      c5: new Array(MAX_HISTORY).fill(init.c5),
      pTotal: new Array(MAX_HISTORY).fill(init.pTotal),
      energy: new Array(MAX_HISTORY).fill(init.energy),
      precursor: new Array(MAX_HISTORY).fill(init.precursor),
      markers: new Array(MAX_HISTORY).fill(null) as (string | null)[],
    });
  };

  return {
    simState: simState.current,
    history,
    simTime,
    setMarker,
    resetSimulation,
  };
}

