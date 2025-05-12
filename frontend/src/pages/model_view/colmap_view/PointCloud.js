import * as THREE from "three";
import { useEffect, useState } from "react";
import { Points } from "@react-three/drei";

const PointCloud = ({ points }) => {
  const [pointData, setPointData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = points.map((item) => {
          const [x, y, z] = item.xyz;
          const [r, g, b] = item.rgb;
          const point = new THREE.Vector3(x, y, z); // flip Y and Z as before
          const color = new THREE.Color(r, g, b); // already normalized [0,1]

          return { point, color };
      });

      const positions = new Float32Array(data.flatMap((d) => d.point.toArray()));
      const colors = new Float32Array(data.flatMap((d) => d.color.toArray()));

      setPointData({ positions, colors });
      };

    fetchData();
  }, [points]);

  return (
    <>
      {pointData && (
        <Points positions={pointData.positions} colors={pointData.colors} >
          <pointsMaterial vertexColors size={2} sizeAttenuation={false} />
        </Points>
      )}
    </>
  );
};

export default PointCloud;