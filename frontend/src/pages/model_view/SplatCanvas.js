import { Canvas} from '@react-three/fiber';
import { StatsGl, Loader, Grid, OrbitControls, FirstPersonControls } from '@react-three/drei';
import { useMemo} from 'react'
import { useControls } from 'leva'
import SplatViewer from './SplatViewer';

function SplatCanvas({ splatUrl }) {
    const rotateOptions = useMemo(() => {
      return {
          x: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
          y: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
          z: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
          scale: { value: 1, min: 0.1, max: 100, step: 0.1 },
      }
    }, [])

    const positionOptions = useMemo(() => {
        return {
            x: { value: 0, min: -5, max: 5, step: 0.1 },
            y: { value: 0, min: -5, max: 5, step: 0.1 },
            z: { value: 0, min: -5, max: 5, step: 0.1 },
        }
    }, [])

    const cameraOptions = useMemo(() => {
        return {
            mode: { value: 'Orbit', options: ['Orbit', 'Fly'] },
        }
    }, [])

    const gridOptions = useMemo(() => {
        return {
            visible: { value: true, label: 'Show Grid' },
        }
    }, [])

    // Add fly mode specific controls
    const flyControlsOptions = useMemo(() => {
        return {
            movementSpeed: { value: 2, min: 0.1, max: 10, step: 0.1 },
            lookSpeed: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 }
        }
    }, [])

    const position = useControls('Position', positionOptions)
    const rotate = useControls('Rotate', rotateOptions)
    const camera = useControls('Camera', cameraOptions)
    const grid = useControls('Grid', gridOptions)
    
    // Only show fly controls when in Fly mode
    const flyControls = useControls(
        'Fly Controls', 
        flyControlsOptions, 
        { collapsed: true, enabled: camera.mode === 'Fly' }
    )

    const Controls = useMemo(() => {
        if (camera.mode === 'Orbit') {
            return (
                <OrbitControls
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

    const GridHelper = useMemo(() => {
        return grid.visible ? <Grid infiniteGrid={true} /> : null;
    }, [grid.visible]);
    
    return (
        <>
            <Canvas  camera={{ position: [0, 0, 2] }}>
                <StatsGl trackGPU={true} className="stats absolute bottom-[60px]"/>
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