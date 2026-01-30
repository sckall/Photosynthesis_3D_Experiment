import * as THREE from 'three';

export interface SimulationState {
  atp: number;
  nadph: number;
  c3: number;
  c5: number;
  sugar: number;
}

export interface HistoryData {
  time: number[];
  c3: number[];
  c5: number[];
  pTotal: number[];
  energy: number[];
  precursor: number[];
  markers: (string | null)[];
}

export interface RealTimeChartProps {
  data: HistoryData;
  height?: number;
  mode?: 'follow' | 'global';
}

export interface SimulationConfig {
  lightIntensity: number;
  co2Level: number;
  isLightOn: boolean;
  isPaused: boolean;
}

export interface SimulationResult {
  c3: number;
  c5: number;
  pTotal: number;
  energy: number;
  precursor: number;
}

export type CarrierState = 'C5' | 'C3x2' | 'G3Px2';

export type FreezeReason = 'NONE' | 'NO_CO2_AT_FIXATION' | 'NO_ENERGY_AT_A';

export interface Carrier {
  progress: number;
  state: CarrierState;
  frozen: boolean;
  freezeReason: FreezeReason;
  waitingForCO2: boolean;
  waitingForEnergy: boolean;
}

export type CO2Phase = 'INCOMING' | 'AT_CHECKPOINT' | 'BINDING' | 'DONE';

export interface CO2Particle {
  id: string;
  phase: CO2Phase;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  carrierIndex?: number;
  opacity: number;
}

export type EnergyPhase = 'INCOMING' | 'AT_REDUCTION' | 'DONE';

export interface EnergyParticle {
  id: string;
  phase: EnergyPhase;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  opacity: number;
}

export interface StarchParticle {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  opacity: number;
  scale: number;
}

export interface CalvinCycleRingLogicProps {
  isPaused: boolean;
  isLightOn: boolean;
  lightIntensity: number;
  co2Level: number;
  showLabels: boolean;
  count?: number;
  radius?: number;
  onReductionReaction?: () => void;
  energyPairCount?: number;
  consumeEnergyPair?: () => void;
}

export interface EnergyCycleSystemProps {
  active: boolean;
  loopDuration?: number;
  showLabels?: boolean;
  energyInSpawns?: Array<{ id: string }>;
  onEnergyArrive?: (id: string) => void;
  energyAtReduction?: Array<{ id: string }>;
  returnSpawns?: Array<{ id: string; type: 'ADP/NADP+' }>;
  onReturnDone?: (id: string) => void;
}

export interface ParticleConfig {
  angle: number;
  y: number;
  speed: number;
  offset: number;
}

export interface ElectronSwarmProps {
  count?: number;
  active: boolean;
  radius?: number;
}

export interface ThylakoidProps {
  position: [number, number, number];
  scale?: number;
  lightIntensity: number;
  isHovered: boolean;
}

export interface GranumProps {
  position: [number, number, number];
  height?: number;
  lightIntensity: number;
  onClick: () => void;
  active: boolean;
}

export interface MoleculeGroupProps {
  position: [number, number, number];
  color: string;
  label: string;
  showLabels?: boolean;
}

export interface ChemicalTextProps {
  label: string;
  position?: [number, number, number];
  fontSize?: number;
  color?: string;
  outlineWidth?: number;
  outlineColor?: string;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
}

export interface ViewportProps {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  isPaused: boolean;
  isLightOn: boolean;
  lightIntensity: number;
  co2Level: number;
  simState: SimulationState;
}

export interface SidebarProps {
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  isLightOn: boolean;
  toggleLight: () => void;
  lightIntensity: number;
  setLightIntensity: (intensity: number) => void;
  co2Level: number;
  setCo2Level: (level: number) => void;
  simTime: number;
}

export interface ChartPanelProps {
  history: HistoryData;
}

// 实验模式类型
export type ExperimentMode = 'selection' | 'o2-source' | 'electron-flow' | 'calvin-cycle' | 'env-factors';

// 实验1：O2来源 - 同位素标记类型
export type IsotopeLabel = 'none' | 'h2o' | 'co2';

// 实验1状态
export interface O2SourceExperimentState {
  selectedLabel: IsotopeLabel;
  isRunning: boolean;
  showResult: boolean;
  completedSchemes: {
    co2: boolean;
    h2o: boolean;
  };
  showWaterPhotolysis: boolean; // 显示"水的光解"模型
}

// 质谱数据
export interface MassSpectrumData {
  time: number[];
  intensity: number[];
  peaks: Array<{
    time: number;
    mz: number;
    compound: string;
  }>;
}

// 3D模型可见性配置
export interface ModelVisibility {
  membrane: boolean;
  basicMolecules: boolean; // H2O, CO2, O2, Sugar
  thylakoid: boolean;
  electronChain: boolean;
  atpSynthase: boolean;
  calvinCycle: boolean;
  calvinIntermediates: boolean;
}

// 模型构建状态（渐进式构建，全局保存）
export interface ModelBuildState {
  // 实验1完成后添加
  waterPhotolysis: boolean; // 4e⁻ 和 4H⁺ 虚线箭头
  // 实验2完成后添加
  atpSynthase: boolean; // ATP合成酶
  nadphFormation: boolean; // NADPH形成
  // 实验3完成后添加（后续实现）
  calvinCycleElements: boolean;
}

// =============================================
// 实验2：电子的去向 - 类型定义
// =============================================

// 缓冲液类型
export type BufferType = 'none' | 'ph4' | 'ph8';

// 添加剂类型
export interface Additives {
  adp: boolean;
  pi: boolean;
  dnp: boolean;      // 解偶联剂
  inhibitor: boolean; // ATP合成酶抑制剂
}

// 单次实验记录
export interface ExperimentRecord {
  id: number;
  buffer: BufferType;
  additives: Additives;
  outerH: string;       // 膜外[H⁺]浓度 (科学计数法)
  innerH: string;       // 膜内[H⁺]浓度 (科学计数法)
  atpProduced: boolean; // 是否产生ATP
}

// 实验2状态
export interface ElectronFlowExperimentState {
  selectedBuffer: BufferType;
  additives: Additives;
  isRunning: boolean;
  showResult: boolean;
  records: ExperimentRecord[];
  // 五种典型实验的完成状态
  completedExperiments: {
    ph4WithADPPi: boolean;      // pH=4+ADP+Pi（对照）
    ph8Only: boolean;           // pH=8（对照）
    ph8WithADPPi: boolean;      // pH=8+ADP+Pi（成功产生ATP）
    ph8WithADPPiDNP: boolean;   // pH=8+ADP+Pi+DNP（无ATP）
    ph8WithADPPiInhibitor: boolean; // pH=8+ADP+Pi+抑制剂（无ATP）
  };
  showATPSynthase: boolean;     // 显示ATP合成酶模型
  showNADPHMaterial: boolean;   // 显示NADPH材料
  showNADPHFormula: boolean;    // 在3D中显示NADPH公式
}

// =============================================
// 实验3：卡尔文循环模型建构 - 占位节点状态
// =============================================
export interface CalvinPlaceholderNode {
  id: string;
  label: string;          // 显示的文本（占位时为"占位节点"，填充后为实际物质名）
  filled: boolean;        // 是否已填充
  filledWith?: string;    // 填充的物质ID
}

export interface CalvinPlaceholderState {
  nodes: {
    c3: CalvinPlaceholderNode;
    c5: CalvinPlaceholderNode;
    atp: CalvinPlaceholderNode;
    nadph: CalvinPlaceholderNode;
    adp: CalvinPlaceholderNode;
    nadp: CalvinPlaceholderNode;
  };
}