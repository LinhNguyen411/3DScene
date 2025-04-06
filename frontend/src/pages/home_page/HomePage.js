import React from "react";
import { Link } from "react-router-dom";
import { Camera, Lock, Info, LogIn, ArrowRight, Check, X } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ 
            backgroundImage: `url('/api/placeholder/1600/900')`,
            filter: 'brightness(0.8)'
          }}
        ></div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">3DScene Engine</h1>
            <div className="inline-block bg-white text-gray-700 text-sm px-3 py-1 rounded-full mb-4">BETA</div>
            <p className="text-xl md:text-2xl mb-8">3D Scan Online</p>
            
            <Link 
              to="/join" 
              className="bg-gradient-to-r from-sky-400 to-sky-500 text-white px-10 py-3 rounded-md text-lg hover:opacity-90 transition"
            >
              Join Now
            </Link>
            
            <div className="mt-4 text-sm">
              Already have an account? <Link to="/login" className="text-sky-400 hover:underline">Log in</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* What's 3DScene Engine Web */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">What's 3DScene Engine Web?</h2>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="md:w-1/2 mb-6 md:mb-0 md:pr-10">
            <p className="mb-4"><span className="font-bold">3DScene Engine Web</span> is a gemini platform of its lightweight sister 3DScene Engine app. You can upload high-quality photos to 3DScene Engine Web to create photorealistic 3D scans.</p>
            <p className="mb-4">We use state-of-art photogrammetry algorithms on the cloud to deliver professional 3D results to users</p>
          </div>
          
          <div className="md:w-1/2">
            <img src="/api/placeholder/600/300" alt="3D Scan Examples" className="rounded-md shadow-lg" />
          </div>
        </div>
      </section>
      
      {/* How to get professional 3D assets */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">How to get professional 3D assets using 3DScene Engine</h2>
        </div>
        
        {/* Choose the right object */}
        <div className="mb-12">
          <h3 className="text-xl font-medium text-center mb-6">- Choose the right object -</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/api/placeholder/150/150" alt="Glass" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-red-400">
                  <X className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <span className="text-sm text-center">Glass</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/api/placeholder/150/150" alt="Water Bottle" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-red-400">
                  <X className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <span className="text-sm text-center">Water Bottle</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/api/placeholder/150/150" alt="Colorful Vase" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-sky-400">
                  <Check className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-sm text-center">Colorful Vase</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img src="/api/placeholder/150/150" alt="Tree Bark" className="rounded-md" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-sky-400">
                  <Check className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="text-sm text-center">Tree Bark</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 text-sm text-gray-600">
            <div>
              <p>Avoid choosing objects that have highly transparent or reflective surfaces</p>
            </div>
            <div>
              <p>3DScene Engine will create stunning 3D scans when scanning colorful, textured objects</p>
            </div>
          </div>
        </div>
        
        {/* Prepare for 3D scanning */}
        <div className="mb-12">
          <h3 className="text-xl font-medium text-center mb-6">- Prepare for 3D scanning -</h3>
          
          <div className="bg-black text-white p-6 rounded-lg">
            <h4 className="text-2xl font-bold text-center mb-6">Tips for photogrammetry with DSLR</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div>
                <h5 className="font-medium mb-2">Pro Tip #1</h5>
                <p className="text-sm">It is recommended to use a high-resolution DSLR camera to take better photos. For small to medium-sized objects, it's the best practice to use a lens with fixed focus.</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Pro Tip #2</h5>
                <p className="text-sm">When taking photos, try to find a clean background. If they are moving objects behind your subject, it might affect the result.</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Pro Tip #3</h5>
                <p className="text-sm">Adjacent photos should have at least 60% overlap. Take at least 30 photos. Try to capture from different angles. More photos usually means better results.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Favorite 3D Scans */}
      <section className="py-10 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white text-center py-4 rounded-md mb-8">
          <h2 className="text-2xl font-medium">Our Favorite 3D Scans</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { name: "Pumpkin", creator: "Created by Alex" },
            { name: "Green Avocado", creator: "Created by Sophie Anderson" },
            { name: "Nike Air 1", creator: "Created by Michael" },
            { name: "Rusty Hammer", creator: "Created by Liu" },
            { name: "Sourdough", creator: "Created by Pierre" },
            { name: "Nike Dunk TL", creator: "Created by Michael" }
          ].map((item, index) => (
            <div key={index} className="rounded-lg overflow-hidden shadow-md bg-white">
              <img 
                src={`/api/placeholder/400/300`} 
                alt={item.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.creator}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2 rounded-full transition">
            Learn More
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-auto py-4 px-4 border-t text-sm text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>Copyright © 2023 3DScene Innovation</div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link to="/terms" className="hover:text-gray-700">User Agreement</Link>
            <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
