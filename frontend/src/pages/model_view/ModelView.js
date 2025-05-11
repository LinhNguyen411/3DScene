import { useState, useEffect } from 'react';
import SplatCanvas from './splat_view/SplatCanvas';
import { ChevronLeft, Share, Download, Loader, Copy, Info, EyeIcon, Grid3X3 } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams, Link } from "react-router-dom";
import DataService from './ModelViewService';
import { useLoader } from '../../provider/LoaderProvider';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import myAppConfig from '../../config';
import LinkNotValid from "../link_not_valid/LinkNotValid";
import SideBar from '../../components/app_comps/SideBar';
import NavBarTop from '../../components/app_comps/NavBarTop';
import ColmapCanvas from './colmap_view/ColmapCanvas';

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
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [model, setModel] = useState(null);
    const [currenUser, setCurrentUser] = useState(null);
    const [modelNotFound, setModelNotFound] = useState(false);
    const [colmapData, setColmapData] = useState(null);
    const [viewMode, setViewMode] = useState('colmap'); // 'colmap' or 'splat'
    
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

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => {
                showSnackbar("Link copied to clipboard!", "success");
            })
            .catch((error) => {
                console.error("Error copying link:", error);
                showSnackbar("Failed to copy link", "error");
            });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatFileSize = (size) => {
        if (size < 1) return `${(size * 1000).toFixed(2)} KB`;
        return `${size.toFixed(2)} MB`;
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'colmap' ? 'splat' : 'colmap');
    };

    let objectUrl;
    const fetchAndProcess = async () => {
        try {
            showLoader();
            const user = await DataService.getAuth(viewer);
            setCurrentUser(user);
            
            try {
                const splat = await DataService.getSplat(id, viewer);
                if (!splat) {
                    setModelNotFound(true);
                    hideLoader();
                    return;
                }
                setModel(splat);
            } catch (error) {
                console.error('Error fetching splat data:', error);
                setModelNotFound(true);
                hideLoader();
                return;
            }
            
            try {
                const colmap = await DataService.getColmapData(id, viewer);
                if (!colmap) {
                    setModelNotFound(true);
                    hideLoader();
                    return;
                }
                console.log('colmap data:', colmap.images);
                setColmapData(colmap);
            } catch (error) {
                console.error('Error fetching colmap data:', error);
                setModelNotFound(true);
                hideLoader();
                return;
            }
            
            try {
                const response = await DataService.getModel(id, viewer);
                if (!response || response.status !== 200) {
                    throw new Error(`Failed to fetch .ply file: ${response?.statusText}`);
                }
                const arrayBuffer = await response.data.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                objectUrl = URL.createObjectURL(blob);
                setSplatUrl(objectUrl);
            } catch (error) {
                console.error('Error processing .ply file:', error);
                setModelNotFound(true);
            }
            
            hideLoader();
        } catch (error) {
            console.error('Error in fetchAndProcess:', error);
            setModelNotFound(true);
            hideLoader();
        }
    };

    useEffect(() => {
        fetchAndProcess();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    // If model not found, display LinkNotValid component
    if (modelNotFound) {
        return (
            <>
                <LinkNotValid />
            </>
        )
    }

    const isDarkMode = viewMode === 'colmap';

    return (
        <div className='h-screen flex flex-col'>
            <nav className={`${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border-b px-4 py-2 flex items-center justify-between`}>
                {/* Left section */}
                <div className="flex items-center">
                    <button className={`h-8 w-8 flex items-center justify-center rounded-full ${isDarkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-700'} border mr-4`} onClick={() => navigate(-1)}>
                        <ChevronLeft size={16} /> 
                    </button>
                </div>
                
                {/* Center section - View Toggle */}
                <div className="flex items-center">
                    <div className={`flex items-center p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <button 
                            onClick={() => setViewMode('colmap')} 
                            className={`flex items-center px-4 py-1.5 rounded-md ${viewMode === 'colmap' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`}
                        >
                            <Grid3X3 size={16} className="mr-2" />
                            <span>Colmap</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('splat')} 
                            className={`flex items-center px-4 py-1.5 rounded-md ${viewMode === 'splat' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`}
                        >
                            <EyeIcon size={16} className="mr-2" />
                            <span>Splat</span>
                        </button>
                    </div>
                </div>
                
                {/* Right section */}
                <div className="flex items-center space-x-3">
                     <button 
                        className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}                        
                        onClick={() => {
                            setIsShareModalOpen(false);
                            setIsDetailModalOpen(true);
                        }}
                    >
                        <Info size={16} className="mr-2" />
                        <span>View Details</span>
                    </button>
                    <button 
                        className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        onClick={() => setIsShareModalOpen(true)}
                    >
                        <Share size={16} className="mr-2" />
                        <span>Share</span>
                    </button>
                    
                    {currenUser ? (
                        <button 
                            onClick={() => setIsExportModalOpen(true)} 
                            className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <Download size={16} className="mr-2" />
                            <span>Download</span>
                        </button>
                    ) : (
                        <Link 
                            to={RouterPath.LOGIN} 
                            className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <span>Login to Download</span>
                        </Link>
                    )}
                    {currenUser && !currenUser?.is_pro && (
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                            Go Pro
                        </button>
                    )}
                </div>
            </nav>
            <div className='flex-1 relative'>
                {/* Keep both components mounted but toggle visibility */}
                <div className={`absolute inset-0 ${viewMode === 'splat' ? 'z-10 visible' : 'z-0 invisible'}`}>
                    {splatUrl && <SplatCanvas key={canvasKey} splatUrl={splatUrl} />}
                </div>
                <div className={`absolute inset-0 ${viewMode === 'colmap' ? 'z-10 visible' : 'z-0 invisible'}`}>
                    {colmapData && <ColmapCanvas colmap_data={colmapData} />}
                </div>
            </div>
            
            {/* Export Modal */}
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

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Share</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Share this 3D model with others:</p>
                                <div className="flex">
                                    <input 
                                        type="text" 
                                        value={window.location.href} 
                                        readOnly 
                                        className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    <button 
                                        className="bg-sky-500 text-white px-4 py-2 rounded-r-md hover:bg-sky-600 flex items-center"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailModalOpen && model && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Model Details</h3>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {model.image_url && (
                                <div className="rounded-lg overflow-hidden h-48 bg-gray-100">
                                    <img 
                                        src={myAppConfig.api.ENDPOINT + model.image_url} 
                                        alt={model.title} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/api/placeholder/400/320";
                                        }}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <h4 className="font-semibold text-xl">{model.title}</h4>
                                <p className="text-gray-500">ID: {model.id}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-2">
                                <div className="text-gray-500">Creator</div>
                                <div>{model.owner ? `${model.owner.first_name} ${model.owner.last_name}` : 'Unknown'}</div>
                                
                                <div className="text-gray-500">Creation Date</div>
                                <div>{formatDate(model.date_created)}</div>
                                
                                <div className="text-gray-500">File Size</div>
                                <div>{formatFileSize(model.model_size)}</div>
                                
                                <div className="text-gray-500">Status</div>
                                <div className="flex items-center">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${model.status === 'SUCCESS' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                    {model.status}
                                </div>
                                
                                <div className="text-gray-500">Visibility</div>
                                <div>{model.is_public ? 'Public' : 'Private'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}