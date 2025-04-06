import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import DataService from './MyModelServices';
import myAppConfig from "../../../config";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

// Main App Component
function MyModel(props){
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate fetching models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('Fetching models...');
        const data = await DataService.getSplats(1, 10); // Fetch page 1, 10 items per page
        console.log('data')
        setModels(data.items); // Assuming the API returns an array of model objects
      } catch (error) {
        console.error('Error fetching splats:', error);
        setModels([]); // Set empty array on error to avoid breaking the UI
      }
    };

    fetchModels();
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
                    <div key={model.id} className="bg-white rounded-lg shadow overflow-hidden">
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
                        
                        <button className="text-gray-400">···</button>
                        <Menu as="div" className="relative inline-block text-left"></Menu>
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
  </div>
  );
};

export default MyModel;