import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onReset?: () => void;
  onPlaceholderFill?: (nodeId: string, label: string) => void;
  placeholders?: {
    nodes: {
      c3: { filledWith?: string };
      c5: { filledWith?: string };
      atp: { filledWith?: string };
      nadph: { filledWith?: string };
      adp: { filledWith?: string };
      nadp: { filledWith?: string };
    };
  };
  onValidate?: (isCorrect: boolean) => void;
}

// 材料数据
const MATERIALS = [
  {
    title: '资料一',
    content: `<div style="padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,#e8f5ff,#f3fbff);border:1px solid #bfe1ff;margin-bottom:10px;">
      <div style="color:#1f2d3d;line-height:1.6;font-size:12px;">
        1955 年，阿尔农等人将离体的叶绿体悬浮液置于无光照、有 CO₂的环境中，同时向悬浮液中提供ATP和NADPH。实验发现，体系中出现了糖类的合成，并且 ATP 和 NADPH 的含量显著减少。
      </div>
    </div>`
  },
  {
    title: '资料二',
    content: `<div style="padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#fefce8);border:1px solid #fcd34d;margin-bottom:10px;">
      <div style="color:#1f2d3d;line-height:1.6;font-size:12px;">
        1948年至1954年，美国生化学家卡尔文利用同位素示踪法，向小球藻提供¹⁴C标记的CO₂，追踪其在光合作用中的转移路径，发现放射性最先出现在一种三碳化合物（C₃）中，随后逐渐集中出现在葡萄糖和五碳化合物（C₅）中；在光合作用过程中，若突然降低二氧化碳的供应，会导致C₃含量减少、C₅含量增加，若中断光照，则C₅含量减少、C₃含量增加。
      </div>
    </div>`
  }
];

// 节点库数据
const PALETTE_ITEMS = [
  { id: 'c3', label: '2C₃' },
  { id: 'c5', label: 'C₅' },
  { id: 'atp', label: 'ATP' },
  { id: 'nadph', label: 'NADPH' },
  { id: 'adp', label: 'ADP+Pi' },
  { id: 'nadp', label: 'NADP⁺' },
];

// 标准答案配置
const STANDARD_ANSWER: Record<string, string> = {
  c3: 'c3',
  c5: 'c5',
  atp: 'atp',
  nadph: 'nadph',
  adp: 'adp',
  nadp: 'nadp',
};

export default function CalvinCycleExperiment({ onBack, onReset, onPlaceholderFill, placeholders, onValidate }: Props) {
  const [currentMaterial, setCurrentMaterial] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const handleDragStart = (itemId: string, e: React.DragEvent) => {
    setDraggedItem(itemId);
    // 设置拖拽数据
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 验证模型建构
  const handleValidate = () => {
    if (!placeholders) {
      setValidationResult({ isCorrect: false, message: '请先填充所有占位节点' });
      return;
    }

    const nodes = placeholders.nodes;
    const allFilled = Object.values(nodes).every(node => node.filledWith);
    
    if (!allFilled) {
      setValidationResult({ isCorrect: false, message: '请填充所有占位节点后再验证' });
      return;
    }

    // 检查每个节点是否正确
    let isCorrect = true;
    const errors: string[] = [];
    
    Object.entries(STANDARD_ANSWER).forEach(([nodeId, expectedItemId]) => {
      const actualItemId = nodes[nodeId as keyof typeof nodes]?.filledWith;
      if (actualItemId !== expectedItemId) {
        isCorrect = false;
        errors.push(`${nodeId}位置不正确`);
      }
    });

    if (isCorrect) {
      setValidationResult({ isCorrect: true, message: '模型建构正确！' });
      onValidate?.(true);
    } else {
      setValidationResult({ isCorrect: false, message: `模型建构错误：${errors.join('，')}` });
      onValidate?.(false);
    }

    // 3秒后自动隐藏提示
    setTimeout(() => {
      setValidationResult(null);
    }, 3000);
  };

  return (
    <div className="w-[360px] bg-white border-l-2 border-green-200 shadow-2xl flex flex-col shrink-0 z-30 overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-cyan-50">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 
            text-sm font-bold transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          <span>返回实验选择</span>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-gray-800">
            实验三：卡尔文循环
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            操作提示：根据证据，拖拽节点到3D场景的占位框
          </p>
        </div>
      </div>

      {/* 材料区 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-br from-blue-50/50 to-white">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <i className="fas fa-book-open text-green-600"></i>
              参考材料
            </h3>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setCurrentMaterial(Math.max(0, currentMaterial - 1))}
                disabled={currentMaterial === 0}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded 
                  disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="text-xs font-medium text-gray-700 px-2 py-0.5 bg-green-100 rounded-full">
                {MATERIALS[currentMaterial]?.title}
              </span>
              <button
                onClick={() => setCurrentMaterial(Math.min(MATERIALS.length - 1, currentMaterial + 1))}
                disabled={currentMaterial >= MATERIALS.length - 1}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded 
                  disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          <div
            className="text-xs leading-relaxed max-h-32 overflow-y-auto custom-scrollbar"
            dangerouslySetInnerHTML={{ __html: MATERIALS[currentMaterial]?.content || '' }}
          />
        </div>
      </div>

      {/* 节点库 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-purple-50/30 to-white">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1.5">
              <i className="fas fa-th-large text-purple-600"></i>
              节点库
            </h3>
            <p className="text-xs text-gray-600">
              拖拽到3D场景中的占位框
            </p>
          </div>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-300 
              bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            重置
          </button>
        </div>

        {/* 紧凑网格布局 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PALETTE_ITEMS.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(item.id, e)}
              onDragEnd={handleDragEnd}
              className={`group px-3 py-2.5 rounded-lg border-2 cursor-move
                transition-all duration-200 hover:scale-105 hover:shadow-md
                ${draggedItem === item.id 
                  ? 'border-purple-500 bg-purple-100 shadow-lg scale-105' 
                  : 'border-purple-300 bg-white hover:border-purple-400'
                }`}
            >
              <div className="flex items-center justify-center">
                <div className="text-sm font-extrabold text-gray-800 text-center leading-tight">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 建构模型按钮 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleValidate}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 
              text-white font-bold rounded-lg shadow-md hover:shadow-lg 
              hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            <i className="fas fa-check-circle mr-2"></i>
            建构模型
          </button>

          {/* 验证结果提示 */}
          {validationResult && (
            <div className={`mt-3 px-4 py-3 rounded-lg border-2 ${
              validationResult.isCorrect
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-start gap-2">
                <i className={`fas ${validationResult.isCorrect ? 'fa-check-circle' : 'fa-times-circle'} 
                  text-xl mt-0.5 ${validationResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}></i>
                <div className="flex-1">
                  <div className={`text-sm font-bold mb-1 ${
                    validationResult.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationResult.isCorrect ? '✓ 模型建构正确！' : '✗ 模型建构错误'}
                  </div>
                  <div className={`text-xs ${
                    validationResult.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {validationResult.message}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
