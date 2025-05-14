import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { CreditCard, Pencil, Trash, MoreVertical, DollarSign } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Pagination from '../../components/admin_comps/Pagination';
import PaymentService from './AdminPaymentServices';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { button } from 'leva';

function AdminPayment() {
  const { showSnackbar } = useSnackbar();
  let PageSize = 5;
  
  const ENTITY_NAME = 'Payment';
  const initItem = {
    id: '',
    amount: 0,
    payment_plan: '',
    expired_at: '',
    payer_id: '',
    payer: {
      email: ''
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState(initItem);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], amounts: [] });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Format date strings to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    currencyDisplay: 'code'
  }).format(amount).replace('VND', '').trim() + ' ₫';
};

  const loadChartData = async (period = 'week') => {
    try {
      setLoading(true);
      let days;
      
      switch(period) {
        case 'week':
          days = 7;
          break;
        case 'month':
          days = 30;
          break;
        case 'year':
          days = 365;
          break;
        case 'total':
          days = 'all';
          break;
        default:
          days = 7;
      }
      
      const data = await PaymentService.getPaymentsByDay(days);
      setChartData(data);
      setSelectedPeriod(period);
    } catch (error) {
      showSnackbar('Failed to load chart data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setLoading(true);
      const data = await PaymentService.getPayments(currentPage, PageSize);
      setItems(data.items || []);
      setTotal(data.total || 0);
      await loadChartData(selectedPeriod);
    } catch (error) {
      showSnackbar('Failed to get payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const paymentData = {
        amount: parseFloat(editingItem.amount),
        payment_plan: editingItem.payment_plan,
      };
      
      await PaymentService.createPayment(editingItem.payer_id, paymentData);
      onRefresh();
      showSnackbar('Payment created successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to create payment', 'error');
    }
    setOpenEditModal(false);
  };

  const handleEdit = async () => {
    try {
      const updateData = {
        expired_at: new Date(editingItem.expired_at).toISOString()
      };
      
      await PaymentService.updatePayment(editingItem.id, updateData);
      onRefresh();
      showSnackbar('Payment updated successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to update payment', 'error');
    }
    setOpenEditModal(false);
  };

  const handleDelete = async () => {
    try {
      await PaymentService.deletePayment(editingItem.id);
      onRefresh();
      showSnackbar('Payment deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete payment', 'error');
    }
    setOpenDeleteModal(false);
  };

  useEffect(() => {
    onRefresh();
  }, [currentPage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    editingItem.id ? handleEdit() : handleAdd();
  };

  // Function to handle period button click
  const handlePeriodChange = (period) => {
    loadChartData(period);
  };

  // Helper function to get button style based on selectedPeriod
  const getPeriodButtonStyle = (period) => {
    return selectedPeriod === period 
      ? 'bg-teal-600 text-white rounded px-4 py-1' 
      : 'bg-teal-500 hover:bg-teal-600 text-white rounded px-4 py-1';
  };

  return (
    <div className="flex-1 flex flex-col mt-14 pb-[5rem] mr-8 ml-2">
      <div className="flex w-fit justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{ENTITY_NAME} Management</h1>
      </div>
      
      {/* Payment Analytics Chart */}
      <div className="bg-white flex-1 border rounded-lg shadow-md mb-6">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Payment Analytics</h2>
          </div>
          <div className="flex flex-row justify-center items-center">
            <LineChart
              xAxis={[{ 
                data: chartData.labels,
                label: 'Date',
                scaleType: 'band'
              }]}
              series={[
                {
                  data: chartData.amounts,
                  area: true,
                  color: '#0D9488', // Teal color
                  label: 'Amount ($)',
                  showMark: true,
                },
              ]}
              width={1000}
              height={300}
              sx={{
                '.MuiLineElement-root': {
                  strokeWidth: 2,
                },
                '.MuiAreaElement-root': {
                  fillOpacity: 0.2,
                }
              }}
            />
            <div className='flex flex-col gap-4 mr-8'>
                <button 
                  onClick={() => handlePeriodChange('week')}
                  className={getPeriodButtonStyle('week')}
                >
                  Week
                </button>
                <button 
                  onClick={() => handlePeriodChange('month')}
                  className={getPeriodButtonStyle('month')}
                >
                  Month
                </button>
                <button 
                  onClick={() => handlePeriodChange('year')}
                  className={getPeriodButtonStyle('year')}
                >
                  Year
                </button>
                <button 
                  onClick={() => handlePeriodChange('total')}
                  className={getPeriodButtonStyle('total')}
                >
                  Total
                </button>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => {
          setEditingItem(initItem);
          setOpenEditModal(true);
        }} 
        className="w-fit bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-6"
      >
        <CreditCard /> Add {ENTITY_NAME}
      </button>
      
      <div className="flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-gray-500">ID</th>
              <th className="text-left py-3 px-4 text-gray-500">AMOUNT</th>
              <th className="text-left py-3 px-4 text-gray-500">PAYMENT PLAN</th>
              <th className="text-left py-3 px-4 text-gray-500">PAYER</th>
              <th className="text-left py-3 px-4 text-gray-500">CREATED</th>
              <th className="text-left py-3 px-4 text-gray-500">EXPIRES</th>
              <th className="text-left py-3 px-4 text-gray-500">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-3 px-4">{item.id}</td>
                <td className="py-3 px-4 font-medium">{formatCurrency(item.amount)}</td>
                <td className="py-3 px-4">{item.payment_plan}</td>
                <td className="py-3 px-4">{item.payer?.email || 'Unknown'}</td>
                <td className="py-3 px-4">{formatDate(item.created_at)}</td>
                <td className="py-3 px-4">{formatDate(item.expired_at)}</td>
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
                      <div>
                        <MenuItem>
                          <button
                            onClick={() => {
                              setOpenEditModal(true);
                              setEditingItem({...item});
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
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7" className="py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={total}
          pageSize={PageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Modal for adding/editing payments */}
      <Dialog open={openEditModal} onClose={() => {}} className="relative z-10">
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
                <h2 className="text-xl font-bold">{editingItem.id ? 'Edit' : 'Add'} {ENTITY_NAME}</h2>
                <button type='button' onClick={() => setOpenEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {editingItem.id && (
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Payment ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                      value={editingItem.id || ''}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Amount {!editingItem.id && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-10 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={editingItem.amount}
                      onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                      required={!editingItem.id}
                      disabled={true}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Payment Plan {!editingItem.id && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editingItem.payment_plan}
                    onChange={(e) => setEditingItem({ ...editingItem, payment_plan: e.target.value })}
                    required={!editingItem.id}
                    disabled={editingItem.id}
                  >
                    <option value="">Select a plan</option>
                    <option value="Monthly Membership">Monthly Membership</option>
                    <option value="Yearly Membership">Yearly Membership</option>
                    <option value="Lifetime Membership">Lifetime Membership</option>
                  </select>
                </div>

                {!editingItem.id && (
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Payer ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={editingItem.payer_id}
                      onChange={(e) => setEditingItem({ ...editingItem, payer_id: e.target.value })}
                      required
                    />
                  </div>
                )}

                {editingItem.id && (
                  <>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Payer Email</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                        value={editingItem.payer?.email || ''}
                        disabled
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Created At</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                        value={formatDate(editingItem.created_at) || ''}
                        disabled
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">
                        Expires At <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={editingItem.expired_at ? new Date(editingItem.expired_at).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingItem({ ...editingItem, expired_at: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mr-2"
                    type='submit'
                  >
                    {editingItem.id ? 'Save' : 'Create'}
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

      {/* Modal for deleting payment */}
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
                      Delete {ENTITY_NAME}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this payment record for {formatCurrency(editingItem.amount)}? 
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

export default AdminPayment;