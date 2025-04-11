import React, { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Users, Activity, Award, MessageCircle, ArrowUpRight } from 'lucide-react';

function AdminDashboard() {
  // Sample data for the metrics
  const metrics = [
    { 
      title: 'Total Traffic', 
      value: '24.3K',
      change: '+12%',
      icon: <Activity size={24} className="text-teal-500" />
    },
    { 
      title: 'Total Users', 
      value: '8,642',
      change: '+8.5%',
      icon: <Users size={24} className="text-teal-500" />
    },
    { 
      title: 'Pro Users', 
      value: '1,893',
      change: '+23%',
      icon: <Award size={24} className="text-teal-500" />
    }
  ];

  // Sample data for feedback
  const [feedback] = useState([
    { id: 1, user: 'Alex Chen', date: 'Today', message: 'The new 3D model generation feature is amazing! Saved me hours of work.', avatar: '/api/placeholder/40/40' },
    { id: 2, user: 'Sarah Johnson', date: 'Yesterday', message: 'Love the intuitive interface. Would appreciate more architectural templates.', avatar: '/api/placeholder/40/40' },
    { id: 3, user: 'Miguel Rodriguez', date: 'Yesterday', message: 'Rendering speed has improved dramatically with the latest update!', avatar: '/api/placeholder/40/40' },
    { id: 4, user: 'Emma Wilson', date: '2 days ago', message: 'Having some issues with exporting to OBJ format. Any help would be appreciated.', avatar: '/api/placeholder/40/40' },
    { id: 5, user: 'Jamal Ahmed', date: '3 days ago', message: 'Great tool for quick prototyping. Would love to see more material options.', avatar: '/api/placeholder/40/40' },
    { id: 6, user: 'Lisa Wong', date: '3 days ago', message: 'The lighting presets are fantastic. Makes my models look professional instantly.', avatar: '/api/placeholder/40/40' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white mt-14 mx-8 border rounded-lg shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Top Section - Metrics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white overflow-hidden border rounded-lg shadow-md">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-md bg-teal-50">
                    {metric.icon}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <span>{metric.change}</span>
                    <ArrowUpRight size={16} className="ml-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-medium text-gray-900">{metric.title}</h2>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{metric.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section - Chart and Feedback */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Chart Section */}
          <div className="bg-white overflow-hidden border rounded-lg shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">3D Models Generated Today</h2>
              </div>
              <div className="flex justify-center">
                <LineChart
                  xAxis={[{ 
                    data: [6, 8, 10, 12, 14, 16, 18], 
                    label: 'Hours (24hr format)',
                    scaleType: 'linear'
                  }]}
                  series={[
                    {
                      data: [12, 29, 41, 35, 52, 68, 74],
                      area: true,
                      color: '#0D9488', // Teal color
                      label: 'Models',
                      showMark: true,
                    },
                  ]}
                  width={500}
                  height={300}
                  sx={{
                    '.MuiLineElement-root': {
                      strokeWidth: 2,
                    },
                    '.MuiAreaElement-root': {
                      fillOpacity: 0.2,
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white overflow-hidden border rounded-lg shadow-md">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <MessageCircle size={20} className="text-teal-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Recent Feedback</h2>
              </div>
              <div className="overflow-y-auto h-64 pr-2">
                {feedback.map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <img
                        src={item.avatar}
                        alt={item.user}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.user}</h3>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;