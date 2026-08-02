import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLedger } from '../hooks/useLedger';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { PullToRefresh } from '../components/ui/pull-to-refresh';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, X, Receipt, Download, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';

export default function Ledger() {
  const { userRole, currentUser } = useAuth();
  const { transactions, members, categories, loading, refetch, saveTransaction, deleteTransaction } = useLedger();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [receivedBy, setReceivedBy] = useState('');
  const [whoPurchased, setWhoPurchased] = useState([]);
  const [billImage, setBillImage] = useState(null);

  function openAddModal() {
    setIsEditing(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setCategoryId('');
    setPaidBy('');
    setPaymentMode('UPI');
    setReceivedBy('');
    setWhoPurchased([]);
    setBillImage(null);
    setIsModalOpen(true);
  }

  function openEditModal(tx) {
    setIsEditing(true);
    setEditingId(tx.id);
    setDescription(tx.description);
    setAmount(tx.amount);
    setType(tx.type);
    setCategoryId(tx.categoryId || '');
    setPaidBy(tx.paidBy || '');
    setPaymentMode(tx.paymentMode || 'UPI');
    setReceivedBy(tx.receivedBy || '');
    setWhoPurchased(tx.whoPurchased || []);
    setBillImage(null);
    setIsModalOpen(true);
  }

  function togglePurchaser(email) {
    if (whoPurchased.includes(email)) {
      setWhoPurchased(whoPurchased.filter(e => e !== email));
    } else {
      setWhoPurchased([...whoPurchased, email]);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!description || !amount) return;
    setIsSaving(true);
    try {
      const txData = {
        description,
        amount: Number(amount),
        type,
        categoryId: categoryId || null,
        paidBy: type === 'income' ? paidBy : null,
        paymentMode: type === 'income' ? paymentMode : null,
        receivedBy: type === 'income' ? receivedBy : null,
        whoPurchased: type === 'expense' ? whoPurchased : [],
      };
      await saveTransaction({ isEditing, editingId, txData, billImage });
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving transaction: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  const handleDelete = (id, desc, amt) => {
    if (window.confirm("Are you sure you want to delete this transaction? (Dues will not be automatically refunded)")) {
      deleteTransaction(id, desc, amt);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-[60vh] w-full rounded-2xl" />
      </div>
    );
  }

  // Group transactions by Date String for Mobile Card View
  const groupedTxs = transactions.reduce((acc, tx) => {
    const dateStr = tx.createdAt ? new Date(tx.createdAt.toDate()).toLocaleDateString('en-GB') : 'Just now';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {});

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto relative min-h-screen">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ledger</h1>
            <p className="text-sm text-slate-500 mt-1">Manage all team transactions.</p>
          </div>
          {isDesktop && userRole === 'admin' && (
            <button onClick={openAddModal} className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          )}
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="bg-emerald-50 rounded-2xl p-4 md:p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Total Income</p>
            <p className="text-xl md:text-3xl font-bold text-emerald-700">₹{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-4 md:p-6 border border-rose-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Total Expenses</p>
            <p className="text-xl md:text-3xl font-bold text-rose-700">₹{totalExpense.toLocaleString()}</p>
          </div>
          <div className={`col-span-2 md:col-span-1 rounded-2xl p-4 md:p-6 shadow-sm border flex flex-col justify-between ${currentBalance >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 ${currentBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>Current Balance</p>
            <p className={`text-2xl md:text-3xl font-bold ${currentBalance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>₹{currentBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center">
              <Receipt className="w-12 h-12 text-slate-300 mb-3" />
              No transactions recorded yet.
            </div>
          ) : isDesktop ? (
            /* Desktop Table View */
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                    {userRole === 'admin' && <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {tx.createdAt ? new Date(tx.createdAt.toDate()).toLocaleDateString('en-GB') : 'Just now'}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{categories.find(c => c.id === tx.categoryId)?.name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-600">
                        {tx.type === 'income' && tx.paidBy && `Paid by: ${members.find(m => m.email === tx.paidBy)?.name || tx.paidBy}`}
                        {tx.type === 'expense' && tx.whoPurchased?.length > 0 && `Purchased by: ${tx.whoPurchased.map(email => members.find(m => m.email === email)?.name.split(' ')[0] || email).join(', ')}`}
                        {tx.billImageUrl && <a href={tx.billImageUrl} target="_blank" rel="noreferrer" className="block text-indigo-600 hover:underline mt-1 font-bold">View Bill</a>}
                      </td>
                      <td className={`py-4 px-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        {tx.type === 'income' && (
                          <button onClick={() => generateReceiptPDF(tx, members.find(m => m.email === tx.paidBy))} className="block ml-auto mt-2 text-indigo-600 hover:text-indigo-800 p-1">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                      {userRole === 'admin' && (
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button onClick={() => openEditModal(tx)} className="p-2 text-slate-400 hover:text-indigo-600 min-h-[44px] min-w-[44px]">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(tx.id, tx.description, tx.amount)} className="p-2 text-slate-400 hover:text-rose-600 min-h-[44px] min-w-[44px]">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Mobile Card View */
            <div className="flex flex-col">
              {Object.keys(groupedTxs).map(dateStr => (
                <div key={dateStr} className="mb-2">
                  <div className="bg-slate-50 px-4 py-2 sticky top-0 z-10 border-y border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dateStr}</h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {groupedTxs[dateStr].map(tx => (
                      <div key={tx.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 leading-tight">{tx.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {categories.find(c => c.id === tx.categoryId)?.name || tx.type}
                                </span>
                                {tx.type === 'expense' && tx.whoPurchased?.length > 0 && (
                                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                                    By: {tx.whoPurchased.map(email => members.find(m => m.email === email)?.name.split(' ')[0] || email).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ₹{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Row for Mobile */}
                        <div className="flex items-center justify-end gap-2 mt-1">
                          {tx.billImageUrl && (
                            <a href={tx.billImageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold min-h-[36px]">
                              <ImageIcon className="w-3.5 h-3.5" /> Bill
                            </a>
                          )}
                          {tx.type === 'income' && (
                            <button onClick={() => generateReceiptPDF(tx, members.find(m => m.email === tx.paidBy))} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold min-h-[36px]">
                              <Download className="w-3.5 h-3.5" /> Receipt
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <>
                              <button onClick={() => openEditModal(tx)} className="bg-slate-100 text-slate-500 p-2 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(tx.id, tx.description, tx.amount)} className="bg-rose-50 text-rose-500 p-2 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Admin FAB */}
        {!isDesktop && userRole === 'admin' && (
          <button 
            onClick={openAddModal}
            className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-transform z-30"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Fullscreen/Bottom Sheet Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center">
            <div className="w-full h-[90vh] md:h-auto md:max-w-lg bg-white md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 text-slate-400 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="txForm" onSubmit={handleSave} className="space-y-6">
                  
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <label className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <input type="radio" className="sr-only" checked={type === 'expense'} onChange={() => setType('expense')} /> Expense
                    </label>
                    <label className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      <input type="radio" className="sr-only" checked={type === 'income'} onChange={() => setType('income')} /> Income
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                      <input 
                        type="text" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="e.g. Bought motor" 
                        required 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount (₹)</label>
                        <input 
                          type="number" 
                          value={amount} 
                          onChange={(e) => setAmount(e.target.value)} 
                          placeholder="5000" 
                          min="1" 
                          required 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category</label>
                        <select 
                          value={categoryId} 
                          onChange={(e) => setCategoryId(e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                        >
                          <option value="">Select...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {type === 'income' && (
                    <div className="p-4 bg-emerald-50 rounded-2xl space-y-4 border border-emerald-100">
                      <div>
                        <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 block">Paid By</label>
                        <select 
                          value={paidBy} 
                          onChange={(e) => setPaidBy(e.target.value)} 
                          required 
                          className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white text-sm font-medium min-h-[44px]"
                        >
                          <option value="" disabled>Select member...</option>
                          {members.map(m => (
                            <option key={m.email} value={m.email}>{m.name} (Due: ₹{m.totalDue || 0})</option>
                          ))}
                        </select>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1.5 uppercase tracking-wider">Saving reduces their expected due automatically.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 block">Mode</label>
                          <select 
                            value={paymentMode} 
                            onChange={(e) => setPaymentMode(e.target.value)} 
                            className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white text-sm font-medium min-h-[44px]"
                          >
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 block">Received By</label>
                          <select 
                            value={receivedBy} 
                            onChange={(e) => setReceivedBy(e.target.value)} 
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-white text-sm font-medium min-h-[44px]"
                          >
                            <option value="" disabled>Select...</option>
                            <option value="Team Treasurer">Team Treasurer</option>
                            {members.filter(m => m.role === 'admin').map(m => (
                              <option key={m.email} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {type === 'expense' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Purchased By (Multiple)</label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 grid gap-1">
                          {members.map(m => (
                            <label key={m.email} className="flex items-center px-3 py-2.5 hover:bg-white rounded-lg cursor-pointer min-h-[44px]">
                              <input 
                                type="checkbox" 
                                checked={whoPurchased.includes(m.email)}
                                onChange={() => togglePurchaser(m.email)}
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="ml-3 text-sm font-medium text-slate-700">{m.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bill Image (Optional)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setBillImage(e.target.files[0])} 
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 min-h-[44px] cursor-pointer" 
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 pb-safe">
                <button 
                  type="submit" 
                  form="txForm"
                  disabled={isSaving}
                  className="w-full min-h-[56px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Transaction')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
