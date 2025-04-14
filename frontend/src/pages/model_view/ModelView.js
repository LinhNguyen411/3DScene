import { useState, useEffect } from 'react';
import SplatCanvas from './SplatCanvas';
import { processPlyBuffer } from './plyConverter';
import { ChevronLeft, Share, Download, MoreHorizontal } from 'lucide-react';
import { useNavigate , useSearchParams} from "react-router-dom";
import myAppConfig from '../../config';
import DataService from './ModelViewService';

export default function ModelView() {
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

  const plyUrl =  myAppConfig.api.ENDPOINT + "/api/v1/splats/" + id + "/download";
  console.log(plyUrl)


  const [splatUrl, setSplatUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    const fetchAndProcess = async () => {
      try {
        const response = await DataService.getModel(id);
        if (!response || response.status !== 200) {
            throw new Error(`Failed to fetch .ply file: ${response?.statusText}`);
          }
    
        const arrayBuffer = await response.data.arrayBuffer(); // 👈 `.data` is needed here with axios response
        console.log("ArrayBuffer:", arrayBuffer);
        console.log(arrayBuffer)
        const splatBuffer = processPlyBuffer(arrayBuffer);
        const blob = new Blob([splatBuffer], { type: 'application/octet-stream' });
        objectUrl = URL.createObjectURL(blob);
        setSplatUrl(objectUrl);
      } catch (error) {
        console.error('Error processing .ply file:', error);
      }
    };

    fetchAndProcess();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [plyUrl]);


  return (
        <div className='h-screen flex flex-col'>
            <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center">
            <button className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-300 mr-4" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} />
            </button>
            <span className="text-gray-700 font-medium">Details</span>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-3">
            <button className="flex items-center text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">
            <Share size={16} className="mr-2" />
            <span>Share</span>
            </button>
            
            <button className="flex items-center text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">
            <Download size={16} className="mr-2" />
            <span>Download</span>
            </button>
            
            <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
            Go Pro
            </button>
            
        </div>
        </nav>
        <div className='flex-1'>
            <SplatCanvas  splatUrl={splatUrl} />   
        </div>
    </div>
  );
}
