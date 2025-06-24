// components/SplatViewer.js
import { Splat } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';

function SplatViewer({ splatUrl, onTargetChange, ...props }) {
  const { camera, scene, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());

  const handleDoubleClick = useCallback((event) => {
    if (!onTargetChange || !camera || !scene) {
      console.log('Missing dependencies:', { onTargetChange: !!onTargetChange, camera: !!camera, scene: !!scene });
      return;
    }

    // Prevent default behavior
    event.stopPropagation();

    // Get the canvas element
    const canvas = gl.domElement;
    if (!canvas) {
      console.log('Canvas not found');
      return;
    }

    // Get the splat mesh from the scene
    const splatMesh = scene.getObjectByName('splat') || scene.children.find(child => 
      child.material && (child.material.isSplatMaterial || child.type === 'Splat' || child.userData?.isSplat)
    );

    if (!splatMesh) {
      console.log('Splat mesh not found in scene');
      console.log('Scene children:', scene.children.map(child => ({ name: child.name, type: child.type, material: child.material?.type })));
      return;
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('Mouse position:', mouse);
    console.log('Camera:', camera);

    // Update raycaster
    const raycaster = raycasterRef.current;
    raycaster.setFromCamera(mouse, camera);

    // Perform raycast intersection
    const intersects = raycaster.intersectObject(splatMesh, true);

    console.log('Intersects:', intersects.length);

    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      console.log('Double-clicked on splat at position:', intersectionPoint);
      
      // Call the callback with the new target position
      onTargetChange(intersectionPoint);
    } else {
      console.log('No intersection found');
    }
  }, [camera, scene, gl, onTargetChange]);

  return (
    <>
      {splatUrl && (
        <group onDoubleClick={handleDoubleClick}>
          <Splat 
            {...props}
            src={splatUrl} 
            chunkSize={1000}
            toneMapped={false} 
            alphaHash={false}
            alphaTest={0}
            opacity={0}
            transparent={true}
            name="splat"
          />
        </group>
      )}
    </>
  );
}

export default SplatViewer;