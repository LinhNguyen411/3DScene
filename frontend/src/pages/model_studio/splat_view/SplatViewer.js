// components/SplatViewer.js
import { Splat} from '@react-three/drei';

function SplatViewer({ splatUrl, ...props }) {
  return (
    <>
      {splatUrl && (
        <Splat 
          {...props}
          src={splatUrl} 
          chunkSize={1000}
          toneMapped={false} 
          alphaHash={false}
          alphaTest={0}
          opacity={0}
          transparent={true}
        />
      )}

    </>
  );
}

export default SplatViewer;
