import React, { useState } from 'react';
import { IsotopeLabel, O2SourceExperimentState } from '../../types';

interface O2SourceExperimentProps {
  onBack: () => void;
  onExperimentChange: (state: O2SourceExperimentState) => void;
}

export default function O2SourceExperiment({ onBack, onExperimentChange }: O2SourceExperimentProps) {
  const [selectedLabel, setSelectedLabel] = useState<IsotopeLabel>('none');
  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [completedSchemes, setCompletedSchemes] = useState({ co2: false, h2o: false });
  const [showWaterPhotolysis, setShowWaterPhotolysis] = useState(false);

  const handleLabelChange = (label: IsotopeLabel) => {
    setSelectedLabel(label);
    setIsRunning(false);
    setShowResult(false);
    onExperimentChange({ 
      selectedLabel: label, 
      isRunning: false, 
      showResult: false,
      completedSchemes,
      showWaterPhotolysis
    });
  };

  const handleStartExperiment = () => {
    if (selectedLabel === 'none') {
      alert('请先选择一个标记选项！');
      return;
    }
    setIsRunning(true);
    setShowResult(false);
    onExperimentChange({ 
      selectedLabel, 
      isRunning: true, 
      showResult: false,
      completedSchemes,
      showWaterPhotolysis
    });

    // 2秒后动画结束，质谱图立即显示
    setTimeout(() => {
      setIsRunning(false);
      setShowResult(true);
      
      // 更新已完成的方案
      const newCompletedSchemes = {
        ...completedSchemes,
        [selectedLabel]: true
      };
      setCompletedSchemes(newCompletedSchemes);
      
      onExperimentChange({ 
        selectedLabel, 
        isRunning: false, 
        showResult: true,
        completedSchemes: newCompletedSchemes,
        showWaterPhotolysis
      });
    }, 2000);
  };

  const handleReset = () => {
    setSelectedLabel('none');
    setIsRunning(false);
    setShowResult(false);
    // 重置时不清除已完成的方案记录和水的光解状态
    onExperimentChange({ 
      selectedLabel: 'none', 
      isRunning: false, 
      showResult: false,
      completedSchemes,
      showWaterPhotolysis
    });
  };

  // 处理"水的光解"按钮点击
  const handleWaterPhotolysisClick = () => {
    setShowWaterPhotolysis(true);
    onExperimentChange({
      selectedLabel,
      isRunning,
      showResult,
      completedSchemes,
      showWaterPhotolysis: true
    });
  };

  // 检查两个方案是否都已完成
  const bothSchemesCompleted = completedSchemes.co2 && completedSchemes.h2o;

  return (
    <div className="w-[360px] bg-white border-l border-green-200 shadow-2xl flex flex-col shrink-0 z-30">
      {/* 头部 */}
      <div className="p-6 border-b border-green-100 bg-gradient-to-br from-blue-50/80 to-white">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-2 text-blue-600 hover:text-blue-800 
            text-sm font-bold transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>返回实验选择</span>
        </button>
        <h1 className="text-xl font-extrabold tracking-tight leading-none text-blue-800">
          实验1：O₂的来源
        </h1>
        <p className="text-gray-500 text-xs mt-2 leading-relaxed">
          1941年鲁宾-卡门同位素标记实验
        </p>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* 假设提示 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="font-bold mb-2 flex items-center gap-2 text-amber-700 text-sm">
            <i className="fas fa-lightbulb"></i> 实验假设
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            光合作用释放的O₂来自哪里？
            <br />• 假设1：来自CO₂
            <br />• 假设2：来自H₂O
          </p>
        </div>

        {/* 实验选择 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            <h3 className="text-sm font-bold text-gray-800">选择标记方案</h3>
          </div>

          {/* 选项1：标记CO2 */}
          <button
            onClick={() => handleLabelChange('co2')}
            disabled={isRunning}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedLabel === 'co2'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedLabel === 'co2' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {selectedLabel === 'co2' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span>方案1：标记CO₂</span>
                  {selectedLabel === 'co2' && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      已选择
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                  C<sup>18</sup>O₂ + H₂O → ?
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  给植物提供普通水和被<sup>18</sup>O标记的CO₂
                </p>
              </div>
            </div>
          </button>

          {/* 选项2：标记H2O */}
          <button
            onClick={() => handleLabelChange('h2o')}
            disabled={isRunning}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedLabel === 'h2o'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedLabel === 'h2o' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {selectedLabel === 'h2o' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span>方案2：标记H₂O</span>
                  {selectedLabel === 'h2o' && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      已选择
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                  CO₂ + H₂<sup>18</sup>O → ?
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  给植物提供被<sup>18</sup>O标记的水和普通CO₂
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* 控制按钮 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleStartExperiment}
            disabled={selectedLabel === 'none' || isRunning}
            className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 
              transition-all ${
                selectedLabel === 'none' || isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg'
              }`}
          >
            {isRunning ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>实验进行中...</span>
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
            className="py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 
              bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 
              disabled:cursor-not-allowed"
          >
            <i className="fas fa-redo"></i>
            <span>重置</span>
          </button>
        </div>

        {/* 实验进度提示 */}
        {isRunning && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 animate-pulse">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-bold mb-2">
              <i className="fas fa-hourglass-half"></i>
              <span>实验进行中</span>
            </div>
            <p className="text-xs text-blue-900">
              请观察3D模型中标记的氧原子流向...
            </p>
          </div>
        )}

        {/* 结果显示 */}
        {showResult && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm font-bold mb-2">
              <i className="fas fa-check-circle"></i>
              <span>实验完成</span>
            </div>
            <p className="text-xs text-green-900 leading-relaxed">
              {selectedLabel === 'h2o'
                ? '检测到释放的氧气中含有 ¹⁸O 同位素！请查看左下角质谱分析结果。'
                : '释放的氧气中未检测到 ¹⁸O 同位素。请查看左下角质谱分析结果。'}
            </p>
          </div>
        )}

        {/* 质谱图原理介绍 */}
        {showResult && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="font-bold mb-2 flex items-center gap-2 text-blue-700 text-sm">
              <i className="fas fa-info-circle"></i> 质谱图原理
            </div>
            <p className="text-xs text-blue-900 leading-relaxed mb-1">
              质谱图是通过记录不同质荷比（m/z）离子经质量分析器分离后的信号，由计算机处理后形成的图谱，主要反映碎片离子元素的组成。
            </p>
            <p className="text-xs text-blue-900 leading-relaxed mb-1">
              质谱图横轴表示离子的质荷比；纵轴表示离子流相对强度，基准为最强峰100%的相对丰度。
            </p>
            <p className="text-xs text-blue-900 leading-relaxed">
              无标记氧分子（¹⁶O₂）质谱峰出现在m/z=32；单标记氧分子（¹⁶O¹⁸O）质谱峰出现在m/z=34处
            </p>
          </div>
        )}

        {/* 思考题 */}
        {showResult && (
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="font-bold mb-2 flex items-center gap-2 text-orange-700 text-sm">
              <i className="fas fa-brain"></i> 思考与分析
            </div>
            <p className="text-xs text-orange-900 leading-relaxed">
              根据实验结果，你能得出什么结论？
              <br />• 光合作用释放的O₂来自哪种物质？
              <br />• 这说明了光合作用的哪个阶段？
            </p>
          </div>
        )}

        {/* 实验进度指示器 */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="font-bold mb-3 flex items-center gap-2 text-gray-700 text-sm">
            <i className="fas fa-tasks"></i> 实验进度
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                completedSchemes.co2 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {completedSchemes.co2 && <i className="fas fa-check text-white text-xs"></i>}
              </div>
              <span className={`text-sm ${completedSchemes.co2 ? 'text-green-700' : 'text-gray-500'}`}>
                方案1：标记CO₂ {completedSchemes.co2 ? '✓ 已完成' : '未完成'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                completedSchemes.h2o ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {completedSchemes.h2o && <i className="fas fa-check text-white text-xs"></i>}
              </div>
              <span className={`text-sm ${completedSchemes.h2o ? 'text-green-700' : 'text-gray-500'}`}>
                方案2：标记H₂O {completedSchemes.h2o ? '✓ 已完成' : '未完成'}
              </span>
            </div>
          </div>
          
          {/* 两个方案都完成后显示提示 */}
          {bothSchemesCompleted && !showWaterPhotolysis && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-blue-600 mb-2">
                🎉 两个实验方案都已完成！现在可以查看"水的光解"模型。
              </p>
              <p className="text-xs text-gray-500">
                请点击3D模型区域中的"水的光解"按钮，了解水分解的详细过程。
              </p>
            </div>
          )}
          
          {showWaterPhotolysis && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-purple-600">
                <i className="fas fa-check-circle"></i>
                <span className="text-sm font-bold">水的光解模型已展示</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                水分解产生4e⁻和4H⁺，将在后续实验中追踪其去向。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 页脚 */}
      <div className="p-3 border-t border-gray-100 text-center text-[10px] text-gray-400 bg-gray-50">
        实验1 / 4 - O₂的来源探究
      </div>
    </div>
  );
}
