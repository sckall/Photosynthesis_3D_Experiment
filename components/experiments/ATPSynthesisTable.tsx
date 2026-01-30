import React from 'react';
import { ExperimentRecord, Additives } from '../../types';

interface ATPSynthesisTableProps {
  records: ExperimentRecord[];
  isRunning: boolean;
  innerHDefault: string; // 默认膜内H⁺浓度
}

// 格式化添加剂显示
function formatAdditives(adds: Additives): string {
  const parts: string[] = [];
  if (adds.adp) parts.push('ADP');
  if (adds.pi) parts.push('Pi');
  if (adds.dnp) parts.push('DNP');
  if (adds.inhibitor) parts.push('抑制剂');
  return parts.length > 0 ? parts.join('+') : '-';
}

// 格式化缓冲液显示
function formatBuffer(buffer: string): string {
  if (buffer === 'ph4') return 'pH=4';
  if (buffer === 'ph8') return 'pH=8';
  return '-';
}

export default function ATPSynthesisTable({ records, isRunning, innerHDefault }: ATPSynthesisTableProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* 表格头部 */}
      <div className="px-4 py-3 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-table text-purple-600"></i>
          <h3 className="font-bold text-purple-800 text-sm">实验记录表</h3>
        </div>
        <div className="text-xs text-purple-600">
          共 {records.length} 条记录
        </div>
      </div>

      {/* 类囊体腔默认浓度提示 */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
        <i className="fas fa-info-circle text-amber-600 text-xs"></i>
        <span className="text-xs text-amber-800">
          类囊体腔内默认[H⁺] = {innerHDefault} mol/L
        </span>
      </div>

      {/* 表格内容 */}
      <div className="flex-1 overflow-auto">
        {records.length === 0 && !isRunning ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
            <i className="fas fa-flask text-4xl mb-4 opacity-50"></i>
            <p className="text-sm font-medium">等待实验数据...</p>
            <p className="text-xs mt-2">请在右侧面板设计并运行实验</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-b border-gray-200">
                  #
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-b border-gray-200">
                  缓冲液
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-gray-700 border-b border-gray-200">
                  添加剂
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-b border-gray-200">
                  膜外[H⁺]
                  <div className="text-[10px] font-normal text-gray-500">(mol/L)</div>
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-b border-gray-200">
                  膜内[H⁺]
                  <div className="text-[10px] font-normal text-gray-500">(mol/L)</div>
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-gray-700 border-b border-gray-200">
                  ATP
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    index === records.length - 1 ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 text-gray-600 border-b border-gray-100">
                    {record.id}
                  </td>
                  <td className="px-3 py-2.5 border-b border-gray-100">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.buffer === 'ph4' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formatBuffer(record.buffer)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 border-b border-gray-100">
                    {formatAdditives(record.additives)}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono border-b border-gray-100">
                    <span className={record.outerH === '10⁻⁸' ? 'text-blue-600' : 'text-orange-600'}>
                      {record.outerH}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono border-b border-gray-100">
                    <span className={record.innerH === '10⁻⁸' ? 'text-blue-600' : 'text-orange-600'}>
                      {record.innerH}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center border-b border-gray-100">
                    {record.atpProduced ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                        <i className="fas fa-check text-[10px]"></i>
                        有
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded font-bold">
                        <i className="fas fa-times text-[10px]"></i>
                        无
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* 实验进行中的占位行 */}
              {isRunning && (
                <tr className="bg-purple-50 animate-pulse">
                  <td className="px-3 py-2.5 text-gray-400 border-b border-gray-100">
                    {records.length + 1}
                  </td>
                  <td colSpan={5} className="px-3 py-2.5 text-center text-purple-600 border-b border-gray-100">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    数据采集中...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 表格底部说明 */}
      {records.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              <span className="inline-block w-2 h-2 rounded bg-orange-500 mr-1"></span>
              高浓度 (10⁻⁴)
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded bg-blue-500 mr-1"></span>
              低浓度 (10⁻⁸)
            </span>
            <span className="ml-auto">
              ATP合成需要：浓度梯度 + ADP + Pi - 抑制剂
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
