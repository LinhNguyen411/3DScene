import { useMemo, useCallback } from 'react';
import { useControls, button } from 'leva';

// Position controls
export const usePositionControls = (collapsed = false) => {
    const positionOptions = useMemo(() => {
        return {
            x: { value: 0, min: -5, max: 5, step: 0.1 },
            y: { value: 0, min: -5, max: 5, step: 0.1 },
            z: { value: 0, min: -5, max: 5, step: 0.1 },
        };
    }, []);

    return useControls('Position', positionOptions, { collapsed });
};

// Rotation controls
export const useRotationControls = (collapsed = false) => {
    const rotateOptions = useMemo(() => {
        return {
            x: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            y: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            z: { value: 0, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            scale: { value: 1, min: 0.1, max: 100, step: 0.1 },
        };
    }, []);

    return useControls('Rotate', rotateOptions, { collapsed });
};

// Camera controls
export const useCameraControls = (onResetView = null) => {
    const cameraOptions = useMemo(() => {
        return {
            mode: { value: 'Orbit', options: ['Orbit', 'Fly'] },
            fov: { value: 50, min: 10, max: 120, step: 0.1 },
            resetView: button(() => {
                if (onResetView) onResetView();
            }),
        };
    }, [onResetView]);

    return useControls('Camera', cameraOptions);
};

// Grid controls
export const useGridControls = () => {
    const gridOptions = useMemo(() => {
        return {
            visible: { value: true, label: 'Show Grid' },
        };
    }, []);

    return useControls('Grid', gridOptions);
};

// Fly controls
export const useFlyControls = (enabled = false) => {
    const flyControlsOptions = useMemo(() => {
        return {
            movementSpeed: { value: 2, min: 0.1, max: 10, step: 0.1 },
            lookSpeed: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
        };
    }, []);

    return useControls(
        'Fly Controls',
        flyControlsOptions,
        { collapsed: true, enabled }
    );
};