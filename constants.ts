/**
 * 全局常量配置
 * 此文件已废弃，请使用 config/ 目录下的配置文件
 * @deprecated Use config/simulation.ts, config/colors.ts instead
 */

// 向后兼容的导出
export const MAX_HISTORY = 1200;
export const SIM_SPEED = 0.5;
export const TIME_STEP = 0.1;

export const INITIAL_STATE = {
  atp: 50,
  nadph: 50,
  c3: 50,
  c5: 50,
  sugar: 0,
};

export const COLORS = {
  c3: '#dc2626',
  c5: '#9333ea',
  pTotal: '#10b981',
  energy: '#eab308',
  precursor: '#3b82f6',
  grid: '#e5e7eb',
  text: '#6b7280',
};
