import { useState, useEffect, use } from 'react';
import SplatCanvas from './SplatCanvas';
import { ChevronLeft, Share, Download, Loader } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams, Link } from "react-router-dom";
import DataService from './ModelViewService';
import { useLoader } from '../../provider/LoaderProvider';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { RouterPath } from '../../assets/dictionary/RouterPath';

export default function ModelView() {
    const { showSnackbar } = useSnackbar();
    const { showLoader, hideLoader } = useLoader();
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const viewer = searchParams.get('viewer');
    const [splatUrl, setSplatUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [model, setModel] = useState(null);
    const [currenUser, setCurrentUser] = useState(null)
    
    
    // Create a unique key for each model to reset Leva controls
    const canvasKey = `model-${id}`;

    const handleExportSplat = async () => {
        try {
          setLoading(true);
          await DataService.downloadSplat(model.id, model.title);
          setIsExportModalOpen(false);
          showSnackbar("Exported .splat file successfully!", "success");
        } catch (error) {
          console.error("Error exporting .splat:", error);
          showSnackbar("Failed to export .splat file", "error");
        }
        finally{
          setLoading(false);
        }
      };
    
      const handleExportPLY = async () => {
        try {
          setLoading(true);
          await DataService.downloadPLY(model.id, model.title);
          setIsExportModalOpen(false);
          showSnackbar("Exported .ply file successfully!", "success");
        } catch (error) {
          console.error("Error exporting .ply:", error);
          showSnackbar("Failed to export .ply file", "error");
        }
        finally{
          setLoading(false);
        }
      };

    useEffect(() => {
        let objectUrl;
        const fetchAndProcess = async () => {
            try {
                showLoader();
                const user = await DataService.getAuth(viewer)
                setCurrentUser(user);
                const splat = await DataService.getSplat(id,viewer);
                setModel(splat);
                const response = await DataService.getModel(id,viewer);
                if (!response || response.status !== 200) {
                    throw new Error(`Failed to fetch .ply file: ${response?.statusText}`);
                }
                const arrayBuffer = await response.data.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                objectUrl = URL.createObjectURL(blob);
                setSplatUrl(objectUrl);
                hideLoader();
            } catch (error) {
                hideLoader();
                console.error('Error processing .ply file:', error);
            }
        };

        fetchAndProcess();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

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
                    
                    {currenUser ? (
                        <button onClick={()=>setIsExportModalOpen(true)} className="flex items-center text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">
                            <Download size={16} className="mr-2" />
                            <span>Download</span>
                        </button>

                    ) : (
                        <Link to={RouterPath.LOGIN} className="flex items-center text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">
                            <span>Login to Download</span>
                        </Link>
                    )}
                    {currenUser?.is_pro && (
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                            Go Pro
                        </button>
                    )}
                </div>
            </nav>
            <div className='flex-1'>
                {/* Add key to force SplatCanvas to fully remount when the model changes */}
                <SplatCanvas key={canvasKey} splatUrl={splatUrl} />
            </div>
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Export</h3>
                    <button onClick={() => setIsExportModalOpen(false)} className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                {loading ? (
                    <div className='flex items-center justify-center'>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    <div>Downloading...</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                    <button
                        className="w-full py-3 bg-sky-500 text-white rounded-md font-medium"
                        onClick={handleExportSplat}
                    >
                        Export as .splat
                    </button>
            
                    {currenUser?.is_pro ? (
                        <button
                        className="w-full py-3 bg-sky-500 text-white rounded-md font-medium"
                        onClick={handleExportPLY}
                        >
                        Export as .ply
                        </button>
                    ) : (
                        <Link to={RouterPath.SUBSCRIPTION}
                        className="w-full py-3 bg-gray-200 text-gray-500 rounded-md font-medium flex items-center justify-center gap-2"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6v2a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2v-5a2 2 0 00-2-2V8a6 6 0 00-6-6zM8 8a2 2 0 114 0v2H8V8z" />
                        </svg>
                        <span>Unlock .ply export – Upgrade to Pro</span>
                        </Link>
                    )}
                    </div>
                )}
                </div>
            </div>
            )}
        </div>
    );
}