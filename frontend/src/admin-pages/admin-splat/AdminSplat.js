import React, { useState } from 'react';
// import { Button, Table, Modal, Form } from 'react-bootstrap';
// import { ThreeDotsVertical } from 'react-bootstrap-icons';

function AdminSplat() {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([
    { id: 1, title: 'Item #1', description: 'Item description' },
    { id: 2, title: 'Item #2', description: 'Item description' }
  ]);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    setNewItem({ title: '', description: '' });
  };
  
  const handleShowModal = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const itemToAdd = {
      id: items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1,
      title: newItem.title,
      description: newItem.description
    };
    
    setItems([...items, itemToAdd]);
    handleCloseModal();
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <div className="page-content">
     
    </div>
  );
}

export default AdminSplat;