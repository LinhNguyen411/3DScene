import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, Info, Maximize2, Minimize2, Download } from 'lucide-react';
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
    const [showActionMenu, setShowActionMenu] = useState(false);

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
    const handleFullScreen = async () => {
        const container = document.getElementById('model-canvas-container');
        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                setIsFullScreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullScreen(false);
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
            showSnackbar('Unable to toggle fullscreen mode', 'error');
        }
    };

    // Download splat logic
    const handleDownloadSplat = async () => {
        try {
            showLoader();
            await DataService.downloadSplat(id, model?.title, viewer);
            showSnackbar('Splat file downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading splat:', error);
            showSnackbar('Failed to download splat file', 'error');
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isFullScreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        };

        const handleFullScreenChange = () => {
            const wasFullScreen = isFullScreen;
            const isCurrentlyFullScreen = !!document.fullscreenElement;
            
            setIsFullScreen(isCurrentlyFullScreen);
            
            // Fix scrollbar and height issues when exiting fullscreen
            if (wasFullScreen && !isCurrentlyFullScreen) {
                const container = document.getElementById('model-canvas-container');
                const mainDiv = document.querySelector('.h-screen');
                
                // Reset all height-related styles
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
                
                if (container) {
                    container.style.height = '';
                    container.style.maxHeight = '';
                }
                
                if (mainDiv) {
                    mainDiv.style.height = '';
                    mainDiv.style.maxHeight = '';
                }
                
                // Force multiple reflows to ensure proper height recalculation
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    // Second reflow for stubborn cases
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                        // Force recalculation of viewport height
                        document.body.style.height = '100vh';
                        setTimeout(() => {
                            document.body.style.height = '';
                        }, 50);
                    }, 100);
                }, 50);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [isFullScreen]);

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

    useEffect(() => {
        fetchAndProcess();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionMenu && !event.target.closest('.action-buttons-container')) {
                setShowActionMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showActionMenu]);

    if (modelNotFound) {
        return (
            <>
                <LinkNotValid />
            </>
        )
    }
    const position = useMemo(() => model?.model_transform?.position || { x: 0, y: 0, z: 0 }, [model]);
    const rotate = useMemo(() => model?.model_transform?.rotation || { x: 0, y: 0, z: 0, scale: 1 }, [model]);
    console.log(DEFAULT_CAMERA_POSITION)

    return (
        <div className={`flex flex-col overflow-hidden ${isFullScreen ? 'h-full' : 'h-screen'}`}>
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
                    
                    {/* Floating Action Buttons */}
                    <div className="action-buttons-container fixed bottom-4 right-4 z-50 flex gap-2">
                        {/* Fullscreen Button */}
                        <button
                            onClick={handleFullScreen}
                            className="w-12 h-12 bg-gray-600 bg-opacity-60 hover:bg-opacity-80 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullScreen ? (
                                <Minimize2 
                                    size={20} 
                                    className="transition-transform duration-200 group-hover:scale-110" 
                                />
                            ) : (
                                <Maximize2 
                                    size={20} 
                                    className="transition-transform duration-200 group-hover:scale-110" 
                                />
                            )}
                        </button>
                        
                        {/* Download Button */}
                    </div>

                    <div className="action-buttons-container fixed bottom-4 left-4 z-50 flex gap-2">
                        <button
                            onClick={handleDownloadSplat}
                            className="w-12 h-12 bg-gray-600 bg-opacity-60 hover:bg-opacity-80 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                            aria-label="Download splat file"
                            title="Download Splat"
                        >
                            <Download 
                                size={20} 
                                className="transition-transform duration-200 group-hover:scale-110" 
                            />
                        </button>
                        
                    </div>
                </div>
            )}
        </div>
    );
}