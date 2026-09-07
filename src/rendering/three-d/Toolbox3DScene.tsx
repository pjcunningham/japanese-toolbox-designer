import React, { useMemo } from 'react';
import { Grid } from '@react-three/drei';
import type { Toolbox3DModel, Point3D } from './model/toolbox3DModel';
import { ToolboxPartMesh } from './ToolboxPartMesh';
import { CameraControls } from './CameraControls';
import { calculateCameraFitting, type StandardCameraView } from './camera/cameraFit';

export interface Toolbox3DSceneProps {
  model: Toolbox3DModel;
  woodId?: string;
  activeView: StandardCameraView;
  resetSignal: number;
}

export const Toolbox3DScene: React.FC<Toolbox3DSceneProps> = ({
  model,
  woodId = 'pine',
  activeView,
  resetSignal,
}) => {
  // Domain center of the model
  const center: Point3D = useMemo(
    () => ({
      x: (model.bounds.min.x + model.bounds.max.x) / 2,
      y: (model.bounds.min.y + model.bounds.max.y) / 2,
      z: (model.bounds.min.z + model.bounds.max.z) / 2,
    }),
    [model.bounds],
  );

  const fitting = useMemo(
    () => calculateCameraFitting(model.bounds, activeView),
    [model.bounds, activeView],
  );

  const groundY = model.bounds.min.z - center.z - 0.5;
  const gridSize = Math.max(
    1000,
    Math.max(model.bounds.max.x - model.bounds.min.x, model.bounds.max.y - model.bounds.min.y) *
      2.5,
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[800, 1200, 600]} intensity={1.2} />
      <directionalLight position={[-600, 600, -800]} intensity={0.5} />
      <directionalLight position={[0, -500, 0]} intensity={0.2} />

      {/* Ground Grid */}
      <Grid
        position={[0, groundY, 0]}
        args={[gridSize, gridSize]}
        cellSize={50}
        cellThickness={0.6}
        cellColor="#e2e8f0"
        sectionSize={250}
        sectionThickness={1.0}
        sectionColor="#cbd5e1"
        fadeDistance={gridSize * 1.5}
        infiniteGrid
      />

      {/* Model Meshes */}
      <group>
        {model.parts.map((part) => (
          <ToolboxPartMesh key={part.id} part={part} center={center} woodId={woodId} />
        ))}
      </group>

      {/* Camera and Interaction Controls */}
      <CameraControls fitting={fitting} resetSignal={resetSignal} />
    </>
  );
};
