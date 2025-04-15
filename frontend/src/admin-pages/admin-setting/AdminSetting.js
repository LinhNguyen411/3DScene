import React, { useState, useEffect } from 'react';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import { useNavigate } from 'react-router-dom';
import SettingsService from './AdminSettingServices';
import { useSnackbar } from '../../provider/SnackbarProvider';

function AdminSetting({ user }) {
  const [activeTab, setActiveTab] = useState('myProfile');
  const [loading, setLoading] = useState(false);
  // const [isPro, setIsPro] = useState(false);
  let navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [profileData, setProfileData] = useState({
    id: user?.id || 0,
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    is_superuser: user?.is_superuser || false,
    is_active: user?.is_active || true
  });
  
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('theme') || 'light',
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false,
    fontSize: localStorage.getItem('fontSize') || 'medium'
  });

  // Fetch user data on component mount if not provided
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await SettingsService.getUserInfo();
        setProfileData({
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          is_superuser: userData.is_superuser,
          is_active: userData.is_active
        });
        
        // Check if user has pro status
        // const proStatus = await SettingsService.checkProStatus();
        // setIsPro(proStatus);
        
        setLoading(false);
      } catch (err) {
        showSnackbar('Failed to load user data', 'error');
        setLoading(false);
      }
    };

    if (!user || !user.id) {
      fetchUserData();
    }
  }, [user, showSnackbar]);

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
    const newValue = type === 'checkbox' ? checked : value;
    setAppearance({ ...appearance, [name]: newValue });
    // Save appearance settings to localStorage
    localStorage.setItem(name, newValue.toString());
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      await SettingsService.updateUserProfile(profileData);
      showSnackbar('Profile updated successfully', 'success');
      setLoading(false);
    } catch (err) {
      showSnackbar('Failed to update profile', 'error');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showSnackbar("Passwords don't match", 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      await SettingsService.changePassword({
        new_password: passwordData.new_password,
        is_superuser: profileData.is_superuser
      });
      
      showSnackbar('Password updated successfully', 'success');
      
      // Reset form
      setPasswordData({
        new_password: '',
        confirm_password: ''
      });
      
      setLoading(false);
    } catch (err) {
      showSnackbar('Failed to update password', 'error');
      setLoading(false);
    }
  };

  const handleAppearanceSubmit = (e) => {
    e.preventDefault();
    // All appearance changes are already saved to localStorage on change
    showSnackbar('Appearance settings saved', 'success');
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("supertoken");
    navigate(RouterPath.ADMIN_LOGIN);
  };

  return (
    <div className='flex-1 flex flex-col mt-14 mb-8 mr-8 ml-2'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Settings</h1>
        {/* {isPro && <span className="bg-blue-500 text-white px-2 py-1 rounded">Pro User</span>} */}
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
                  <label className="block text-gray-700 mb-2" htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="w-full px-3 py-2 border rounded"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </div>
                <div className='flex-1'>
                  <label className="block text-gray-700 mb-2" htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="w-full px-3 py-2 border rounded"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className="flex mt-6">
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                  disabled={loading}
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
                <label className="block text-gray-700 mb-2" htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  className="w-full px-3 py-2 border rounded"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="confirm_password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  className="w-full px-3 py-2 border rounded"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="flex mt-6">
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                  onClick={() => setPasswordData({
                    new_password: '',
                    confirm_password: ''
                  })}
                  disabled={loading}
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
                {/* <button 
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
                </button> */}
                <button 
                  type="button"
                  className="bg-gray-500 text-gray-700 border px-4 py-2 rounded"
                  disabled={true}
                >
                  Coming Soon
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