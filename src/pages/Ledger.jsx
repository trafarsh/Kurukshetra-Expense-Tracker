import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { logAudit } from '../utils/auditLogger';

export default function Ledger() {
  const { userRole, currentUser } = useAuth();
  const userEmail = currentUser?.email || 'Unknown';
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
  
  // New Fields for Income
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [receivedBy, setReceivedBy] = useState('');
  
  // Multi-select for purchasers
  const [whoPurchased, setWhoPurchased] = useState([]);
  const [billImage, setBillImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const [txSnap, memSnap, catSnap] = await Promise.all([
        getDocs(q),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'categories'))
      ]);
      
      const txData = [];
      txSnap.forEach((doc) => txData.push({ id: doc.id, ...doc.data() }));
      setTransactions(txData);

      const memData = [];
      memSnap.forEach((doc) => {
        if (doc.data().email !== 'mohamedarshad1507@gmail.com') memData.push(doc.data());
      });
      setMembers(memData);

      const catData = [];
      catSnap.forEach((doc) => catData.push({ id: doc.id, ...doc.data() }));
      setCategories(catData);
    } catch (error) {
      console.error("Error fetching ledger data:", error);
    } finally {
      setLoading(false);
    }
  }

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

  async function uploadToImgBB(file) {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) throw new Error("ImgBB API key is missing. Add VITE_IMGBB_API_KEY to your .env file.");

    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'Upload failed');
    return data.data.url;
  }

  async function handleSaveTransaction(e) {
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
        updatedAt: serverTimestamp(),
      };

      // Handle ImgBB Upload
      if (type === 'expense' && billImage) {
        txData.billImageUrl = await uploadToImgBB(billImage);
      }

      if (isEditing) {
        await updateDoc(doc(db, 'transactions', editingId), txData);
        await logAudit(userEmail, 'EDIT_TRANSACTION', `Edited ${type} transaction: ₹${amount} - ${description}`);
      } else {
        txData.createdAt = serverTimestamp();

        // Handle Dues Reduction
        if (type === 'income' && paidBy) {
          const memberRef = doc(db, 'members', paidBy);
          const memberSnap = await getDoc(memberRef);
          
          if (memberSnap.exists()) {
            const mData = memberSnap.data();
            const currentDue = mData.totalDue || 0;
            await updateDoc(memberRef, { totalDue: Math.max(0, currentDue - txData.amount) });
          }
        }

        await addDoc(collection(db, 'transactions'), txData);
        await logAudit(userEmail, 'ADD_TRANSACTION', `Added ${type} transaction: ₹${amount} - ${description}`);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(`Failed to save transaction: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id, txDesc, txAmount) {
    if (!window.confirm("Are you sure you want to delete this transaction? (Dues will not be automatically refunded)")) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      await logAudit(userEmail, 'DELETE_TRANSACTION', `Deleted transaction: ₹${txAmount} - ${txDesc}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-8 p-2">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Club Ledger</h1>
          <p className="text-muted-foreground text-slate-500 mt-1">Manage and track all club income and expenses.</p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            + Add Transaction
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{currentBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No transactions yet. Add one to begin!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {userRole === 'admin' && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-slate-500 whitespace-nowrap text-xs">
                      {tx.createdAt ? new Date(tx.createdAt.toDate()).toLocaleDateString('en-GB') : 'Just now'}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {categories.find(c => c.id === tx.categoryId)?.name || 'None'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'income' ? 'default' : 'destructive'} className={tx.type === 'income' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs max-w-[200px] truncate">
                      {tx.type === 'income' && tx.paidBy && `Paid by: ${members.find(m => m.email === tx.paidBy)?.name || tx.paidBy}`}
                      {tx.type === 'expense' && tx.whoPurchased?.length > 0 && `Purchased by: ${tx.whoPurchased.map(email => members.find(m => m.email === email)?.name.split(' ')[0] || email).join(', ')}`}
                    </TableCell>
                    <TableCell className="text-xs">
                       {tx.billImageUrl && <a href={tx.billImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Bill</a>}
                       {tx.type === 'income' && (
                         <button onClick={() => generateReceiptPDF(tx, members.find(m => m.email === tx.paidBy))} className="text-blue-600 hover:underline ml-2">Download PDF</button>
                       )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </TableCell>
                    {userRole === 'admin' && (
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(tx)} className="h-8 px-2 text-blue-600">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id, tx.description, tx.amount)} className="h-8 px-2 text-red-600">Delete</Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-slate-50/80 px-6 py-4 flex flex-row items-center justify-between sticky top-0 z-10">
              <CardTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </CardHeader>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Transaction Type</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center p-2 border rounded-lg cursor-pointer bg-red-50/50 border-red-200">
                    <input type="radio" value="expense" checked={type === 'expense'} onChange={(e) => setType(e.target.value)} className="mr-2" />
                    <span className="text-sm font-medium text-red-700">Expense</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center p-2 border rounded-lg cursor-pointer bg-green-50/50 border-green-200">
                    <input type="radio" value="income" checked={type === 'income'} onChange={(e) => setType(e.target.value)} className="mr-2" />
                    <span className="text-sm font-medium text-green-700">Income</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Category</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Bought motor for kart" required />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Amount (₹)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" min="1" required />
              </div>

              {type === 'income' && (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-1 block">Paid By (Member)</label>
                    <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>
                      <option value="" disabled>Select member...</option>
                      {members.map(m => (
                        <option key={m.email} value={m.email}>{m.name} (Due: ₹{m.totalDue || 0})</option>
                      ))}
                    </Select>
                    <p className="text-xs text-blue-600 mt-1">Saving this will automatically reduce their due.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-1 block">Mode of Payment</label>
                    <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-blue-900 mb-1 block">Received By</label>
                    <Select value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} required>
                      <option value="" disabled>Select receiver...</option>
                      {members.filter(m => m.role === 'admin').map(m => (
                        <option key={m.email} value={m.name}>{m.name}</option>
                      ))}
                      <option value="Team Treasurer">Team Treasurer</option>
                      <option value="Admin">Admin</option>
                    </Select>
                  </div>
                </div>
              )}

              {type === 'expense' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Who Purchased It? (Multi-select)</label>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-slate-50/50">
                      {members.map(m => (
                        <label key={m.email} className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={whoPurchased.includes(m.email)}
                            onChange={() => togglePurchaser(m.email)}
                            className="rounded border-slate-300"
                          />
                          <span className="text-sm">{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Upload Bill Image</label>
                    <Input type="file" accept="image/*" onChange={(e) => setBillImage(e.target.files[0])} className="cursor-pointer" />
                    <p className="text-xs text-slate-500 mt-1">Uses free ImgBB API.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Transaction')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
