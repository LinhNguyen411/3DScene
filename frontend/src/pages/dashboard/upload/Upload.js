import React, { useState, useEffect } from 'react';
import { Edit, UploadCloud, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouterPath } from '../../../assets/dictionary/RouterPath';
import DataService from './UploadServices';

// Main App Component
function Upload(props){
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // File selection handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setTitle(file.name.split('.')[0]); // Set initial title to filename without extension
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  // Process video handler
  const handleProcessVideo = async () => {
    setIsProcessing(true);
    try {
      const response = await DataService.createSplat(
        title,          // Title from state
        selectedFile,   // The selected video file
        1000             // Number of iterations (keeping default as in your DataService example)
      );
      

      setSelectedFile(null);
      setVideoUrl('');
      setTitle('');
      navigate(RouterPath.DASHBOARD_MY_MODEL);
    } catch (error) {
      console.error('Error processing video:', error);
      setError(error.message || 'Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setVideoUrl('');
    setTitle('');
  };
  return (

    <div className="flex-1">
      <main className="p-6">
          <div>
            <div className="flex space-x-4 mb-6">
              <button className="flex-1 bg-sky-400 text-white p-4 rounded text-center">
                Photo Mode
              </button>
              <button className="flex-1 bg-gray-200 text-gray-800 p-4 rounded text-center">
                Featureless Object Mode
              </button>
              <button className="flex-1 bg-gray-200 text-gray-800 p-4 rounded text-center">
                3DGS (with Mesh)
              </button>
            </div>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <UploadCloud size={48} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">Click to upload or drag file(s) into this area</p>
                  <p className="text-gray-500 mb-6">
                    Photogrammetry for professional 3D model quality,<br />
                    works for featureful objects or scenes
                  </p>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    id="video-upload" 
                    onChange={handleFileSelect}
                  />
                  <label 
                    htmlFor="video-upload"
                    className="cursor-pointer bg-sky-400 hover:bg-sky-500 text-white px-6 py-2 rounded"
                  >
                    Select Video
                  </label>
                </div>
                
                <div className="mt-12 text-sm text-gray-500">
                  <div className="flex justify-center items-center gap-4 mb-2">
                    <span>Photo upload:</span>
                    <span>Supported formats: jpg, png, jpeg</span>
                    <span>Photo limit: 20-100 photos(Basic)/20-300 photos(Pro)</span>
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <span>Video upload:</span>
                    <span>Supported formats: mp4, mov</span>
                    <span>Video limit: 1 minute(Basic)/3 minutes (Pro)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Video Preview</h2>
                  <button 
                    onClick={handleClearFile}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-64 bg-gray-100 rounded mb-4 object-contain"
                />
                
                <div className="flex items-center mb-6">
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
                  onClick={handleProcessVideo}
                  disabled={isProcessing}
                  className={`bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? 'Processing...' : 'Process Video'}
                </button>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
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