import React, { useEffect, useRef } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import type { CameraFittingResult } from './camera/cameraFit';

export interface CameraControlsProps {
  fitting: CameraFittingResult;
  resetSignal: number;
}

type OrbitControlsHandle = React.ComponentRef<typeof OrbitControls>;

export const CameraControls: React.FC<CameraControlsProps> = ({ fitting, resetSignal }) => {
  const controlsRef = useRef<OrbitControlsHandle>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(...fitting.target);
      controls.object.position.set(...fitting.position);
      controls.object.up.set(...fitting.up);
      controls.update();
    }
  }, [fitting, resetSignal]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={fitting.position}
        fov={fitting.fov}
        near={fitting.near}
        far={fitting.far}
      />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.8}
        zoomSpeed={1.0}
        panSpeed={0.8}
        minDistance={10}
        maxDistance={fitting.far * 0.9}
      />
    </>
  );
};
