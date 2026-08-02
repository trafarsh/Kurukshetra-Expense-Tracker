import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logAudit } from '../utils/auditLogger';

export function useLedger() {
  const { userEmail } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
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

  useEffect(() => {
    fetchData();
  }, []);

  async function uploadToImgBB(file) {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) throw new Error("ImgBB API key is missing.");

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

  async function saveTransaction({ isEditing, editingId, txData, billImage }) {
    if (txData.type === 'expense' && billImage) {
      txData.billImageUrl = await uploadToImgBB(billImage);
    }

    if (isEditing) {
      txData.updatedAt = serverTimestamp();
      await updateDoc(doc(db, 'transactions', editingId), txData);
      await logAudit(userEmail, 'EDIT_TRANSACTION', `Edited ${txData.type} transaction: ₹${txData.amount} - ${txData.description}`);
    } else {
      txData.createdAt = serverTimestamp();

      // Handle Dues Reduction
      if (txData.type === 'income' && txData.paidBy) {
        const memberRef = doc(db, 'members', txData.paidBy);
        const memberSnap = await getDoc(memberRef);
        
        if (memberSnap.exists()) {
          const mData = memberSnap.data();
          const currentDue = mData.totalDue || 0;
          await updateDoc(memberRef, { totalDue: Math.max(0, currentDue - txData.amount) });
        }
      }

      await addDoc(collection(db, 'transactions'), txData);
      await logAudit(userEmail, 'ADD_TRANSACTION', `Added ${txData.type} transaction: ₹${txData.amount} - ${txData.description}`);
    }
    
    await fetchData();
  }

  async function deleteTransaction(id, txDesc, txAmount) {
    await deleteDoc(doc(db, 'transactions', id));
    await logAudit(userEmail, 'DELETE_TRANSACTION', `Deleted transaction: ₹${txAmount} - ${txDesc}`);
    await fetchData();
  }

  return { 
    transactions, 
    members, 
    categories, 
    loading, 
    refetch: fetchData,
    saveTransaction,
    deleteTransaction
  };
}
