import React, { createContext, useContext, useState } from 'react';

// Create a context for the loader
const LoaderContext = createContext({
  isLoading: false,
  showLoader: () => {},
  hideLoader: () => {}
});

// Custom hook to use the loader context
export const useLoader = () => useContext(LoaderContext);

// Loader component with animation
const LoaderOverlay = () => {
  const [dots, setDots] = useState('');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prevDots => {
        if (prevDots.length >= 3) return '';
        return prevDots + '.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="flex flex-col items-center justify-center">
        <div className="spinner mb-4">
          <div className="face1"></div>
          <div className="face2"></div>
          <div className="face3"></div>
          <div className="face4"></div>
          <div className="face5"></div>
          <div className="face6"></div>
        </div>
        
        <div className="mt-2 text-white text-lg font-medium flex">
          <span>Loading</span>
          <span className="inline-block text-left">{dots}</span>
        </div>
      </div>
      
      <style jsx>{`
        .spinner {
          width: 44px;
          height: 44px;
          animation: spinner 2s infinite ease;
          transform-style: preserve-3d;
        }
        
        .spinner > div {
          background-color: rgba(14, 165, 233, 0.2); /* sky-500 with opacity */
          height: 100%;
          position: absolute;
          width: 100%;
          border: 2px solid rgb(14, 165, 233); /* sky-500 */
        }
        
        .face1 {
          transform: translateZ(-22px) rotateY(180deg);
        }
        
        .face2 {
          transform: rotateY(-270deg) translateX(50%);
          transform-origin: top right;
        }
        
        .face3 {
          transform: rotateY(270deg) translateX(-50%);
          transform-origin: center left;
        }
        
        .face4 {
          transform: rotateX(90deg) translateY(-50%);
          transform-origin: top center;
        }
        
        .face5 {
          transform: rotateX(-90deg) translateY(50%);
          transform-origin: bottom center;
        }
        
        .face6 {
          transform: translateZ(22px);
        }
        
        @keyframes spinner {
          0% {
            transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
          }
          50% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
          }
          100% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
          }
        }
      `}</style>
    </div>
  );
};

// Provider component
export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);
  
  return (
    <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      {isLoading && <LoaderOverlay />}
    </LoaderContext.Provider>
  );
};

export default LoaderProvider;