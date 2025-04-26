import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import myAppConfig from "../../../config";
import DataService from './ExploreService';

const Explore = () => {
  const [galleryItems, setExploreItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(6);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchExploreItems();
    setPage(prevPage => prevPage + 1);
  }, []);

  const fetchExploreItems = async (resetItems = false) => {
    try {
      setIsLoading(true);
      const data = await DataService.getFeaturedExplore(page, size);
      
      setTotalItems(data.total);
      
      if (resetItems) {
        setExploreItems(data.items || []);
      } else {
        setExploreItems(prevItems => [...prevItems, ...(data.items || [])]);
      }
      
      // Check if we've loaded all available items
      setHasMore((page * size) < data.total);
      
    } catch (error) {
      console.error("Failed to fetch gallery items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMore = () => {
    setPage(prevPage => prevPage + 1);
    fetchExploreItems(false);
  };

  return (
    <section className="py-10 px-4 max-w-6xl mx-auto w-full">
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
        <h2 className="text-2xl font-medium">Explore Our 3D Creations</h2>
      </div>
      
      {galleryItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <div key={item.id || index} className="rounded-lg overflow-hidden shadow-md bg-white">
              <Link to={`${RouterPath.MODEL_VIEW}?id=${item.id}`}>
                <img 
                  src={myAppConfig.api.ENDPOINT + item.image_url} 
                  alt={item.title} 
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4 flex flex-row justify-between items-center">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-xs text-gray-500">by {item.owner.first_name} {item.owner.last_name}</p>
                </div>
                <h4 className="font-small">{item.model_size} MB</h4>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No featured creations available at the moment.</p>
            <p className="text-gray-500 mt-2">Be the first to create amazing 3D models!</p>
          </div>
        )
      )}
      
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      )}

      {hasMore && galleryItems.length > 0 && !isLoading && (
        <div className="text-center mt-8">
          <button
            onClick={handleViewMore}
            className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2 rounded-full transition hover:bg-gray-50"
          >
            View More
          </button>
        </div>
      )}
    </section>
  );
};

export default Explore;