import React, { useState } from 'react';
import RealTimeChart from './RealTimeChart';
import { HistoryData } from '../types';
import { exportToCSV } from '../utils/export';
import { COLORS } from '../constants';

interface ChartPanelProps {
  history: HistoryData;
}

export default function ChartPanel({ history }: ChartPanelProps) {
  const [mode, setMode] = useState<'follow' | 'global'>('follow');

  const handleExport = () => {
    exportToCSV(history);
  };

  return (
    <div className="h-[280px] bg-white border-t border-green-200 flex flex-col shrink-0 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* 图表头部 */}
      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
            <i className="fas fa-chart-line text-green-600"></i>
            实时含量监测（绝对值 a.u.）
          </h3>
          <div className="hidden sm:flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setMode('follow')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                mode === 'follow' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="跟随模式：纵轴/横轴窗口随当前数据自动调整"
            >
              跟随
            </button>
            <button
              onClick={() => setMode('global')}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                mode === 'global' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="全局模式：固定纵轴范围，横轴显示更长时间"
            >
              全局
            </button>
          </div>
          <div className="hidden md:flex gap-3 text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>P总速率
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>C3含量
            </span>
            <span className="flex items-center gap-1 text-purple-600">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>C5含量
            </span>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="text-xs bg-white border border-gray-300 hover:bg-green-50 text-green-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-2 transition-colors"
        >
          <i className="fas fa-download"></i> 导出数据 (CSV)
        </button>
      </div>

      {/* 图表主体 */}
      <div className="flex-1 w-full p-2 relative">
        <RealTimeChart data={history} height={200} mode={mode} />
      </div>
    </div>
  );
}

