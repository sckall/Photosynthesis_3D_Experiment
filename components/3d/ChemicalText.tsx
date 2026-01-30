import React from 'react';
import { Text } from '@react-three/drei';

// 渲染带有下标的化学式文本，避免字体字形问题
export const ChemicalText = ({ label, ...props }: any) => {
  const commonProps = {
    color: props.color || 'black',
    outlineWidth: props.outlineWidth || 0.02,
    outlineColor: props.outlineColor || 'white',
    fontSize: props.fontSize || 0.4,
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    renderOrder: 1000,
  };

  // 根据字体大小计算偏移量
  const subScale = 0.65;
  const supScale = 0.55;
  const subY = -0.15 * (props.fontSize ? props.fontSize / 0.4 : 1);
  const supY = 0.18 * (props.fontSize ? props.fontSize / 0.4 : 1);

  // 同位素标记的化学式
  if (label === 'H₂¹⁸O') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.35, 0, 0]} renderOrder={1000}>
          H
        </Text>
        <Text {...commonProps} position={[-0.12, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
        <Text {...commonProps} position={[0.16, supY, 0]} fontSize={commonProps.fontSize * supScale} renderOrder={1000}>
          18
        </Text>
        <Text {...commonProps} position={[0.38, 0, 0]} renderOrder={1000}>
          O
        </Text>
      </group>
    );
  }
  if (label === '¹⁸O₂') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.28, supY, 0]} fontSize={commonProps.fontSize * supScale} renderOrder={1000}>
          18
        </Text>
        <Text {...commonProps} position={[0, 0, 0]} renderOrder={1000}>
          O
        </Text>
        <Text {...commonProps} position={[0.22, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
      </group>
    );
  }
  if (label === 'C¹⁸O₂') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.38, 0, 0]} renderOrder={1000}>
          C
        </Text>
        <Text {...commonProps} position={[-0.08, supY, 0]} fontSize={commonProps.fontSize * supScale} renderOrder={1000}>
          18
        </Text>
        <Text {...commonProps} position={[0.16, 0, 0]} renderOrder={1000}>
          O
        </Text>
        <Text {...commonProps} position={[0.38, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
      </group>
    );
  }
  if (label === '(CH₂O)') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.42, 0, 0]} renderOrder={1000}>
          (CH
        </Text>
        <Text {...commonProps} position={[-0.08, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
        <Text {...commonProps} position={[0.28, 0, 0]} renderOrder={1000}>
          O)
        </Text>
      </group>
    );
  }
  // 同位素标记的糖类：(C¹⁸H₂O) - CO₂中的¹⁸O进入糖类
  if (label === '(C¹⁸H₂O)') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.52, 0, 0]} renderOrder={1000}>
          (C
        </Text>
        <Text {...commonProps} position={[-0.22, supY, 0]} fontSize={commonProps.fontSize * supScale} renderOrder={1000}>
          18
        </Text>
        <Text {...commonProps} position={[0.02, 0, 0]} renderOrder={1000}>
          H
        </Text>
        <Text {...commonProps} position={[0.22, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
        <Text {...commonProps} position={[0.48, 0, 0]} renderOrder={1000}>
          O)
        </Text>
      </group>
    );
  }

  if (label === 'H₂O' || label === 'H2O') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.22, 0, 0]} renderOrder={1000}>
          H
        </Text>
        <Text {...commonProps} position={[0, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
        <Text {...commonProps} position={[0.22, 0, 0]} renderOrder={1000}>
          O
        </Text>
      </group>
    );
  }
  if (label === 'CO₂' || label === 'CO2') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.14, 0, 0]} renderOrder={1000}>
          CO
        </Text>
        <Text 
          {...commonProps} 
          position={[0.14, subY, 0]} 
          fontSize={commonProps.fontSize * subScale} 
          renderOrder={1000}
          color={commonProps.color}
          outlineWidth={commonProps.outlineWidth}
          outlineColor={commonProps.outlineColor}
        >
          2
        </Text>
      </group>
    );
  }
  if (label === 'O₂' || label === 'O2') {
    return (
      <group position={props.position}>
        <Text {...commonProps} position={[-0.12, 0, 0]} renderOrder={1000}>
          O
        </Text>
        <Text {...commonProps} position={[0.15, subY, 0]} fontSize={commonProps.fontSize * subScale} renderOrder={1000}>
          2
        </Text>
      </group>
    );
  }

  return (
    <Text {...props} {...commonProps} renderOrder={1000}>
      {label}
    </Text>
  );
};

