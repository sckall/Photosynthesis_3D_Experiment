import * as THREE from 'three';

// 颜色线性插值
export const lerpColor = (color1: string | THREE.Color, color2: string | THREE.Color, factor: number): THREE.Color => {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, factor);
};

