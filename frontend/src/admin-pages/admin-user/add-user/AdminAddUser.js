import React, { useState } from 'react';
// import { Modal, Button, Form } from 'react-bootstrap';

function AdminAddUser({ show, handleClose, handleAdd }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    
    const newUser = {
      email,
      fullName,
      role: isSuperuser ? 'Superuser' : 'User',
      status: isActive ? 'Active' : 'Inactive',
      isYou: false
    };
    
    handleAdd(newUser);
    
    // Reset form
    setEmail('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setIsSuperuser(false);
    setIsActive(true);
  };

  return (
    // <Modal show={show} onHide={handleClose} centered>
    //   <Modal.Header closeButton>
    //     <Modal.Title>Add User</Modal.Title>
    //   </Modal.Header>
    //   <Modal.Body>
    //     <Form onSubmit={handleSubmit}>
    //       <Form.Group className="mb-3">
    //         <Form.Label>Email <span className="text-danger">*</span></Form.Label>
    //         <Form.Control
    //           type="email"
    //           value={email}
    //           onChange={(e) => setEmail(e.target.value)}
    //           required
    //         />
    //       </Form.Group>
          
    //       <Form.Group className="mb-3">
    //         <Form.Label>Full name</Form.Label>
    //         <Form.Control
    //           type="text"
    //           value={fullName}
    //           onChange={(e) => setFullName(e.target.value)}
    //         />
    //       </Form.Group>
          
    //       <Form.Group className="mb-3">
    //         <Form.Label>Set Password <span className="text-danger">*</span></Form.Label>
    //         <Form.Control
    //           type="password"
    //           value={password}
    //           onChange={(e) => setPassword(e.target.value)}
    //           required
    //         />
    //       </Form.Group>
          
    //       <Form.Group className="mb-3">
    //         <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
    //         <Form.Control
    //           type="password"
    //           value={confirmPassword}
    //           onChange={(e) => setConfirmPassword(e.target.value)}
    //           required
    //         />
    //       </Form.Group>
          
    //       <div className="d-flex gap-4 mb-3">
    //         <Form.Check 
    //           type="checkbox"
    //           id="is-superuser"
    //           label="Is superuser?"
    //           checked={isSuperuser}
    //           onChange={(e) => setIsSuperuser(e.target.checked)}
    //         />
            
    //         <Form.Check 
    //           type="checkbox"
    //           id="is-active"
    //           label="Is active?"
    //           checked={isActive}
    //           onChange={(e) => setIsActive(e.target.checked)}
    //         />
    //       </div>
          
    //       <div className="d-flex justify-content-end gap-2 mt-4">
    //         <Button variant="secondary" onClick={handleClose}>
    //           Cancel
    //         </Button>
    //         <Button variant="success" type="submit">
    //           Save
    //         </Button>
    //       </div>
    //     </Form>
    //   </Modal.Body>
    // </Modal>
    <div></div>
  );
}

export default AdminAddUser;