import React from 'react';

const ImagePopup = ({ isOpen, imageUrl, onClose, imageName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{imageName || 'Camera View'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <img 
          src={imageUrl} 
          alt={imageName || "Camera view"} 
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />
      </div>
    </div>
  );
};

export default ImagePopup;