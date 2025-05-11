import React, { useEffect, useState, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
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
  const { gl } = useThree();
  const [textureLoaded, setTextureLoaded] = useState(false);
  
  useEffect(() => {
    if (isHovered) {
      console.log(`Hovered camera: ${item.name || item.uniqueId}`);
    }
  }, [isHovered, item.name, item.uniqueId]);

  // Use provided camera dimensions
  const width = 0.2;
  const aspectRatio = cameraHeight / cameraWidth;
  const height = aspectRatio * width;
  const pyramidSize = useMemo(() => new THREE.Vector3(width / 2, 0.05, height / 2), [width, height]);

  const pyramidColor = isHovered ? 0xffff00 : 0xffffff;
  const baseOpacity = isHovered ? 0.1 : 0;
  
  // Calculate optimal texture size based on distance
  const optimalSize = useMemo(() => {
    return viewerPosition ? calculateOptimalTextureSize(item, viewerPosition) : 256;
  }, [item, viewerPosition]);
  
  // Create a texture loader with caching
  const texture = useMemo(() => {
    if (!item.name) return null;
    
    const imagePath = `${imageBasePath}/${item.name}`;
    const cacheKey = `${imagePath}_${optimalSize}`;
    
    if (textureCache.has(cacheKey)) {
      setTextureLoaded(true);
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
        
        // Update loaded state
        setTextureLoaded(true);
      },
      undefined,
      (error) => console.error('Error loading texture:', error)
    );
    
    // Store in cache for reuse
    textureCache.set(cacheKey, newTexture);
    return newTexture;
  }, [item.name, imageBasePath, optimalSize]);

  const [w, x, y, z] = item.quaternion;

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
          onClick={(e) => {
            e.stopPropagation();
            onCameraClick(item, `${imageBasePath}/${item.name}`);
          }}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            map={texture}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.5}
            opacity={textureLoaded ? 1 : 0}
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
  
  useEffect(() => {
    const updateDistance = () => {
      const cameraPosition = new THREE.Vector3(...props.item.position);
      const viewerPosition = camera.position;
      const dist = cameraPosition.distanceTo(viewerPosition);
      setDistance(dist);
    };
    
    // Initial calculation
    updateDistance();
    
    // Add to render loop for continuous updates
    const interval = setInterval(updateDistance, 500);
    return () => clearInterval(interval);
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

  useEffect(() => {
    // Process camera data
    const processedData = cameras.map((item, index) => ({
      ...item,
      uniqueId: item.camera_id || `camera-${index}`,
      img_w: item.image_width || 480, // Fallback to default width
      img_h: item.image_height || 480, // Fallback to default height
    }));
    setCameraData(processedData);
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