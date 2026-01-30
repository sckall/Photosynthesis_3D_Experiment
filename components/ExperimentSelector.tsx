import React from 'react';
import { ExperimentMode } from '../types';

interface ExperimentSelectorProps {
  onSelectExperiment: (mode: ExperimentMode) => void;
}

export default function ExperimentSelector({ onSelectExperiment }: ExperimentSelectorProps) {
  const experiments = [
    {
      mode: 'o2-source' as ExperimentMode,
      title: 'O₂的来源',
      description: '通过同位素标记实验探究光合作用释放的氧气来源',
      icon: 'fa-flask',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      mode: 'electron-flow' as ExperimentMode,
      title: 'ATP的合成',
      description: '追踪光反应中电子的传递路径和最终去向',
      icon: 'fa-bolt',
      color: 'from-yellow-500 to-orange-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      mode: 'calvin-cycle' as ExperimentMode,
      title: '卡尔文循环的过程',
      description: '观察暗反应中碳固定和糖类合成的循环过程',
      icon: 'fa-sync',
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      mode: 'env-factors' as ExperimentMode,
      title: '环境因素的影响',
      description: '探究光照强度和CO₂浓度对光合作用速率的影响',
      icon: 'fa-sun',
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="w-[360px] bg-white border-l border-green-200 shadow-2xl flex flex-col shrink-0 z-30">
      {/* 头部 */}
      <div className="p-6 border-b border-green-100 bg-gradient-to-br from-green-50/80 to-white">
        <h1 className="text-2xl font-extrabold tracking-tight leading-none">
          <span className="text-green-800">叶绿体</span>
          <span className="text-cyan-600">3D实验室</span>
        </h1>
        <p className="text-gray-500 text-xs mt-3 leading-relaxed">
          逐步构建完整的光合作用模型。 每个实验都会在3D模型中添加新的结构和过程。
        </p>
      </div>

      {/* 实验列表 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {experiments.map((exp, index) => (
          <button
            key={exp.mode}
            onClick={() => onSelectExperiment(exp.mode)}
            className={`w-full text-left p-4 rounded-xl border-2 ${exp.borderColor} ${exp.bgColor} 
              hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group`}
          >
            <div className="flex items-start gap-3">
              {/* 图标 */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${exp.color} 
                flex items-center justify-center text-white flex-shrink-0 
                group-hover:scale-110 transition-transform`}
              >
                <i className={`fas ${exp.icon} text-xl`}></i>
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${exp.textColor} 
                    bg-white px-2 py-0.5 rounded-full`}
                  >
                    实验 {index + 1}
                  </span>
                </div>
                <h4 className="font-bold text-gray-800 text-base mb-1" dangerouslySetInnerHTML={{ __html: exp.title }}>
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {exp.description}
                </p>
              </div>

              {/* 箭头 */}
              <div className="flex items-center text-gray-400 group-hover:text-gray-600 
                group-hover:translate-x-1 transition-all"
              >
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </button>
        ))}


      </div>
    </div>
  );
}
