import React, { useState, useEffect } from 'react';
import { Edit, UploadCloud, X, Image, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouterPath } from '../../../assets/dictionary/RouterPath';
import DataService from './UploadServices';

// Main App Component
function Upload(props) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadType, setUploadType] = useState('video'); // 'video' or 'image'
  const navigate = useNavigate();

  // File selection handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types based on upload type
    let validFiles = [];
    if (uploadType === 'video') {
      validFiles = files.filter(file => file.type.startsWith('video/'));
      if (validFiles.length !== files.length) {
        setError('Only video files are allowed in video mode.');
      }
    } else { // image mode
      validFiles = files.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== files.length) {
        setError('Only image files are allowed in image mode.');
      }
    }
    
    if (validFiles.length === 0) return;
    
    setSelectedFiles(validFiles);
    
    // Create object URLs for previews
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setFilePreviewUrls(urls);
    
    // Set default title from first file name
    if (validFiles.length > 0 && title === '') {
      setTitle(validFiles[0].name.split('.')[0]); 
    }
    
    // Clear any previous errors
    setError(null);
  };

  // Toggle upload type between video and image
  const toggleUploadType = (type) => {
    if (type !== uploadType) {
      // Clear files when changing type
      handleClearFiles();
      setUploadType(type);
    }
  };

  // Process files handler
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    if (!title || title.trim() === '') {
      setError('Please provide a title for your model');
      return;
    }
    
    setIsProcessing(true);
    try {
      let response;
      if (uploadType === 'video') {
        // For video uploads, we'll use a higher default iteration count
        response = await DataService.createSplatFromVideos(
          title,
          selectedFiles,
          7000 // Higher number of iterations for video processing
        );
      } else {
        // For image uploads, use the default iteration count
        response = await DataService.createSplatFromImages(
          title,
          selectedFiles,
          7000 // Iterations suitable for image processing
        );
      }

      // Reset form state
      setSelectedFiles([]);
      setFilePreviewUrls([]);
      setTitle('');
      setError(null);
      
      // Navigate to the dashboard
      navigate(RouterPath.DASHBOARD_MY_MODEL);
    } catch (error) {
      console.error(`Error processing ${uploadType}s:`, error);
      setError(error.message || `Failed to process ${uploadType}s. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear selected files
  const handleClearFiles = () => {
    // Clean up object URLs to prevent memory leaks
    filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setSelectedFiles([]);
    setFilePreviewUrls([]);
    setTitle('');
    setError(null);
  };
  
  // Remove a specific file from selection
  const handleRemoveFile = (index) => {
    URL.revokeObjectURL(filePreviewUrls[index]);
    
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    
    const updatedUrls = [...filePreviewUrls];
    updatedUrls.splice(index, 1);
    
    setSelectedFiles(updatedFiles);
    setFilePreviewUrls(updatedUrls);
    
    if (updatedFiles.length === 0) {
      setTitle('');
    }
  };
  
  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="flex-1">
      <main className="p-6">
        <div>
          {/* Upload Type Selector */}
          <div className="flex space-x-4 mb-6">
            <button 
              className={`flex-1 p-4 rounded text-center flex items-center justify-center ${uploadType === 'video' ? 'bg-sky-400 text-white' : 'bg-gray-200'}`}
              onClick={() => toggleUploadType('video')}
            >
              <Video size={20} className="mr-2" />
              Videos Upload
            </button>
            <button 
              className={`flex-1 p-4 rounded text-center flex items-center justify-center ${uploadType === 'image' ? 'bg-sky-400 text-white' : 'bg-gray-200'}`}
              onClick={() => toggleUploadType('image')}
            >
              <Image size={20} className="mr-2" />
              Images Upload
            </button>
          </div>
          
          {selectedFiles.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <UploadCloud size={48} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">Click to upload or drag {uploadType} file(s) into this area</p>
                <p className="text-gray-500 mb-6">
                  Photogrammetry for professional 3D model quality,<br />
                  works for featureful objects or scenes
                </p>
                <input 
                  type="file" 
                  accept={uploadType === 'video' ? "video/*" : "image/*"} 
                  className="hidden" 
                  id="file-upload" 
                  onChange={handleFileSelect}
                  multiple
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer bg-sky-400 hover:bg-sky-500 text-white px-6 py-2 rounded"
                >
                  Select {uploadType === 'video' ? 'Videos' : 'Images'}
                </label>
              </div>
              
              <div className="mt-12 text-sm text-gray-500">
                {uploadType === 'video' ? (
                  <div className="flex justify-center items-center gap-4">
                    <span>Video upload:</span>
                    <span>Supported formats: mp4, mov</span>
                    <span>Video limit: 10 minute(Basic)/30 minutes (Pro)</span>
                  </div>
                ) : (
                  <div className="flex justify-center items-center gap-4">
                    <span>Photo upload:</span>
                    <span>Supported formats: jpg, png, jpeg</span>
                    <span>Photo limit: 20-100 photos(Basic)/20-300 photos(Pro)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{uploadType === 'video' ? 'Video' : 'Image'} Preview ({selectedFiles.length} files)</h2>
                <button 
                  onClick={handleClearFiles}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {filePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {uploadType === 'video' ? (
                      <video 
                        src={url} 
                        controls 
                        className="w-full h-40 bg-gray-100 rounded object-contain"
                      />
                    ) : (
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 bg-gray-100 rounded object-contain" 
                      />
                    )}
                    <button 
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center mb-6">
                <div className="text-gray-700 mr-2">Title:</div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    className="border border-gray-300 rounded px-2 py-1 mr-2"
                    autoFocus
                  />
                ) : (
                  <h3 className="font-medium mr-2">{title}</h3>
                )}
                <button 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit size={16} />
                </button>
              </div>
              
              <button 
                onClick={handleProcessFiles}
                disabled={isProcessing || selectedFiles.length === 0}
                className={`bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded ${isProcessing || selectedFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing...' : `Process ${selectedFiles.length} ${uploadType}${selectedFiles.length !== 1 ? 's' : ''}`}
              </button>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm mt-4">
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Upload;