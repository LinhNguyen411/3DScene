import React, { useState, useEffect, useRef, use } from 'react';
import { Edit, UploadCloud, X, Image, Video, AlertTriangle, Plus } from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { RouterPath } from '../../../assets/dictionary/RouterPath';
import DataService from './UploadServices';
import { useLoader } from '../../../provider/LoaderProvider';

// Main App Component
function Upload(props) {
  const { showLoader, hideLoader } = useLoader()
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
  const [isDragging, setIsDragging] = useState(false);
  const videoRefs = useRef({});
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
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

  // Improved file type validation
  const isVideoFile = (file) => {
    // Check if the file type starts with 'video/'
    if (file.type.startsWith('video/')) {
      return true;
    }
    
    // Fallback for MOV files which might not be correctly identified by some browsers
    const extension = file.name.split('.').pop().toLowerCase();
    return ['mov', 'mp4', 'avi'].includes(extension);
  };

  const isImageFile = (file) => {
    return file.type.startsWith('image/');
  };

  // File selection handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    processFiles(files);
  };

  // Process files (common function for both input and drag-and-drop)
  const processFiles = (files) => {
    if (files.length === 0) return;
    
    // Validate file types based on upload type
    let validFiles = [];
    if (uploadType === 'video') {
      validFiles = files.filter(file => isVideoFile(file));
      if (validFiles.length !== files.length) {
        setError('Only video files are allowed in video mode.');
      }
    } else { // image mode
      validFiles = files.filter(file => isImageFile(file));
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

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop area
    // and not entering a child element
    if (e.currentTarget === dropAreaRef.current) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
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
      showLoader()
      let response;
      if (uploadType === 'video') {
        // For video uploads, we'll use a higher default iteration count
        response = await DataService.createSplatFromVideos(
          title,
          selectedFiles,
          10000 // Higher number of iterations for video processing
        );
      } else {
        // For image uploads, use the default iteration count
        response = await DataService.createSplatFromImages(
          title,
          selectedFiles,
          10000 // Iterations suitable for image processing
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
      console.error(`Error processing ${uploadType}s:`, error.response?.data || error.message);
      setError(error.message || `Failed to process ${uploadType}s. Please try again.`);
    } finally {
      setIsProcessing(false);
      hideLoader();
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
    <div className="flex-1 min-h-screen">
      <main className="p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hidden file input for adding more files */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept={uploadType === 'video' ? "video/*, .mp4, .mov, .MOV" : "image/*"} 
            className="hidden" 
            onChange={handleFileSelect}
            multiple
          />
        
          {/* Upload Type Selector */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button 
              className={`flex-1 p-3 sm:p-4 rounded text-center flex items-center justify-center text-sm sm:text-base ${uploadType === 'video' ? 'bg-sky-400 text-white' : 'bg-gray-200'}`}
              onClick={() => toggleUploadType('video')}
            >
              <Video size={16} className="mr-2 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Videos Upload</span>
            </button>
            <button 
              className={`flex-1 p-3 sm:p-4 rounded text-center flex items-center justify-center text-sm sm:text-base
                ${uploadType === 'image' ? 'bg-sky-400 text-white' : 'bg-gray-200'}
                ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleUploadType('image')}
              disabled={!isPro}
            >
              <Image size={16} className="mr-2 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Images Upload</span>
              {!isPro && <span className="ml-1 sm:ml-2 text-xs bg-yellow-400 text-black px-1 sm:px-2 py-1 rounded flex-shrink-0">PRO</span>}
            </button>
          </div>
          
          {!isPro && uploadType === 'video' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm text-blue-700">
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
            <div 
              ref={dropAreaRef}
              className={`border-2 border-dashed ${isDragging ? 'border-sky-400 bg-sky-50' : 'border-gray-300'} rounded-lg p-6 sm:p-8 md:p-12 text-center`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center">
                <div className={`${isDragging ? 'bg-sky-100' : 'bg-gray-100'} p-3 sm:p-4 rounded-full mb-3 sm:mb-4`}>
                  <UploadCloud size={32} className={`sm:w-12 sm:h-12 ${isDragging ? 'text-sky-500' : 'text-gray-400'}`} />
                </div>
                <p className="text-base sm:text-lg font-medium mb-2 px-2">
                  {isDragging 
                    ? `Drop your ${uploadType} file(s) here` 
                    : `Click to upload or drag ${uploadType} file(s) into this area`}
                </p>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-2 text-center">
                  Photogrammetry for professional 3D model quality,<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>works for featureful objects or scenes
                </p>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="cursor-pointer bg-sky-400 hover:bg-sky-500 text-white px-4 sm:px-6 py-2 rounded text-sm sm:text-base"
                >
                  Select {uploadType === 'video' ? 'Videos' : 'Images'}
                </button>
              </div>
              
              <div className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-500">
                {uploadType === 'video' ? (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                    <span className="font-medium">Video upload:</span>
                    <span>mp4, mov</span>
                    <span>{isPro ? '5' : '3'} min limit</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                    <span className="font-medium">Photo upload:</span>
                    <span>jpg, png, jpeg</span>
                    <span>up to {maxImagesCount} photos</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <h2 className="text-lg sm:text-xl font-bold">
                  {uploadType === 'video' ? 'Videos' : 'Images'} Preview 
                  <span className="text-base sm:text-lg font-normal text-gray-600">
                    ({selectedFiles.length}{uploadType === 'video' ? '' : '/'+ maxImagesCount} files)
                  </span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Add More Button */}
                  <button 
                    onClick={handleAddMoreFiles}
                    className={`flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm
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
                    className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm"
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {filePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {uploadType === 'video' ? (
                      <video 
                        ref={el => videoRefs.current[index] = el}
                        src={url} 
                        controls 
                        className="w-full h-32 sm:h-40 bg-gray-100 rounded object-contain"
                        onLoadedMetadata={() => calculateTotalVideoDuration()}
                      />
                    ) : (
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 sm:h-40 bg-gray-100 rounded object-contain" 
                      />
                    )}
                    <button 
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 gap-2">
                <div className="text-gray-700 font-medium">Title:</div>
                <div className="flex items-center flex-1">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      className="border border-gray-300 rounded px-2 py-1 mr-2 flex-1 text-sm sm:text-base"
                      autoFocus
                      placeholder="Enter model title..."
                    />
                  ) : (
                    <h3 className="font-medium mr-2 flex-1 text-sm sm:text-base break-words">{title}</h3>
                  )}
                  <button 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleProcessFiles}
                  disabled={isProcessing || selectedFiles.length === 0 || (uploadType === 'video' && totalVideoDuration > maxVideoDuration)}
                  className={`bg-sky-500 hover:bg-sky-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded text-sm sm:text-base font-medium ${(isProcessing || selectedFiles.length === 0 || (uploadType === 'video' && totalVideoDuration > maxVideoDuration)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? 'Processing...' : `Process ${selectedFiles.length} ${uploadType}${selectedFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-xs sm:text-sm mt-4">
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