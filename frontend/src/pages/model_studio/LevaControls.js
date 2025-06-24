import { useMemo, useCallback, useRef } from 'react';
import { useControls, button } from 'leva';


export const usePositionControls = (
    defaultPosition = { x: 0, y: 0, z: 0 },
    collapsed = false
) => {
    const [position, set] = useControls(
        'Position',
        () => ({
            x: { value: defaultPosition.x, min: -5, max: 5, step: 0.1 },
            y: { value: defaultPosition.y, min: -5, max: 5, step: 0.1 },
            z: { value: defaultPosition.z, min: -5, max: 5, step: 0.1 },
            reset: button(() => {
                set({ ...defaultPosition });
            }),
        }),
        { collapsed }
    );

    return [position, set];
};

// Rotation controls
export const useRotationControls = (
    defaultRotation = { x: 0, y: 0, z: 0 , scale:1},
    collapsed = false) => {
    const [rotation, set] = useControls(
        'Rotation',
        () => ({
            x: { value: defaultRotation.x, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            y: { value: defaultRotation.y, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            z: { value: defaultRotation.z, min: Math.PI * -2, max: Math.PI * 2, step: 0.01 },
            scale: { value: defaultRotation.scale, min: 0.1, max: 100, step: 0.1 },
            reset: button(() => {
                set({ ...defaultRotation });
            }),
        }),
        { collapsed }
    );

    return [rotation, set];
};

// Camera controls
export const useCameraControls = (onResetView = null, logCameraInfo = null, onSaveView = null) => {
    const [camera, set] = useControls(
        'Camera',
        () => ({
            mode: { value: 'Orbit', options: ['Orbit', 'Fly'] },
            fov: { value: 50, min: 10, max: 120, step: 0.1 },
            resetView: button(() => {
                if (onResetView) onResetView();
                set({mode: 'Orbit', fov:50});
            }),
            logCamera: button(() => {
                if (logCameraInfo) logCameraInfo();
            }),
            saveView: button(() => {
                if (onSaveView) onSaveView();
            }),
        }),
        { onResetView, onSaveView }
    );

    return [camera, set];
};

// Grid controls
export const useGridControls = (defaultGrid = true) => {
    const [grid, set] = useControls(
        'Grid',
        () => ({
            visible: { value: defaultGrid, label: 'Show Grid' },
        }),
        { defaultGrid }
    );

    return [grid, set];

};

// Fly controls
export const useFlyControls = (
    defaultFly = { movementSpeed: 2, lookSpeed: 0.05},
    collapsed = false) => {

    const [fly, set] = useControls(
        'Fly',
        () => ({
            movementSpeed: { value: defaultFly.movementSpeed, min: 0.1, max: 10, step: 0.1 },
            lookSpeed: { value: defaultFly.lookSpeed, min: 0.01, max: 0.2, step: 0.01 },
            reset: button(() => {
                set({ ...defaultFly });
            }),
        }),
        { collapsed }
    );

    return [fly, set];

};