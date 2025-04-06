import React, { useState } from 'react';
import { Button, Form, Tab, Tabs } from 'react-bootstrap';

function AdminSetting({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
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
    <div className="page-content">
      <h2>User Settings</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 mt-4"
      >
        <Tab eventKey="profile" title="My profile">
          <div className="tab-content-wrapper">
            <h4 className="mb-3">User Information</h4>
            <Form onSubmit={handleProfileSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Full name</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                />
              </Form.Group>
              
              <div>
                <Button variant="success" type="submit" className="me-2">
                  Save
                </Button>
                <Button variant="secondary">
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Tab>
        
        <Tab eventKey="password" title="Password">
          <div className="tab-content-wrapper">
            <h4 className="mb-3">Change Password</h4>
            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Confirm New Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Form.Group>
              
              <div>
                <Button variant="success" type="submit" className="me-2">
                  Update Password
                </Button>
                <Button variant="secondary">
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </Tab>
        
        <Tab eventKey="appearance" title="Appearance">
          <div className="tab-content-wrapper">
            <h4 className="mb-3">Interface Settings</h4>
            <Form onSubmit={handleAppearanceSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Theme</Form.Label>
                <Form.Select
                  name="theme"
                  value={appearance.theme}
                  onChange={handleAppearanceChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Font Size</Form.Label>
                <Form.Select
                  name="fontSize"
                  value={appearance.fontSize}
                  onChange={handleAppearanceChange}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  id="sidebar-collapsed"
                  label="Collapse sidebar by default"
                  name="sidebarCollapsed"
                  checked={appearance.sidebarCollapsed}
                  onChange={handleAppearanceChange}
                />
              </Form.Group>
              
              <div>
                <Button variant="success" type="submit" className="me-2">
                  Save Settings
                </Button>
                <Button variant="secondary">
                  Reset to Defaults
                </Button>
              </div>
            </Form>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default AdminSetting;