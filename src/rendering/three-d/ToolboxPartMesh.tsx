import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import type { Toolbox3DPartModel, Point3D } from './model/toolbox3DModel';
import { createThreePolyhedronGeometry } from './geometry/createThreePolyhedronGeometry';

export interface ToolboxPartMeshProps {
  part: Toolbox3DPartModel;
  center: Point3D;
}

// Neutral wood tones with subtle part family differentiation
function getPartColor(id: string): string {
  if (id === 'locking-wedge') {
    return '#bf8d58'; // Slightly deeper tone for the wedge
  }
  if (id.startsWith('lid-') || id.startsWith('straight-') || id.startsWith('locking-lid-')) {
    return '#c99e6b'; // Lid assembly
  }
  return '#d2a775'; // Carcass and fixed battens
}

export const ToolboxPartMesh: React.FC<ToolboxPartMeshProps> = ({ part, center }) => {
  const color = useMemo(() => getPartColor(part.id), [part.id]);

  // For polyhedron parts, create and manage BufferGeometry
  const polyhedronGeometry = useMemo(() => {
    if (part.kind === 'polyhedron') {
      return createThreePolyhedronGeometry(part, center);
    }
    return null;
  }, [part, center]);

  useEffect(() => {
    return () => {
      if (polyhedronGeometry) {
        polyhedronGeometry.dispose();
      }
    };
  }, [polyhedronGeometry]);

  if (part.kind === 'box') {
    // Domain dimensions
    const sizeX = part.max.x - part.min.x;
    const sizeY = part.max.y - part.min.y;
    const sizeZ = part.max.z - part.min.z;

    // Domain center of this part
    const partCenterX = (part.min.x + part.max.x) / 2;
    const partCenterY = (part.min.y + part.max.y) / 2;
    const partCenterZ = (part.min.z + part.max.z) / 2;

    // Three.js coordinates (centered at model origin):
    // Three X = partCenterX - center.x
    // Three Y = partCenterZ - center.z (vertical)
    // Three Z = partCenterY - center.y (depth)
    const posX = partCenterX - center.x;
    const posY = partCenterZ - center.z;
    const posZ = partCenterY - center.y;

    // Three.js box geometry sizes: [width (Three X), height (Three Y), depth (Three Z)]
    const boxArgs: [number, number, number] = [sizeX, sizeZ, sizeY];

    return (
      <mesh position={[posX, posY, posZ]} castShadow receiveShadow>
        <boxGeometry args={boxArgs} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.05}
          side={THREE.FrontSide}
        />
        <Edges color="#422e1b" threshold={15} />
      </mesh>
    );
  }

  if (part.kind === 'compound-box') {
    return (
      <group data-part-id={part.id}>
        {part.solids.map((solid, index) => {
          const sizeX = solid.max.x - solid.min.x;
          const sizeY = solid.max.y - solid.min.y;
          const sizeZ = solid.max.z - solid.min.z;

          const partCenterX = (solid.min.x + solid.max.x) / 2;
          const partCenterY = (solid.min.y + solid.max.y) / 2;
          const partCenterZ = (solid.min.z + solid.max.z) / 2;

          const posX = partCenterX - center.x;
          const posY = partCenterZ - center.z;
          const posZ = partCenterY - center.y;

          const boxArgs: [number, number, number] = [sizeX, sizeZ, sizeY];

          return (
            <mesh
              key={`${part.id}-solid-${index}`}
              position={[posX, posY, posZ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={boxArgs} />
              <meshStandardMaterial
                color={color}
                roughness={0.7}
                metalness={0.05}
                side={THREE.FrontSide}
              />
              <Edges color="#422e1b" threshold={15} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (polyhedronGeometry) {
    return (
      <mesh geometry={polyhedronGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.05}
          side={THREE.FrontSide}
        />
        <Edges color="#422e1b" threshold={15} />
      </mesh>
    );
  }

  return null;
};
