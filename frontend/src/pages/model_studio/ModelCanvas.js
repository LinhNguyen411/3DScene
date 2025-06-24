import { Canvas, useFrame } from '@react-three/fiber';
import { StatsGl, Loader, Grid, OrbitControls, FirstPersonControls, PerspectiveCamera, FlyControls } from '@react-three/drei';
// 1. Import useRef and useEffect
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import SplatViewer from './splat_view/SplatViewer';
import PointCloud from './colmap_view/PointCloud';
import Cameras from './colmap_view/Cameras';
import * as THREE from 'three';
import myAppConfig from '../../config';
import { 
    usePositionControls, 
    useRotationControls, 
    useCameraControls, 
    useGridControls, 
    useFlyControls 
} from './LevaControls';

const Axes = () => {
  const axesHelper = new THREE.AxesHelper(0.4);
  axesHelper.setColors(
    new THREE.Color(0xff0000),
    new THREE.Color(0x00ff00),
    new THREE.Color(0x0000ff)
  );
  return <primitive object={axesHelper} />;
};


function ModelCanvas({ model, viewMode, splatUrl, colmapData, onSaveView }) {
    // References
    const FALLBACK_CAMERA_POSITION = new THREE.Vector3(5, 2, 6);
    const FALLBACK_CAMERA_QUATERNION = new THREE.Quaternion();
    const DEFAULT_CAMERA_FOV = 50;

    const orbitControlsRef = useRef();
    const prevFovRef = useRef(DEFAULT_CAMERA_FOV);
    const cameraRef = useRef();


    const DEFAULT_CAMERA_POSITION = useMemo(() => {
        if (model?.camera_init?.position) {
            if (Array.isArray(model.camera_init.position)) {
                const [x, y, z] = model.camera_init.position;
                return new THREE.Vector3(x, y, z);
            }
            return new THREE.Vector3(
                model.camera_init.position.x || 0,
                model.camera_init.position.y || 0,
                model.camera_init.position.z || 0
            );
        }
        return FALLBACK_CAMERA_POSITION;
    }, [model?.camera_init?.position]);
    
    const DEFAULT_CAMERA_QUATERNION = useMemo(() => {
        if (model?.camera_init?.quaternion) {
            if (Array.isArray(model.camera_init.quaternion)) {
                const [x, y, z, w] = model.camera_init.quaternion;
                return new THREE.Quaternion(x, y, z, w);
            }
            return new THREE.Quaternion(
                model.camera_init.quaternion._x || model.camera_init.quaternion.x || 0,
                model.camera_init.quaternion._y || model.camera_init.quaternion.y || 0,
                model.camera_init.quaternion._z || model.camera_init.quaternion.z || 0,
                model.camera_init.quaternion._w !== undefined ? model.camera_init.quaternion._w : (model.camera_init.quaternion.w !== undefined ? model.camera_init.quaternion.w : 1)
            );
        }
        return FALLBACK_CAMERA_QUATERNION.clone();
    }, [model?.camera_init?.quaternion]);
    
    const DEFAULT_CAMERA_TARGET = useMemo(() => {
        if (model?.camera_init?.target) {
            const { x, y, z } = model.camera_init.target;
            return new THREE.Vector3(x, y, z);
        }
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(DEFAULT_CAMERA_QUATERNION);
        const baseDistance = -10;
        return new THREE.Vector3().copy(DEFAULT_CAMERA_POSITION).add(
            direction.multiplyScalar(baseDistance)
        );
    }, [model?.camera_init?.target, DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_QUATERNION]);
    
    const handleResetView = useCallback(() => {
        if (!cameraRef.current || !orbitControlsRef.current) return;
        
        const camera = cameraRef.current;
        const controls = orbitControlsRef.current;
        
        const initialPosition = camera.position.clone();
        const initialFov = camera.fov;
        const initialTarget = new THREE.Vector3();
        if (controls.target) {
            initialTarget.copy(controls.target);
        }
        
        const duration = 1500;
        const startTime = Date.now();
        
        function animateReset() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            camera.position.x = initialPosition.x + (DEFAULT_CAMERA_POSITION.x - initialPosition.x) * easeProgress;
            camera.position.y = initialPosition.y + (DEFAULT_CAMERA_POSITION.y - initialPosition.y) * easeProgress;
            camera.position.z = initialPosition.z + (DEFAULT_CAMERA_POSITION.z - initialPosition.z) * easeProgress;
            
            camera.fov = initialFov + (DEFAULT_CAMERA_FOV - initialFov) * easeProgress;
            camera.updateProjectionMatrix();
            
            if (controls.target) {
                controls.target.x = initialTarget.x + (DEFAULT_CAMERA_TARGET.x - initialTarget.x) * easeProgress;
                controls.target.y = initialTarget.y + (DEFAULT_CAMERA_TARGET.y - initialTarget.y) * easeProgress;
                controls.target.z = initialTarget.z + (DEFAULT_CAMERA_TARGET.z - initialTarget.z) * easeProgress;
                
                if (controls.update) {
                    controls.update();
                }
            }
            
            if (progress >= 1) {
                prevFovRef.current = DEFAULT_CAMERA_FOV;
            } else {
                requestAnimationFrame(animateReset);
            }
        }
        
        animateReset();
    }, [DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET]);

    const logCameraInfo = useCallback(() => {
        if (cameraRef.current) {
            console.log('Camera Position:', cameraRef.current.position);
            console.log('Camera Quaternion:', cameraRef.current.quaternion);
            console.log('Camera FOV:', cameraRef.current.fov);
        }
        if (orbitControlsRef.current && orbitControlsRef.current.target) {
            console.log('Orbit Controls Target:', orbitControlsRef.current.target);
        }
    }, []);

    const defaultPosition = useMemo(() => model?.model_transform?.position || { x: 0, y: 0, z: 0 }, [model]);
    const defaultRotation = useMemo(() => model?.model_transform?.rotation || { x: 0, y: 0, z: 0, scale: 1 }, [model]);

    const [position, setPosition] = usePositionControls(defaultPosition, true);
    const [rotate, setRotate] = useRotationControls(defaultRotation, true);

    // **FIX STARTS HERE**

    // 2. Create refs to hold the latest state values.
    const positionRef = useRef(position);
    const rotateRef = useRef(rotate);

    // 3. Keep the refs in sync with the state on every render.
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    useEffect(() => {
        rotateRef.current = rotate;
    }, [rotate]);


    // 4. Update handleSave to read from the refs.
    const handleSave = useCallback(() => {
        if (!cameraRef.current || !orbitControlsRef.current) {
            console.error("Camera or controls ref not available.");
            return;
        }

        // Read the LATEST values from the refs' .current property
        const currentPosition = positionRef.current;
        const currentRotate = rotateRef.current;

        const viewData = {
            camera_init: {
                position: cameraRef.current.position.clone(),
                quaternion: cameraRef.current.quaternion.clone(),
                target: orbitControlsRef.current.target.clone(),
            },
            model_transform: {
                position: {x: currentPosition.x, y: currentPosition.y, z: currentPosition.z},
                rotation: {x: currentRotate.x, y: currentRotate.y, z: currentRotate.z, scale: currentRotate.scale}
            }
        };

        if (onSaveView) {
            onSaveView(viewData);
        } else {
            console.log("Save data payload (no callback provided):", viewData);
        }
    // The callback now only depends on `onSaveView`, making it much more stable.
    // It no longer needs `position` or `rotate` as dependencies.
    }, [onSaveView]); 

    // **FIX ENDS HERE**

    const [camera, setCamera] = useCameraControls(handleResetView, logCameraInfo, handleSave);
    const [grid, setGrid] = useGridControls(true);
    const [flyControls, setFly] = useFlyControls({ movementSpeed: 2, lookSpeed: 0.05}, camera.mode != 'Fly');

    const Controls = useMemo(() => {
        if (camera.mode === 'Orbit') {
            return (
                   <OrbitControls 
                      ref={orbitControlsRef}
                      target={DEFAULT_CAMERA_TARGET}
                      enableDamping={true}
                      dampingFactor={0.05}
                      rotateSpeed={0.5}
                      zoomSpeed={0.5}
                      panSpeed={0.5}
                />
            );
        } else {
            return (
                <FlyControls
                   autoForward={false} 
                   dragToLook={true} 
                   movementSpeed={2} 
                   rollSpeed={Math.PI / 24}
                />
            );
        }
    }, [camera.mode, flyControls.movementSpeed, flyControls.lookSpeed, DEFAULT_CAMERA_TARGET]);
    
    // ... (rest of your component is unchanged)
    const canvasBackgroundColor = useMemo(() => {
        if (viewMode === 'colmap') {
            return "bg-black";
        }
        return "bg-white";
    }, [viewMode]);

    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.quaternion.copy(DEFAULT_CAMERA_QUATERNION);
        }
    }, [DEFAULT_CAMERA_QUATERNION]);

    const gridColors = useMemo(() => {
        if (viewMode === 'colmap') {
            return {
                sectionColor: "#ffffff",
                cellColor: "#ffffff"
            };
        }
        return {
            sectionColor: "#3B82F6",
            cellColor: "#3B82F6"
        };
    }, [viewMode]);

    const handleSplatTargetChange = useCallback((newTarget) => {
        console.log(newTarget)
        if (orbitControlsRef.current && camera.mode === 'Orbit') {
        }
    }, [camera.mode]);
    

    return (
        <div className="relative w-full h-full">
              <Canvas className={canvasBackgroundColor} >
                <PerspectiveCamera 
                    ref={cameraRef}
                    makeDefault 
                    position={DEFAULT_CAMERA_POSITION} 
                    fov={camera.fov} 
                />
                <StatsGl trackGPU={true} className="stats absolute bottom-[60px]" />
                
                {viewMode === 'splat' && splatUrl && (
                    <SplatViewer
                        splatUrl={splatUrl}
                        position={[position.x, position.y, position.z]}
                        rotation={[rotate.x, -rotate.y, -rotate.z]}
                        scale={rotate.scale + 4.25}
                        onTargetChange={handleSplatTargetChange}
                    />
                )}
                
                {viewMode === 'colmap' && model.colmap_url && (
                    <>
                        <ambientLight intensity={1} />
                        <group 
                          rotation={[rotate.x + Math.PI, -rotate.y, -rotate.z]}
                          position={[position.x, position.y, position.z]}
                          scale={rotate.scale}
                        >
                          <Cameras 
                            imageBasePath={myAppConfig.api.ENDPOINT + colmapData.images}
                            cameras={colmapData.cameras}
                          />
                          <PointCloud points={colmapData.points}/>
                        </group>
                        <Axes />
                    </>
                )}
                
                {viewMode === 'colmap' && !model.colmap_url && (
                    <mesh position={[0, 0, 0]}>
                        <planeGeometry args={[4, 2]} />
                        <meshBasicMaterial color="#666666" transparent opacity={0.8} />
                        <mesh position={[0, 0, 0.01]}>
                            <planeGeometry args={[3.8, 1.8]} />
                            <meshBasicMaterial color="#333333" />
                        </mesh>
                    </mesh>
                )}
                
                {Controls}
                <Grid
                  position={[0, -1.5, 0]}
                  args={[50, 50]}
                  fadeDistance={25}
                  sectionColor={gridColors.sectionColor}
                  cellColor={gridColors.cellColor}
                  visible={grid.visible}
                />
              </Canvas>
            <Loader />
            
            {viewMode === 'colmap' && !model.colmap_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <div className="text-center p-8 bg-gray-800 rounded-lg">
                        <div className="text-6xl mb-4">📷</div>
                        <h3 className="text-xl font-semibold mb-2">Colmap Data Not Available</h3>
                        <p className="text-gray-300 mb-4">
                            This model doesn't have colmap reconstruction data available.
                        </p>
                        <p className="text-sm text-gray-400">
                            Switch to Splat view to see the 3D model.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModelCanvas;