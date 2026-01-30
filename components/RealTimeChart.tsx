import React, { useEffect, useRef, useState } from 'react';
import { RealTimeChartProps } from '../types';
import { COLORS } from '../constants';

export default function RealTimeChart({ data, height = 220, mode = 'follow' }: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number; index: number } | null>(null);

  // Configuration
  // Increased right padding to 65px to accommodate labels
  const PADDING = { top: 20, right: 65, bottom: 25, left: 35 };

  // 视图状态（用于“跟随/全局”模式平滑切换）
  const viewRef = useRef({
    yMin: 0,
    yMax: 1,
    xStart: 0,
    xEnd: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const drawWidth = width * dpr;
    const drawHeight = height * dpr;
    
    canvas.width = drawWidth;
    canvas.height = drawHeight;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Chart Area
    const chartW = width - PADDING.left - PADDING.right;
    const chartH = height - PADDING.top - PADDING.bottom;
    const dataLen = data.c3.length;
    if (dataLen < 2) return;

    // 需求：删除 ATP/ADP 曲线后，仅用 P_total / C3 / C5
    const series = [data.pTotal, data.c3, data.c5];

    const computeMinMax = (start: number, end: number) => {
      let minV = Infinity;
      let maxV = -Infinity;
      for (const arr of series) {
        for (let i = start; i <= end; i++) {
          const v = arr[i];
          if (!Number.isFinite(v)) continue;
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
      }
      return { minV, maxV };
    };

    const formatY = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 100) return v.toFixed(0);
      if (abs >= 10) return v.toFixed(1);
      return v.toFixed(2);
    };

    // 目标视图（mode 决定）
    const FOLLOW_POINTS = 300; // 跟随模式：较短时间窗
    const targetXEnd = dataLen - 1;
    const targetXStart = mode === 'follow' ? Math.max(0, dataLen - FOLLOW_POINTS) : 0;

    // y 轴目标范围
    let targetYMin = 0;
    let targetYMax = 1;
    if (mode === 'follow') {
      const { minV, maxV } = computeMinMax(targetXStart, targetXEnd);
      if (!Number.isFinite(minV) || !Number.isFinite(maxV)) return;
      const spanRaw = maxV - minV;
      const minSpan = Math.max(10, Math.abs(maxV) * 0.15);
      const span = Math.max(spanRaw, minSpan);
      const pad = span * 0.12;
      targetYMin = minV - pad;
      targetYMax = maxV + pad;
    } else {
      // 全局模式：纵轴“完整范围”（从 0 开始），更稳定；并保持一定边距
      const { maxV } = computeMinMax(0, targetXEnd);
      if (!Number.isFinite(maxV)) return;
      const minSpan = Math.max(50, Math.abs(maxV) * 0.2);
      const yMax = Math.max(maxV * 1.08, minSpan);
      targetYMin = 0;
      targetYMax = yMax;
    }

    // 动画：把 viewRef 平滑逼近目标（切换模式时不突变）
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpInt = (a: number, b: number, t: number) => Math.round(lerp(a, b, t));
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    // 单帧插值强度（越小越平滑）
    const k = mode === 'follow' ? 0.12 : 0.10;

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, width, height);

      // 更新当前视图
      const v = viewRef.current;
      v.xStart = lerpInt(v.xStart, targetXStart, k);
      v.xEnd = lerpInt(v.xEnd, targetXEnd, k);
      v.yMin = lerp(v.yMin, targetYMin, k);
      v.yMax = lerp(v.yMax, targetYMax, k);

      // 修正
      v.xStart = Math.max(0, Math.min(v.xStart, dataLen - 2));
      v.xEnd = Math.max(v.xStart + 1, Math.min(v.xEnd, dataLen - 1));
      if (v.yMax - v.yMin < 1e-6) {
        v.yMax = v.yMin + 1;
      }

      const visibleLen = v.xEnd - v.xStart + 1;

      // Helpers（基于当前视图窗口）
      const getX = (i: number) => PADDING.left + ((i - v.xStart) / (visibleLen - 1)) * chartW;
      const getY = (val: number) => {
        const t = clamp01((val - v.yMin) / (v.yMax - v.yMin));
        return PADDING.top + chartH - t * chartH;
      };

      // --- 1. Draw Grid & Axes ---
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Y-Axis Grid & Labels (动态 5 刻度)
      const ticks = 5;
      for (let i = 0; i < ticks; i++) {
        const t = i / (ticks - 1);
        const val = v.yMin + t * (v.yMax - v.yMin);
        const y = getY(val);
        ctx.beginPath();
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = COLORS.grid;
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(width - PADDING.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(formatY(val), PADDING.left - 5, y);
      }

    // X-Axis Line
    ctx.beginPath();
    ctx.strokeStyle = '#9ca3af';
    ctx.moveTo(PADDING.left, PADDING.top + chartH);
    ctx.lineTo(width - PADDING.right, PADDING.top + chartH);
    ctx.stroke();

      // X-Axis Time Labels
      // Pick 5 equidistant points to show time
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const numLabels = 5;
      for (let i = 0; i < numLabels; i++) {
        // Calculate index within current window
        const index = v.xStart + Math.floor(i * (visibleLen - 1) / (numLabels - 1));
        const x = getX(index);
        const timeVal = data.time[index];
        
        // Draw tick
        ctx.beginPath();
        ctx.moveTo(x, PADDING.top + chartH);
        ctx.lineTo(x, PADDING.top + chartH + 5);
        ctx.stroke();

        // Draw text (seconds)
        if (timeVal !== undefined) {
             ctx.fillText(`${timeVal.toFixed(0)}s`, x, PADDING.top + chartH + 8);
        }
    }


      // --- 2. Draw Event Markers (Vertical Lines) ---
      ctx.save();
      for (let i = v.xStart; i <= v.xEnd; i++) {
        const marker = data.markers[i];
        if (marker) {
            const x = getX(i);
            // Vertical Line
            ctx.beginPath();
            ctx.strokeStyle = '#4b5563';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.moveTo(x, PADDING.top);
            ctx.lineTo(x, height - PADDING.bottom);
            ctx.stroke();
            
            // Label
            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'left';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(marker, x + 4, PADDING.top + 10);
        }
      }
      ctx.restore();

    // --- 3. Draw Curves ---
      const drawPath = (values: number[], color: string, width: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.moveTo(getX(v.xStart), getY(values[v.xStart]));
        for (let i = v.xStart + 1; i <= v.xEnd; i++) {
          ctx.lineTo(getX(i), getY(values[i]));
        }
        ctx.stroke();
      };

    drawPath(data.pTotal, COLORS.pTotal, 2.5);
    drawPath(data.c3, COLORS.c3, 2.0);
    drawPath(data.c5, COLORS.c5, 2.0);

      // --- 4. Draw End Labels with Collision Detection ---
      const lastIdx = v.xEnd;
      if (lastIdx >= 0) {
        const labels = [
            { text: 'P总', val: data.pTotal[lastIdx], color: COLORS.pTotal },
            { text: 'C3', val: data.c3[lastIdx], color: COLORS.c3 },
            { text: 'C5', val: data.c5[lastIdx], color: COLORS.c5 },
        ];

        // 1. Initialize positions
        let items = labels.map(l => ({
            ...l,
            y: getY(l.val),
            originalY: getY(l.val)
        }));

        // 2. Sort by Y position (canvas Y increases downwards)
        items.sort((a, b) => a.y - b.y);

        // 3. Relax positions to prevent overlap
        const minSpacing = 12; // Minimum vertical pixels between labels
        for (let i = 0; i < 5; i++) { // Iterations to settle
            for (let j = 0; j < items.length - 1; j++) {
                const top = items[j];
                const bottom = items[j + 1];
                const dist = bottom.y - top.y;
                
                if (dist < minSpacing) {
                    const push = (minSpacing - dist) / 2;
                    top.y -= push;
                    bottom.y += push;
                }
            }
        }

        // 4. Draw labels
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 10px sans-serif';
        const labelX = width - PADDING.right + 6;

        items.forEach(item => {
            // Draw connecting line if label moved significantly
            if (Math.abs(item.y - item.originalY) > 2) {
                 ctx.beginPath();
                 ctx.strokeStyle = item.color;
                 ctx.lineWidth = 1;
                 ctx.globalAlpha = 0.5;
                 ctx.moveTo(width - PADDING.right + 2, item.originalY);
                 ctx.lineTo(labelX - 2, item.y);
                 ctx.stroke();
                 ctx.globalAlpha = 1.0;
            } else {
                 // Small dot if aligned
                 ctx.beginPath();
                 ctx.arc(width - PADDING.right, item.originalY, 2, 0, Math.PI * 2);
                 ctx.fillStyle = item.color;
                 ctx.fill();
            }

            ctx.fillStyle = item.color;
            ctx.fillText(item.text, labelX, item.y);
        });
    }

      // --- 5. Interactive Cursor (if hovering) ---
      if (hoverData) {
        const idx = hoverData.index;
        if (idx >= v.xStart && idx <= v.xEnd) {
          const x = getX(idx);
        
        // Cursor Line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.moveTo(x, PADDING.top);
        ctx.lineTo(x, height - PADDING.bottom);
        ctx.stroke();

        // Dots on lines
        const drawDot = (val: number, color: string) => {
            const y = getY(val);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.stroke();
        };

          drawDot(data.pTotal[idx], COLORS.pTotal);
          drawDot(data.c3[idx], COLORS.c3);
          drawDot(data.c5[idx], COLORS.c5);
        }
      }

      // 是否继续动画（用于模式切换的平滑过渡）
      const done =
        Math.abs(v.yMin - targetYMin) < 0.5 &&
        Math.abs(v.yMax - targetYMax) < 0.5 &&
        Math.abs(v.xStart - targetXStart) <= 1;

      if (!done) {
        raf = requestAnimationFrame(draw);
      }
    };

    // 初始化 viewRef（首次渲染）
    if (viewRef.current.xEnd === 0) {
      viewRef.current.xStart = targetXStart;
      viewRef.current.xEnd = targetXEnd;
      viewRef.current.yMin = targetYMin;
      viewRef.current.yMax = targetYMax;
    }

    let raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);

  }, [data, height, hoverData, mode]);

  // Interaction Handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING.left;
    const chartW = rect.width - PADDING.left - PADDING.right;
    
    const v = viewRef.current;
    const visibleLen = Math.max(2, v.xEnd - v.xStart + 1);

    // Convert mouse X to data index within current window
    let idxInWindow = Math.round((x / chartW) * (visibleLen - 1));
    idxInWindow = Math.max(0, Math.min(idxInWindow, visibleLen - 1));
    let index = v.xStart + idxInWindow;
    index = Math.max(v.xStart, Math.min(index, v.xEnd));
    
    setHoverData({ x: e.clientX - rect.left, index });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full bg-white/60 backdrop-blur-md rounded-lg border border-green-200 shadow-inner overflow-hidden cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: `${height}px` }}
        className="block"
      />
      
      {/* HTML Tooltip Overlay */}
      {hoverData && (
        <div 
            className="absolute top-2 pointer-events-none bg-white/95 border border-green-100 shadow-xl rounded-lg p-2 text-[10px] z-20 w-40 tabular-nums leading-tight"
            style={{ 
                // Keep tooltip inside container
                left: Math.min(Math.max(hoverData.x + 10, 0), (containerRef.current?.clientWidth || 300) - 165),
            }}
        >
            <div className="font-bold text-gray-500 mb-1 border-b border-gray-100 pb-1 flex justify-between">
                <span>Time:</span>
                <span>{data.time[hoverData.index]?.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between items-center text-green-600"><span className="font-bold">P总速率</span> <span>{data.pTotal[hoverData.index].toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-red-600"><span className="font-bold">C3含量</span> <span>{data.c3[hoverData.index].toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-purple-600"><span className="font-bold">C5含量</span> <span>{data.c5[hoverData.index].toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}