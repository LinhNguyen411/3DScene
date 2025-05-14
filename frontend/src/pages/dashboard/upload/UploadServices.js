import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/splats";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const createSplatFromVideos = async (title, files, num_iterations = 10) => {
  const formData = new FormData();
  
  // Append all video files
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  
  formData.append('title', title);
  formData.append('num_iterations', num_iterations);
  
  try {
    const response = await axios.post(
      API_BASE_URL,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating splat from videos:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create splat from videos');
  }
};

const createSplatFromImages = async (title, files, num_iterations = 10) => {
  const formData = new FormData();
  
  // Append all image files
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  
  formData.append('title', title);
  formData.append('num_iterations', num_iterations);
  
  try {
    const response = await axios.post(
      API_BASE_URL,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating splat from images:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to create splat from images');
  }
};

const DataService = {
  createSplatFromVideos,
  createSplatFromImages
};

export default DataService;