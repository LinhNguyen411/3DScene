import React, { useState, useEffect } from 'react';
import Pagination from '../../components/admin_comps/Pagination';
import DataService from './AdminOrderServices';
import { useSnackbar } from '../../provider/SnackbarProvider';


function AdminOrder() {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);



  let PageSize = 5;
  const MODEL_NAME = 'Model';
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);




  const onRefresh = async () => {
    try {
      setLoading(true);
      console.log('Refreshing models...');
      const data = await DataService.getOrders(currentPage, PageSize);
      console.log('Fetched models:', data);
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      showSnackbar('Failed to get Orders', 'error')
    } finally{
      setLoading(false)
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(amount).replace('VND', '').trim() + ' ₫';
  };
  useEffect(() => {
    onRefresh(); 
  }, [currentPage]);


  return (
    <div className="flex-1 flex flex-col mt-14 mb-8 mr-8 ml-2">
    <div className="flex w-fit justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{MODEL_NAME} Management</h1>
    </div>
    
    <div className="flex-1">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-gray-500">ID</th>
            <th className="text-left py-3 px-4 text-gray-500">USER</th>
            <th className="text-left py-3 px-4 text-gray-500">AMOUNT</th>
            <th className="text-left py-3 px-4 text-gray-500">DATE CREATED</th>
            <th className="text-left py-3 px-4 text-gray-500">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b">
              <td className="py-3 px-4" title={item.id}>
                {item.id}
              </td>
              <td className="py-3 px-4">{item.orderer.email}</td>
              <td className="py-3 px-4">{formatCurrency(item.amount)}</td>
              <td className="py-3 px-4">{item.created_at}</td> 
              <td className="py-3 px-4">{item.status}</td>
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


  </div>
  );
}

export default AdminOrder;