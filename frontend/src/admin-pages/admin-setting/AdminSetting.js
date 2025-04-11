import React, { useState } from 'react';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import { useNavigate } from 'react-router-dom';
function AdminSetting({ user }) {
  const [activeTab, setActiveTab] = useState('myProfile');
  let navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || 'Admin',
    lastName: user?.lastName || 'User',
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

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("supertoken");
    navigate(RouterPath.ADMIN_LOGIN);
    // Here you would implement logout functionality
    // e.g., clearing auth tokens, redirecting to login page, etc.
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
        {activeTab === 'myProfile' && (
          <>
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <form onSubmit={handleProfileSubmit}>
              <div className="flex flex-row mb-4 gap-4">
                <div className='flex-1'>
                  <label className="block text-gray-700 mb-2" htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="w-full px-3 py-2 border rounded"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className='flex-1'>
                  <label className="block text-gray-700 mb-2" htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="w-full px-3 py-2 border rounded"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border rounded"
                  value={profileData.email}
                  onChange={handleProfileChange}
                />
              </div>
              
              <div className="flex mt-6">
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                >
                  Save
                </button>
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === 'password' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="w-full px-3 py-2 border rounded"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border rounded"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              
              <div className="flex mt-6">
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                >
                  Update Password
                </button>
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                  onClick={() => setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === 'appearance' && (
          <>
            <h2 className="text-lg font-semibold mb-4">Appearance Settings</h2>
            <form onSubmit={handleAppearanceSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  name="theme"
                  className="w-full px-3 py-2 border rounded"
                  value={appearance.theme}
                  onChange={handleAppearanceChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="fontSize">Font Size</label>
                <select
                  id="fontSize"
                  name="fontSize"
                  className="w-full px-3 py-2 border rounded"
                  value={appearance.fontSize}
                  onChange={handleAppearanceChange}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="sidebarCollapsed"
                  name="sidebarCollapsed"
                  className="mr-2"
                  checked={appearance.sidebarCollapsed}
                  onChange={handleAppearanceChange}
                />
                <label htmlFor="sidebarCollapsed">Collapse sidebar by default</label>
              </div>
              
              <div className="flex mt-6">
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                >
                  Save Settings
                </button>
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-10 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Log Out
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminSetting;