import React, { useMemo } from 'react';
import { IsotopeLabel } from '../../types';

interface MassSpectrumPanelProps {
  isotopeLabel: IsotopeLabel;
}

export default function MassSpectrumPanel({ isotopeLabel }: MassSpectrumPanelProps) {
  // 生成质谱数据
  const spectrumData = useMemo(() => {
    return generateMassSpectrumData(isotopeLabel);
  }, [isotopeLabel]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-chart-area"></i>
              <span className="font-bold text-sm">质谱分析结果</span>
            </div>
            <span className="text-xs opacity-90">Mass Spectrometry</span>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="p-4 space-y-4">
          {/* TIC - 总离子流色谱 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">TIC: 总离子流色谱</span>
              <span className="text-gray-500">Max: {spectrumData.tic.maxIntensity.toFixed(2)} cps</span>
            </div>
            <div className="relative h-24 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <SpectrumChart data={spectrumData.tic} color="#3b82f6" />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>0.0</span>
              <span className="text-gray-600">Time (min)</span>
              <span>{spectrumData.tic.timeMax}</span>
            </div>
          </div>

          {/* 氧气同位素峰 - 关键数据 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">
                O₂同位素分析 {isotopeLabel === 'h2o' && <span className="text-red-600">(检测到¹⁸O)</span>}
              </span>
              <span className="text-gray-500">m/z = {isotopeLabel === 'h2o' ? '34' : '32'}</span>
            </div>
            <div className="relative h-24 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <SpectrumChart data={spectrumData.o2Isotope} color={isotopeLabel === 'h2o' ? '#ef4444' : '#10b981'} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>0.0</span>
              <span className="text-gray-600">Time (min)</span>
              <span>{spectrumData.o2Isotope.timeMax}</span>
            </div>
          </div>

          {/* 其他化合物峰 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">其他检测物质</span>
              <span className="text-gray-500">多重离子监测</span>
            </div>
            <div className="relative h-24 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <SpectrumChart data={spectrumData.others} color="#a855f7" showPeakLabels />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>0.0</span>
              <span className="text-gray-600">Time (min)</span>
              <span>{spectrumData.others.timeMax}</span>
            </div>
          </div>

          {/* 峰标注说明 */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
            <div className="font-bold text-blue-900 mb-2">峰标注说明：</div>
            {spectrumData.peaks.map((peak, idx) => (
              <div key={idx} className="flex items-center justify-between text-blue-800">
                <span>• {peak.compound}</span>
                <span className="font-mono text-[10px] text-blue-600">
                  t={peak.time.toFixed(2)} min, m/z={peak.mz}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 结论卡片 */}
      <div className={`rounded-xl p-4 border-2 ${
        isotopeLabel === 'h2o' 
          ? 'bg-green-50 border-green-300' 
          : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
            isotopeLabel === 'h2o' ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            <i className={`fas ${isotopeLabel === 'h2o' ? 'fa-check' : 'fa-times'}`}></i>
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-gray-800 mb-1">实验结论</div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {isotopeLabel === 'h2o' ? (
                <>
                  在质谱图中检测到质量数为<strong className="text-red-600"> 34 </strong>
                  的氧气分子（¹⁸O₂），证明光合作用释放的氧气来自<strong className="text-blue-600"> 水（H₂O）</strong>
                  而非二氧化碳。这是光反应中水光解的直接证据。
                </>
              ) : (
                <>
                  在质谱图中仅检测到质量数为<strong> 32 </strong>
                  的普通氧气分子（¹⁶O₂），未检测到¹⁸O标记的氧气。
                  说明标记的CO₂中的氧原子没有进入氧气分子。
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 质谱图图表组件
interface SpectrumChartProps {
  data: {
    time: number[];
    intensity: number[];
    peaks?: Array<{ time: number; intensity: number; label?: string }>;
  };
  color: string;
  showPeakLabels?: boolean;
}

function SpectrumChart({ data, color, showPeakLabels }: SpectrumChartProps) {
  const { time, intensity, peaks } = data;
  
  // 计算SVG路径
  const path = useMemo(() => {
    if (time.length === 0) return '';
    
    const maxIntensity = Math.max(...intensity);
    const points = time.map((t, i) => {
      const x = (t / Math.max(...time)) * 100;
      const y = 100 - (intensity[i] / maxIntensity) * 90; // 留10%空间
      return `${x},${y}`;
    });
    
    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  }, [time, intensity]);

  const maxIntensity = Math.max(...intensity);

  return (
    <div className="relative w-full h-full">
      {/* SVG 图表 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 基线网格 */}
        <line x1="0" y1="100" x2="100" y2="100" stroke="#d1d5db" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1,1" />
        
        {/* 数据曲线 */}
        <path d={path} fill={color} opacity="0.15" />
        <path 
          d={path.replace('Z', '')} 
          fill="none" 
          stroke={color} 
          strokeWidth="0.8" 
          vectorEffect="non-scaling-stroke"
        />
        
        {/* 峰标注 */}
        {showPeakLabels && peaks && peaks.map((peak, idx) => {
          const x = (peak.time / Math.max(...time)) * 100;
          const y = 100 - (peak.intensity / maxIntensity) * 90;
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="1" fill={color} />
              <text
                x={x}
                y={y - 3}
                fontSize="3"
                fill="#374151"
                textAnchor="middle"
                fontWeight="bold"
              >
                {peak.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 生成质谱数据
function generateMassSpectrumData(isotopeLabel: IsotopeLabel): {
  tic: any;
  o2Isotope: any;
  others: any;
  peaks: Array<{ time: number; mz: number; compound: string }>;
} {
  // 时间范围：0-10分钟，采样100个点
  const timePoints = 100;
  const timeMax = 10;
  const time = Array.from({ length: timePoints }, (_, i) => (i / timePoints) * timeMax);

  // TIC - 总离子流（多个高斯峰叠加）
  const ticIntensity = time.map(t => {
    let intensity = 0;
    // 主峰在 2.2 分钟
    intensity += gaussian(t, 2.2, 0.3, 1.1e6);
    // 次要峰
    intensity += gaussian(t, 4.08, 0.2, 4.5e5);
    intensity += gaussian(t, 4.72, 0.2, 4.8e5);
    intensity += gaussian(t, 5.38, 0.2, 5.0e5);
    intensity += gaussian(t, 5.82, 0.2, 5.2e5);
    intensity += gaussian(t, 6.87, 0.2, 6.0e5);
    intensity += gaussian(t, 7.37, 0.15, 3.5e5);
    intensity += gaussian(t, 7.97, 0.15, 3.2e5);
    // 基线噪声
    intensity += Math.random() * 1e4;
    return intensity;
  });

  // O2同位素峰
  let o2Intensity: number[];
  if (isotopeLabel === 'h2o') {
    // 标记水：检测到 ¹⁸O₂ (m/z = 34)
    o2Intensity = time.map(t => {
      let intensity = 0;
      // 主峰：¹⁸O₂ 在 2.22 分钟
      intensity += gaussian(t, 2.22, 0.25, 1.1e6);
      // 基线噪声
      intensity += Math.random() * 5e3;
      return intensity;
    });
  } else {
    // 标记CO2或未标记：只有普通 ¹⁶O₂ (m/z = 32)
    o2Intensity = time.map(t => {
      let intensity = 0;
      // 主峰：¹⁶O₂ 在 2.20 分钟
      intensity += gaussian(t, 2.20, 0.25, 1.1e6);
      // 基线噪声
      intensity += Math.random() * 5e3;
      return intensity;
    });
  }

  // 其他化合物峰（模拟图2中图的多个峰）
  const othersIntensity = time.map(t => {
    let intensity = 0;
    // 模拟多个生物代谢产物的峰
    intensity += gaussian(t, 5.33, 0.15, 9e5); // SA (水杨酸)
    intensity += gaussian(t, 5.71, 0.12, 5.5e5);
    intensity += gaussian(t, 6.62, 0.13, 6.2e5); // ABA (脱落酸)
    intensity += gaussian(t, 7.48, 0.15, 7.0e5); // SA4
    intensity += gaussian(t, 4.10, 0.15, 5.0e5); // tZR
    intensity += gaussian(t, 4.74, 0.12, 4.8e5); // 6-KT
    intensity += gaussian(t, 5.41, 0.13, 5.5e5); // IBA
    intensity += gaussian(t, 5.84, 0.12, 5.0e5); // IAA
    intensity += gaussian(t, 6.18, 0.10, 4.5e5);
    intensity += gaussian(t, 6.34, 0.10, 3.8e5);
    intensity += gaussian(t, 6.88, 0.12, 5.5e5); // 2-iP
    intensity += gaussian(t, 7.39, 0.10, 3.2e5);
    intensity += gaussian(t, 8.46, 0.12, 4.0e5);
    // 基线噪声
    intensity += Math.random() * 1e4;
    return intensity;
  });

  // 峰标注信息
  const peaks = [
    { time: isotopeLabel === 'h2o' ? 2.22 : 2.20, mz: isotopeLabel === 'h2o' ? 34 : 32, compound: isotopeLabel === 'h2o' ? '¹⁸O₂ (氧气-18)' : '¹⁶O₂ (普通氧气)' },
    { time: 5.33, mz: 138, compound: 'SA (水杨酸)' },
    { time: 6.62, mz: 264, compound: 'ABA (脱落酸)' },
    { time: 7.48, mz: 152, compound: 'SA4' },
  ];

  return {
    tic: {
      time,
      intensity: ticIntensity,
      maxIntensity: Math.max(...ticIntensity),
      timeMax,
    },
    o2Isotope: {
      time,
      intensity: o2Intensity,
      maxIntensity: Math.max(...o2Intensity),
      timeMax,
    },
    others: {
      time,
      intensity: othersIntensity,
      maxIntensity: Math.max(...othersIntensity),
      timeMax,
      peaks: [
        { time: 5.33, intensity: 9e5, label: 'SA' },
        { time: 6.62, intensity: 6.2e5, label: 'ABA' },
        { time: 7.48, intensity: 7.0e5, label: 'SA4' },
      ],
    },
    peaks,
  };
}

// 高斯函数生成峰形
function gaussian(x: number, mean: number, sigma: number, amplitude: number): number {
  return amplitude * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}
