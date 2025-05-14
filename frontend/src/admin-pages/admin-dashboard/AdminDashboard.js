import React, { useState, useEffect, useRef } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { DollarSign, Users, Award, MessageCircle, ArrowUpRight } from 'lucide-react';
import DashboardService from './AdminDashboardServices';
import { useSnackbar } from '../../provider/SnackbarProvider';

function AdminDashboard() {
  // Add useSnackbar hook
  const { showSnackbar } = useSnackbar();

  // State for metrics
  const [metrics, setMetrics] = useState([
    { 
      title: 'Total Amount', 
      value: '0',
      change: '0%',
      icon: <DollarSign size={24} className="text-teal-500" />
    },
    { 
      title: 'Total Users', 
      value: '0',
      change: '0%',
      icon: <Users size={24} className="text-teal-500" />
    },
    { 
      title: 'Pro Users', 
      value: '0',
      change: '0%',
      icon: <Award size={24} className="text-teal-500" />
    }
  ]);

  // State for chart data
  const [chartData, setChartData] = useState({
    hours: [6, 8, 10, 12, 14, 16, 18],
    models: [0, 0, 0, 0, 0, 0, 0]
  });

  // State for feedback
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref for the interval timer
  const intervalRef = useRef(null);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(amount).replace('VND', '').trim() + ' ₫';
  };

  // Process models data for chart
  const processModelsData = (data) => {
    // Expected data structure: Array of Splat objects
    if (!data || !Array.isArray(data)) return chartData;
    
    // Create hour buckets (6, 8, 10, 12, 14, 16, 18)
    const hours = [6, 8, 10, 12, 14, 16, 18];
    const models = [0, 0, 0, 0, 0, 0, 0];
    
    // Group splats by hour
    data.forEach(splat => {
      try {
        const date = new Date(splat.date_created);
        const hour = date.getHours();
        
        // Find the appropriate bucket
        for (let i = 0; i < hours.length; i++) {
          // If this is the last bucket or the hour falls in the current bucket range
          if (i === hours.length - 1 || (hour >= hours[i] && hour < (hours[i + 1] || 24))) {
            models[i]++;
            break;
          }
        }
      } catch (e) {
        console.error('Error processing splat date:', e);
      }
    });
    
    return { hours, models };
  };

  // Process feedback data
  const processFeedbackData = (data) => {
    if (!data || !data.items || !Array.isArray(data.items)) return [];
    
    return data.items.map(item => {
      // Calculate relative date (Today, Yesterday, 2 days ago, etc.)
      const feedbackDate = new Date(item.created_at);
      const today = new Date();
      const diffTime = Math.abs(today - feedbackDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let relativeDate;
      if (diffDays === 0) relativeDate = 'Today';
      else if (diffDays === 1) relativeDate = 'Yesterday';
      else relativeDate = `${diffDays} days ago`;
      
      return {
        id: item.id,
        email: item.email_contact,
        date: relativeDate,
        message: item.comment,
      };
    });
  };

  // Fetch all data
  const fetchDashboardData = async () => {
    try {
      // Only show loading on first load
      if (loading) {
        setLoading(true);
      }
      
      // Fetch metrics data
      const [totalAmount, totalUsers, proUsers, modelsData, feedbackData] = await Promise.all([
        DashboardService.getTotalAmount(),
        DashboardService.getTotalUsers(),
        DashboardService.getTotalProUsers(),
        DashboardService.getModelsLast24Hours(),
        DashboardService.getRecentFeedback(1, 6) // Show 6 recent feedback entries
      ]);
      
      // Update metrics
      setMetrics([
        { 
          title: 'Total Amount', 
          value: formatCurrency(totalAmount),
          change: '+8.7%', // Hardcoded for now, would need previous data to calculate
          icon: <DollarSign size={24} className="text-teal-500" />
        },
        { 
          title: 'Total Users', 
          value: formatNumber(totalUsers),
          change: '+5.2%', // Hardcoded for now
          icon: <Users size={24} className="text-teal-500" />
        },
        { 
          title: 'Pro Users', 
          value: formatNumber(proUsers),
          change: '+12.3%', // Hardcoded for now
          icon: <Award size={24} className="text-teal-500" />
        }
      ]);
      
      // Process and set chart data
      setChartData(processModelsData(modelsData));
      
      // Process and set feedback data
      setFeedback(processFeedbackData(feedbackData));
      
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
      // Add snackbar notification for error
      showSnackbar('Failed to load dashboard data', 'error');
    }
  };

  // Initial data load and set up interval
  useEffect(() => {
    // Initial fetch
    fetchDashboardData();
    
    // Set up interval for refreshing data every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchDashboardData();
    }, 10000); // 10 seconds
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white mt-14 mx-8 border rounded-lg shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Loading/Error State */}
        {loading && <div className="text-center py-10">Loading dashboard data...</div>}
        {error && <div className="text-center py-10 text-red-500">{error}</div>}
        
        {!loading && (
          <>
            {/* Top Section - Metrics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white overflow-hidden border rounded-lg shadow-md">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-md bg-teal-50">
                        {metric.icon}
                      </div>
                      {/* <div className="flex items-center text-sm text-green-600">
                        <span>{metric.change}</span>
                        <ArrowUpRight size={16} className="ml-1" />
                      </div> */}
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
                        data: chartData.hours, 
                        label: 'Hours (24hr format)',
                        scaleType: 'linear'
                      }]}
                      series={[
                        {
                          data: chartData.models,
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
                    {feedback.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">No feedback available</div>
                    ) : (
                      feedback.map((item) => (
                        <div key={item.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{item.email}</h3>
                              <p className="text-xs text-gray-500">{item.date}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;