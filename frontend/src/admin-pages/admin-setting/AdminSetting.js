import React, { useState, useEffect } from 'react';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import { useNavigate, useOutletContext } from 'react-router-dom';
import SettingsService from './AdminSettingServices';
import { useSnackbar } from '../../provider/SnackbarProvider';

function AdminSetting() {
  const {user, setUser} = useOutletContext();
  console.log(user)
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

  const [envVariables, setEnvVariables] = useState([]);
  const [groupedEnvVars, setGroupedEnvVars] = useState({});
  const [editingVar, setEditingVar] = useState(null);
  const [updatedValue, setUpdatedValue] = useState('');
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [activeEnvGroup, setActiveEnvGroup] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);


  useEffect(() => {
    if (activeTab === 'environmentConfig' && user?.is_superuser) {
      loadEnvironmentVariables();
    }
  }, [activeTab, user]);

  const loadEnvironmentVariables = async () => {
    try {
      setLoadingEnv(true);
      const variables = await SettingsService.getEnvironmentVariables();
      setEnvVariables(variables);
      
      // Group the variables
      const grouped = groupEnvironmentVariables(variables);
      setGroupedEnvVars(grouped);
      
      setLoadingEnv(false);
    } catch (error) {
      showSnackbar('Failed to load environment variables', 'error');
      setLoadingEnv(false);
    }
  };

  const groupEnvironmentVariables = (variables) => {
    const groups = {
      application: [],
      google: [],
      stripe: [],
      smtp: [],
      other: []
    };

    variables.forEach(variable => {
      const key = variable.key.toLowerCase();
      
      if (key.includes('google')) {
        groups.google.push(variable);
      } else if (key.includes('stripe')) {
        groups.stripe.push(variable);
      } else if (key.includes('smtp') || key.includes('email') || key.includes('mail')) {
        groups.smtp.push(variable);
      } else if (key.includes('project') || key.includes('server') || key.includes('support')) {
        groups.application.push(variable);
      } else {
        groups.other.push(variable);
      }
    });

    return groups;
  };

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
    sessionStorage.clear();
    navigate(RouterPath.ADMIN_LOGIN);
  };

  const handleEditVariable = (variable) => {
    setEditingVar(variable.key);
    setUpdatedValue(variable.value === '****' ? '' : variable.value);
  };

  const handleCancelEdit = () => {
    setEditingVar(null);
    setUpdatedValue('');
  };

  const handleUpdateVariable = async (key) => {
    try {
      setLoadingEnv(true);
      await SettingsService.updateEnvironmentVariable(key, updatedValue);
      showSnackbar(`Environment variable ${key} updated successfully`, 'success');
      setEditingVar(null);
      setUpdatedValue('');
      await loadEnvironmentVariables();
    } catch (error) {
      showSnackbar('Failed to update environment variable', 'error');
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleReloadEnv = async () => {
    try {
      setLoadingEnv(true);
      await SettingsService.reloadEnvironmentVariables();
      showSnackbar('Environment variables reloaded successfully', 'success');
      await loadEnvironmentVariables();
    } catch (error) {
      showSnackbar('Failed to reload environment variables', 'error');
    } finally {
      setLoadingEnv(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoadingEnv(true);
      await SettingsService.createEnvBackup();
      showSnackbar('Environment backup created successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to create environment backup', 'error');
    } finally {
      setLoadingEnv(false);
    }
  };
  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    
    // Reset "Copied" text after 2 seconds
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };
  const renderEnvVariablesTable = (variables) => {
    if (!variables || variables.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">No environment variables in this group</div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variable</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {variables.map((variable) => (
          <tr key={variable.key}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {variable.key}
              {variable.sensitive && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                  Sensitive
                </span>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
              {editingVar === variable.key ? (
                <input
                  type={variable.sensitive ? "password" : "text"}
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                  placeholder={variable.sensitive ? "Enter new value" : ""}
                />
              ) : (
                <div className="flex items-center">
                  <span 
                    className={`font-mono ${variable.sensitive ? "text-red-500" : ""} truncate`}
                    title={variable.value}
                  >
                    {variable.value}
                  </span>
                  {variable.value.length > 30 && (
                    <button
                      className={`ml-2 text-xs ${copiedKey === variable.key ? "text-green-500" : "text-blue-500 hover:text-blue-700"}`}
                      onClick={() => handleCopy(variable.value, variable.key)}
                    >
                      {copiedKey === variable.key ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {editingVar === variable.key ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleUpdateVariable(variable.key, updatedValue);
                      setEditingVar(null);
                    }}
                    className="text-green-600 hover:text-green-900"
                    disabled={loadingEnv}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-gray-900"
                    disabled={loadingEnv}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditVariable(variable)}
                  className="text-blue-600 hover:text-blue-900"
                  disabled={loadingEnv || editingVar !== null}
                >
                  Edit
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    );
  };

  // Only show Environment Config tab for superusers
  const isAdmin = user?.is_superuser === true;

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
          {isAdmin && (
            <button 
              className={`py-2 px-4 ${activeTab === 'environmentConfig' ? 'border-b-2 border-teal-500 text-teal-500' : ''}`}
              onClick={() => setActiveTab('environmentConfig')}
            >
              Environment Config
            </button>
          )}
        </div>
      </div>
      
      <div className="max-w-8xl">
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

        {activeTab === 'environmentConfig' && isAdmin && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Environment Configuration</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleReloadEnv}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  disabled={loadingEnv}
                >
                  Reload Env
                </button>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  disabled={loadingEnv}
                >
                  Create Backup
                </button>
              </div>
            </div>
            
            {loadingEnv ? (
              <div className="py-4 text-center">Loading environment variables...</div>
            ) : (
              <>
                <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'application' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('application')}
                  >
                    Application
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'google' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('google')}
                  >
                    Google Auth
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'stripe' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('stripe')}
                  >
                    Stripe
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'smtp' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('smtp')}
                  >
                    SMTP/Email
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${activeEnvGroup === 'other' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActiveEnvGroup('other')}
                  >
                    Other
                  </button>
                </div>
                
                <div className="border rounded overflow-hidden">
                  {activeEnvGroup === 'all' ? (
                    <>
                      {Object.keys(groupedEnvVars).map(group => (
                        <div key={group} className="mb-6">
                          <h3 className="text-md font-medium px-6 py-2 bg-gray-100 capitalize">{group.replace('_', ' ')}</h3>
                          {renderEnvVariablesTable(groupedEnvVars[group])}
                        </div>
                      ))}
                    </>
                  ) : (
                    renderEnvVariablesTable(groupedEnvVars[activeEnvGroup] || [])
                  )}
                </div>
              </>
            )}
            <div className="my-4 text-sm text-gray-500">
              <p>Note: Some variables (marked as sensitive) will be masked for security purposes.</p>
              <p>Changes to environment variables may require a server restart to take full effect.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminSetting;