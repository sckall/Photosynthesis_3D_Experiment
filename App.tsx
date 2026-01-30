import React, { useState } from 'react';
import Viewport from './components/Viewport';
import ChartPanel from './components/ChartPanel';
import Sidebar from './components/Sidebar';
import ExperimentSelector from './components/ExperimentSelector';
import O2SourceExperiment from './components/experiments/O2SourceExperiment';
import ElectronFlowExperiment from './components/experiments/ElectronFlowExperiment';
import CalvinCycleExperiment from './components/experiments/CalvinCycleExperiment';
import MassSpectrumChart from './components/experiments/MassSpectrumChart';
import ATPSynthesisTable from './components/experiments/ATPSynthesisTable';
import { useSimulation } from './hooks/useSimulation';
import { ExperimentMode, ModelVisibility, O2SourceExperimentState, ElectronFlowExperimentState, ModelBuildState, CalvinPlaceholderState } from './types';

export default function App() {
  // UI State
  const [showLabels, setShowLabels] = useState(true);
  // 默认值：12000 lx（范围 0-50000 lx），420 μL/L（范围 0-1000 μL/L）
  const [lightIntensity, setLightIntensity] = useState(12000); // 单位：lx
  const [co2Level, setCo2Level] = useState(420); // 单位：μL/L
  const [isLightOn, setIsLightOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // 实验模式状态
  const [experimentMode, setExperimentMode] = useState<ExperimentMode>('selection');

  // 实验4重置key（用于强制重新挂载组件，实现完全刷新）
  const [experiment4ResetKey, setExperiment4ResetKey] = useState(0);

  // 首次加载标识（用于显示欢迎标题，进入实验后不再显示）
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 实验1状态
  const [o2ExperimentState, setO2ExperimentState] = useState<O2SourceExperimentState>({
    selectedLabel: 'none',
    isRunning: false,
    showResult: false,
    completedSchemes: { co2: false, h2o: false },
    showWaterPhotolysis: false,
  });

  // 实验2状态
  const [electronFlowState, setElectronFlowState] = useState<ElectronFlowExperimentState>({
    selectedBuffer: 'none',
    additives: { adp: false, pi: false, dnp: false, inhibitor: false },
    isRunning: false,
    showResult: false,
    records: [],
    completedExperiments: {
      ph4WithADPPi: false,
      ph8Only: false,
      ph8WithADPPi: false,
      ph8WithADPPiDNP: false,
      ph8WithADPPiInhibitor: false,
    },
    showATPSynthase: false,
    showNADPHMaterial: false,
    showNADPHFormula: false,
  });

  // 全局模型构建状态（渐进式构建，返回实验选择界面时保持）
  const [modelBuildState, setModelBuildState] = useState<ModelBuildState>({
    waterPhotolysis: false,      // 实验1完成后添加：4e⁻和4H⁺
    atpSynthase: false,          // 实验2完成后添加：ATP合成酶
    nadphFormation: false,       // 实验2完成后添加：NADPH形成
    calvinCycleElements: false,  // 实验3完成后添加
  });

  // 实验3：卡尔文循环占位节点状态（全局保存，退出实验后仍保留）
  const [calvinPlaceholders, setCalvinPlaceholders] = useState<CalvinPlaceholderState>({
    nodes: {
      c3: { id: 'c3', label: '占位节点', filled: false },
      c5: { id: 'c5', label: '占位节点', filled: false },
      atp: { id: 'atp', label: '占位节点', filled: false },
      nadph: { id: 'nadph', label: '占位节点', filled: false },
      adp: { id: 'adp', label: '占位节点', filled: false },
      nadp: { id: 'nadp', label: '占位节点', filled: false },
    },
  });

  // 实验3验证完成状态（成功后永久保留）
  const [calvinModelValidated, setCalvinModelValidated] = useState(false);

  // 处理"水的光解"按钮点击 - 同时更新实验状态和全局模型状态
  const handleShowWaterPhotolysis = () => {
    setO2ExperimentState(prev => ({
      ...prev,
      showWaterPhotolysis: true
    }));
    // 永久保存到全局模型状态
    setModelBuildState(prev => ({
      ...prev,
      waterPhotolysis: true
    }));
  };

  // 处理实验2状态变化
  const handleElectronFlowChange = (state: ElectronFlowExperimentState) => {
    setElectronFlowState(state);
    // 如果显示了ATP合成酶，更新全局模型状态
    if (state.showATPSynthase && !modelBuildState.atpSynthase) {
      setModelBuildState(prev => ({
        ...prev,
        atpSynthase: true
      }));
    }
    // 如果显示了NADPH公式，更新全局模型状态
    if (state.showNADPHFormula && !modelBuildState.nadphFormation) {
      setModelBuildState(prev => ({
        ...prev,
        nadphFormation: true
      }));
    }
  };

  // 处理实验3占位节点填充
  const handlePlaceholderDrop = (nodeId: string, itemId: string) => {
    // 物质ID到显示名称的映射
    const labelMap: Record<string, string> = {
      c3: '2C₃',
      c5: 'C₅',
      atp: 'ATP',
      nadph: 'NADPH',
      adp: 'ADP+Pi',
      nadp: 'NADP⁺',
    };

    setCalvinPlaceholders(prev => {
      const next = {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...prev.nodes[nodeId as keyof typeof prev.nodes],
            label: labelMap[itemId] || itemId,
            filled: true,
            filledWith: itemId,
          },
        },
      };

      const allFilled = Object.values(next.nodes).every(node => node.filled);
      if (allFilled && !modelBuildState.calvinCycleElements) {
        setModelBuildState(prevBuild => ({
          ...prevBuild,
          calvinCycleElements: true,
        }));
      }

      return next;
    });
  };

  const handleCalvinReset = () => {
    setCalvinPlaceholders({
      nodes: {
        c3: { id: 'c3', label: '占位节点', filled: false },
        c5: { id: 'c5', label: '占位节点', filled: false },
        atp: { id: 'atp', label: '占位节点', filled: false },
        nadph: { id: 'nadph', label: '占位节点', filled: false },
        adp: { id: 'adp', label: '占位节点', filled: false },
        nadp: { id: 'nadp', label: '占位节点', filled: false },
      },
    });
    setCalvinModelValidated(false);
  };

  // 处理实验3验证
  const handleCalvinValidate = (isCorrect: boolean) => {
    if (isCorrect) {
      setCalvinModelValidated(true);
      // 成功后更新全局模型状态
      setModelBuildState(prev => ({
        ...prev,
        calvinCycleElements: true,
      }));
    }
  };

  // 模拟逻辑
  const { simState, history, simTime, setMarker, resetSimulation } = useSimulation({
    lightIntensity,
    co2Level,
    isLightOn,
    isPaused,
  });

  // 切换光源
  const toggleLight = () => {
    setMarker(!isLightOn ? '开灯' : '关灯');
    setIsLightOn(!isLightOn);
  };

  // 重置实验4（执行两次以确保彻底清除，但只重新挂载一次避免闪烁）
  const handleResetExperiment4 = () => {
    // 目标值（避免依赖异步状态更新）
    const targetLight = 12000;
    const targetCO2 = 420;

    // 1. 重置控制参数到默认值
    setLightIntensity(targetLight);
    setCo2Level(targetCO2);
    setIsLightOn(true);
    setIsPaused(false);

    // 2. 立即执行两次重置，直接传入目标值（避免状态延迟问题）
    setTimeout(() => {
      resetSimulation(targetLight, targetCO2);  // 第一次重置
      setTimeout(() => {
        resetSimulation(targetLight, targetCO2);  // 第二次重置
      }, 5);

      // 3. 稍后更新key强制重新挂载（只执行一次，避免闪烁）
      setTimeout(() => {
        setExperiment4ResetKey(prev => prev + 1);
      }, 15);
    }, 0);
  };

  // 根据实验模式和模型构建状态配置3D模型可见性
  const getModelVisibility = (): ModelVisibility => {
    switch (experimentMode) {
      case 'o2-source':
        // 实验1：只显示基础结构
        return {
          membrane: true,
          basicMolecules: true,
          thylakoid: false,
          electronChain: false,
          atpSynthase: false,
          calvinCycle: false,
          calvinIntermediates: false,
        };
      case 'electron-flow':
        // 实验2：添加类囊体和电子链
        return {
          membrane: true,
          basicMolecules: true,
          thylakoid: true,
          electronChain: true,
          atpSynthase: false,
          calvinCycle: false,
          calvinIntermediates: false,
        };
      case 'calvin-cycle':
        // 实验3：添加卡尔文循环基本结构
        return {
          membrane: true,
          basicMolecules: true,
          thylakoid: true,
          electronChain: true,
          atpSynthase: true,
          calvinCycle: true,
          calvinIntermediates: false,
        };
      case 'env-factors':
        // 实验4：显示完整模型
        return {
          membrane: true,
          basicMolecules: true,
          thylakoid: true,
          electronChain: true,
          atpSynthase: true,
          calvinCycle: true,
          calvinIntermediates: true,
        };
      case 'selection':
      default:
        // 实验选择界面：根据已构建的模型状态显示
        // 基础结构始终显示，其他根据构建进度
        // 如果完成了实验三，自动显示光反应部分（因为实验三依赖于光反应）
        return {
          membrane: true,
          basicMolecules: true,
          thylakoid: modelBuildState.calvinCycleElements || modelBuildState.atpSynthase || modelBuildState.nadphFormation, // 完成实验3或实验2后显示
          electronChain: modelBuildState.calvinCycleElements || modelBuildState.nadphFormation, // 完成实验3或实验2后显示
          atpSynthase: modelBuildState.calvinCycleElements || modelBuildState.atpSynthase, // 完成实验3或实验2后显示
          calvinCycle: modelBuildState.calvinCycleElements, // 实验3完成后显示
          calvinIntermediates: false,
        };
    }
  };

  // 处理实验选择
  const handleSelectExperiment = (mode: ExperimentMode) => {
    setExperimentMode(mode);
    // 标记已进入过实验，欢迎标题不再显示
    setIsFirstLoad(false);
    // 实验4自动开始运行
    if (mode === 'env-factors') {
      setIsPaused(false);
    }
    // 不重置实验状态，保持渐进式构建的进度
  };

  // 返回实验选择
  const handleBackToSelection = () => {
    setExperimentMode('selection');
    setIsPaused(true); // 返回实验选择界面时暂停模拟
  };

  // 渲染右侧面板
  const renderRightPanel = () => {
    switch (experimentMode) {
      case 'selection':
        return <ExperimentSelector onSelectExperiment={handleSelectExperiment} />;
      case 'o2-source':
        return (
          <O2SourceExperiment
            onBack={handleBackToSelection}
            onExperimentChange={setO2ExperimentState}
          />
        );
      case 'env-factors':
        return (
          <Sidebar
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            isLightOn={isLightOn}
            toggleLight={toggleLight}
            lightIntensity={lightIntensity}
            setLightIntensity={setLightIntensity}
            co2Level={co2Level}
            setCo2Level={setCo2Level}
            simTime={simTime}
            onBack={handleBackToSelection}
            onReset={handleResetExperiment4}
          />
        );
      case 'electron-flow':
        return (
          <ElectronFlowExperiment
            onBack={handleBackToSelection}
            onExperimentChange={handleElectronFlowChange}
          />
        );
      case 'calvin-cycle':
        return (
          <CalvinCycleExperiment
            onBack={handleBackToSelection}
            onReset={handleCalvinReset}
            placeholders={calvinPlaceholders}
            onValidate={handleCalvinValidate}
          />
        );
      default:
        return null;
    }
  };

  // 渲染左下角图表区域
  const renderBottomPanel = () => {
    if (experimentMode === 'o2-source') {
      // 实验1：显示质谱图（占据40%高度，自适应）
      const status = o2ExperimentState.isRunning
        ? 'collecting'
        : o2ExperimentState.showResult
          ? 'complete'
          : 'waiting';
      return (
        <div className="h-[40vh] min-h-[350px] border-t-2 border-green-200 bg-white">
          <MassSpectrumChart 
            status={status} 
            isotopeLabel={o2ExperimentState.selectedLabel}
            completedSchemes={o2ExperimentState.completedSchemes}
          />
        </div>
      );
    } else if (experimentMode === 'electron-flow') {
      // 实验2：显示ATP合成实验记录表
      return (
        <div className="h-[40vh] min-h-[300px] border-t-2 border-purple-200 bg-white">
          <ATPSynthesisTable
            records={electronFlowState.records}
            isRunning={electronFlowState.isRunning}
            innerHDefault="10⁻⁴"
          />
        </div>
      );
    } else if (experimentMode === 'env-factors') {
      // 实验4：显示实时图表（使用key强制重置）
      return <ChartPanel key={experiment4ResetKey} history={history} />;
    }
    return null;
  };

  return (
    <div className="flex w-full h-screen bg-green-50 overflow-hidden font-sans text-gray-800">
      {/* 左侧列：可视化与数据 */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Viewport
          key={experimentMode === 'env-factors' ? `exp4-${experiment4ResetKey}` : 'viewport'}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          isPaused={isPaused}
          isLightOn={isLightOn}
          lightIntensity={lightIntensity}
          co2Level={co2Level}
          simState={simState}
          modelVisibility={getModelVisibility()}
          o2ExperimentState={experimentMode === 'o2-source' ? o2ExperimentState : undefined}
          electronFlowState={experimentMode === 'electron-flow' ? electronFlowState : undefined}
          onShowWaterPhotolysis={handleShowWaterPhotolysis}
          modelBuildState={modelBuildState}
          calvinPlaceholders={(experimentMode !== 'env-factors' && (experimentMode === 'calvin-cycle' || calvinModelValidated)) ? calvinPlaceholders : undefined}
          onPlaceholderDrop={handlePlaceholderDrop}
          isSelectionMode={experimentMode === 'selection'}
          isFirstLoad={isFirstLoad}
          experimentMode={experimentMode}
        />
        {/* 左下角图表区域 */}
        <div key={experimentMode === 'env-factors' ? `chart-${experiment4ResetKey}` : 'charts'}>
          {renderBottomPanel()}
        </div>
      </div>

      {/* 右侧列：根据实验模式渲染不同面板 */}
      {renderRightPanel()}
    </div>
  );
}