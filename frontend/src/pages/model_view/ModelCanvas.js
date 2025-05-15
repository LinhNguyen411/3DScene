import { Canvas, useFrame } from '@react-three/fiber';
import { StatsGl, Loader, Grid, OrbitControls, FirstPersonControls, PerspectiveCamera } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import SplatViewer from './splat_view/SplatViewer';
import PointCloud from './colmap_view/PointCloud';
import Cameras from './colmap_view/Cameras';
import ImagePopup from './colmap_view/ImagePopup';
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

// Default camera settings
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5, 2, 6);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_CAMERA_FOV = 50;

function ModelCanvas({ viewMode, splatUrl, colmapData }) {
    // References
    const orbitControlsRef = useRef();
    const prevFovRef = useRef(DEFAULT_CAMERA_FOV);
    const cameraRef = useRef();
    
    // Reset view handler
    const handleResetView = useCallback(() => {
        if (!cameraRef.current || !orbitControlsRef.current) return;
        
        const camera = cameraRef.current;
        const controls = orbitControlsRef.current;
        
        // Store initial values
        const initialPosition = camera.position.clone();
        const initialFov = camera.fov;
        const initialTarget = new THREE.Vector3();
        if (controls.target) {
            initialTarget.copy(controls.target);
        }
        
        // Animation parameters
        const duration = 1500; // 1.5 seconds, same as the GSAP version
        const startTime = Date.now();
        
        // Animation function
        function animateReset() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Easing function for smooth animation (ease-in-out)
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Interpolate camera position
            camera.position.x = initialPosition.x + (DEFAULT_CAMERA_POSITION.x - initialPosition.x) * easeProgress;
            camera.position.y = initialPosition.y + (DEFAULT_CAMERA_POSITION.y - initialPosition.y) * easeProgress;
            camera.position.z = initialPosition.z + (DEFAULT_CAMERA_POSITION.z - initialPosition.z) * easeProgress;
            
            // Interpolate field of view
            camera.fov = initialFov + (DEFAULT_CAMERA_FOV - initialFov) * easeProgress;
            camera.updateProjectionMatrix();
            
            // Interpolate orbit controls target
            if (controls.target) {
                controls.target.x = initialTarget.x + (DEFAULT_CAMERA_TARGET.x - initialTarget.x) * easeProgress;
                controls.target.y = initialTarget.y + (DEFAULT_CAMERA_TARGET.y - initialTarget.y) * easeProgress;
                controls.target.z = initialTarget.z + (DEFAULT_CAMERA_TARGET.z - initialTarget.z) * easeProgress;
                
                if (controls.update) {
                    controls.update();
                }
            }
            
            // Update state references when animation completes
            if (progress >= 1) {
                prevFovRef.current = DEFAULT_CAMERA_FOV;
                cameraStateRef.current = {
                    position: DEFAULT_CAMERA_POSITION.clone(),
                    quaternion: camera.quaternion.clone(),
                    target: DEFAULT_CAMERA_TARGET.clone(),
                    fov: DEFAULT_CAMERA_FOV
                };
            } else {
                // Continue animation if not done
                requestAnimationFrame(animateReset);
            }
        }
        
        // Start animation
        animateReset();
    }, []);

    // Use the separated Leva controls
    const position = usePositionControls(viewMode !== 'splat');
    const rotate = useRotationControls(viewMode !== 'splat');
    const camera = useCameraControls(handleResetView);
    const grid = useGridControls();
    const flyControls = useFlyControls(camera.mode === 'Fly');
    
    // Store camera state for each mode
    const cameraStateRef = useRef({
        position: DEFAULT_CAMERA_POSITION.clone(),
        quaternion: new THREE.Quaternion(),
        target: DEFAULT_CAMERA_TARGET.clone(),
        fov: DEFAULT_CAMERA_FOV
    });

    // Colmap specific state
    const [popupState, setPopupState] = useState({
        isOpen: false,
        imageUrl: "",
        imageName: ""
    });

    const handleImageClick = (camera, imageUrl) => {
        setPopupState({
            isOpen: true,
            imageUrl: imageUrl,
            imageName: camera.name || `Camera ${camera.uniqueId}`
        });
    };

    const closePopup = () => {
        setPopupState({
            ...popupState,
            isOpen: false
        });
    };

    // Save camera state when switching modes
    useEffect(() => {
        if (!cameraRef.current || !orbitControlsRef.current) return;

        // Save current camera state
        cameraStateRef.current.position.copy(cameraRef.current.position);
        cameraStateRef.current.quaternion.copy(cameraRef.current.quaternion);
        cameraStateRef.current.fov = camera.fov;
        
        if (orbitControlsRef.current.target) {
            cameraStateRef.current.target.copy(orbitControlsRef.current.target);
        }
    }, [viewMode]);

    // Restore camera state when canvas is ready
    useEffect(() => {
        if (!cameraRef.current || !orbitControlsRef.current) return;

        // Restore camera state
        cameraRef.current.position.copy(cameraStateRef.current.position);
        cameraRef.current.quaternion.copy(cameraStateRef.current.quaternion);
        cameraRef.current.fov = cameraStateRef.current.fov;
        
        if (orbitControlsRef.current.target) {
            orbitControlsRef.current.target.copy(cameraStateRef.current.target);
        }
        
        if (orbitControlsRef.current.update) {
            orbitControlsRef.current.update();
        }
    }, [cameraRef.current, orbitControlsRef.current]);

    // Effect to implement dolly effect in Orbit mode
    useEffect(() => {
        if (camera.mode === 'Orbit' && orbitControlsRef.current) {
            const controls = orbitControlsRef.current;
            const target = controls.target;
            const cameraObj = controls.object;
            const prevFov = prevFovRef.current;
            const newFov = camera.fov;

            if (prevFov !== newFov) {
                const prevTan = Math.tan((prevFov * Math.PI / 180) / 2);
                const newTan = Math.tan((newFov * Math.PI / 180) / 2);
                const factor = prevTan / newTan;

                const currentDistance = cameraObj.position.distanceTo(target);
                const newDistance = currentDistance * factor;

                const direction = new THREE.Vector3()
                    .subVectors(cameraObj.position, target)
                    .normalize();
                const newPosition = target.clone().add(direction.multiplyScalar(newDistance));
                
                // Animate to new position for a smoother transition
                const initialPosition = cameraObj.position.clone();
                const duration = 500; // 0.5 seconds
                const startTime = Date.now();
                
                function animateDolly() {
                    const elapsedTime = Date.now() - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    
                    // Simple ease-out function
                    const easeProgress = 1 - Math.pow(1 - progress, 2);
                    
                    // Interpolate position
                    cameraObj.position.x = initialPosition.x + (newPosition.x - initialPosition.x) * easeProgress;
                    cameraObj.position.y = initialPosition.y + (newPosition.y - initialPosition.y) * easeProgress;
                    cameraObj.position.z = initialPosition.z + (newPosition.z - initialPosition.z) * easeProgress;
                    
                    controls.update();
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateDolly);
                    }
                }
                
                animateDolly();
                prevFovRef.current = newFov;
            }
        }
    }, [camera.fov, camera.mode]);

    // Set up controls based on camera mode
    const Controls = useMemo(() => {
        if (camera.mode === 'Orbit') {
            return (
                   <OrbitControls 
                      ref={orbitControlsRef}
                      onUpdate={(controls) => {
                        if (controls.object) {
                          controls.object.userData.controls = controls;
                        }
                      }}
                      enableDamping={true}
                      dampingFactor={0.05}
                      rotateSpeed={0.5}
                      zoomSpeed={0.5}
                      panSpeed={0.5}
                      momentum={false}
                />
            );
        } else {
            return (
                <FirstPersonControls
                    ref={orbitControlsRef}
                    lookSpeed={flyControls.lookSpeed}
                    movementSpeed={flyControls.movementSpeed}
                    lookVertical={true}
                    constrainVertical={true}
                    verticalMin={Math.PI / 4}
                    verticalMax={Math.PI}
                    heightSpeed={false}
                />
            );
        }
    }, [camera.mode, flyControls.movementSpeed, flyControls.lookSpeed]);

    return (
        <div className="relative w-full h-full">
              <Canvas className={viewMode === 'colmap' ? "bg-black" : "bg-white"} >
                <PerspectiveCamera 
                    ref={cameraRef}
                    makeDefault 
                    position={[5,2,6]} 
                    fov={camera.fov} 
                />
                <StatsGl trackGPU={true} className="stats absolute bottom-[60px]" />
                {viewMode === 'splat' && splatUrl && (
                    <SplatViewer
                        splatUrl={splatUrl}
                        position={[position.x, position.y, position.z]}
                        rotation={[rotate.x, -rotate.y, -rotate.z]}
                        scale={rotate.scale + 5}
                    />
                )}
                {viewMode === 'colmap' && colmapData && (
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
                            onImageClick={handleImageClick}
                          />
                          <PointCloud points={colmapData.points}/>
                        </group>
                        <Axes />
                    </>
                )}
                {Controls}
                <Grid
                  position={[0, -1.5, 0]}
                  args={[50, 50]}
                  fadeDistance={25}
                  sectionColor={viewMode === 'colmap'? "#ffffff" : "#3B82F6"}
                  cellColor={viewMode === 'colmap'? "#ffffff" : "#3B82F6"}
                  visible={grid.visible}
                />
              </Canvas>
            <Loader />
            {/* Popup component outside of Canvas */}
            {viewMode === 'colmap' && (
                <ImagePopup 
                    isOpen={popupState.isOpen}
                    imageUrl={popupState.imageUrl}
                    imageName={popupState.imageName}
                    onClose={closePopup}
                />
            )}
        </div>
    );
}

export default ModelCanvas;