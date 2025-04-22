import React, { useState, useEffect } from 'react';
import { Save, User, Lock, Paintbrush, LogOut } from 'lucide-react';
import DataService from './ProfileSerivce';
import { useSnackbar } from '../../../provider/SnackbarProvider';
import { useOutletContext } from 'react-router-dom';

function Profile() {
  const { showSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const {user, fetchAuthData} = useOutletContext();

  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('theme') || 'light',
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false,
    fontSize: localStorage.getItem('fontSize') || 'medium'
  });

  useEffect(() => {
    setProfileData(user);
  }, []);

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
      await DataService.updateProfile(profileData);
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to update profile', 'error');
    } finally {
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
      await DataService.changePassword({
        current_password: passwordData.current_password,
        password: passwordData.new_password,
      });
      
      showSnackbar('Password updated successfully', 'success');
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      showSnackbar('Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSubmit = (e) => {
    e.preventDefault();
    showSnackbar('Appearance settings saved', 'success');
    // Reload page to apply new appearance settings
    // window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button 
            className={`py-2 px-4 flex items-center ${activeTab === 'profile' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </button>
          <button 
            className={`py-2 px-4 flex items-center ${activeTab === 'security' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock className="h-4 w-4 mr-2" />
            Security
          </button>
          <button 
            className={`py-2 px-4 flex items-center ${activeTab === 'appearance' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Paintbrush className="h-4 w-4 mr-2" />
            Appearance
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'profile' && profileData && (
          <>
            <h2 className="text-lg font-medium mb-4">Profile Information</h2>
            <form onSubmit={handleProfileSubmit}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={profileData.last_name}
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
                  className="w-full px-3 py-2 bg-gray-200 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled
                />
              </div>
              
              <div className="flex justify-end mt-6">
                <button 
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <h2 className="text-lg font-medium mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="flex justify-end mt-6">
                <button 
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </button>
              </div>
            </form>
          </>
        )}

        {activeTab === 'appearance' && (
          <>
            <h2 className="text-lg font-medium mb-4">Appearance Settings</h2>
            <form onSubmit={handleAppearanceSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  name="theme"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              
              <div className="flex justify-end mt-6">
                <button 
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;