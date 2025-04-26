import React, { useState, useEffect, useRef, use } from 'react';
import { Edit, UploadCloud, X, Image, Video, AlertTriangle, Plus } from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { RouterPath } from '../../../assets/dictionary/RouterPath';
import DataService from './UploadServices';

// Main App Component
function Upload(props) {
  // Fix: Ensure proper destructuring with default empty array for useOutletContext
  const {user} = useOutletContext();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadType, setUploadType] = useState('video'); // Default to video as images might be disabled
  const [totalVideoDuration, setTotalVideoDuration] = useState(0);
  const [isPro, setIsPro] = useState(false)
  const [maxVideoDuration, setMaxVideoDuration] = useState(0)
  const videoRefs = useRef({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const maxImagesCount = 400; // Maximum 400 images

  useEffect(() => {
    setIsPro(user?.is_pro ?? false);
    setMaxVideoDuration(user?.is_pro ? 5 * 60 : 3 * 60)
    
  }, [user]);
  // Update video duration when files are loaded
  useEffect(() => {
    if (uploadType === 'video') {
      calculateTotalVideoDuration();
    }
  }, [filePreviewUrls, uploadType]);

  // Calculate total video duration
  const calculateTotalVideoDuration = () => {
    // Reset duration when no videos
    if (selectedFiles.length === 0) {
      setTotalVideoDuration(0);
      return;
    }

    // Count loaded videos to know when we've processed all
    let loadedVideos = 0;
    let totalDuration = 0;

    // Function to update duration when all videos are loaded
    const updateDuration = (duration) => {
      totalDuration += duration;
      loadedVideos++;
      
      if (loadedVideos === selectedFiles.length) {
        setTotalVideoDuration(totalDuration);
        
        // Show error if exceeding limit
        if (totalDuration > maxVideoDuration) {
          setError(`Total video duration exceeds ${maxVideoDuration/60} minute${maxVideoDuration/60 !== 1 ? 's' : ''} limit (${(totalDuration/60).toFixed(1)} minutes). ${isPro ? '' : 'Upgrade to Pro for more time.'}`);
        } else {
          // Clear duration-related errors
          if (error && error.includes('duration')) {
            setError(null);
          }
        }
      }
    };

    // Process each video to get its duration
    Object.keys(videoRefs.current).forEach(key => {
      const video = videoRefs.current[key];
      if (video) {
        if (video.duration) {
          updateDuration(video.duration);
        } else {
          // If duration not available yet, add an event listener
          const handleLoadedMetadata = () => {
            updateDuration(video.duration);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          };
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
        }
      }
    });
  };

  // File selection handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
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
      
      // Check image count limit for total files (existing + new)
      if (selectedFiles.length + validFiles.length > maxImagesCount) {
        setError(`You can upload maximum ${maxImagesCount} images at once. You're trying to add ${validFiles.length} files to ${selectedFiles.length} existing files.`);
        return;
      }
    }
    
    if (validFiles.length === 0) return;
    
    // Create object URLs for previews for new files
    const newUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Combine with existing files and URLs
    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
    setFilePreviewUrls(prevUrls => [...prevUrls, ...newUrls]);
    
    // Set default title from first file name if no title set yet
    if (title === '' && validFiles.length > 0) {
      setTitle(validFiles[0].name.split('.')[0]); 
    }
    
    // Clear file type related errors when adding new files
    if (error && (error.includes('Only video files') || error.includes('Only image files'))) {
      setError(null);
    }
    
    // Reset the file input so the same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add more files handler
  const handleAddMoreFiles = () => {
    // Check if we can add more files based on constraints
    if (uploadType === 'video' && totalVideoDuration >= maxVideoDuration) {
      setError(`Cannot add more videos. Total duration already at maximum (${maxVideoDuration/60} minute${maxVideoDuration/60 !== 1 ? 's' : ''}).`);
      return;
    }
    
    if (uploadType === 'image' && selectedFiles.length >= maxImagesCount) {
      setError(`Cannot add more images. Already at maximum count (${maxImagesCount}).`);
      return;
    }
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Toggle upload type between video and image
  const toggleUploadType = (type) => {
    if (type !== uploadType && (type !== 'image' || isPro)) {
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
    
    // Check video duration limit before processing
    if (uploadType === 'video' && totalVideoDuration > maxVideoDuration) {
      setError(`Total video duration exceeds ${maxVideoDuration/60} minute${maxVideoDuration/60 !== 1 ? 's' : ''} limit (${(totalVideoDuration/60).toFixed(1)} minutes). ${isPro ? '' : 'Upgrade to Pro for more time.'}`);
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
          10 // Higher number of iterations for video processing
        );
      } else {
        // For image uploads, use the default iteration count
        response = await DataService.createSplatFromImages(
          title,
          selectedFiles,
          10 // Iterations suitable for image processing
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
    setTotalVideoDuration(0);
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

  // Format seconds as minutes:seconds
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1">
      <main className="p-6">
        <div>
          {/* Hidden file input for adding more files */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept={uploadType === 'video' ? "video/*" : "image/*"} 
            className="hidden" 
            onChange={handleFileSelect}
            multiple
          />
        
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
              className={`flex-1 p-4 rounded text-center flex items-center justify-center 
                ${uploadType === 'image' ? 'bg-sky-400 text-white' : 'bg-gray-200'}
                ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleUploadType('image')}
              disabled={!isPro}
            >
              <Image size={20} className="mr-2" />
              Images Upload
              {!isPro && <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-1 rounded">PRO</span>}
            </button>
          </div>
          
          {!isPro && uploadType === 'video' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Free accounts are limited to 3 minutes of total video duration. 
                    <Link 
                      className="ml-1 font-medium text-blue-700 underline"
                      to={RouterPath.SUBSCRIPTION}
                    >
                      Upgrade to Pro
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="cursor-pointer bg-sky-400 hover:bg-sky-500 text-white px-6 py-2 rounded"
                >
                  Select {uploadType === 'video' ? 'Videos' : 'Images'}
                </button>
              </div>
              
              <div className="mt-12 text-sm text-gray-500">
                {uploadType === 'video' ? (
                  <div className="flex justify-center items-center gap-4">
                    <span>Video upload:</span>
                    <span>Supported formats: mp4, mov</span>
                    <span>Video limit: {isPro ? '5' : '3'} minutes</span>
                  </div>
                ) : (
                  <div className="flex justify-center items-center gap-4">
                    <span>Photo upload:</span>
                    <span>Supported formats: jpg, png, jpeg</span>
                    <span>Photo limit: up to {maxImagesCount} photos</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{uploadType === 'video' ? 'Videos' : 'Images'} Preview ({selectedFiles.length}{uploadType === 'video' ? '' : '/'+ maxImagesCount} files)</h2>
                <div className="flex space-x-2">
                  {/* Add More Button */}
                  <button 
                    onClick={handleAddMoreFiles}
                    className={`flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm
                      ${((uploadType === 'video' && totalVideoDuration >= maxVideoDuration) || 
                         (uploadType === 'image' && selectedFiles.length >= maxImagesCount)) ? 
                        'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={(uploadType === 'video' && totalVideoDuration >= maxVideoDuration) || 
                             (uploadType === 'image' && selectedFiles.length >= maxImagesCount)}
                  >
                    <Plus size={16} className="mr-1" />
                    Add More
                  </button>
                  
                  {/* Clear Button */}
                  <button 
                    onClick={handleClearFiles}
                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                  >
                    <X size={16} className="mr-1" />
                    Clear All
                  </button>
                </div>
              </div>
              
              {uploadType === 'video' && (
                <div className="mb-4 text-sm">
                  <span className={`font-medium ${totalVideoDuration > maxVideoDuration ? 'text-red-600' : 'text-gray-700'}`}>
                    Total duration: {formatDuration(totalVideoDuration)} / {formatDuration(maxVideoDuration)}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {filePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {uploadType === 'video' ? (
                      <video 
                        ref={el => videoRefs.current[index] = el}
                        src={url} 
                        controls 
                        className="w-full h-40 bg-gray-100 rounded object-contain"
                        onLoadedMetadata={() => calculateTotalVideoDuration()}
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
                disabled={isProcessing || selectedFiles.length === 0 || (uploadType === 'video' && totalVideoDuration > maxVideoDuration)}
                className={`bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded ${(isProcessing || selectedFiles.length === 0 || (uploadType === 'video' && totalVideoDuration > maxVideoDuration)) ? 'opacity-50 cursor-not-allowed' : ''}`}
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