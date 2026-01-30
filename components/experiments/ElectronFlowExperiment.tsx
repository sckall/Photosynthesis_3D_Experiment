import React, { useState, useCallback } from 'react';
import {
  BufferType,
  Additives,
  ElectronFlowExperimentState,
  ExperimentRecord
} from '../../types';

interface ElectronFlowExperimentProps {
  onBack: () => void;
  onExperimentChange: (state: ElectronFlowExperimentState) => void;
}

// 默认添加剂状态
const defaultAdditives: Additives = {
  adp: false,
  pi: false,
  dnp: false,
  inhibitor: false,
};

export default function ElectronFlowExperiment({ onBack, onExperimentChange }: ElectronFlowExperimentProps) {
  const [selectedBuffer, setSelectedBuffer] = useState<BufferType>('none');
  const [additives, setAdditives] = useState<Additives>(defaultAdditives);
  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [records, setRecords] = useState<ExperimentRecord[]>([]);// 初始状态
  const [completedExperiments, setCompletedExperiments] = useState({
    ph4WithADPPi: false,
    ph8Only: false,
    ph8WithADPPi: false,
    ph8WithADPPiDNP: false,
    ph8WithADPPiInhibitor: false,
  });
  const [showATPSynthase, setShowATPSynthase] = useState(false);
  const [showNADPHMaterial, setShowNADPHMaterial] = useState(false);
  const [showNADPHFormula, setShowNADPHFormula] = useState(false);

  // 通知父组件状态变化
  const notifyChange = useCallback((updates: Partial<ElectronFlowExperimentState>) => {
    onExperimentChange({
      selectedBuffer,
      additives,
      isRunning,
      showResult,
      records,
      completedExperiments,
      showATPSynthase,
      showNADPHMaterial,
      showNADPHFormula,
      ...updates,
    });
  }, [selectedBuffer, additives, isRunning, showResult, records, completedExperiments,
    showATPSynthase, showNADPHMaterial, showNADPHFormula, onExperimentChange]);

  // 判断ATP是否产生
  const calculateATPResult = (buffer: BufferType, adds: Additives): boolean => {
    // ATP产生条件：
    // 1. 必须有浓度梯度（膜内高，膜外低）→ 使用pH=8缓冲液
    // 2. 必须有ADP和Pi
    // 3. 不能有DNP（消除梯度）
    // 4. 不能有抑制剂（阻断酶）
    if (buffer !== 'ph8') return false;
    if (!adds.adp || !adds.pi) return false;
    if (adds.dnp) return false;
    if (adds.inhibitor) return false;
    return true;
  };

  // 计算H⁺浓度
  const getHConcentrations = (buffer: BufferType, adds: Additives) => {
    // 默认类囊体腔内[H⁺] = 10⁻⁴ mol/L
    const defaultInner = '10⁻⁴';

    if (buffer === 'ph4') {
      // pH=4: [H⁺] = 10⁻⁴ mol/L
      return { outer: '10⁻⁴', inner: defaultInner };
    } else if (buffer === 'ph8') {
      // pH=8: [H⁺] = 10⁻⁸ mol/L
      // 如果加了DNP，膜内H⁺也会下降（梯度消除）
      const inner = adds.dnp ? '10⁻⁸' : defaultInner;
      return { outer: '10⁻⁸', inner };
    }
    return { outer: '-', inner: defaultInner };
  };

  // 检查实验类型并更新完成状态
  const checkExperimentType = (buffer: BufferType, adds: Additives, newCompleted: typeof completedExperiments) => {
    if (buffer === 'ph4' && adds.adp && adds.pi && !adds.dnp && !adds.inhibitor) {
      newCompleted.ph4WithADPPi = true;
    } else if (buffer === 'ph8' && !adds.adp && !adds.pi && !adds.dnp && !adds.inhibitor) {
      newCompleted.ph8Only = true;
    } else if (buffer === 'ph8' && adds.adp && adds.pi && !adds.dnp && !adds.inhibitor) {
      newCompleted.ph8WithADPPi = true;
    } else if (buffer === 'ph8' && adds.adp && adds.pi && adds.dnp && !adds.inhibitor) {
      newCompleted.ph8WithADPPiDNP = true;
    } else if (buffer === 'ph8' && adds.adp && adds.pi && !adds.dnp && adds.inhibitor) {
      newCompleted.ph8WithADPPiInhibitor = true;
    }
    return newCompleted;
  };

  const handleBufferChange = (buffer: BufferType) => {
    setSelectedBuffer(buffer);
    setShowResult(false);
    notifyChange({ selectedBuffer: buffer, showResult: false });
  };

  const handleAdditiveChange = (key: keyof Additives) => {
    const newAdditives = { ...additives, [key]: !additives[key] };
    setAdditives(newAdditives);
    setShowResult(false);
    notifyChange({ additives: newAdditives, showResult: false });
  };

  const handleStartExperiment = () => {
    if (selectedBuffer === 'none') {
      alert('请先选择缓冲液！');
      return;
    }

    setIsRunning(true);
    setShowResult(false);
    notifyChange({ isRunning: true, showResult: false });

    // 2秒后显示结果
    setTimeout(() => {
      const atpProduced = calculateATPResult(selectedBuffer, additives);
      const { outer, inner } = getHConcentrations(selectedBuffer, additives);

      // 创建新记录
      const newRecord: ExperimentRecord = {
        id: records.length + 1,
        buffer: selectedBuffer,
        additives: { ...additives },
        outerH: outer,
        innerH: inner,
        atpProduced,
      };

      const newRecords = [...records, newRecord];

      // 更新完成状态
      const newCompleted = checkExperimentType(selectedBuffer, additives, { ...completedExperiments });

      setRecords(newRecords);
      setCompletedExperiments(newCompleted);
      setIsRunning(false);
      setShowResult(true);

      notifyChange({
        records: newRecords,
        completedExperiments: newCompleted,
        isRunning: false,
        showResult: true
      });
    }, 2000);
  };

  const handleReset = () => {
    setSelectedBuffer('none');
    setAdditives(defaultAdditives);
    setIsRunning(false);
    setShowResult(false);
    notifyChange({
      selectedBuffer: 'none',
      additives: defaultAdditives,
      isRunning: false,
      showResult: false
    });
  };

  const handleClearTable = () => {
    setRecords([]);
    setCompletedExperiments({
      ph4WithADPPi: false,
      ph8Only: false,
      ph8WithADPPi: false,
      ph8WithADPPiDNP: false,
      ph8WithADPPiInhibitor: false,
    });
    notifyChange({
      records: [],
      completedExperiments: {
        ph4WithADPPi: false,
        ph8Only: false,
        ph8WithADPPi: false,
        ph8WithADPPiDNP: false,
        ph8WithADPPiInhibitor: false,
      }
    });
  };

  // 处理"构建模型"按钮点击
  const handleBuildModel = () => {
    setShowATPSynthase(true);
    setShowNADPHMaterial(true);
    notifyChange({ showATPSynthase: true, showNADPHMaterial: true });
  };

  // 处理"显示NADPH公式"按钮点击
  const handleShowNADPH = () => {
    setShowNADPHFormula(true);
    notifyChange({ showNADPHFormula: true });
  };

  // 检查是否完成所有五种典型实验
  const allExperimentsCompleted =
    completedExperiments.ph4WithADPPi &&
    completedExperiments.ph8Only &&
    completedExperiments.ph8WithADPPi &&
    completedExperiments.ph8WithADPPiDNP &&
    completedExperiments.ph8WithADPPiInhibitor;

  // 获取已完成的实验数量
  const completedCount = Object.values(completedExperiments).filter(Boolean).length;

  return (
    <div className="w-[360px] bg-white border-l border-green-200 shadow-2xl flex flex-col shrink-0 z-30">
      {/* 头部 */}
      <div className="p-6 border-b border-green-100 bg-gradient-to-br from-purple-50/80 to-white">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-2 text-purple-600 hover:text-purple-800 
            text-sm font-bold transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>返回实验选择</span>
        </button>
        <h1 className="text-xl font-extrabold tracking-tight leading-none text-purple-800">
          实验2：ATP的合成
        </h1>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* 核心问题 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="font-bold mb-2 flex items-center gap-2 text-amber-700 text-sm">
            <i className="fas fa-question-circle"></i> 核心问题
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            水光解产生的电子和H⁺的去路是什么？
          </p>
        </div>

        {/* 背景知识 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-sm">
            <i className="fas fa-book"></i> 背景知识
          </div>
          <ul className="text-xs text-blue-900 leading-relaxed space-y-1">
            <li>• 1954年，美国科学家<strong>阿尔农</strong>发现，在光照条件下，叶绿体可合成ATP</li>
            <li>• 1957年，他又发现ATP的合成与水的光解相伴随</li>
            <li>• 1961年，英国科学家<strong>米切尔</strong>提出<strong>化学渗透假说</strong>，认为H⁺浓度差为ATP合成提供势能</li>
          </ul>
        </div>

        {/* 实验设计区 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            <h3 className="text-sm font-bold text-gray-800">🧪 设计你的实验</h3>
          </div>

          {/* 缓冲液选择（单选） */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="font-bold text-gray-700 text-xs mb-3">缓冲液（单选）：</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBufferChange('ph4')}
                disabled={isRunning}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedBuffer === 'ph4'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                pH=4 酸性
              </button>
              <button
                onClick={() => handleBufferChange('ph8')}
                disabled={isRunning}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedBuffer === 'ph8'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                pH=8 碱性
              </button>
            </div>
          </div>

          {/* 添加剂选择（多选） */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="font-bold text-gray-700 text-xs mb-3">添加剂（可多选）：</div>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${additives.adp ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={additives.adp}
                  onChange={() => handleAdditiveChange('adp')}
                  disabled={isRunning}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">ADP</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${additives.pi ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={additives.pi}
                  onChange={() => handleAdditiveChange('pi')}
                  disabled={isRunning}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">Pi（无机磷酸）</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${additives.dnp ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-red-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={additives.dnp}
                  onChange={() => handleAdditiveChange('dnp')}
                  disabled={isRunning}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm">解偶联剂DNP</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${additives.inhibitor ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={additives.inhibitor}
                  onChange={() => handleAdditiveChange('inhibitor')}
                  disabled={isRunning}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-sm">ATP合成酶抑制剂</span>
              </label>
            </div>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={handleStartExperiment}
            disabled={selectedBuffer === 'none' || isRunning}
            className={`py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 
              transition-all ${selectedBuffer === 'none' || isRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:shadow-lg'
              }`}
          >
            {isRunning ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>进行中</span>
              </>
            ) : (
              <>
                <i className="fas fa-play"></i>
                <span>开始实验</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isRunning}
            className="py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 
              bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 
              disabled:cursor-not-allowed"
          >
            <i className="fas fa-redo"></i>
            <span>重置选项</span>
          </button>

          <button
            onClick={handleClearTable}
            disabled={isRunning || records.length === 0}
            className="py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 
              bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 
              disabled:cursor-not-allowed"
          >
            <i className="fas fa-trash"></i>
            <span>清空表格</span>
          </button>
        </div>

        {/* 实验进度提示 */}
        {isRunning && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 animate-pulse">
            <div className="flex items-center gap-2 text-purple-700 text-sm font-bold mb-2">
              <i className="fas fa-hourglass-half"></i>
              <span>实验进行中</span>
            </div>
            <p className="text-xs text-purple-900">
              请观察3D模型中H⁺离子的分布变化...
            </p>
          </div>
        )}

        {/* 结果显示 */}
        {showResult && records.length > 0 && (
          <div className={`rounded-xl p-4 border ${records[records.length - 1].atpProduced
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className={`flex items-center gap-2 text-sm font-bold mb-2 ${records[records.length - 1].atpProduced ? 'text-green-700' : 'text-red-700'
              }`}>
              <i className={`fas ${records[records.length - 1].atpProduced ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              <span>实验完成</span>
            </div>
            <p className={`text-xs leading-relaxed ${records[records.length - 1].atpProduced ? 'text-green-900' : 'text-red-900'
              }`}>
              {records[records.length - 1].atpProduced
                ? '✓ 检测到ATP合成！H⁺浓度梯度成功驱动ATP合成酶工作。'
                : '✗ 未检测到ATP合成。请检查实验条件并分析原因。'}
            </p>
          </div>
        )}

        {/* 实验进度指示器 */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="font-bold mb-3 flex items-center justify-between text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <i className="fas fa-tasks"></i> 典型实验进度
            </div>
            <span className="text-xs text-purple-600">{completedCount}/5</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completedExperiments.ph4WithADPPi ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                {completedExperiments.ph4WithADPPi && <i className="fas fa-check text-white text-[8px]"></i>}
              </div>
              <span className={completedExperiments.ph4WithADPPi ? 'text-green-700' : 'text-gray-500'}>
                pH=4+ADP+Pi（对照组）
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completedExperiments.ph8Only ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                {completedExperiments.ph8Only && <i className="fas fa-check text-white text-[8px]"></i>}
              </div>
              <span className={completedExperiments.ph8Only ? 'text-green-700' : 'text-gray-500'}>
                pH=8（对照组）
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completedExperiments.ph8WithADPPi ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                {completedExperiments.ph8WithADPPi && <i className="fas fa-check text-white text-[8px]"></i>}
              </div>
              <span className={completedExperiments.ph8WithADPPi ? 'text-green-700' : 'text-gray-500'}>
                pH=8+ADP+Pi（ATP合成）
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completedExperiments.ph8WithADPPiDNP ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                {completedExperiments.ph8WithADPPiDNP && <i className="fas fa-check text-white text-[8px]"></i>}
              </div>
              <span className={completedExperiments.ph8WithADPPiDNP ? 'text-green-700' : 'text-gray-500'}>
                pH=8+ADP+Pi+DNP（验证梯度）
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${completedExperiments.ph8WithADPPiInhibitor ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                {completedExperiments.ph8WithADPPiInhibitor && <i className="fas fa-check text-white text-[8px]"></i>}
              </div>
              <span className={completedExperiments.ph8WithADPPiInhibitor ? 'text-green-700' : 'text-gray-500'}>
                pH=8+ADP+Pi+抑制剂（验证酶）
              </span>
            </div>
          </div>

          {/* 四种实验都完成后显示构建模型按钮 */}
          {allExperimentsCompleted && !showATPSynthase && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-purple-600 mb-3">
                🎉 四种典型实验都已完成！现在可以构建ATP合成模型。
              </p>
              <button
                onClick={handleBuildModel}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 
                  bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:shadow-lg transition-all"
              >
                <i className="fas fa-cube"></i>
                <span>构建模型</span>
              </button>
            </div>
          )}

          {/* 显示ATP合成酶模型后，展示NADPH材料 */}
          {showATPSynthase && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <i className="fas fa-check-circle"></i>
                <span className="text-sm font-bold">ATP合成酶模型已展示</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                H⁺通过ATP合成酶流出，驱动ADP+Pi合成ATP。
              </p>
            </div>
          )}

          {/* NADPH材料展示 */}
          {showNADPHMaterial && (
            <div className="mt-4 pt-3 border-t border-purple-200 bg-purple-50 rounded-lg p-3 -mx-1">
              <div className="font-bold mb-2 flex items-center gap-2 text-purple-700 text-sm">
                <i className="fas fa-scroll"></i> 补充材料
              </div>
              <p className="text-xs text-purple-900 leading-relaxed mb-3">
                20世纪50年代科学家发现叶绿体具有<strong>NADP⁺</strong>，
                在光照条件下可接受水光解产生的电子生成<strong>NADPH</strong>。
              </p>

              {!showNADPHFormula && (
                <button
                  onClick={handleShowNADPH}
                  className="w-full py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 
                    bg-purple-500 text-white shadow-sm hover:bg-purple-600 transition-all"
                >
                  <i className="fas fa-plus"></i>
                  <span>添加NADPH合成到模型</span>
                </button>
              )}

              {showNADPHFormula && (
                <div className="flex items-center gap-2 text-green-600 mt-2">
                  <i className="fas fa-check-circle"></i>
                  <span className="text-xs font-bold">NADPH合成公式已添加到3D模型</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="bg-gray-100 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-600 leading-relaxed">
            <i className="fas fa-info-circle mr-1"></i>
            提示：类囊体腔内默认[H⁺]为10⁻⁴ mol/L。尝试不同的试剂组合，观察结果并分析原因。
          </p>
        </div>
      </div>

      {/* 页脚 */}
      <div className="p-3 border-t border-gray-100 text-center text-[10px] text-gray-400 bg-gray-50">
        实验2 / 4 - 电子的去向探究
      </div>
    </div>
  );
}
