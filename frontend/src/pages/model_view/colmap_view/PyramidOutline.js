import React, { useMemo } from 'react';
import * as THREE from 'three';

const PyramidOutlineComponent = ({ size = new THREE.Vector3(1, 1, 1), color = 0xffffff, baseOpacity = 0 }) => {
  // useMemo will recompute the geometries only if the 'size' prop changes.
  const { lineGeometry, baseGeometry } = useMemo(() => {
    const halfSizeX = size.x; 
    const heightY = size.y;   
    const halfSizeZ = size.z; 

    // Define the vertices of the pyramid
    const baseCorners = [
      new THREE.Vector3(halfSizeX, -heightY, -halfSizeZ),
      new THREE.Vector3(halfSizeX, -heightY, halfSizeZ),
      new THREE.Vector3(-halfSizeX, -heightY, halfSizeZ),
      new THREE.Vector3(-halfSizeX, -heightY, -halfSizeZ),
    ];
    const apex = new THREE.Vector3(0, 0, 0);

    // Define points for line segments
    const baseLinePoints = [
      baseCorners[0], baseCorners[1],
      baseCorners[1], baseCorners[2],
      baseCorners[2], baseCorners[3],
      baseCorners[3], baseCorners[0],
    ];
    const sideLinePoints = baseCorners.flatMap((corner) => [corner, apex]);
    const allLinePoints = [...baseLinePoints, ...sideLinePoints];
    const computedLineGeometry = new THREE.BufferGeometry().setFromPoints(allLinePoints);

    // Create base geometry (two triangles for a quad)
    const computedBaseGeometry = new THREE.BufferGeometry();
    const baseVertices = new Float32Array([
      baseCorners[0].x, baseCorners[0].y, baseCorners[0].z,
      baseCorners[1].x, baseCorners[1].y, baseCorners[1].z,
      baseCorners[2].x, baseCorners[2].y, baseCorners[2].z,

      baseCorners[0].x, baseCorners[0].y, baseCorners[0].z,
      baseCorners[2].x, baseCorners[2].y, baseCorners[2].z,
      baseCorners[3].x, baseCorners[3].y, baseCorners[3].z,
    ]);
    computedBaseGeometry.setAttribute('position', new THREE.BufferAttribute(baseVertices, 3));

    return { lineGeometry: computedLineGeometry, baseGeometry: computedBaseGeometry };
  }, [size]);

  return (
    <group 
      rotation={[-Math.PI / 2, 0, 0]} // Rotate the pyramid to face upwards
    >
      {/* Semi-transparent base */}
      <mesh geometry={baseGeometry}>
        <meshBasicMaterial
          color={color} 
          side={THREE.DoubleSide}
          transparent
          opacity={baseOpacity} 
        />
      </mesh>
      {/* Line segments for the pyramid outline */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={color}/>
      </lineSegments>
    </group>
  );
};

export default PyramidOutlineComponent;
