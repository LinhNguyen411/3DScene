import React, { useState } from 'react';
import { Button, Table, Badge } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';
import AdminAddUser from './add-user/AdminAddUser';

function AdminUser() {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, fullName: 'N/A', email: 'admin@example.com', role: 'Superuser', status: 'Active', isYou: true },
    { id: 2, fullName: 'User', email: 'user@example.com', role: 'User', status: 'Active', isYou: false },
    { id: 3, fullName: 'User2', email: 'user2@example.com', role: 'User', status: 'Inactive', isYou: false }
  ]);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const handleAddUser = (newUser) => {
    newUser.id = users.length + 1;
    setUsers([...users, newUser]);
    handleCloseModal();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>User Management</h2>
        <Button 
          variant="primary" 
          className="add-button"
          onClick={handleShowModal}
        >
          + Add User
        </Button>
      </div>

      <div className="table-container">
        <Table hover className="user-table">
          <thead>
            <tr>
              <th>FULL NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  {user.fullName}
                  {user.isYou && <span className="you-tag">YOU</span>}
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <Badge 
                    bg={user.status === 'Active' ? 'success' : 'danger'} 
                    className="status-badge"
                    pill
                  >
                    {user.status}
                  </Badge>
                </td>
                <td>
                  <Button variant="light" className="action-button">
                    <ThreeDotsVertical />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <AdminAddUser 
        show={showModal} 
        handleClose={handleCloseModal}
        handleAdd={handleAddUser}
      />
    </div>
  );
}

export default AdminUser;