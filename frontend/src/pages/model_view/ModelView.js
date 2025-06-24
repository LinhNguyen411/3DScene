import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import DataService from './ModelViewService';
import { useLoader } from '../../provider/LoaderProvider';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import myAppConfig from '../../config';
import LinkNotValid from "../link_not_valid/LinkNotValid";

import { Canvas } from '@react-three/fiber';
import { Loader, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import SplatViewer from './splat_view/SplatViewer';
import * as THREE from 'three';

export default function SplatViewerPage() {
    // ModelView Hooks and State
    const { showSnackbar } = useSnackbar();
    const { showLoader, hideLoader } = useLoader();
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const viewer = searchParams.get('viewer');
    const [splatUrl, setSplatUrl] = useState(null);
    const [model, setModel] = useState(null);
    const [modelNotFound, setModelNotFound] = useState(false);
    const [projectName, setProjectName] = useState(null);
    const [projectIcon, setProjectIcon] = useState(null);

    // ModelCanvas Hooks and State
    const FALLBACK_CAMERA_POSITION = new THREE.Vector3(5, 2, 6);
    const FALLBACK_CAMERA_QUATERNION = new THREE.Quaternion();
    const FALLBACK_MODEL_POSITION = new THREE.Vector3(0,0,0);
    const FALLBACK_MODEL_ROTATION = new THREE.Vector3(0,0,0);
    const cameraRef = useRef();
    const orbitControlsRef = useRef();
    const [isFullScreen, setIsFullScreen] = useState(false);

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

    const DEFAULT_CAMERA_TARGET = useMemo(() => {
        if (model?.camera_init?.target) {
            const { x, y, z } = model.camera_init.target;
            return new THREE.Vector3(x, y, z);
        }
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(FALLBACK_CAMERA_QUATERNION);
        const baseDistance = -10;
        return new THREE.Vector3().copy(DEFAULT_CAMERA_POSITION).add(
            direction.multiplyScalar(baseDistance)
        );
    }, [model?.camera_init?.target, DEFAULT_CAMERA_POSITION]);

    const DEFAULT_MODEL_POSITION = useMemo(() => {
        console.log(model?.model_transform?.position)
        if (model?.model_transform?.position) {
            if (Array.isArray(model.model_transform.position)) {
                const [x, y, z] = model.model_transform.position;
                return new THREE.Vector3(x, y, z);
            }
            return new THREE.Vector3(
                model.model_transform.position.x || 0,
                model.model_transform.position.y || 0,
                model.model_transform.position.z || 0
            );
        }
        return FALLBACK_MODEL_POSITION;
    }, [model?.model_transform?.position]);

    const DEFAULT_MODEL_ROTATION = useMemo(() => {
        if (model?.model_transform?.rotation) {
            if (Array.isArray(model.model_transform.rotation)) {
                const [x, y, z, scale] = model.model_transform.rotation;
                return new THREE.Vector3(x, y, z);
            }
            return new THREE.Vector3(
                model.model_transform.rotation.x || 0,
                model.model_transform.rotation.y || 0,
                model.model_transform.rotation.z || 0
            );
        }
        return FALLBACK_MODEL_ROTATION;
    }, [model?.model_transform?.rotation]);

    // Full screen logic
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isFullScreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        };

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [isFullScreen]);

    const toggleFullScreen = () => {
        const element = document.getElementById('model-canvas-container');
        if (element) {
            if (!document.fullscreenElement) {
                element.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen().then(() => setIsFullScreen(false)).catch(err => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                });
            }
        }
    };

    // Data fetching logic
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        }
    };

    let objectUrl;
    const fetchAndProcess = async () => {
        try {
            showLoader();
            try {
                const splat = await DataService.getSplat(id, viewer);
                if (!splat) {
                    setModelNotFound(true);
                    hideLoader();
                    return;
                }
                setModel(splat);
            } catch (error) {
                console.error('Error fetching splat data:', error);
                setModelNotFound(true);
                hideLoader();
                return;
            }
            
            try {
                const response = await DataService.getModel(id, viewer);
                if (!response || response.status !== 200) {
                    throw new Error(`Failed to fetch .splat file: ${response?.statusText}`);
                }
                const arrayBuffer = await response.data.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                objectUrl = URL.createObjectURL(blob);
                setSplatUrl(objectUrl);
            } catch (error) {
                console.error('Error processing .splat file:', error);
                setModelNotFound(true);
            }
            
            hideLoader();
        } catch (error) {
            console.error('Error in fetchAndProcess:', error);
            setModelNotFound(true);
            hideLoader();
        }
    };

    const fetchProjectInfo = async () => {
        try {
            const response = await DataService.getProjectInfo();
            if (response) {
                setProjectName(response.project_name);
                setProjectIcon(myAppConfig.api.ENDPOINT + response.project_icon);
            } else {
                console.error('Failed to fetch project info');
            }
        }
        catch (error) {
            console.error('Error fetching project info:', error);
        }
    }

    useEffect(() => {
        fetchAndProcess();
        fetchProjectInfo();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    // if (modelNotFound) {
    //     return (
    //         <>
    //             <LinkNotValid />
    //         </>
    //     )
    // }
    const position = useMemo(() => model?.model_transform?.position || { x: 0, y: 0, z: 0 }, [model]);
    const rotate = useMemo(() => model?.model_transform?.rotation || { x: 0, y: 0, z: 0, scale: 1 }, [model]);
    console.log(DEFAULT_CAMERA_POSITION)

    return (
        <div className='h-screen flex flex-col'>
            {model && (
                <div id="model-canvas-container" className='flex-1 relative'>
                    <Canvas className="bg-white">
                        <PerspectiveCamera 
                            ref={cameraRef}
                            makeDefault 
                            position={DEFAULT_CAMERA_POSITION} 
                            fov={50} 
                        />
                        <OrbitControls 
                            ref={orbitControlsRef}
                            target={DEFAULT_CAMERA_TARGET}
                            enableDamping={true}
                            dampingFactor={0.05}
                            rotateSpeed={0.5}
                            zoomSpeed={0.5}
                            panSpeed={0.5}
                        />
                        {splatUrl && (
                            <SplatViewer
                                splatUrl={splatUrl}
                                position={[position.x, position.y, position.z]}
                                rotation={[rotate.x, -rotate.y, -rotate.z]}
                                scale={rotate.scale + 4.25}
                            />
                        )}
                    </Canvas>
                    <Loader />
                    <button
                        onClick={toggleFullScreen}
                        className="absolute bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
                        title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullScreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 16.5l-4-4m0 0l4-4m-4 4h14m-5 4v5m0-5V4" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0 0h-4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m0 4l-5-5" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}