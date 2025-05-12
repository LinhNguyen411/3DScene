import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import PyramidOutlineComponent from './PyramidOutline';

// TextureCache to prevent redundant loading
const textureCache = new Map();

// Helper function to calculate optimal texture size based on distance and view
const calculateOptimalTextureSize = (camera, viewerPosition, maxSize = 1024, minSize = 128) => {
  // Calculate distance from camera to viewer
  const distance = new THREE.Vector3(...camera.position).distanceTo(
    new THREE.Vector3(viewerPosition.x, viewerPosition.y, viewerPosition.z)
  );
  
  // Scale size inversely with distance (closer = higher resolution)
  const optimalSize = Math.max(minSize, Math.min(maxSize, Math.floor(maxSize / (distance * 0.1 + 1))));
  
  // Return power of 2 for better GPU performance
  return Math.pow(2, Math.floor(Math.log2(optimalSize)));
};

// CameraInstance component with optimized texture loading
const CameraInstance = ({ 
  item, 
  imageBasePath, 
  isHovered, 
  onPointerOver, 
  onPointerOut, 
  onCameraClick, 
  cameraWidth, 
  cameraHeight,
  viewerPosition
}) => {
  const { gl, camera } = useThree();
  // Ref for texture loaded state to avoid re-renders
  const textureLoadedRef = useRef(false);
  const [textureVisible, setTextureVisible] = useState(false);
  
  useEffect(() => {
    if (isHovered) {
      console.log(`Hovered camera: ${item.name || item.uniqueId}`);
    }
  }, [isHovered, item.name, item.uniqueId]);

  let width, height, aspectRatio;
  // Use provided camera dimensions
  if (cameraWidth > cameraHeight){
    width = 0.2;
    aspectRatio = cameraHeight / cameraWidth;
    height = aspectRatio * width;
  }
  else{
    height = 0.2;
    aspectRatio = cameraWidth / cameraHeight;
    width = aspectRatio * height;
  }
  const pyramidSize = useMemo(() => new THREE.Vector3(width / 2, 0.05, height / 2), [width, height]);

  const pyramidColor = isHovered ? 0xffff00 : 0xffffff;
  const baseOpacity = isHovered ? 0.1 : 0;
  
  // Calculate optimal texture size based on distance - moved outside of texture loading
  const optimalSize = useMemo(() => {
    return viewerPosition ? calculateOptimalTextureSize(item, viewerPosition) : 256;
  }, [item, viewerPosition]);
  
  // Create a texture loader with caching
  const texture = useMemo(() => {
    if (!item.name) return null;
    
    const imagePath = `${imageBasePath}/${item.name}`;
    const cacheKey = `${imagePath}_${optimalSize}`;
    
    if (textureCache.has(cacheKey)) {
      if (!textureLoadedRef.current) {
        textureLoadedRef.current = true;
        // Use requestAnimationFrame to avoid state update during rendering
        requestAnimationFrame(() => {
          setTextureVisible(true);
        });
      }
      return textureCache.get(cacheKey);
    }
    
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    const newTexture = loader.load(
      imagePath,
      (loadedTexture) => {
        // Resize texture for performance
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        
        // Create downsized version for better performance
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Size canvas to optimal dimensions (maintaining aspect ratio)
        const scaleFactor = optimalSize / Math.max(loadedTexture.image.width, loadedTexture.image.height);
        canvas.width = Math.round(loadedTexture.image.width * scaleFactor);
        canvas.height = Math.round(loadedTexture.image.height * scaleFactor);
        
        // Draw and resize the image
        ctx.drawImage(loadedTexture.image, 0, 0, canvas.width, canvas.height);
        
        // Apply the resized image to the texture
        loadedTexture.image = canvas;
        loadedTexture.needsUpdate = true;
        
        // Update loaded state using ref first, then state
        textureLoadedRef.current = true;
        
        // Use requestAnimationFrame to avoid state update during rendering
        requestAnimationFrame(() => {
          setTextureVisible(true);
        });
      },
      undefined,
      (error) => console.error('Error loading texture:', error)
    );
    
    // Store in cache for reuse
    textureCache.set(cacheKey, newTexture);
    return newTexture;
  }, [item.name, imageBasePath, optimalSize]);

  const [w, x, y, z] = item.quaternion;

  // Handle camera focus and zoom on click
   const handleClick = (e) => {
    e.stopPropagation();

    // Get the current world matrix from the mesh to account for all parent transformations
    const mesh = e.object;
    mesh.updateWorldMatrix(true, false);
    
    // Get the world position of this camera (including all parent transformations)
    const worldPosition = new THREE.Vector3();
    mesh.getWorldPosition(worldPosition);
    
    // Get world quaternion (including all parent transformations)
    const worldQuaternion = new THREE.Quaternion();
    mesh.getWorldQuaternion(worldQuaternion);
    
    // Create a direction vector based on the camera orientation
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion);
    
    // Get the world scale to adjust the viewing distance
    const worldScale = new THREE.Vector3();
    mesh.getWorldScale(worldScale);
    // Use the average scale factor
    const scaleFactor = (worldScale.x + worldScale.y + worldScale.z) / 3;
    
    // Calculate the position to place the viewing camera
    // Adjust distance based on scale to maintain consistent view size
    const baseDistance = 0.3;
    const adjustedDistance = baseDistance * scaleFactor;
    const targetPosition = new THREE.Vector3().copy(worldPosition).add(
      direction.multiplyScalar(adjustedDistance)
    );
    
    // Create a temporary object to animate to
    const currentPosition = camera.position.clone();
    const currentTarget = new THREE.Vector3(0, 0, 0);
    if (camera.userData.controls) {
      currentTarget.copy(camera.userData.controls.target);
    }
    
    // Store initial values
    const initialPositionX = currentPosition.x;
    const initialPositionY = currentPosition.y;
    const initialPositionZ = currentPosition.z;
    const initialTargetX = currentTarget.x;
    const initialTargetY = currentTarget.y;
    const initialTargetZ = currentTarget.z;
    
    // Destination values
    const targetPositionX = targetPosition.x;
    const targetPositionY = targetPosition.y;
    const targetPositionZ = targetPosition.z;
    
    // Duration of the animation in milliseconds
    const duration = 1000;
    const startTime = Date.now();
    
    // Animation function
    function animateCamera() {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing function for smooth animation (ease-in-out)
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate position
      camera.position.x = initialPositionX + (targetPositionX - initialPositionX) * easeProgress;
      camera.position.y = initialPositionY + (targetPositionY - initialPositionY) * easeProgress;
      camera.position.z = initialPositionZ + (targetPositionZ - initialPositionZ) * easeProgress;
      
      // Interpolate orbit controls target to the world position
      if (camera.userData.controls) {
        camera.userData.controls.target.x = initialTargetX + (worldPosition.x - initialTargetX) * easeProgress;
        camera.userData.controls.target.y = initialTargetY + (worldPosition.y - initialTargetY) * easeProgress;
        camera.userData.controls.target.z = initialTargetZ + (worldPosition.z - initialTargetZ) * easeProgress;
        camera.userData.controls.update();
      }
      
      // Continue animation if not done
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    }
    
    // Start animation
    animateCamera();
  
    // Also call the original click handler to show the popup if needed
    // if (onCameraClick) {
    //   onCameraClick(item, `${imageBasePath}/${item.name}`);
    // }
  };

  return (
    <group
      position={item.position}
      quaternion={new THREE.Quaternion(x, y, z, -w)}
    >
      <PyramidOutlineComponent size={pyramidSize} color={pyramidColor} baseOpacity={baseOpacity} />
      {item.name && texture && (
        <mesh
          position={[0, 0, 0.05001]}
          rotation={[Math.PI, 0, 0]}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={handleClick}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            map={texture}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.5}
            opacity={textureVisible ? 0.7 : 0}
          />
        </mesh>
      )}
    </group>
  );
};

