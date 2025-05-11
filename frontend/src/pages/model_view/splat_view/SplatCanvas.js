import { Canvas } from '@react-three/fiber';
import { StatsGl, Loader, Grid, OrbitControls, FirstPersonControls, PerspectiveCamera } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useControls } from 'leva';
import SplatViewer from './SplatViewer';
import * as THREE from 'three';

function SplatCanvas({ splatUrl }) {
    const rotateOptions = useMemo(() => {
        return {
            x: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            y: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            z: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            scale: { value: 1, min: 0.1, max: 100, step: 0.1 },
        };
    }, []);

    const positionOptions = useMemo(() => {
        return {
            x: { value: 0, min: -5, max: 5, step: 0.1 },
            y: { value: 0, min: -5, max: 5, step: 0.1 },
            z: { value: 0, min: -5, max: 5, step: 0.1 },
        };
    }, []);

    const cameraOptions = useMemo(() => {
        return {
            mode: { value: 'Orbit', options: ['Orbit', 'Fly'] },
            fov: { value: 50, min: 10, max: 120, step: 0.1 },
        };
    }, []);

    const gridOptions = useMemo(() => {
        return {
            visible: { value: true, label: 'Show Grid' },
        };
    }, []);

    const flyControlsOptions = useMemo(() => {
        return {
            movementSpeed: { value: 2, min: 0.1, max: 10, step: 0.1 },
            lookSpeed: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
        };
    }, []);

    const position = useControls('Position', positionOptions);
    const rotate = useControls('Rotate', rotateOptions);
    const camera = useControls('Camera', cameraOptions);
    const grid = useControls('Grid', gridOptions);
    const flyControls = useControls(
        'Fly Controls',
        flyControlsOptions,
        { collapsed: true, enabled: camera.mode === 'Fly' }
    );

    // References for controls and previous FOV
    const controlsRef = useRef();
    const prevFovRef = useRef(camera.fov);
    const cameraRef = useRef();
    
    // Store positions for each camera mode
    const orbitPositionRef = useRef(new THREE.Vector3(0, 0, 5));
    const orbitTargetRef = useRef(new THREE.Vector3(0, 0, 0));
    const flyPositionRef = useRef(new THREE.Vector3(0, 0, 5));
    const flyDirectionRef = useRef(new THREE.Vector3(0, 0, -1));
    
    // Track previous camera mode to detect changes
    const prevModeRef = useRef(camera.mode);

    // Effect to implement dolly effect in Orbit mode
    useEffect(() => {
        if (camera.mode === 'Orbit' && controlsRef.current) {
            const controls = controlsRef.current;
            const target = controls.target; // OrbitControls target point
            const cameraObj = controls.object; // The camera instance
            const prevFov = prevFovRef.current;
            const newFov = camera.fov;

            if (prevFov !== newFov) {
                // Convert FOV from degrees to radians
                const prevTan = Math.tan((prevFov * Math.PI / 180) / 2);
                const newTan = Math.tan((newFov * Math.PI / 180) / 2);
                const factor = prevTan / newTan;

                // Calculate new distance
                const currentDistance = cameraObj.position.distanceTo(target);
                const newDistance = currentDistance * factor;

                // Adjust camera position along the view direction
                const direction = new THREE.Vector3()
                    .subVectors(cameraObj.position, target)
                    .normalize();
                const newPosition = target.clone().add(direction.multiplyScalar(newDistance));
                cameraObj.position.copy(newPosition);

                // Update controls to reflect the new position
                controls.update();

                // Store the new FOV as the previous value
                prevFovRef.current = newFov;
            }
        }
    }, [camera.fov, camera.mode]);

    // Save camera position when control mode changes
    useEffect(() => {
        if (!controlsRef.current || !cameraRef.current) return;
        
        const prevMode = prevModeRef.current;
        const newMode = camera.mode;
        
        if (prevMode !== newMode) {
            // Save the current camera state before switching
            if (prevMode === 'Orbit') {
                orbitPositionRef.current.copy(cameraRef.current.position);
                if (controlsRef.current.target) {
                    orbitTargetRef.current.copy(controlsRef.current.target);
                }
            } else if (prevMode === 'Fly') {
                flyPositionRef.current.copy(cameraRef.current.position);
                // Save camera direction
                const direction = new THREE.Vector3(0, 0, -1);
                direction.applyQuaternion(cameraRef.current.quaternion);
                flyDirectionRef.current.copy(direction);
            }
            
            prevModeRef.current = newMode;
        }
    }, [camera.mode]);

    // Set up controls based on camera mode with position restoration
    const Controls = useMemo(() => {
        if (camera.mode === 'Orbit') {
            return (
                <OrbitControls
                    ref={controlsRef}
                    enableDamping={true}
                    dampingFactor={0.05}
                    rotateSpeed={0.5}
                    zoomSpeed={0.5}
                    panSpeed={0.5}
                    momentum={false}
                    target={orbitTargetRef.current}
                    onUpdate={(controls) => {
                        // If camera position ref exists, set the camera position
                        if (cameraRef.current && prevModeRef.current !== camera.mode) {
                            cameraRef.current.position.copy(orbitPositionRef.current);
                            controls.update();
                        }
                    }}
                />
            );
        } else {
            return (
                <FirstPersonControls
                    ref={controlsRef}
                    lookSpeed={flyControls.lookSpeed}
                    movementSpeed={flyControls.movementSpeed}
                    lookVertical={true}
                    constrainVertical={true}
                    verticalMin={Math.PI / 4}
                    verticalMax={Math.PI}
                    heightSpeed={false}
                    onUpdate={(controls) => {
                        // If camera position ref exists, set the camera position and direction
                        if (cameraRef.current && prevModeRef.current !== camera.mode) {
                            cameraRef.current.position.copy(flyPositionRef.current);
                            
                            // Set the camera orientation based on the saved direction
                            const direction = flyDirectionRef.current.clone();
                            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                                new THREE.Vector3(0, 0, -1),
                                direction.normalize()
                            );
                            cameraRef.current.quaternion.copy(quaternion);
                            
                            controls.update();
                        }
                    }}
                />
            );
        }
    }, [camera.mode, flyControls.movementSpeed, flyControls.lookSpeed]);

    const GridHelper = useMemo(() => {
        return grid.visible ? <Grid infiniteGrid={true} /> : null;
    }, [grid.visible]);

    return (
        <>
            <Canvas>
                <PerspectiveCamera 
                    ref={cameraRef}
                    makeDefault 
                    position={[0, 0, 5]} 
                    fov={camera.fov} 
                />
                <StatsGl trackGPU={true} className="stats absolute bottom-[60px]" />
                <SplatViewer
                    splatUrl={splatUrl}
                    position={[position.x, position.y, position.z]}
                    rotation={[rotate.x, rotate.y, rotate.z]}
                    scale={rotate.scale}
                />
                {Controls}
                {GridHelper}
            </Canvas>
            <Loader />
        </>
    );
}

export default SplatCanvas;