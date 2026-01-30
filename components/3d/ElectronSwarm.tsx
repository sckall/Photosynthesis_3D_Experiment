import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ElectronSwarmProps {
  count?: number;
  active: boolean;
  radius?: number;
}

export const ElectronSwarm = ({ count = 30, active, radius = 1.2 }: ElectronSwarmProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      angle: Math.random() * Math.PI * 2,
      y: (Math.random() - 0.5) * 2.5,
      speed: 1 + Math.random() * 2,
      offset: Math.random() * 10,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current || !active) return;
    particles.forEach((p, i) => {
      p.angle += p.speed * delta;
      const x = Math.cos(p.angle) * radius;
      const z = Math.sin(p.angle) * radius;
      dummy.position.set(x, p.y, z);
      const scale = (0.5 + Math.sin(state.clock.elapsedTime * 15 + p.offset) * 0.5) * 0.15;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} visible={active}>
      <sphereGeometry args={[0.5, 6, 6]} />
      <meshBasicMaterial color="#ffff00" toneMapped={false} />
    </instancedMesh>
  );
};

