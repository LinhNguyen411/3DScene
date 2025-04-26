import React, { useRef, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Check, X } from "lucide-react";
import { RouterPath } from "../../assets/dictionary/RouterPath";
import myAppConfig from "../../config";
import DataService from './HomePageService';

export default function HomePage() {
  const videoRef = useRef(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const {projectName, projectIcon} = useOutletContext();


  useEffect(() => {
    // Auto-play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video autoplay failed:", error);
        // Many browsers require user interaction before playing videos with sound
      });
    }
    
    // Fetch gallery items for the showcase
    const fetchGalleryItems = async () => {
      try {
        setIsLoading(true);
        const data = await DataService.getFeaturedGallery();
        setGalleryItems(data.items || []);
      } catch (error) {
        console.error("Failed to fetch gallery items:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGalleryItems();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[600px] overflow-hidden">
        {/* Hero Background Video */}
        <div className="absolute inset-0 z-0 bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="herothumbnail.webp"
          >
            {/* Note: In a real implementation, you would use the actual video URL */}
            <source src="videoplayback.mp4" type="video/mp4" />
            {/* Fallback for browsers that don't support video */}
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black opacity-40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
          <div className="text-center">
            <div className="inline-block px-3 py-1 mb-4">
             <img className="w-[7em]" src={projectIcon} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-xl">{projectName}</h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-lg">
              Create Stunning 3D Models from Video with Gaussian Splatting
            </p>

            <Link
              to={RouterPath.DASHBOARD}
              className="bg-gradient-to-r from-sky-400 to-sky-500 text-white px-10 py-3 rounded-md text-lg hover:opacity-90 transition"
            >
              Start Creating
            </Link>

            <div className="mt-4 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-sky-400 hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What's {projectName} */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">What's {projectName}?</h2>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="md:w-1/2 mb-6 md:mb-0 md:pr-10">
            <p className="mb-4">
              <span className="font-bold">{projectName}</span> is a revolutionary platform that transforms your videos into photorealistic 3D models using advanced Gaussian splatting technology.
            </p>
            <p className="mb-4">
              Simply upload a video, and our cloud-based algorithms generate high-fidelity 3D assets ready for games, VR, AR, or 3D printing.
            </p>
          </div>

          <div className="md:w-1/2">
            <img
              src="/training.gif" // Replace with a Gaussian splatting model example
              alt="3D Gaussian Splat Render"
              className="rounded-md shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* How to Create 3D Models */}
      <section id="how-to-create" className="pt-10 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">How to Create 3D Models with {projectName}</h2>
        </div>

        {/* Capture the Right Video */}
        <div className="mb-12">
          <h3 className="text-xl font-medium text-center mb-6">- Capture the Right Video -</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/shakyvideo.gif" alt="Shaky Video" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-red-400">
                  <X className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <span className="text-sm text-center">Shaky Video</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/lowlightvideo.gif" alt="Low Light Video" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-red-400">
                  <X className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <span className="text-sm text-center">Low Light Video</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/stable.gif" alt="Stable Video" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-sky-400">
                  <Check className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-sm text-center">Stable Video</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/well-lit.gif" alt="Well-Lit Video" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-sky-400">
                  <Check className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-sm text-center">Well-Lit Video</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 text-sm text-gray-600">
            <div>
              <p>Avoid shaky or blurry videos. Use a tripod or stabilize your camera for best results.</p>
            </div>
            <div>
              <p>Record in bright, even lighting to capture clear details for high-quality 3D models.</p>
            </div>
          </div>
        </div>

        {/* Tips for Video Recording */}
        <div className="mb-12">
          <h3 className="text-xl font-medium text-center mb-6">- Tips for Video Recording -</h3>

          <div className="bg-black text-white p-6 rounded-lg">
            <h4 className="text-2xl font-bold text-center mb-6">
              Best Practices for Gaussian Splatting
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div>
                <h5 className="font-medium mb-2">Pro Tip #1</h5>
                <p className="text-sm">
                  Record a slow, steady video circling the object. Aim for 360° coverage to capture all angles.
                </p>
              </div>

              <div>
                <h5 className="font-medium mb-2">Pro Tip #2</h5>
                <p className="text-sm">
                  Use a plain, non-reflective background to avoid interference with the splatting algorithm.
                </p>
              </div>

              <div>
                <h5 className="font-medium mb-2">Pro Tip #3</h5>
                <p className="text-sm">
                  Shoot in at least 1080p resolution. Higher resolutions improve model detail and accuracy.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="text-lg font-medium text-center mb-4">Example Video</h4>
              <div className="aspect-w-16 aspect-h-9">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/2ZX_5bOdKjo?si=Z26tIpGZfkoZlNDQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>              </div>
            </div>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section id="showcase-gallery" className="py-10 px-4 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">Explore Our 3D Creations</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <>
            {galleryItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {galleryItems.map((item, index) => (
                  <div key={item.id || index} className="rounded-lg overflow-hidden shadow-md bg-white">
                    <Link to={`${RouterPath.MODEL_VIEW}?id=${item.id}`}>
                      <img 
                        src={myAppConfig.api.ENDPOINT  + item.image_url} 
                        alt={item.title} 
                        className="w-full h-48 object-cover"
                      />
                    </Link>
                    <div className="p-4 flex flex-row justify-between items-center">
                      <h3 className="font-medium">{item.title}</h3>
                      <h4 className="font-small">{item.model_size} MB</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No featured creations available at the moment.</p>
                <p className="text-gray-500 mt-2">Be the first to create amazing 3D models!</p>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Link
                to={RouterPath.DASHBOARD_EXPLORE}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2 rounded-full transition"
              >
                View More Creations
              </Link>
            </div>
          </>
        )}
      </section>
      

      {/* Footer */}
      <footer className="mt-auto py-4 px-4 border-t text-sm text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>Copyright © 2025 {projectName}</div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link to={RouterPath.TERMS} className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link to={RouterPath.PRIVACY} className="hover:text-gray-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}