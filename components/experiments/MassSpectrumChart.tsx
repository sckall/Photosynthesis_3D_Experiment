import React, { useMemo } from 'react';
import { IsotopeLabel } from '../../types';

interface MassSpectrumChartProps {
  status: 'waiting' | 'collecting' | 'complete';
  isotopeLabel: IsotopeLabel;
  completedSchemes?: {
    co2: boolean;
    h2o: boolean;
  };
}

export default function MassSpectrumChart({ status, isotopeLabel, completedSchemes = { co2: false, h2o: false } }: MassSpectrumChartProps) {
  // 生成两个实验组的质谱数据
  const comparisonData = useMemo(() => {
    return generateComparisonData();
  }, []);

  if (status === 'waiting') {
    return (
      <div className="h-full bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden flex flex-col">
        {/* 质谱图原理介绍 */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-5 border border-blue-200 shadow-md">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              质谱图原理介绍
            </h3>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                质谱图是通过记录不同质荷比（m/z）离子经质量分析器分离后的信号，由计算机处理后形成的图谱，主要反映碎片离子元素的组成。
              </p>
              <p>
                质谱图横轴表示离子的质荷比；纵轴表示离子流相对强度，基准为最强峰100%的相对丰度。
              </p>
              <p>
                无标记氧分子（¹⁶O₂）质谱峰出现在m/z=32；单标记氧分子（¹⁶O¹⁸O）质谱峰出现在m/z=34处；双标记氧分子（¹⁸O₂）质谱峰出现在m/z=36处。
              </p>
              <p className="text-xs text-gray-500 mt-4">
                💡 提示：请在右侧选择标记方案并开始实验，以查看实际的质谱图结果
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'collecting') {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <i className="fas fa-chart-line text-4xl text-blue-500 animate-pulse"></i>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-blue-700 text-sm font-bold mb-1">质谱仪数据采集中...</p>
          <p className="text-blue-600 text-xs">质谱分析</p>
        </div>
      </div>
    );
  }

  // status === 'complete' - 显示对比视图（左右两侧）
  return (
    <div className="h-full bg-white rounded-lg border-2 border-gray-300 overflow-hidden flex flex-col">
      {/* 对比图表区域（左右两侧） */}
      <div className="flex-1 p-2 flex gap-2">
        {/* 左侧：组1 - 标记CO₂ */}
        <div className="flex-1 flex flex-col">
          {completedSchemes.co2 ? (
            <div className="flex-1 relative bg-gray-50 rounded-lg border-2 border-gray-200">
              <MassSpectrumPlot data={comparisonData.group1} groupLabel="组1：H₂¹⁶O + C¹⁸O₂" />
            </div>
          ) : (
            <div className="flex-1 relative bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <i className="fas fa-flask text-2xl mb-2"></i>
                <div className="text-xs">等待实验1完成</div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：组2 - 标记水 */}
        <div className="flex-1 flex flex-col">
          {completedSchemes.h2o ? (
            <div className="flex-1 relative bg-gray-50 rounded-lg border-2 border-gray-200">
              <MassSpectrumPlot data={comparisonData.group2} groupLabel="组2：H₂¹⁸O (0.85%) + CO₂" />
            </div>
          ) : (
            <div className="flex-1 relative bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <i className="fas fa-flask text-2xl mb-2"></i>
                <div className="text-xs">等待实验2完成</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 质谱图绘图组件
interface MassSpectrumPlotProps {
  data: {
    mz: number[];
    abundance: number[];
    peaks: Array<{ mz: number; abundance: number; label: string; isKey?: boolean }>;
    mzMin: number;
    mzMax: number;
  };
  groupLabel: string;
}

function MassSpectrumPlot({ data, groupLabel }: MassSpectrumPlotProps) {
  const { mz, abundance, peaks, mzMin, mzMax } = data;

  // 计算SVG路径
  const path = useMemo(() => {
    if (mz.length === 0) return '';

    const mzRange = mzMax - mzMin;
    const maxAbundance = Math.max(...abundance);
    const points = mz.map((m, i) => {
      const x = ((m - mzMin) / mzRange) * 100;
      const y = 100 - (abundance[i] / maxAbundance) * 85; // 留15%空间给标签
      return `${x},${y}`;
    });

    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  }, [mz, abundance, mzMin, mzMax]);

  const mzRange = mzMax - mzMin;
  const maxAbundance = Math.max(...abundance);

  return (
    <div className="relative w-full h-full p-2">
      {/* 标题（在图表内部，顶部居中） */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
        <div className="text-xs font-bold text-gray-700 bg-white/90 px-2 py-0.5 rounded">
          {groupLabel}
        </div>
      </div>

      {/* Y轴标签（HTML，不变形） */}
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">
        <span className="text-[10px] font-semibold text-gray-600">相对丰度 (%)</span>
      </div>

      {/* 图表主体区域 */}
      <div className="ml-10 mr-2 mt-1 mb-5 h-[calc(100%-1rem)] relative">
        {/* Y轴刻度标签（HTML，绝对定位） */}
        {[0, 25, 50, 75, 100].map((val) => {
          const topPercent = 100 - val; // 0在底部(100%)，100在顶部(0%)
          return (
            <div
              key={val}
              className="absolute -left-7 text-[9px] text-gray-500 font-medium"
              style={{ top: `${topPercent}%`, transform: 'translateY(-50%)' }}
            >
              {val}
            </div>
          );
        })}

        {/* SVG 图表（只包含图形，不包含文字） */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 坐标轴 */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="#374151" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="#374151" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

          {/* Y轴刻度线 */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = 100 - val;
            return (
              <line key={val} x1="-0.5" y1={y} x2="0" y2={y} stroke="#374151" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            );
          })}

          {/* X轴刻度线（只显示32, 34, 36） */}
          {[32, 34, 36].map((mzVal) => {
            const x = ((mzVal - mzMin) / mzRange) * 100;
            return (
              <g key={mzVal}>
                <line x1={x} y1="100" x2={x} y2="100.5" stroke="#374151" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}

          {/* 网格线 */}
          {[25, 50, 75].map((val) => {
            const y = 100 - val;
            return (
              <line
                key={val}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* 数据曲线填充 */}
          <path d={path} fill="#3b82f6" opacity="0.2" />
          {/* 数据曲线描边 */}
          <path
            d={path.replace('Z', '')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />

          {/* 峰的垂直指示线 */}
          {peaks.map((peak, idx) => {
            const x = ((peak.mz - mzMin) / mzRange) * 100;
            const y = 100 - (peak.abundance / maxAbundance) * 75;
            const isKeyPeak = peak.isKey;

            return (
              <line
                key={idx}
                x1={x}
                y1={y}
                x2={x}
                y2="100"
                stroke={isKeyPeak ? '#ef4444' : '#94a3b8'}
                strokeWidth={isKeyPeak ? 1.5 : 0.8}
                strokeDasharray={isKeyPeak ? "3,2" : "2,2"}
                vectorEffect="non-scaling-stroke"
                opacity={0.7}
              />
            );
          })}
        </svg>

        {/* 峰标签（HTML，绝对定位，不变形） */}
        {peaks.map((peak, idx) => {
          const leftPercent = ((peak.mz - mzMin) / mzRange) * 100;
          const topPercent = 100 - (peak.abundance / maxAbundance) * 85;
          const isKeyPeak = peak.isKey;
          // 计算相对丰度百分比（相对于最大峰）
          const abundancePercent = (peak.abundance / maxAbundance) * 100;

          return (
            <div key={idx}>
              {/* 峰名称标签（在峰上方） */}
              <div
                className={`absolute -translate-x-1/2 whitespace-nowrap ${
                  isKeyPeak ? 'text-red-600 font-bold text-xs' : 'text-gray-700 font-semibold text-[10px]'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${Math.max(topPercent - 12, 2)}%`,
                }}
              >
                {peak.label}
              </div>
              {/* Y值标签（相对丰度百分比，在峰名称下方） */}
              <div
                className={`absolute -translate-x-1/2 whitespace-nowrap ${
                  isKeyPeak ? 'text-red-600 font-semibold text-[9px]' : 'text-gray-600 text-[8px]'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${Math.max(topPercent - 5, 5)}%`,
                }}
              >
                {abundancePercent.toFixed(1)}%
              </div>
              {/* m/z 值标签（在X轴下方） */}
              <div
                className={`absolute -translate-x-1/2 whitespace-nowrap ${
                  isKeyPeak ? 'text-red-600 font-bold text-[10px]' : 'text-gray-600 text-[9px]'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  top: '103%',
                }}
              >
                {peak.mz}
              </div>
            </div>
          );
        })}
      </div>

      {/* X轴标签（HTML，不变形，放在右侧末尾） */}
      <div className="absolute bottom-0 right-2">
        <span className="text-[10px] font-semibold text-gray-600">质荷比 (m/z)</span>
      </div>
    </div>
  );
}

// 生成对比质谱数据（两个实验组）
function generateComparisonData(): {
  group1: {
    mz: number[];
    abundance: number[];
    peaks: Array<{ mz: number; abundance: number; label: string; isKey?: boolean }>;
    mzMin: number;
    mzMax: number;
  };
  group2: {
    mz: number[];
    abundance: number[];
    peaks: Array<{ mz: number; abundance: number; label: string; isKey?: boolean }>;
    mzMin: number;
    mzMax: number;
  };
} {
  // m/z范围：30-40（只显示关键区域）
  const mzMin = 30;
  const mzMax = 40;
  const dataPoints = 200; // 高分辨率
  const mz = Array.from({ length: dataPoints }, (_, i) => mzMin + (i / (dataPoints - 1)) * (mzMax - mzMin));

  // 组1：标记CO₂（H₂¹⁶O + C¹⁸O₂）
  // ¹⁸O丰度接近自然本底（约0.20%）
  // ¹⁶O₂ : ¹⁶O¹⁸O : ¹⁸O₂ ≈ 99.6% : 0.4% : 0.0004%
  const abundance1 = mz.map((m) => {
    let val = 0;
    // 32号峰：¹⁶O₂（主峰，100%）
    val += gaussian(m, 32, 0.3, 100);
    // 34号峰：¹⁶O¹⁸O（自然本底，约0.4%）
    val += gaussian(m, 34, 0.3, 0.4);
    // 36号峰：¹⁸O₂（自然本底，约0.0004%，但为了可见性设为0.2%）
    val += gaussian(m, 36, 0.3, 0.2);
    // 基线噪声
    val += Math.random() * 0.1;
    return Math.max(0, val);
  });

  // 组2：标记水（H₂¹⁸O 0.85% + CO₂）
  // ¹⁸O丰度约0.85%
  // 根据用户数据：¹⁶O₂ : ¹⁶O¹⁸O : ¹⁸O₂ ≈ 98.3% : 1.7% : 0.007%
  // 但为了突出36号峰的差异，我们调整比例使其更明显
  const abundance2 = mz.map((m) => {
    let val = 0;
    // 32号峰：¹⁶O₂（主峰，100%）
    val += gaussian(m, 32, 0.3, 100);
    // 34号峰：¹⁶O¹⁸O（约1.7%）
    val += gaussian(m, 34, 0.3, 1.7);
    // 36号峰：¹⁸O₂（约0.007%，但为了可见性设为1.0%，突出差异）
    val += gaussian(m, 36, 0.3, 1.0);
    // 基线噪声
    val += Math.random() * 0.1;
    return Math.max(0, val);
  });

  // 峰信息
  const peaks1 = [
    {
      mz: 32,
      abundance: 100,
      label: '¹⁶O₂',
      isKey: false,
    },
    {
      mz: 34,
      abundance: 0.4,
      label: '¹⁶O¹⁸O',
      isKey: false,
    },
    {
      mz: 36,
      abundance: 0.2,
      label: '¹⁸O₂',
      isKey: true, // 关键峰，重点观察
    },
  ];

  const peaks2 = [
    {
      mz: 32,
      abundance: 100,
      label: '¹⁶O₂',
      isKey: false,
    },
    {
      mz: 34,
      abundance: 1.7,
      label: '¹⁶O¹⁸O',
      isKey: false,
    },
    {
      mz: 36,
      abundance: 1.0,
      label: '¹⁸O₂',
      isKey: true, // 关键峰，重点观察
    },
  ];

  return {
    group1: {
      mz,
      abundance: abundance1,
      peaks: peaks1,
      mzMin,
      mzMax,
    },
    group2: {
      mz,
      abundance: abundance2,
      peaks: peaks2,
      mzMin,
      mzMax,
    },
  };
}

// 高斯函数生成峰形
function gaussian(x: number, mean: number, sigma: number, amplitude: number): number {
  return amplitude * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}
