import React, { useState, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { AxesHelper } from "three";
import PointCloud from "./PointCloud";
import Cameras from "./Cameras";
import ImagePopup from "./ImagePopup";
import myAppConfig from "../../../config";

const Axes = () => {
  const axesHelper = new AxesHelper(0.4);
  axesHelper.setColors(
    new THREE.Color(0xff0000),
    new THREE.Color(0x00ff00),
    new THREE.Color(0x0000ff)
  );

  return <primitive object={axesHelper} />;
};

const ColmapCanvas = ({colmap_data}) => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    imageUrl: "",
    imageName: ""
  });
  
  // Create a ref to store the OrbitControls
  const orbitControlsRef = useRef();

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
  console.log("colmap_data", colmap_data);

  return (
    <div className="relative w-full h-full">
      <Canvas camera={{ fov: 50, position: [5, 2, 6] }} className="bg-black">
        <ambientLight intensity={1} />
        <group rotation={[Math.PI, 0, 0]}>
          <Cameras 
            imageBasePath={myAppConfig.api.ENDPOINT + colmap_data.images}
            cameras={colmap_data.cameras}
            onImageClick={handleImageClick}
          />
          <PointCloud points={colmap_data.points}/>
        </group>
        <Axes />
        <OrbitControls 
          ref={orbitControlsRef}
          makeDefault 
          // Store the controls reference in the camera's userData for access in other components
          onUpdate={(controls) => {
            // This will run when OrbitControls updates
            // Store the controls in the camera's userData for access in Cameras.js
            if (controls.object) {
              controls.object.userData.controls = controls;
            }
          }}
        />
        <Grid
          position={[0, -1.5, 0]}
          args={[50, 50]}
          fadeDistance={25}
          sectionColor="#ffffff"
          cellColor="#ffffff"
        />
      </Canvas>
      
      {/* Popup component outside of Canvas */}
      <ImagePopup 
        isOpen={popupState.isOpen}
        imageUrl={popupState.imageUrl}
        imageName={popupState.imageName}
        onClose={closePopup}
      />
    </div>
  );
};

export default ColmapCanvas;