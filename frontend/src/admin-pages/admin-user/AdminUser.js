import React, { useState, useEffect } from 'react';
import Pagination from '../../components/admin_comps/Pagination';
import {  Pencil, Trash, MoreVertical } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems , Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import DataService from './AdminUserServices';
import { useSnackbar } from '../../provider/SnackbarProvider';

function AdminUser() {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  
  let PageSize = 5;
  const initItem = {
    id: null,
    last_name: '',
    first_name: '',
    email: '',
    is_active: true,
    is_superuser: false,
    password: '',
    confirm_password: '',
  }
  const MODEL_NAME = 'User';
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState(initItem);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const onRefresh = async () => {
    try {
      setLoading(true);
      const data = await DataService.getUsers(currentPage, PageSize);
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      showSnackbar('Failed to get users', 'error')
    } finally{
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const newItem = {
      last_name: editingItem.last_name,
      first_name: editingItem.first_name,
      email: editingItem.email,
      is_active: editingItem.is_active,
      is_superuser: editingItem.is_superuser,
      password: editingItem.password,
    };
    try {
      const response = await DataService.createUser(newItem);
      onRefresh();
      showSnackbar('User created successfully', 'success')
    }catch (error) {
      showSnackbar('Failed to create user', 'error')
    }

    setOpenEditModal(false);
  }

  const handleEdit = async () => {
    const updateItem = {
      last_name: editingItem.last_name,
      first_name: editingItem.first_name,
      email: editingItem.email,
      is_active: editingItem.is_active,
      is_superuser: editingItem.is_superuser,
      password: editingItem.password,
    };
    console.log('Updating item:', updateItem);
    try {
      const response = await DataService.updateUser(editingItem.id, updateItem);  
      onRefresh();
      showSnackbar('User updated successfully', 'success')
    }catch (error) {
      showSnackbar('Failed to update user', 'error')

    }
    setOpenEditModal(false);
  };

  const handleDelete = async () => {
    try{
      const response = await DataService.deleteUser(editingItem.id);  
      onRefresh();
      showSnackbar('User deleted successfully', 'success')
    }catch(error){
      showSnackbar('Failed to delete user', 'error')
    }
    setOpenDeleteModal(false);
  };

  useEffect(() => {
    onRefresh(); 
  }, [currentPage]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingItem.password !== editingItem.confirm_password) {
      return;
    }
    console.log('Submitting form:', editingItem);
    editingItem.id ? handleEdit() : handleAdd();
  };

  return (
    <div className="flex-1 flex flex-col mt-14 mb-8 mr-8 ml-2">
    <div className="flex w-fit justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{MODEL_NAME} Management</h1>
    </div>
    
    <button onClick={() => {
                  setEditingItem(initItem);
                  setOpenEditModal(true);
                  }} 
            className="w-fit bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-6"
    >
      <span>+</span> Add {MODEL_NAME}
    </button>
    
    <div className="flex-1">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-gray-500">ID</th>
            <th className="text-left py-3 px-4 text-gray-500">FULL NAME</th>
            <th className="text-left py-3 px-4 text-gray-500">EMAIL</th>
            <th className="text-left py-3 px-4 text-gray-500">ROLE</th>
            <th className="text-left py-3 px-4 text-gray-500">STATUS</th>
            <th className="text-left py-3 px-4 text-gray-500">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b">
              <td className="py-3 px-4">{item.id}</td>
              <td className="py-3 px-4 flex items-center gap-2">
                {item.last_name + ' ' + item.first_name}
              </td>
              <td className="py-3 px-4">{item.email}</td>
              <td className="py-3 px-4">{item.is_superuser ? 'Super User' : 'User'}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {item.is_active ? 'Active' : 'Inactive'}
                </div>
              </td>
              <td className="py-3 px-4 relative">
              <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <MenuButton className="inline-flex w-full justify-center gap-x-1.5 border-none rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </MenuButton>
                  </div>
                  <MenuItems
                    transition
                    className="absolute w-fit right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                  >
                    <div >
                      <MenuItem>
                        <button
                          onClick={() => {
                                      setOpenEditModal(true);
                                       setEditingItem({...item, confirm_password: item.password});
                                  }}
                          className="w-full flex gap-5 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          onClick={() => {
                                      setOpenDeleteModal(true);
                                      setEditingItem(item);
                                  }}
                          className="w-full flex gap-5 text-red-500 block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                          Delete
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>


              </td>
            </tr>
          ))}
        </tbody>
        {loading && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
      </table>
      <Pagination
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={total}
        pageSize={PageSize}
        onPageChange={page => setCurrentPage(page)}
      />
    </div>

          {/* Modal for adding/editing users */}
    <Dialog open={openEditModal} onClose={() => {}}  className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="p-4 relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{initItem.id ? 'Edit' : 'Add'} {MODEL_NAME}</h2>
              <button type='button' onClick={() => setOpenEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            
            <form
                onSubmit={handleSubmit}
                >
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingItem.email}
                    onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex flex-row gap-4">
                  <div className="mb-4 flex-1">
                    <label className="block text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={editingItem.last_name}
                      onChange={(e) => setEditingItem({ ...editingItem, last_name: e.target.value })}
                    />
                  </div>

                  <div className="mb-4 flex-1">
                    <label className="block text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={editingItem.first_name}
                      onChange={(e) => setEditingItem({ ...editingItem, first_name: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Set Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingItem.password}
                    onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingItem.confirm_password}
                    onChange={(e) => setEditingItem({ ...editingItem, confirm_password: e.target.value })}
                  />
                </div>
                {editingItem.password !== editingItem.confirm_password && (
                    <div className="text-red-500 text-sm mb-4">
                      Passwords do not match!
                    </div>
                  )}
                
                <div className='flex flex-row'>

                  <div className="flex items-center mr-6">
                    <input
                      type="checkbox"
                      id="isSuperuser"
                      className="mr-2 accent-teal-500 w-4 h-4"
                      checked={editingItem.is_superuser}
                      onChange={(e) => setEditingItem({ ...editingItem, is_superuser: e.target.checked})}
                    />
                    
                    <label htmlFor="isSuperuser">Is superuser?</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="mr-2 w-4 h-4 accent-teal-500"
                      checked={editingItem.is_active}
                      onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked})}
                    />
                    <label htmlFor="isActive">Is active?</label>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                    type='submit'
                  >
                    Save
                  </button>
                  <button
                  type='button'
                    onClick={() => setOpenEditModal(false)}
                    className="bg-white hover:bg-gray-100 text-gray-700 border px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              
          </DialogPanel>
        </div>
      </div>
    </Dialog>

    {/* Modal for deleting users */}
    <Dialog open={openDeleteModal} onClose={() => {}} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                  <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                    Delete {MODEL_NAME}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this {MODEL_NAME}? All of their data will be removed from the system.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={() => handleDelete()}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
              >
                Delete
              </button>
              <button
                type="button"
                data-autofocus
                onClick={() => setOpenDeleteModal(false)}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </div>
  );
}

export default AdminUser;