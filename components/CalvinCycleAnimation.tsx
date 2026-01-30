import React, { useEffect, useRef, useState } from 'react';

export default function CalvinCycleAnimation({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [message, setMessage] = useState("准备开始...");
  const isPlayingRef = useRef(true);
  const isMountedRef = useRef(true);

  // Toggle Play
  const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = !isPlaying;
      setIsPlaying(next);
      isPlayingRef.current = next;
  };

  // Refs for SVG elements to manipulate DOM directly for performance
  const els = useRef<Record<string, SVGElement | null>>({});

  // Helper: Wait function that respects Pause state
  const wait = async (ms: number) => {
    let elapsed = 0;
    const step = 50;
    while (elapsed < ms) {
        if (!isMountedRef.current) return;
        if (isPlayingRef.current) {
            await new Promise(r => setTimeout(r, step));
            elapsed += step;
        } else {
            await new Promise(r => setTimeout(r, 100)); // Pause loop
        }
    }
  };

  // Helper: Set CSS Transform & Opacity
  const animate = (id: string, x: number, y: number, opacity: number, duration: number = 1000) => {
      const el = els.current[id];
      if (el) {
          el.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease`;
          el.style.transform = `translate(${x}px, ${y}px)`;
          el.style.opacity = String(opacity);
      }
  };

  // Helper: Instant set (reset)
  const setInstant = (id: string, x: number, y: number, opacity: number) => {
      const el = els.current[id];
      if (el) {
          el.style.transition = 'none';
          el.style.transform = `translate(${x}px, ${y}px)`;
          el.style.opacity = String(opacity);
          // Force reflow
          void el.getBoundingClientRect(); 
      }
  };

  useEffect(() => {
    isMountedRef.current = true;
    isPlayingRef.current = true;

    const runLoop = async () => {
        while (isMountedRef.current) {
            // --- 0. Initialization ---
            setMessage("准备开始...");
            // Initial positions
            setInstant('c5', 300, 100, 1);    // Top center
            setInstant('co2', 50, 50, 0);     // Top left out
            setInstant('c3_1', 300, 100, 0);  // Hidden at C5 pos
            setInstant('c3_2', 300, 100, 0);  // Hidden at C5 pos
            setInstant('atp', 100, 300, 0);   // Bottom left out
            setInstant('nadph', 400, 300, 0); // Bottom right out
            setInstant('g3p_1', 220, 350, 0); // Hidden at reaction site
            setInstant('g3p_2', 380, 350, 0); // Hidden at reaction site
            setInstant('sugar', 450, 350, 0); // Hidden at output

            await wait(1000);

            // --- Phase 1: Carbon Fixation ---
            if (!isMountedRef.current) break;
            setMessage("① 碳固定：CO₂ 被固定为 C₃");
            
            // CO2 enters
            animate('co2', 250, 100, 1, 1500); 
            await wait(1500);

            // Reaction: C5 + CO2 -> 2 C3
            // 1. Move CO2 into C5
            animate('co2', 300, 100, 0, 500); 
            animate('c5', 300, 100, 0, 500); // C5 fades/splits
            
            await wait(500);
            
            // 2. C3s appear and separate
            setInstant('c3_1', 300, 100, 0);
            setInstant('c3_2', 300, 100, 0);
            // Small delay to allow browser render frame
            await new Promise(r => setTimeout(r, 20));
            
            animate('c3_1', 220, 250, 1, 1200); // Move down-left
            animate('c3_2', 380, 250, 1, 1200); // Move down-right
            
            await wait(1500);

            // --- Phase 2: Reduction ---
            if (!isMountedRef.current) break;
            setMessage("② 还原：C₃ 在 ATP/NADPH 驱动下还原为 G3P");

            // 1. C3s move to reaction area
            animate('c3_1', 220, 350, 1, 1000);
            animate('c3_2', 380, 350, 1, 1000);

            // 2. ATP & NADPH Enter
            animate('atp', 160, 350, 1, 1000);   // From left
            animate('nadph', 440, 350, 1, 1000); // From right

            await wait(1200);

            // 3. Reaction Flash (Consumption)
            animate('c3_1', 220, 350, 0, 500);
            animate('c3_2', 380, 350, 0, 500);
            animate('atp', 220, 350, 0, 500);   // Consumed
            animate('nadph', 380, 350, 0, 500); // Consumed
            
            await wait(500);

            // 4. G3P Appear
            setInstant('g3p_1', 220, 350, 0);
            setInstant('g3p_2', 380, 350, 0);
            await new Promise(r => setTimeout(r, 20));
            animate('g3p_1', 220, 350, 1, 500);
            animate('g3p_2', 380, 350, 1, 500);
            
            await wait(1000);

            // --- Phase 3: Regeneration ---
            if (!isMountedRef.current) break;
            setMessage("③ 再生：多数 G3P 用于再生 C₅，少数用于合成糖类");

            // Path 1: Output to Sugar (Right)
            animate('g3p_2', 500, 350, 0, 1500); // Move right and fade
            animate('sugar', 520, 350, 1, 1500); // Sugar appears
            
            // Path 2: Regeneration to C5 (Left and Up)
            animate('g3p_1', 300, 100, 0, 2000); // Move back to top center
            animate('c5', 300, 100, 1, 2000);    // C5 Reappears
            
            await wait(2000);

            // Cleanup Sugar
            animate('sugar', 580, 350, 0, 1000); // Fade out
            await wait(1000);
        }
    };

    runLoop();

    return () => {
        isMountedRef.current = false;
    };
  }, []);

  // SVG Element Component
  const Molecule = ({ id, label, color, stroke, textColor="#1f2937", type='circle' }: any) => (
      <g 
        ref={(el) => { els.current[id] = el as SVGElement; }} 
        style={{ opacity: 0, transition: 'opacity 0.5s' }}
      >
          {type === 'circle' ? (
             <circle r="24" fill={color} stroke={stroke} strokeWidth="3" />
          ) : (
             <rect x="-32" y="-20" width="64" height="40" rx="8" fill={color} stroke={stroke} strokeWidth="3" />
          )}
          <text 
            x="0" y="0" 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize="12" 
            fontWeight="800" 
            fill={textColor}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {label}
          </text>
      </g>
  );

  return (
    <div className="w-[600px] h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans border border-green-200 relative select-none">
        {/* Header */}
        <div className="bg-green-700 text-white px-5 py-4 flex justify-between items-center shadow-md z-10">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <i className="fas fa-sync-alt animate-spin-slow"></i> 
                    卡尔文循环 (Calvin Cycle)
                </h3>
                <p className="text-green-100 text-xs mt-0.5">叶绿体基质中的暗反应过程</p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={togglePlay} 
                    className="hover:bg-green-600 bg-green-800/60 px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border border-green-500"
                >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    {isPlaying ? '暂停' : '播放'}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="hover:bg-red-500 hover:text-white bg-white/10 text-white px-3 py-1.5 rounded-full text-sm transition-colors border border-transparent hover:border-red-400"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>

        {/* Animation Stage */}
        <div className="flex-1 bg-[#f0fdf4] relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute inset-0 opacity-30 pointer-events-none">
                 <svg width="100%" height="100%">
                     <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#bef264" strokeWidth="1"/>
                        </pattern>
                     </defs>
                     <rect width="100%" height="100%" fill="url(#grid)" />
                 </svg>
             </div>

             <svg viewBox="0 0 600 450" className="w-full h-full relative z-0">
                <defs>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.15"/>
                    </filter>
                </defs>
                
                {/* Background Cycle Arrows (Static Reference) */}
                <g opacity="0.15" stroke="#16a34a" strokeWidth="40" fill="none" strokeLinecap="round">
                     <path d="M 300 120 A 160 160 0 1 1 180 350" />
                     <path d="M 170 330 L 180 370 L 220 340" strokeWidth="10" strokeLinejoin="round"/>
                </g>
                
                {/* --- Animation Layer --- */}
                
                {/* Stage 1: Fixation */}
                <Molecule id="c5" label="C₅" color="#d8b4fe" stroke="#9333ea" />
                <Molecule id="co2" label="CO₂" color="#e5e7eb" stroke="#4b5563" />
                
                {/* Stage 2: Reduction */}
                <Molecule id="c3_1" label="C₃" color="#fca5a5" stroke="#dc2626" />
                <Molecule id="c3_2" label="C₃" color="#fca5a5" stroke="#dc2626" />
                
                {/* Energy Inputs */}
                <Molecule id="atp" label="ATP" color="#fef08a" stroke="#eab308" textColor="#854d0e" />
                <Molecule id="nadph" label="NADPH" color="#bae6fd" stroke="#0ea5e9" textColor="#0369a1" />
                
                {/* Stage 3: Product */}
                <Molecule id="g3p_1" label="G3P" color="#fdba74" stroke="#ea580c" />
                <Molecule id="g3p_2" label="G3P" color="#fdba74" stroke="#ea580c" />
                
                {/* Output */}
                <Molecule id="sugar" label="糖类" color="#ffedd5" stroke="#c2410c" type="rect" />
             </svg>

             {/* Message Box Overlay */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[85%]">
                <div className="bg-white/95 backdrop-blur-sm border-l-4 border-green-600 shadow-lg rounded-r-lg p-4 transition-all duration-300 transform">
                    <p className="text-base font-bold text-gray-800 flex items-start gap-3">
                        <i className="fas fa-info-circle text-green-600 mt-1"></i>
                        {message}
                    </p>
                </div>
             </div>
        </div>
    </div>
  );
}
