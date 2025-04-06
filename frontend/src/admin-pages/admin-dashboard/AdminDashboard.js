import React from 'react';

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
            </header>
            <div className="dashboard-content">
                <div className="dashboard-card">
                    <h2>Users</h2>
                    <p>Manage users and their roles.</p>
                </div>
                <div className="dashboard-card">
                    <h2>Reports</h2>
                    <p>View system reports and analytics.</p>
                </div>
                <div className="dashboard-card">
                    <h2>Settings</h2>
                    <p>Configure system settings.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;