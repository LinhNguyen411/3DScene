import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DataService from './MyModelServices';
import myAppConfig from "../../../config";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MoreHorizontal, Pencil, Download, Trash } from "lucide-react";
import { useSnackbar } from '../../../provider/SnackbarProvider';


// Main App Component
function MyModel(props){
  const { showSnackbar } = useSnackbar();
  
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [model, setModel] = useState('');
  const [title, setTitle] = useState('');

  const handleUpdateModel = async () => {
    try {
      await DataService.updateSplat(model.id, title);
      setIsEditModalOpen(false);
      onRefresh(); // Refresh the model list
      onUpdate(model.id, title);
    } catch (error) {
      console.error('Error updating model:', error);
    }
  };

  // Handle deleting the model
  const handleDeleteModel = async () => {
    try {
      await DataService.deleteSplat(model.id);
      setIsDeleteModalOpen(false);
      onRefresh(); // Refresh the model list
      onDelete(model.id);
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  // Simulate fetching models from API
  const onRefresh = async () => {
    try {
      console.log('Refreshing models...');
      const data = await DataService.getSplats(1, 10); // Fetch page 1, 10 items per page
      setModels(data.items); // Update the models state with the new data
    } catch (error) {
      console.error('Error refreshing models:', error);
    }
  };

  // Combine useEffect with onRefresh to fetch models initially
  useEffect(() => {
    onRefresh(); // Initial fetch when component mounts

    // Set up an interval to check and refresh every 5 seconds
    const intervalId = setInterval(() => {
      // Check if any model does not have "succeed" status
      const shouldRefresh = models.some((model) => model.task_metadata.status !== 'SUCCESS');
      
      if (shouldRefresh) {
        console.log('Auto-refreshing due to non-succeed status...');
        onRefresh();
      } else {
        onRefresh();
        console.log('All models succeeded, no refresh needed.');
        clearInterval(intervalId);
        showSnackbar('Your model completed!', 'info');
      }
      }, 5000); // 5000ms = 5 seconds
    return () => clearInterval(intervalId);
    // Cleanup interval on component unmount
    
  }, []);
  const tabToStatusMap = {
    All: 'All',
    Queuing: 'PENDING',
    Processing: 'PROCESS',
    Succeeded: 'SUCCESS',
    Failed: 'FAILED',
  };
  console.log(models);
  const statusToFilter = tabToStatusMap[activeTab];


  // Filter models based on active tab and search query
  const filteredModels = models.filter(model => {
    const matchesTab = activeTab === 'All' || model.task_metadata.status === statusToFilter;
    const matchesSearch = model.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex-1">
        <main className="p-6">
            <div>
                <div className="flex mb-6 border-b align-items-center">
                {['All', 'Queuing', 'Processing', 'Succeeded', 'Failed'].map((tab) => (
                    <button
                    key={tab}
                    className={`px-8 py-3 ${activeTab === tab ? 'text-sky-500 border-b-2 border-sky-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab(tab)}
                    >
                    {tab}
                    </button>
                ))}
                  <div className="relative ml-auto">
                      <input
                      type="text"
                      placeholder="Search your 3D Models"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-100 pl-10 pr-4 py-2 rounded-lg w-64"
                      />
                      <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
                  </div>
                </div>
                
               
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModels.map((model) => (
                    <div key={model.id} className="bg-white rounded-lg shadow">
                    <div className="relative">
                        <img 
                        src={myAppConfig.api.ENDPOINT  + model.image_url} 
                        alt={model.title} 
                        className="w-full h-48 object-cover"
                        />
                        <div className="absolute bottom-2 left-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                            model.task_metadata.status === 'SUCCESS' ? 'bg-teal-400 text-white' :
                            model.task_metadata.status === 'PROCESS' ? 'bg-blue-400 text-white' :
                            model.task_metadata.status === 'PENDING' ? 'bg-yellow-400 text-white' :
                            'bg-red-400 text-white'
                        }`}>
                            {model.task_metadata.status}
                        </span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-center">
                        <h3 className="font-medium">{model.title}</h3>
                        
                        <Menu as="div" className="relative inline-block text-left">
                          <div>
                            <MenuButton className="inline-flex w-full justify-center gap-x-1.5 border-none rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                              <MoreHorizontal className="w-5 h-5 text-gray-500" />
                            </MenuButton>
                          </div>
                          <MenuItems
                            transition
                            className="absolute w-fit right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                          >
                            <div >
                              <MenuItem>
                                <button
                                  onClick={() => (setIsEditModalOpen(true), setModel(model), setTitle(model.title))}
                                  className="w-full flex gap-5 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <button
                                  onClick={() => (setIsExportModalOpen(true), setModel(model))}
                                  className="w-full flex gap-5 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <button
                                  onClick={() => (setIsDeleteModalOpen(true), setModel(model))}
                                  className="w-full flex gap-5 text-red-500 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                  Delete
                                </button>
                              </MenuItem>
                            </div>
                          </MenuItems>
                        </Menu>
                        </div>
                        <div className="mt-2 flex items-center">
                        <span className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded mr-2">Photo Scan</span>
                        <span className="text-xs text-gray-500">{model.date_created}</span>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
                
                {filteredModels.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No models found matching your criteria</p>
                </div>
                )}
            </div>
        </main>
         {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Name</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              placeholder="Enter model name"
            />
            <div className="text-right">
              <span className="text-sm text-gray-500">{title.length} /30</span>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateModel}
                className="px-4 py-2 bg-sky-500 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Delete Model</h3>
            </div>
            <p className="mb-4">Are you sure to delete?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                No
              </button>
              <button
                onClick={handleDeleteModel}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Yes
              </button>
            </div>
          </div>
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
            
            <div className="rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-500 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Upgrade to Pro</p>
                    <p className="text-sm text-gray-500">Enjoy unlimited exports and more</p>
                  </div>
                </div>
                <input type="radio" checked className="h-4 w-4 text-sky-500" />
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 rounded-full p-1">
                    <Download className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Free Export Coupon</p>
                    <p className="text-sm text-gray-500">You have 3 export coupons left</p>
                  </div>
                </div>
                <input type="radio" className="h-4 w-4 text-sky-500" />
              </div>
            </div>
            
            <button
              className="w-full py-3 bg-sky-500 text-white rounded-md font-medium"
            >
              Upgrade To Pro
            </button>
          </div>
        </div>
      )}
  </div>
  );
};

export default MyModel;