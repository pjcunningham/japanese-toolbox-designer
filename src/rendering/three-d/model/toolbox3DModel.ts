export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Toolbox3DPart =
  | 'bottom'
  | 'side-front'
  | 'side-back'
  | 'end-stop'
  | 'end-locking'
  | 'fixed-top-batten-stop'
  | 'fixed-top-batten-locking'
  | 'lid-panel'
  | 'straight-lid-batten'
  | 'locking-lid-batten'
  | 'locking-wedge';

export interface BoxPart3D {
  id: string;
  part: Toolbox3DPart;
  name: string;
  kind: 'box';
  min: Point3D;
  max: Point3D;
}

export interface PolyhedronPart3D {
  id: string;
  part: Toolbox3DPart;
  name: string;
  kind: 'polyhedron';
  vertices: Point3D[];
  faces: number[][];
}

export type Toolbox3DPartModel = BoxPart3D | PolyhedronPart3D;

export interface Toolbox3DBounds {
  min: Point3D;
  max: Point3D;
}

export interface Toolbox3DModel {
  parts: Toolbox3DPartModel[];
  bounds: Toolbox3DBounds;
  metadata: {
    partCount: number;
    length: number;
    width: number;
    height: number;
    wedgeWorkingLength: number;
  };
}
