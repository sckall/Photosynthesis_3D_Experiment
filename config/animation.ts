export const ANIMATION_CONFIG = {
  CALVIN_CYCLE: {
    DURATION: 10,
    REDUCTION_ENTRY_T: 3.5,
    SPEED: 0.06,
    RADIUS: 2.5,
    CARRIER_COUNT: 5,
    FIXATION_POINT: 0.75,
    STARCH_POINT: 0.25,
  },
  
  ENERGY_CYCLE: {
    LOOP_DURATION: 10,
    FORWARD_DURATION: 2.0,
    BACKWARD_DURATION: 2.5,
    MAX_ENERGY_PAIRS: 12,
    INITIAL_ENERGY_PAIRS: 1,
  },
  
  PARTICLES: {
    CO2: {
      INCOMING_SPEED: 2.2,
      BINDING_SPEED: 3.0,
      MAX_PARTICLES: 60,
      START_POS: [5.7, 4.7, 0] as [number, number, number],
    },
    
    STARCH: {
      MAX_PARTICLES: 80,
      FADE_SPEED: 0.6,
      SCALE_SPEED: 0.05,
      VELOCITY_Y: -0.9,
      VELOCITY_X_RANGE: 0.6,
    },
    
    ELECTRON: {
      COUNT: 12,
      RADIUS: 1.25,
      SPEED_MIN: 1,
      SPEED_MAX: 3,
      SCALE_BASE: 0.15,
      SCALE_VARIATION: 0.5,
      FREQUENCY: 15,
    },
  },
  
  VISUAL: {
    STUCK_SCALE: 1.08,
    NORMAL_SCALE: 1.0,
    FLASH_SCALE_MAX: 1.25,
    FLASH_DURATION: 0.5,
    SPACING: 0.36,
    COLUMNS: 2,
  },
  
  PATHS: {
    FORWARD: [
      [-1.8, 0.5, 0],
      [0.35, 2.5, 0],
      [2.5, 0.5, 0],
    ] as [number, number, number][],
    
    BACKWARD: [
      [2.5, 0.5, 0],
      [0.35, -1.5, 0],
      [-1.8, 0.5, 0],
    ] as [number, number, number][],
  },
  
  BEAM: {
    BASE_OPACITY: 0.15,
    PULSE_AMPLITUDE: 0.05,
    TOP_RADIUS: 0.8,
    BOTTOM_RADIUS: 3.5,
    HEIGHT: 8,
    POSITION: [0, 4, 0] as [number, number, number],
  },
  
  THYLAKOID: {
    RADIUS: 1.2,
    HEIGHT: 0.2,
    SEGMENTS: 32,
    EMISSIVE_INTENSITY_BASE: 0.5,
    ROUGHNESS: 0.3,
    METALNESS: 0.1,
  },
  
  GRANUM: {
    DISC_SPACING: 0.25,
    ACTIVE_RING_INNER: 1.4,
    ACTIVE_RING_OUTER: 1.6,
    CONNECTOR_RADIUS: 0.05,
    CONNECTOR_LENGTH: 1.8,
  },
  
  MOLECULE: {
    SPHERE_RADIUS: 0.4,
    SEGMENTS: 32,
    EMISSIVE_INTENSITY: 0.3,
    ROUGHNESS: 0.2,
    LABEL_OFFSET_Y: 0.7,
  },
  
  TEXT: {
    FONT_SIZE_DEFAULT: 0.4,
    OUTLINE_WIDTH: 0.04,
    SUBSCRIPT_SCALE: 0.65,
    SUBSCRIPT_Y_OFFSET: -0.15,
  },
} as const;