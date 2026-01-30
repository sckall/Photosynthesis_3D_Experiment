<div align="center">
  <img width="1200" height="475" alt="光合作用模拟实验" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 叶绿体 3D 探索器 - 光合作用虚拟实验室
  
  **交互式 3D 可视化平台，探索光合作用中光反应与暗反应的动态平衡机制**
  
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
  [![Three.js](https://img.shields.io/badge/Three.js-0.164.1-000000?logo=three.js)](https://threejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  

  **[🌐 在线演示](https://sckall.github.io/Photosynthesis_3D_Experiment/)** · **[📖 快速开始](#-快速开始)** · **[✨ 功能特性](#-功能特性)** · **[📚 API 文档](#-api-文档)**

</div>

---

## 📖 项目概述

叶绿体 3D 探索器是一个基于 WebGL 的交互式光合作用模拟实验平台，通过直观的 3D 可视化和实时数据图表，帮助用户深入理解光合作用的光反应和暗反应（卡尔文循环）过程。

### 技术栈

- **前端框架**: React 18.3.1 + TypeScript 5.8.2
- **3D 渲染**: Three.js 0.164.1 + React Three Fiber 8.16.6
- **构建工具**: Vite 6.2.0
- **3D 辅助**: @react-three/drei 9.105.6

### 核心价值

- 🎓 **教育可视化**: 将抽象的光合作用过程转化为直观的 3D 动画
- 🎮 **实时交互**: 支持动态调节环境参数，观察光合作用速率变化
- 📊 **数据驱动**: 基于科学模型模拟，提供准确的化学物质浓度变化
- 🌟 **沉浸式体验**: 高质量的 3D 渲染和流畅的动画效果

---

## ✨ 功能特性

### 🌞 光反应模拟

- **类囊体堆叠结构**: 真实的基粒（Grana）3D 模型
- **电子传递链**: 动态电子流可视化
- **光照响应**: 光照强度直接影响电子传递速率
- **ATP/NADPH 生成**: 实时显示能量分子产生过程

### 🌿 暗反应（卡尔文循环）

- **三阶段动画**: 羧化、还原、再生过程的动态展示
- **C3/C5 循环**: 精确的化合物转化追踪
- **能量消耗**: ATP 和 NADPH 的消耗与再生
- **糖类合成**: G3P 生成和积累的可视化

### 📊 实时数据监控

- **多维度图表**: C3、C5、总光合速率、能量水平等实时曲线
- **历史数据追踪**: 支持查看过去 1200 个时间步的数据
- **事件标记**: 开关灯等关键操作的时间点标记
- **自适应视图**: 支持跟随模式和全局视图切换

### 🎛️ 交互控制

- **光照强度调节**: 0 - 50,000 lx 连续可调
- **CO₂ 浓度控制**: 0 - 1,000 μL/L 精确控制
- **光源开关**: 一键切换光照状态
- **模拟暂停**: 随时暂停/恢复模拟过程
- **标签显示**: 可切换化学标签的显示/隐藏

### 🎨 高级特性

- **生物滞后效应**: 模拟真实的生物反应延迟
- **能量循环系统**: ATP/NADPH 在类囊体和基质间的运输动画
- **粒子堆积效果**: 还原点能量分子的堆积可视化
- **响应式设计**: 适配不同屏幕尺寸

---

## 🔧 环境要求

### 必需环境

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **现代浏览器**: Chrome 90+、Firefox 88+、Safari 14+、Edge 90+

### 推荐配置

- **内存**: >= 4GB RAM
- **显卡**: 支持 WebGL 2.0 的独立显卡或集成显卡
- **显示器**: 分辨率 >= 1920x1080

### 环境变量

创建 `.env.local` 文件（可选）：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

如不需要 AI 功能，可使用占位符：`GEMINI_API_KEY=PLACEHOLDER_API_KEY`

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0
- 支持 WebGL 2.0 的现代浏览器

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd 叶绿体-3d-探索器

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选）
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

---

## 📚 使用指南

### 基本操作

#### 1. 调节光照强度

在右侧控制面板拖动"光照强度"滑块（0 - 50,000 lx），观察电子传递速率和 ATP/NADPH 生成的变化。

```typescript
// 代码示例
const [lightIntensity, setLightIntensity] = useState(12000);
setLightIntensity(25000); // 设置为 25,000 lx
```

#### 2. 调节 CO₂ 浓度

在右侧控制面板拖动"CO₂ 浓度"滑块（0 - 1,000 μL/L），观察卡尔文循环速率变化。

```typescript
const [co2Level, setCo2Level] = useState(420);
setCo2Level(800); // 设置为 800 μL/L
```

#### 3. 切换光源

点击"开灯/关灯"按钮，观察光合作用过程的启动和停止。

#### 4. 暂停/恢复模拟

点击"暂停/继续"按钮，冻结当前状态以便详细观察。

#### 5. 显示/隐藏标签

勾选"显示标签"复选框，控制化学分子标签的显示。

### 实验场景

#### 场景 1: 光照强度对光合作用的影响

1. 设置 CO₂ 浓度为 420 μL/L（标准大气浓度）
2. 从 0 lx 逐步增加光照强度到 50,000 lx
3. 观察总光合速率的变化曲线
4. 注意光饱和现象的出现

#### 场景 2: CO₂ 浓度对卡尔文循环的影响

1. 设置光照强度为 12,000 lx（中等光照）
2. 从 0 μL/L 逐步增加 CO₂ 浓度到 1,000 μL/L
3. 观察 C3 和 C5 相对含量的变化
4. 注意 CO₂ 饱和现象

#### 场景 3: 光暗转换实验

1. 在标准条件下（12,000 lx, 420 μL/L）运行模拟
2. 点击"关灯"按钮，观察 ATP/NADPH 水平下降
3. 点击"开灯"按钮，观察恢复过程

### 数据图表说明

底部图表面板实时显示：

- 🔴 **C3 相对含量**: 三碳化合物浓度
- 🟣 **C5 相对含量**: 五碳化合物浓度
- 🟢 **总光合速率**: 整体光合作用速率
- 🟡 **ATP+NADPH**: 能量分子水平
- 🔵 **ADP+NADP+**: 能量前体水平

---

## 📖 API 文档

### 核心类型

#### SimulationState

模拟状态接口，定义光合作用过程中的关键化学物质浓度。

```typescript
interface SimulationState {
  atp: number;      // ATP 相对含量
  nadph: number;    // NADPH 相对含量
  c3: number;       // C3 相对含量
  c5: number;       // C5 相对含量
  sugar: number;    // 糖类相对含量
}
```

#### HistoryData

历史数据接口，用于存储模拟过程中的时间序列数据。

```typescript
interface HistoryData {
  time: number[];           // 时间轴
  c3: number[];             // C3 相对含量历史
  c5: number[];             // C5 相对含量历史
  pTotal: number[];         // 总光合速率历史
  energy: number[];         // ATP+NADPH 相对含量历史
  precursor: number[];      // ADP+NADP+ 相对含量历史
  markers: (string | null)[]; // 事件标记
}
```

### 核心 Hooks

#### useSimulation

光合作用模拟的核心 Hook，管理模拟状态和历史数据。

**参数**:

```typescript
interface UseSimulationProps {
  lightIntensity: number;  // 光照强度 (lx)
  co2Level: number;        // CO₂ 浓度 (μL/L)
  isLightOn: boolean;      // 光源开关状态
  isPaused: boolean;       // 暂停状态
}
```

**返回值**:

```typescript
{
  simState: SimulationState;           // 当前模拟状态
  history: HistoryData;                // 历史数据
  simTime: number;                     // 模拟时间
  setMarker: (marker: string) => void; // 设置事件标记
}
```

**使用示例**:

```typescript
const { simState, history, simTime, setMarker } = useSimulation({
  lightIntensity: 12000,
  co2Level: 420,
  isLightOn: true,
  isPaused: false,
});

// 访问当前状态
console.log(simState.atp);  // ATP 相对含量
console.log(simState.c3);   // C3 相对含量

// 设置事件标记
setMarker('开灯');
```

### 主要组件

#### ChloroplastModel

叶绿体 3D 模型组件，负责渲染光合作用的 3D 可视化。

```typescript
<ChloroplastModel
  showLabels={showLabels}
  isPaused={isPaused}
  isLightOn={isLightOn}
  lightIntensity={lightIntensity}
  co2Level={co2Level}
  simState={simState}
/>
```

#### RealTimeChart

实时图表组件，用于显示历史数据曲线。

```typescript
<RealTimeChart
  data={history}
  height={200}
  mode="follow"
/>
```

### 配置常量

#### 模拟参数 (config/simulation.ts)

```typescript
SIMULATION_CONFIG = {
  MAX_HISTORY: 1200,        // 历史数据最大长度
  SIM_SPEED: 0.5,           // 模拟速度
  TIME_STEP: 0.1,           // 每帧模拟的秒数
  LIGHT: {
    MIN: 0,
    MAX: 50000,
    DEFAULT: 12000,
  },
  CO2: {
    MIN: 0,
    MAX: 1000,
    DEFAULT: 420,
  },
}
```

#### 颜色配置 (config/colors.ts)

```typescript
COLOR_CONFIG = {
  SERIES: {
    C3: '#dc2626',        // 红色
    C5: '#9333ea',        // 紫色
    P_TOTAL: '#10b981',   // 绿色
    ENERGY: '#eab308',    // 黄色
    PRECURSOR: '#3b82f6', // 蓝色
  },
}
```

---

## 🏗️ 项目结构

```
叶绿体-3d-探索器/
├── components/              # React 组件
│   ├── 3d/                 # 3D 可视化组件
│   │   ├── calvin/        # 卡尔文循环动画
│   │   │   ├── CalvinCycleInstances.tsx    # 循环实例渲染
│   │   │   └── CalvinCycleRingLogic.tsx    # 循环逻辑控制
│   │   ├── ChemicalText.tsx                # 化学标签组件
│   │   ├── ElectronSwarm.tsx               # 电子传递动画
│   │   └── utils.ts                        # 3D 工具函数
│   ├── CalvinCycleAnimation.tsx            # 卡尔文循环主组件
│   ├── ChartPanel.tsx                      # 图表面板容器
│   ├── ChloroplastModel.tsx                # 叶绿体 3D 模型
│   ├── RealTimeChart.tsx                   # 实时数据图表
│   ├── Sidebar.tsx                         # 控制侧边栏
│   └── Viewport.tsx                        # 3D 视口容器
├── config/                  # 配置文件
│   ├── animation.ts        # 动画配置参数
│   ├── colors.ts           # 颜色主题配置
│   ├── simulation.ts       # 模拟参数配置
│   └── index.ts            # 配置统一导出
├── hooks/                   # 自定义 React Hooks
│   └── useSimulation.ts    # 光合作用模拟核心逻辑
├── types/                   # TypeScript 类型定义
│   └── index.ts            # 类型统一导出
├── utils/                   # 工具函数
│   └── export.ts           # 数据导出工具
├── dist/                    # 构建输出目录（自动生成）
├── App.tsx                  # 主应用组件
├── constants.ts             # 全局常量
├── types.ts                 # 核心类型定义
├── index.html               # HTML 入口文件
├── index.tsx                # React 应用入口
├── vite.config.ts           # Vite 构建配置
├── tsconfig.json            # TypeScript 编译配置
├── package.json             # 项目依赖和脚本
├── .env.local               # 环境变量（需自行创建）
├── .gitignore               # Git 忽略规则
└── README.md                # 项目文档
```

### 📂 目录说明

#### `/components` - UI 组件层
- **3d/**: 所有 3D 可视化相关组件
  - `calvin/`: 卡尔文循环的完整动画系统
  - `ChemicalText.tsx`: 3D 空间中的化学物质标签
  - `ElectronSwarm.tsx`: 电子传递链的粒子动画
  - `utils.ts`: 3D 计算和辅助函数
- **ChloroplastModel.tsx**: 叶绿体主模型，整合光反应和暗反应
- **CalvinCycleAnimation.tsx**: 卡尔文循环动画的高层封装
- **RealTimeChart.tsx**: 基于 Canvas 的实时数据图表
- **ChartPanel.tsx**: 图表容器，管理图表布局
- **Sidebar.tsx**: 右侧控制面板，包含所有交互控件
- **Viewport.tsx**: 3D 场景视口，包含相机和光照

#### `/config` - 配置管理
- **simulation.ts**: 光合作用模拟的物理和化学参数
- **animation.ts**: 动画速度、缓动函数等配置
- **colors.ts**: 统一的颜色主题和样式
- **index.ts**: 配置的统一导出入口

#### `/hooks` - 业务逻辑层
- **useSimulation.ts**: 核心模拟引擎
  - 光反应和暗反应的数学模型
  - 状态管理和历史数据追踪
  - 生物滞后效应模拟

#### `/types` - 类型系统
- **index.ts**: 全局类型定义和接口
- **types.ts**: 核心数据结构类型

#### `/utils` - 工具函数
- **export.ts**: 数据导出和格式化工具

### 🔑 核心文件说明

| 文件 | 作用 | 关键功能 |
|------|------|----------|
| `App.tsx` | 应用根组件 | 状态管理、组件组合 |
| `hooks/useSimulation.ts` | 模拟引擎 | 光合作用数学模型、状态更新 |
| `components/ChloroplastModel.tsx` | 3D 主场景 | 叶绿体结构、动画协调 |
| `components/RealTimeChart.tsx` | 数据可视化 | Canvas 绘图、实时更新 |
| `components/Sidebar.tsx` | 交互控制 | 参数调节、状态切换 |
| `constants.ts` | 全局常量 | 模拟参数、颜色配置 |
| `vite.config.ts` | 构建配置 | 开发服务器、路径别名 |

---

## 🏛️ 架构设计

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Viewport   │  │  ChartPanel  │  │   Sidebar    │  │
│  │  (3D 视口)   │  │  (数据图表)  │  │  (控制面板)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      组件层                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ChloroplastModel (叶绿体主模型)          │  │
│  │  ┌────────────────┐    ┌────────────────────┐   │  │
│  │  │ ElectronSwarm  │    │ CalvinCycleAnimation│   │  │
│  │  │  (电子传递)    │    │   (卡尔文循环)      │   │  │
│  │  └────────────────┘    └────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │         useSimulation (模拟引擎)                  │  │
│  │  • 光反应数学模型                                 │  │
│  │  • 暗反应数学模型                                 │  │
│  │  • 状态管理                                       │  │
│  │  • 历史数据追踪                                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    配置层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ simulation.ts│  │ animation.ts │  │  colors.ts   │  │
│  │  (模拟参数)  │  │  (动画配置)  │  │  (颜色主题)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 数据流

```
用户交互 → Sidebar (控制面板)
    ↓
App.tsx (状态管理)
    ↓
useSimulation (模拟计算)
    ↓
    ├─→ ChloroplastModel (3D 渲染)
    └─→ RealTimeChart (数据可视化)
```

### 核心设计模式

#### 1. 单向数据流

所有状态由 `App.tsx` 统一管理，通过 props 向下传递，确保数据流向清晰可追踪。

```typescript
// App.tsx 管理所有状态
const [lightIntensity, setLightIntensity] = useState(12000);
const [co2Level, setCo2Level] = useState(420);

// 通过 props 传递给子组件
<Sidebar lightIntensity={lightIntensity} setLightIntensity={setLightIntensity} />
<ChloroplastModel lightIntensity={lightIntensity} />
```

#### 2. 关注点分离

- **UI 组件**: 只负责渲染和用户交互
- **业务逻辑**: 封装在自定义 Hooks 中
- **配置管理**: 独立的 config 目录

#### 3. 组件组合

使用组合而非继承，通过小型、可复用的组件构建复杂界面。

```typescript
<ChloroplastModel>
  <ElectronSwarm />
  <CalvinCycleAnimation />
  <EnergyCycleSystem />
</ChloroplastModel>
```

#### 4. 配置驱动

所有可调参数都通过配置文件管理，便于维护和扩展。

```typescript
// config/simulation.ts
export const SIMULATION_CONFIG = {
  LIGHT: { MIN: 0, MAX: 50000, DEFAULT: 12000 },
  CO2: { MIN: 0, MAX: 1000, DEFAULT: 420 },
};
```

### 性能优化策略

#### 1. React 优化

- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 和 `useCallback` 缓存计算结果
- 合理拆分组件，减少渲染范围

#### 2. Three.js 优化

- 复用几何体和材质
- 使用实例化渲染（InstancedMesh）
- 控制粒子数量和更新频率

#### 3. 数据优化

- 限制历史数据长度（MAX_HISTORY = 1200）
- 使用环形缓冲区避免频繁数组操作
- 按需更新图表，避免每帧重绘

### 扩展指南

#### 添加新的化学物质

1. 在 `types/index.ts` 中添加类型定义
2. 在 `hooks/useSimulation.ts` 中添加计算逻辑
3. 在 `components/ChloroplastModel.tsx` 中添加 3D 渲染
4. 在 `config/colors.ts` 中添加颜色配置

#### 添加新的实验场景

1. 在 `config/simulation.ts` 中定义场景参数
2. 在 `components/Sidebar.tsx` 中添加场景选择器
3. 实现场景切换逻辑

#### 添加新的图表类型

1. 在 `components/charts/` 目录下创建新组件
2. 在 `components/ChartPanel.tsx` 中集成
3. 在 `types/index.ts` 中添加相应类型定义

---

## 🤝 贡献指南

欢迎所有形式的贡献！

### 贡献流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript 进行类型检查
- 组件命名: PascalCase (如 `ChloroplastModel`)
- 函数/变量: camelCase (如 `useSimulation`)
- 常量: UPPER_SNAKE_CASE (如 `MAX_HISTORY`)
- 为复杂逻辑添加注释

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:

```
feat: 添加 CO₂ 浓度实时调节功能

- 在 Sidebar 组件中添加 CO₂ 浓度滑块
- 更新 useSimulation hook 以支持动态 CO₂ 浓度
- 添加相应的类型定义
```

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 📞 联系与支持

### 项目链接

- **在线演示**: [AI Studio](https://ai.studio/apps/drive/18CUSLTFoCWhyCMIhZIO1tSo9Y0yOL6UY)
- **GitHub**: [项目仓库](https://github.com/your-username/叶绿体-3d-探索器)
- **Issues**: [问题反馈](https://github.com/your-username/叶绿体-3d-探索器/issues)

### 获取帮助

1. 查看本文档和代码注释
2. 在 GitHub Issues 中搜索类似问题
3. 提交新的 Issue 描述您的问题

---

## 🐛 故障排除

### 常见问题

#### 1. 安装依赖失败

```bash
# 清除缓存后重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. 开发服务器无法启动

- 检查端口 3000 是否被占用
- 确认 Node.js 版本 >= 18.0.0
- 检查 `.env.local` 文件格式是否正确

#### 3. 3D 场景无法渲染

- 确认浏览器支持 WebGL 2.0
- 检查显卡驱动是否更新
- 尝试在其他浏览器中打开

#### 4. 性能问题

- 降低粒子数量（修改 `config/animation.ts`）
- 关闭标签显示
- 使用性能更好的浏览器（推荐 Chrome）

#### 5. 构建失败

```bash
# 清除构建缓存
rm -rf dist
npm run build
```

### 调试技巧

#### 启用详细日志

在浏览器控制台中查看详细的模拟数据：

```typescript
// 在 useSimulation.ts 中添加
console.log('Simulation State:', simState);
console.log('Light Intensity:', lightIntensity);
```

#### 性能分析

使用 React DevTools 和 Chrome Performance 工具分析性能瓶颈。

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/) - UI 框架
- [Three.js](https://threejs.org/) - 3D 图形库
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - React Three.js 渲染器
- [@react-three/drei](https://github.com/pmndrs/drei) - Three.js 辅助库
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

---

## 📊 项目统计

- **代码行数**: ~5,000+ 行
- **组件数量**: 15+ 个 React 组件
- **3D 模型**: 叶绿体、基粒、卡尔文循环等
- **动画效果**: 20+ 种动画效果
- **支持数据点**: 1,200+ 个历史数据点

---

## 🗺️ 开发路线图

### ✅ 已完成

- [x] 基础 3D 叶绿体模型
- [x] 光反应动画系统
- [x] 卡尔文循环动画系统
- [x] 实时数据图表
- [x] 交互控制面板
- [x] 光照强度动态调节
- [x] CO₂ 浓度动态调节
- [x] 能量循环系统
- [x] 生物滞后效应模拟

### 🚧 进行中

- [ ] 性能优化和代码重构
- [ ] 单元测试和集成测试
- [ ] 移动端适配优化

### 📋 计划中

- [ ] 数据导出功能（CSV/JSON）
- [ ] 实验场景预设
- [ ] 多语言支持（英文）
- [ ] 更多化学物质可视化
- [ ] AI 辅助教学功能
- [ ] 用户自定义参数配置

### 🔮 未来展望

- [ ] VR/AR 支持
- [ ] 多人协作模式
- [ ] 云端数据同步
- [ ] 教学课程集成
- [ ] 科研数据分析工具

---

## 📝 更新日志

### v0.1.0 (2025-01-08)

**初始版本发布**

- ✨ 实现基础光合作用模拟功能
- 🎨 添加 3D 叶绿体模型和动画系统
- 📊 实现实时数据图表和历史追踪
- 🎛️ 添加交互控制面板
- 🌞 实现光反应和电子传递链动画
- 🌿 实现卡尔文循环三阶段动画
- ⚡ 添加能量循环系统
- 🔧 优化代码结构和配置管理

---

<div align="center">
  <p>如果这个项目对您有帮助，请给我们一个 ⭐️</p>
  <p>Made with ❤️ by 叶绿体 3D 探索器团队</p>
</div>