// LevelOfDetail wrapper component to manage detail levels
const LODCameraInstance = (props) => {
  const { camera } = useThree();
  const [distance, setDistance] = useState(0);
  const distanceRef = useRef(0);
  const requestRef = useRef(null);
  
  // Use refs to avoid multiple state updates
  useEffect(() => {
    const updateDistance = () => {
      const cameraPosition = new THREE.Vector3(...props.item.position);
      const viewerPosition = camera.position;
      const dist = cameraPosition.distanceTo(viewerPosition);
      
      // Only update state if the distance has changed significantly
      if (Math.abs(distanceRef.current - dist) > 1) {
        distanceRef.current = dist;
        setDistance(dist);
      }
      
      // Schedule next update
      requestRef.current = requestAnimationFrame(updateDistance);
    };
    
    // Start updates
    requestRef.current = requestAnimationFrame(updateDistance);
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [props.item.position, camera]);
  
  // Skip rendering if too far away
  if (distance > 50) return null;
  
  return <CameraInstance {...props} viewerPosition={camera.position} />;
};

// Main Cameras component
const Cameras = ({ cameras, imageBasePath = '/images/', onImageClick }) => {
  const [cameraData, setCameraData] = useState([]);
  const [hoveredCameraId, setHoveredCameraId] = useState(null);
  const { camera } = useThree();
  const processedRef = useRef(false);
  
  // Store the OrbitControls reference in camera.userData
  useEffect(() => {
    // Find the OrbitControls instance attached to the scene
    const orbitControls = camera.userData.controls;
    
    // If not already stored, try to get it from the DOM
    if (!orbitControls) {
      // We'll need to access it from the ColmapCanvas component
      // This will be set by ColmapCanvas.js when OrbitControls is created
    }
  }, [camera]);

  useEffect(() => {
    // Prevent duplicate processing
    if (processedRef.current) return;
    
    // Process camera data
    const processedData = cameras.map((item, index) => ({
      ...item,
      uniqueId: item.camera_id || `camera-${index}`,
      img_w: item.image_width || 480, // Fallback to default width
      img_h: item.image_height || 480, // Fallback to default height
    }));
    
    setCameraData(processedData);
    processedRef.current = true;
  }, [cameras]);

  const handleCameraClick = (camera, imageUrl) => {
    if (onImageClick) {
      onImageClick(camera, imageUrl);
    }
  };

  // Preload frequently used textures
  useEffect(() => {
    // Clear texture cache when component unmounts
    return () => {
      textureCache.forEach((texture) => {
        texture.dispose();
      });
      textureCache.clear();
    };
  }, []);

  return (
    <group>
      {cameraData.map((item) => {
        const cameraWidth = item ? item.img_w : 480; // Fallback
        const cameraHeight = item ? item.img_h : 854; // Fallback

        return (
          <Suspense key={item.uniqueId} fallback={null}>
            <LODCameraInstance
              item={item}
              imageBasePath={imageBasePath}
              isHovered={item.uniqueId === hoveredCameraId}
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredCameraId(item.uniqueId);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                setHoveredCameraId(null);
                document.body.style.cursor = 'auto';
              }}
              onCameraClick={handleCameraClick}
              cameraWidth={cameraWidth}
              cameraHeight={cameraHeight}
            />
          </Suspense>
        );
      })}
    </group>
  );
};

export default Cameras;