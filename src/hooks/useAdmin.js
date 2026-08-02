import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { logAudit } from '../utils/auditLogger';

export function useAdmin() {
  const { userRole, userEmail } = useAuth();
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultCategories = ['Chassis', 'Engine', 'Tyres', 'Brakes', 'Steering', 'Transmission', 'Fuel', 'Event Fees', 'Miscellaneous'];

  async function fetchAllAdminData() {
    if (userRole !== 'admin') return;
    setLoading(true);
    await Promise.all([
      fetchMembers(),
      fetchCategories(),
      fetchDeadlines(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAllAdminData();
  }, [userRole]);

  async function fetchAuditLogs() {
    const snap = await getDocs(collection(db, 'audit_logs'));
    const data = [];
    snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAuditLogs(data);
  }

  async function fetchDeadlines() {
    const snap = await getDocs(collection(db, 'deadlines'));
    const data = [];
    snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    setDeadlines(data);
  }

  async function fetchMembers() {
    const snap = await getDocs(collection(db, 'members'));
    const data = [];
    snap.forEach(doc => {
      if (doc.data().email !== 'mohamedarshad1507@gmail.com') {
        data.push({ id: doc.id, ...doc.data() });
      }
    });
    setMembers(data);
  }

  async function fetchCategories() {
    const snap = await getDocs(collection(db, 'categories'));
    const data = [];
    snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    
    if (data.length === 0) {
      for (const cat of defaultCategories) {
        await addDoc(collection(db, 'categories'), { name: cat });
      }
      return fetchCategories();
    } else {
      setCategories(data);
    }
  }

  async function handleSaveDue(member, newDueAmount) {
    const val = Number(newDueAmount);
    if (!isNaN(val)) {
      await updateDoc(doc(db, 'members', member.id), { totalDue: val });
      
      await addDoc(collection(db, 'notifications'), {
        userEmail: member.id,
        message: `Admin updated your expected due to ₹${val.toLocaleString()}`,
        createdAt: new Date().toISOString(),
        read: false
      });

      await logAudit(userEmail, 'EDIT_DUE', `Updated expected due for ${member.name} to ₹${val}`);
      await fetchMembers();
      await fetchAuditLogs();
    }
  }

  async function handleAddCategory(name) {
    if (!name.trim()) return;
    await addDoc(collection(db, 'categories'), { name: name.trim() });
    await logAudit(userEmail, 'ADD_CATEGORY', `Created new category: ${name.trim()}`);
    await fetchCategories();
    await fetchAuditLogs();
  }

  async function handleDeleteCategory(id) {
    await deleteDoc(doc(db, 'categories', id));
    await logAudit(userEmail, 'DELETE_CATEGORY', `Deleted category ID: ${id}`);
    await fetchCategories();
    await fetchAuditLogs();
  }

  async function handleSaveCategory(id, currentName, newName) {
    if (!newName.trim()) return;
    await updateDoc(doc(db, 'categories', id), { name: newName.trim() });
    await logAudit(userEmail, 'EDIT_CATEGORY', `Renamed category ${currentName} to ${newName.trim()}`);
    await fetchCategories();
    await fetchAuditLogs();
  }

  async function handleAddDeadline(title, date, description) {
    if (!title.trim() || !date) return;
    await addDoc(collection(db, 'deadlines'), {
      title: title.trim(),
      date: date,
      description: description.trim()
    });
    await logAudit(userEmail, 'ADD_DEADLINE', `Created deadline: ${title.trim()}`);
    await fetchDeadlines();
    await fetchAuditLogs();
  }

  async function handleDeleteDeadline(id) {
    await deleteDoc(doc(db, 'deadlines', id));
    await logAudit(userEmail, 'DELETE_DEADLINE', `Deleted deadline ID: ${id}`);
    await fetchDeadlines();
    await fetchAuditLogs();
  }

  async function handleAddMember(name, email, role) {
    if (!name.trim() || !email.trim()) return;
    const emailToSave = email.toLowerCase().trim();
    await setDoc(doc(db, 'members', emailToSave), {
      name: name.trim(),
      email: emailToSave,
      role: role,
      totalDue: 0
    });
    await logAudit(userEmail, 'ADD_MEMBER', `Added member: ${name.trim()} (${emailToSave}) as ${role}`);
    await fetchMembers();
    await fetchAuditLogs();
  }

  async function handleRemoveMember(id) {
    await deleteDoc(doc(db, 'members', id));
    await logAudit(userEmail, 'REMOVE_MEMBER', `Removed member: ${id}`);
    await fetchMembers();
    await fetchAuditLogs();
  }

  return {
    members, categories, deadlines, auditLogs, loading, refetch: fetchAllAdminData,
    handleSaveDue, handleAddCategory, handleDeleteCategory, handleSaveCategory,
    handleAddDeadline, handleDeleteDeadline, handleAddMember, handleRemoveMember
  };
}
