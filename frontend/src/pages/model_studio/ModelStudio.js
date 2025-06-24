import { useState, useEffect } from 'react';
import { ChevronLeft, Share, Download, Loader, Copy, Info, EyeIcon, Grid3X3, Save } from 'lucide-react';
import { useNavigate, useOutletContext, useSearchParams, Link } from "react-router-dom";
import DataService from './ModelStudioService';
import { useLoader } from '../../provider/LoaderProvider';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import myAppConfig from '../../config';
import LinkNotValid from "../link_not_valid/LinkNotValid";
import ModelCanvas from './ModelCanvas';

export default function ModelStudio() {
    const { showSnackbar } = useSnackbar();
    const { showLoader, hideLoader } = useLoader();
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [splatUrl, setSplatUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [model, setModel] = useState(null);
    const [currenUser, setCurrentUser] = useState(null);
    const [modelNotFound, setModelNotFound] = useState(false);
    const [colmapData, setColmapData] = useState(null);
    const [viewMode, setViewMode] = useState('splat'); // Always start with splat
    const [colmapDataLoading, setColmapDataLoading] = useState(false);
    const [projectName, setProjectName] = useState(null);
    const [projectIcon, setProjectIcon] = useState(null);
    
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

    const handleExportColmap = async () => {
        try {
          setLoading(true);
          await DataService.downloadColmap(model.id);
          setIsExportModalOpen(false);
          showSnackbar("Exported COLMAP files successfully!", "success");
        } catch (error) {
          console.error("Error exporting COLMAP files:", error);
          showSnackbar("Failed to export COLMAP files", "error");
        }
        finally{
          setLoading(false);
        }
    };

    const handleSaveView = async (viewData) => {
        if (!model) return;
        try {
            showLoader();
            // Convert THREE.js objects to plain objects for JSON serialization
            const payload = {
                camera_init: {
                    position: { ...viewData.camera_init.position },
                    quaternion: { ...viewData.camera_init.quaternion },
                    target: { ...viewData.camera_init.target }
                },
                model_transform: {
                    position: { ...viewData.model_transform.position },
                    rotation: { ...viewData.model_transform.rotation }
                }
            };
            await DataService.updateModel(id, payload);

            // Optimistically update the model state to reflect the change immediately
            setModel(prevModel => ({...prevModel, ...payload}));

            showSnackbar("View saved successfully!", "success");
        } catch (error) {
            console.error("Error saving view:", error);
            showSnackbar("Failed to save view", "error");
        } finally {
            hideLoader();
        }
    };

    const handleCopyLink = () => {
        const url = `${myAppConfig.frontend.FRONTEND_DOMAIN}${RouterPath.MODEL_VIEW}?id=${id}`;
        navigator.clipboard.writeText(url)
            .then(() => {
                showSnackbar("Link copied to clipboard!", "success");
            })
            .catch((error) => {
                console.error("Error copying link:", error);
                showSnackbar("Failed to copy link", "error");
            });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        }
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


    // Function to load colmap data when user clicks colmap button
    const loadColmapData = async () => {
        if (colmapData) return; // Already loaded
        
        setColmapDataLoading(true);
        try {
            const colmap = await DataService.getColmapData(id);
            if (colmap && colmap.cameras && colmap.points && colmap.images) {
                console.log('colmap data:', colmap.images);
                setColmapData(colmap);
            } else {
                showSnackbar("Colmap data not available", "error");
            }
        } catch (error) {
            console.error('Error loading colmap data:', error);
            showSnackbar("Failed to load colmap data", "error");
        } finally {
            setColmapDataLoading(false);
        }
    };

    const handleViewModeToggle = async (mode) => {
        if (mode === 'colmap' && !colmapData) {
            await loadColmapData();
        }
        setViewMode(mode);
    };

    let objectUrl;
    const fetchAndProcess = async () => {
        try {
            showLoader();
            const user = await DataService.getAuth();
            setCurrentUser(user);
            
            try {
                const splat = await DataService.getSplat(id);
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
                const response = await DataService.getModel(id);
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
    const fetchProjectInfo = async () => {
                try {
            const response = await DataService.getProjectInfo();
            if (response) {
                setProjectName(response.project_name);
                setProjectIcon(myAppConfig.api.ENDPOINT + response.project_icon);
                console.log('Project info:', response);
            } else {
                console.error('Failed to fetch project info');
            }
        }
        catch (error) {
            console.error('Error fetching project info:', error);
        }
    }

    const handleTogglePublic = async () => {
        if (!model) return;
        const newPublicStatus = !model.is_public;
        try {
            showLoader();
            await DataService.updateModel(id, { is_public: newPublicStatus });
            setModel(prevModel => ({ ...prevModel, is_public: newPublicStatus }));
            showSnackbar(`Model visibility set to ${newPublicStatus ? 'Public' : 'Private'}`, "success");
        } catch (error) {
            console.error("Error updating model visibility:", error);
            showSnackbar("Failed to update model visibility", "error");
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchAndProcess();
        fetchProjectInfo();


        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    if (modelNotFound) {
        return (
            <>
                <LinkNotValid />
            </>
        )
    }


    return (
        <div className='h-screen flex flex-col'>
            <nav className={`${viewMode === 'colmap' ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border-b px-4 py-2 flex items-center justify-between`}>
                {/* Left section */}
                <div className="flex items-center">
                    <button className={`h-8 w-8 flex items-center justify-center rounded-full border mr-4 ${viewMode === 'colmap' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-700'}`} onClick={handleBack}>
                        <ChevronLeft size={16} /> 
                    </button>
                    <div className="flex items-center">
                        <Link to={RouterPath.HOME} className="flex justify-between items-center">
                            <img className="w-10" src={projectIcon} alt={`${projectName} logo`} />
                            <h2 className={`brand-text text-xl ml-2 ${viewMode === 'colmap' ? 'text-white-400' : 'text-sky-400'}`}>{projectName}</h2>
                        </Link>
                    </div>
                </div>

                
                {/* Center section - View Toggle - Only show if colmap data is available */}
                {model?.colmap_url && (
                    <div className="flex items-center">
                        <div className={`flex items-center p-1 rounded-lg ${viewMode === 'colmap' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <button 
                                onClick={() => setViewMode('splat')} 
                                className={`flex items-center px-4 py-1.5 rounded-md ${viewMode === 'splat' ? (viewMode === 'colmap' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (viewMode === 'colmap' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`}
                            >
                                <EyeIcon size={16} className="mr-2" />
                                <span>Splat</span>
                            </button>
                            <button 
                                onClick={() => handleViewModeToggle('colmap')} 
                                className={`flex items-center px-4 py-1.5 rounded-md ${viewMode === 'colmap' ? (viewMode === 'colmap' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (viewMode === 'colmap' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200')}`}
                                disabled={colmapDataLoading}
                            >
                                {colmapDataLoading ? (
                                    <Loader size={16} className="mr-2 animate-spin" />
                                ) : (
                                    <Grid3X3 size={16} className="mr-2" />
                                )}
                                <span>Colmap</span>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Show current view mode when toggle is not available */}
                {!model?.colmap_url && (
                    <div className="flex items-center">
                        <div className={`flex items-center px-4 py-1.5 rounded-md ${viewMode === 'colmap' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            <EyeIcon size={16} className="mr-2" />
                            <span>Splat View</span>
                        </div>
                    </div>
                )}
                
                {/* Right section */}
                <div className="flex items-center space-x-3">
                     <button 
                        className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'colmap' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}                        
                        onClick={() => {
                            setIsShareModalOpen(false);
                            setIsDetailModalOpen(true);
                        }}
                    >
                        <Info size={16} className="mr-2" />
                        <span>View Details</span>
                    </button>
                    <button 
                        className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'colmap' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        onClick={() => setIsShareModalOpen(true)}
                    >
                        <Share size={16} className="mr-2" />
                        <span>Share</span>
                    </button>
                    
                    {currenUser ? (
                        <button 
                            onClick={() => setIsExportModalOpen(true)} 
                            className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'colmap' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <Download size={16} className="mr-2" />
                            <span>Download</span>
                        </button>
                    ) : (
                        <Link 
                            to={RouterPath.LOGIN} 
                            className={`flex items-center px-3 py-1 rounded-md ${viewMode === 'colmap' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <span>Login to Download</span>
                        </Link>
                    )}
                    {currenUser && !currenUser?.is_pro && (
                        <Link to={RouterPath.SUBSCRIPTION} className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600">
                            Go Pro
                        </Link>
                    )}
                </div>
            </nav>
            {model && (
                <div className='flex-1 relative'>
                <ModelCanvas
                        model={model}
                        key={canvasKey}
                        viewMode={viewMode}
                        splatUrl={splatUrl}
                        colmapData={colmapData}
                        onSaveView={handleSaveView}
                    />
                </div>

            )}
            
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
                                {/* Only show colmap export if colmap data is loaded */}
                                {model?.colmap_url && (
                                    <button
                                        className="w-full py-3 bg-sky-500 text-white rounded-md font-medium"
                                        onClick={handleExportColmap}
                                    >
                                        Export colmap .zip (includes images)
                                    </button>
                                )}
                        
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
        <div className="bg-white rounded-lg p-6 w-[500px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Share</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-700">
                                {model.is_public ? 'Public Model' : 'Private Model'}
                            </span>
                            <label htmlFor="toggle-public" className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="toggle-public"
                                        className="sr-only"
                                        checked={model.is_public}
                                        onChange={handleTogglePublic}
                                    />
                                    <div className={`block ${model.is_public ? 'bg-green-300' :'bg-gray-300'} w-14 h-8 rounded-full`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${model.is_public ? 'translate-x-full bg-blue-600' : ''}`}></div>
                                </div>
                            </label>
                        </div>
            
            {model.is_public && (
                <div className="space-y-6">
                    {/* Direct Link Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Direct Link
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Share this 3D model with others:</p>
                        <div className="flex">
                            <input 
                                type="text" 
                                value={`${myAppConfig.frontend.FRONTEND_DOMAIN}${RouterPath.MODEL_VIEW}?id=${id}`} 
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

                    {/* Embed Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Embed Code
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Copy this code to embed the 3D model in your website:</p>
                        
                        {/* Embed Size Options */}
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Size:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Small', width: 400, height: 300 },
                                    { label: 'Medium', width: 600, height: 400 },
                                    { label: 'Large', width: 800, height: 600 },
                                    { label: 'Full Width', width: '100%', height: 500 }
                                ].map((size) => (
                                    <button
                                        key={size.label}
                                        className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                        onClick={() => {
                                            const embedCode = `<iframe src="${myAppConfig.frontend.FRONTEND_DOMAIN}${RouterPath.MODEL_VIEW}?id=${id}&embed=true" width="${size.width}" height="${size.height}" frameborder="0" allowfullscreen></iframe>`;
                                            navigator.clipboard.writeText(embedCode).then(() => {
                                                showSnackbar("Embed code copied to clipboard!", "success");
                                            }).catch(() => {
                                                showSnackbar("Failed to copy embed code", "error");
                                            });
                                        }}
                                    >
                                        {size.label} ({size.width}×{size.height})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Default embed code display */}
                        <div className="relative">
                            <textarea 
                                value={`<iframe src="${myAppConfig.frontend.FRONTEND_DOMAIN}${RouterPath.MODEL_VIEW}?id=${id}&embed=true" width="600" height="400" frameborder="0" allowfullscreen></iframe>`}
                                readOnly 
                                rows={3}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            />
                            <button 
                                className="absolute top-2 right-2 bg-sky-500 text-white px-3 py-1 rounded hover:bg-sky-600 flex items-center text-xs"
                                onClick={() => {
                                    const embedCode = `<iframe src="${myAppConfig.frontend.FRONTEND_DOMAIN}${RouterPath.MODEL_VIEW}?id=${id}&embed=true" width="600" height="400" frameborder="0" allowfullscreen></iframe>`;
                                    navigator.clipboard.writeText(embedCode).then(() => {
                                        showSnackbar("Embed code copied to clipboard!", "success");
                                    }).catch(() => {
                                        showSnackbar("Failed to copy embed code", "error");
                                    });
                                }}
                            >
                                <Copy size={12} className="mr-1" />
                                Copy
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-2">
                            Note: The embed parameter ensures optimal display for embedded content.
                        </p>
                    </div>

                </div>

            )}
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
                                
                                <div className="text-gray-500">Available Views</div>
                                <div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">Splat</span>
                                    {model?.colmap_url && (
                                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Colmap</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}