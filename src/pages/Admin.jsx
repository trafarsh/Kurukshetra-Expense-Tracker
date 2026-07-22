import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { logAudit } from '../utils/auditLogger';

export default function Admin() {
  const { userRole, currentUser } = useAuth();
  const userEmail = currentUser?.email || 'Unknown';
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  
  // Deadlines State
  const [deadlines, setDeadlines] = useState([]);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineDesc, setNewDeadlineDesc] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // New Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  
  // Custom Modal State for Edit Due
  const [editingDueMember, setEditingDueMember] = useState(null);
  const [newDueAmount, setNewDueAmount] = useState('');

  // Custom Modal State for Edit Category
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  
  // Seed initial categories if none exist
  const defaultCategories = ['Chassis', 'Engine', 'Tyres', 'Brakes', 'Steering', 'Transmission', 'Fuel', 'Event Fees', 'Miscellaneous'];

  useEffect(() => {
    if (userRole === 'admin') {
      fetchMembers();
      fetchCategories();
      fetchDeadlines();
      fetchAuditLogs();
    }
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
      // Seed categories
      for (const cat of defaultCategories) {
        await addDoc(collection(db, 'categories'), { name: cat });
      }
      fetchCategories();
    } else {
      setCategories(data);
    }
  }

  function openEditDueModal(member) {
    setEditingDueMember(member);
    setNewDueAmount(member.totalDue || 0);
  }

  async function handleSaveDue(e) {
    e.preventDefault();
    if (!editingDueMember) return;
    
    const val = Number(newDueAmount);
    if (!isNaN(val)) {
      await updateDoc(doc(db, 'members', editingDueMember.id), { totalDue: val });
      
      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userEmail: editingDueMember.id,
        message: `Admin updated your expected due to ₹${val.toLocaleString()}`,
        createdAt: new Date().toISOString(),
        read: false
      });

      await logAudit(userEmail, 'EDIT_DUE', `Updated expected due for ${editingDueMember.name} to ₹${val}`);
      setEditingDueMember(null);
      fetchMembers();
      fetchAuditLogs();
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addDoc(collection(db, 'categories'), { name: newCategory });
    await logAudit(userEmail, 'ADD_CATEGORY', `Created new category: ${newCategory.trim()}`);
    setNewCategory('');
    fetchCategories();
    fetchAuditLogs();
  }

  async function handleDeleteCategory(id) {
    if (window.confirm("Delete this category?")) {
      await deleteDoc(doc(db, 'categories', id));
      await logAudit(userEmail, 'DELETE_CATEGORY', `Deleted category ID: ${id}`);
      fetchCategories();
      fetchAuditLogs();
    }
  }

  function openEditCategoryModal(category) {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    if (!editingCategory || !editedCategoryName.trim()) return;
    
    await updateDoc(doc(db, 'categories', editingCategory.id), { name: editedCategoryName.trim() });
    await logAudit(userEmail, 'EDIT_CATEGORY', `Renamed category ${editingCategory.name} to ${editedCategoryName.trim()}`);
    setEditingCategory(null);
    fetchCategories();
    fetchAuditLogs();
  }

  async function handleAddDeadline(e) {
    e.preventDefault();
    if (!newDeadlineTitle.trim() || !newDeadlineDate) return;
    await addDoc(collection(db, 'deadlines'), {
      title: newDeadlineTitle.trim(),
      date: newDeadlineDate,
      description: newDeadlineDesc.trim()
    });
    await logAudit(userEmail, 'ADD_DEADLINE', `Created deadline: ${newDeadlineTitle.trim()}`);
    setNewDeadlineTitle('');
    setNewDeadlineDate('');
    setNewDeadlineDesc('');
    fetchDeadlines();
    fetchAuditLogs();
  }

  async function handleDeleteDeadline(id) {
    if (window.confirm("Delete this deadline?")) {
      await deleteDoc(doc(db, 'deadlines', id));
      await logAudit(userEmail, 'DELETE_DEADLINE', `Deleted deadline ID: ${id}`);
      fetchDeadlines();
      fetchAuditLogs();
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    
    const emailToSave = newMemberEmail.toLowerCase().trim();
    await setDoc(doc(db, 'members', emailToSave), {
      name: newMemberName.trim(),
      email: emailToSave,
      role: newMemberRole,
      totalDue: 0
    });
    
    await logAudit(userEmail, 'ADD_MEMBER', `Added member: ${newMemberName.trim()} (${emailToSave}) as ${newMemberRole}`);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('member');
    fetchMembers();
    fetchAuditLogs();
  }

  async function handleRemoveMember(id) {
    if (window.confirm("Are you sure you want to remove this member?")) {
      await deleteDoc(doc(db, 'members', id));
      await logAudit(userEmail, 'REMOVE_MEMBER', `Removed member: ${id}`);
      fetchMembers();
      fetchAuditLogs();
    }
  }

  if (userRole !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Control Panel</h1>
        <p className="text-muted-foreground text-slate-500 mt-1">Manage members, expected dues, and transaction categories.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
              <Input 
                value={newMemberName} 
                onChange={e => setNewMemberName(e.target.value)} 
                placeholder="Name" 
                required 
              />
              <Input 
                type="email"
                value={newMemberEmail} 
                onChange={e => setNewMemberEmail(e.target.value)} 
                placeholder="Email (@skcet.ac.in)" 
                required 
              />
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newMemberRole}
                onChange={e => setNewMemberRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit">Add Member</Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Expected Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div>{m.name}</div>
                      <div className="text-xs text-slate-500">{m.email || m.id}</div>
                    </TableCell>
                    <TableCell className="capitalize text-xs text-slate-500">{m.role}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">₹{(m.totalDue || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDueModal(m)}>Edit Due</Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveMember(m.id)}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name..." />
              <Button type="submit">Add</Button>
            </form>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCategoryModal(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteCategory(c.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deadlines Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Deadlines & Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDeadline} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
              <Input 
                value={newDeadlineTitle} 
                onChange={e => setNewDeadlineTitle(e.target.value)} 
                placeholder="Deadline Title" 
                required 
              />
              <Input 
                type="date"
                value={newDeadlineDate} 
                onChange={e => setNewDeadlineDate(e.target.value)} 
                required 
              />
              <Input 
                value={newDeadlineDesc} 
                onChange={e => setNewDeadlineDesc(e.target.value)} 
                placeholder="Short Description" 
              />
              <Button type="submit">Add Deadline</Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-bold text-slate-800">{d.title}</TableCell>
                    <TableCell className="text-slate-600">{new Date(d.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{d.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDeadline(d.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {deadlines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-4">No deadlines set.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity Audit Log Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity Audit Log (History) 🕒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{log.userEmail}</TableCell>
                      <TableCell>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{log.details}</TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-4">No audit logs found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-0">
            <CardHeader className="border-b bg-slate-50/80 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle>Edit Category</CardTitle>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </CardHeader>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Update name for category <strong className="text-slate-900">{editingCategory.name}</strong>.
                </p>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Category Name</label>
                <Input 
                  type="text" 
                  value={editedCategoryName} 
                  onChange={(e) => setEditedCategoryName(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingCategory(null)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Category</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Due Modal */}
      {editingDueMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl border-0">
            <CardHeader className="border-b bg-slate-50/80 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle>Edit Member Dues</CardTitle>
              <button onClick={() => setEditingDueMember(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </CardHeader>
            <form onSubmit={handleSaveDue} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  Update expected due for <strong className="text-slate-900">{editingDueMember.name}</strong>.
                </p>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">New Due Amount (₹)</label>
                <Input 
                  type="number" 
                  value={newDueAmount} 
                  onChange={(e) => setNewDueAmount(e.target.value)} 
                  required 
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingDueMember(null)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Dues</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
