import React from 'react';

interface SidebarProps {
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  isLightOn: boolean;
  toggleLight: () => void;
  lightIntensity: number;
  setLightIntensity: (intensity: number) => void;
  co2Level: number;
  setCo2Level: (level: number) => void;
  simTime: number;
  onBack?: () => void;
  onReset?: () => void;
}

export default function Sidebar({
  isPaused,
  setIsPaused,
  isLightOn,
  toggleLight,
  lightIntensity,
  setLightIntensity,
  co2Level,
  setCo2Level,
  simTime,
  onBack,
  onReset,
}: SidebarProps) {
  return (
    <div className="w-[360px] bg-white border-l border-green-200 shadow-2xl flex flex-col shrink-0 z-30">
      {/* 仪表板头部 */}
      <div className="p-6 border-b border-green-100 bg-gradient-to-br from-purple-50/80 to-white">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-purple-600 hover:text-purple-800 
              text-sm font-bold transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>返回实验选择</span>
          </button>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight leading-none">
          <span className="text-purple-800">实验4：</span>
          <span className="text-pink-600">环境因素影响</span>
        </h1>
        <p className="text-gray-500 text-xs mt-3 leading-relaxed">
          通过交互式模拟，探索光合作用中光反应与暗反应的动态平衡机制。
        </p>
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* 状态卡片 */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">系统状态</h3>
            <div
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPaused ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}
            >
              {isPaused ? '已暂停' : '运行中'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-gray-400 text-[10px] uppercase">模拟时间</span>
              <span className="font-mono font-bold text-lg text-gray-800 tracking-tight">
                {simTime.toFixed(1)}s
              </span>
            </div>
            <div>
              <span className="block text-gray-400 text-[10px] uppercase">光照状态</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isLightOn ? 'text-yellow-600' : 'text-gray-400'
                }`}
              >
                <i className={`fas ${isLightOn ? 'fa-sun' : 'fa-moon'}`}></i>
                {isLightOn ? '开启 (ON)' : '关闭 (OFF)'}
              </span>
            </div>
          </div>
        </div>

        {/* 主控制 */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-500 rounded-full"></span>
            实验控制
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isPaused
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
              {isPaused ? '继续实验' : '暂停实验'}
            </button>

            <button
              onClick={toggleLight}
              className={`py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isLightOn
                  ? 'bg-yellow-400 text-yellow-900 shadow-md ring-2 ring-yellow-200'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-power-off"></i>
              {isLightOn ? '关闭光源' : '开启光源'}
            </button>
          </div>

          {/* 重置按钮 */}
          {onReset && (
            <button
              onClick={onReset}
              className="w-full py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 
                bg-red-500 text-white hover:bg-red-600 shadow-md transition-all"
            >
              <i className="fas fa-redo"></i>
              重置实验
            </button>
          )}

          {/* 滑块 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-5 border border-gray-100">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <label>光照强度</label>
                <span>{Math.round(lightIntensity)} lx</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="100"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                disabled={!isLightOn}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  isLightOn ? 'bg-yellow-200 accent-yellow-500' : 'bg-gray-200 accent-gray-400'
                }`}
              />
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>0 lx</span>
                <span>50000 lx</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <label>CO₂ 浓度</label>
                <span>{Math.round(co2Level)} μL/L</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={co2Level}
                onChange={(e) => setCo2Level(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
              />
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>0 μL/L</span>
                <span>1000 μL/L</span>
              </div>
            </div>
          </div>
        </div>

        {/* 探究建议 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm leading-relaxed text-amber-900 shadow-sm">
          <div className="font-bold mb-2 flex items-center gap-2 text-amber-700">
            <i className="fas fa-clipboard-list"></i> 探究建议
          </div>
          <p className="text-xs opacity-90 mb-2">
            1. 保持光照充足，待曲线平稳。<br />
            2. 点击 <span className="font-bold bg-amber-200 px-1 rounded">关闭光源</span> 按钮。<br />
            3. 观察图表中红色(C3)与紫色(C5)曲线的交叉变化。
          </p>
          <div className="text-[10px] bg-white/50 p-2 rounded text-amber-800 font-medium">
            思考：为何光反应停止后，暗反应的中间产物会出现这种消长？
          </div>
        </div>
      </div>
    </div>
  );
}

