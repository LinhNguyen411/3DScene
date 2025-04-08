import React, { useState } from 'react';
// import { Button, Form, Tab, Tabs } from 'react-bootstrap';

function AdminSetting({ user }) {
  const [activeTab, setActiveTab] = useState('myProfile');
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || 'Admin',
    email: user?.email || 'admin@example.com'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [appearance, setAppearance] = useState({
    theme: 'light',
    sidebarCollapsed: false,
    fontSize: 'medium'
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleAppearanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearance({ 
      ...appearance, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to update the profile
    console.log('Profile data submitted:', profileData);
    // Show success message or handle response
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    // Here you would typically make an API call to update the password
    console.log('Password data submitted:', passwordData);
    // Reset form and show success message
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleAppearanceSubmit = (e) => {
    e.preventDefault();
    // Here you would typically save appearance settings
    console.log('Appearance settings submitted:', appearance);
    // Show success message or handle response
  };

  return (
    <div className='flex-1 flex flex-col mt-14 mb-8 mr-8 ml-2'>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">User Settings</h1>
          </div>
          
          <div className="mb-6">
            <div className="flex border-b">
              <button 
                className={`py-2 px-4 ${activeTab === 'myProfile' ? 'border-b-2 border-teal-500 text-teal-500' : ''}`}
                onClick={() => setActiveTab('myProfile')}
              >
                My profile
              </button>
              <button 
                className={`py-2 px-4 ${activeTab === 'password' ? 'border-b-2 border-teal-500 text-teal-500' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                Password
              </button>
              <button 
                className={`py-2 px-4 ${activeTab === 'appearance' ? 'border-b-2 border-teal-500 text-teal-500' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                Appearance
              </button>
            </div>
          </div>
          
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            
            <div className="flex flex-row mb-4 gap-4">
              <div className='flex-1'>
                <label className="block text-gray-700 mb-2" htmlFor="fullName">Last Name</label>
                <input
                  type="text"
                  id="fullName"
                  className="w-full px-3 py-2 border rounded"
                  defaultValue="Admin"
                />
              </div>
              <div className='flex-1'>
                <label className="block text-gray-700 mb-2" htmlFor="fullName">First Name</label>
                <input
                  type="text"
                  id="fullName"
                  className="w-full px-3 py-2 border rounded"
                  defaultValue="Admin"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border rounded"
                defaultValue="admin@example.com"
              />
            </div>
            
            <div className="flex mt-6">
              <button 
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
              >
                Save
              </button>
              <button className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
  );
}

export default AdminSetting;