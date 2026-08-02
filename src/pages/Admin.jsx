import { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { PullToRefresh } from '../components/ui/pull-to-refresh';
import { Skeleton } from '../components/ui/skeleton';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Users, Tag, Calendar, ShieldAlert, Plus, Trash2, Edit3, X, Save } from 'lucide-react';

export default function Admin() {
  const { userRole, actualRole } = useAuth();
  const {
    members, categories, deadlines, auditLogs, loading, refetch,
    handleSaveDue, handleAddCategory, handleDeleteCategory, handleSaveCategory,
    handleAddDeadline, handleDeleteDeadline, handleAddMember, handleRemoveMember
  } = useAdmin();
  
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [activeTab, setActiveTab] = useState('members'); // members, categories, deadlines, logs

  // Form states
  const [editingDueId, setEditingDueId] = useState(null);
  const [dueInput, setDueInput] = useState('');
  
  const [editingCatId, setEditingCatId] = useState(null);
  const [catInput, setCatInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineDesc, setNewDeadlineDesc] = useState('');

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  if (actualRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-[70vh] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-sm shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Manage team data and configurations.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto p-1 bg-slate-100 rounded-2xl snap-x scrollbar-hide">
          {[
            { id: 'members', label: 'Members', icon: Users },
            { id: 'categories', label: 'Categories', icon: Tag },
            { id: 'deadlines', label: 'Deadlines', icon: Calendar },
            { id: 'logs', label: 'Audit Logs', icon: ShieldAlert },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all snap-start ${
                  activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* --- MEMBERS TAB --- */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Add Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 min-h-[44px]" />
                <input type="email" placeholder="Email (@skcet.ac.in)" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 min-h-[44px]" />
                <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-100 min-h-[44px]">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => { handleAddMember(newMemberName, newMemberEmail, newMemberRole); setNewMemberName(''); setNewMemberEmail(''); }} className="bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors min-h-[44px]">Add Member</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {isDesktop ? (
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Expected Due</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">{m.name}</td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-500">{m.email}</td>
                          <td className="py-4 px-4"><span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{m.role}</span></td>
                          <td className="py-4 px-4 text-right">
                            {editingDueId === m.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <input type="number" value={dueInput} onChange={e => setDueInput(e.target.value)} className="w-24 px-2 py-1.5 border rounded-lg text-sm text-right font-medium min-h-[36px]" />
                                <button onClick={() => { handleSaveDue(m, dueInput); setEditingDueId(null); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg min-w-[36px] min-h-[36px]"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingDueId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-lg min-w-[36px] min-h-[36px]"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-3 group">
                                <span className="font-bold text-slate-700">₹{(m.totalDue || 0).toLocaleString()}</span>
                                <button onClick={() => { setEditingDueId(m.id); setDueInput(m.totalDue || 0); }} className="text-indigo-600 opacity-0 group-hover:opacity-100 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-indigo-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button onClick={() => window.confirm('Remove member?') && handleRemoveMember(m.id)} className="text-slate-400 hover:text-rose-600 min-w-[44px] min-h-[44px]"><Trash2 className="w-4 h-4 ml-auto" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {members.map(m => (
                    <div key={m.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m.role}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase">Expected Due:</span>
                        {editingDueId === m.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" value={dueInput} onChange={e => setDueInput(e.target.value)} className="w-20 px-2 py-1 border rounded-md text-sm text-right font-medium min-h-[36px]" />
                            <button onClick={() => { handleSaveDue(m, dueInput); setEditingDueId(null); }} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md min-h-[36px] min-w-[36px] flex items-center justify-center"><Check className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">₹{(m.totalDue || 0).toLocaleString()}</span>
                            <button onClick={() => { setEditingDueId(m.id); setDueInput(m.totalDue || 0); }} className="text-indigo-600 bg-indigo-50 p-1.5 rounded-md min-h-[36px] min-w-[36px] flex items-center justify-center"><Edit3 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => window.confirm('Remove member?') && handleRemoveMember(m.id)} className="text-xs font-bold text-rose-500 hover:text-rose-700 mt-1 self-end min-h-[36px] px-2 flex items-center">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="New Category Name" value={newCatInput} onChange={e => setNewCatInput(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 min-h-[44px]" />
              <button onClick={() => { handleAddCategory(newCatInput); setNewCatInput(''); }} className="bg-indigo-600 text-white font-bold rounded-xl px-6 min-h-[44px]">Add Category</button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  {editingCatId === c.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input type="text" value={catInput} onChange={e => setCatInput(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm font-medium min-h-[44px]" />
                      <button onClick={() => { handleSaveCategory(c.id, c.name, catInput); setEditingCatId(null); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg min-h-[44px] min-w-[44px]"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingCatId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-lg min-h-[44px] min-w-[44px]"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                  )}
                  {editingCatId !== c.id && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCatId(c.id); setCatInput(c.name); }} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg min-h-[44px] min-w-[44px]"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => window.confirm('Delete category?') && handleDeleteCategory(c.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-rose-50 rounded-lg min-h-[44px] min-w-[44px]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DEADLINES TAB --- */}
        {activeTab === 'deadlines' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">Add Deadline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Title" value={newDeadlineTitle} onChange={e => setNewDeadlineTitle(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 min-h-[44px]" />
                <input type="date" value={newDeadlineDate} onChange={e => setNewDeadlineDate(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 min-h-[44px]" />
              </div>
              <textarea placeholder="Description" value={newDeadlineDesc} onChange={e => setNewDeadlineDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-100 resize-none min-h-[44px]" />
              <button onClick={() => { handleAddDeadline(newDeadlineTitle, newDeadlineDate, newDeadlineDesc); setNewDeadlineTitle(''); setNewDeadlineDate(''); setNewDeadlineDesc(''); }} className="w-full md:w-auto bg-indigo-600 text-white font-bold rounded-xl px-6 min-h-[44px]">Add Deadline</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deadlines.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <button onClick={() => window.confirm('Delete deadline?') && handleDeleteDeadline(d.id)} className="text-slate-300 hover:text-rose-500 min-h-[44px] min-w-[44px] flex justify-center items-center rounded-full hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1 pr-8">{d.title}</h4>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">{new Date(d.date).toLocaleDateString('en-GB')}</p>
                  <p className="text-sm text-slate-600 font-medium">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- LOGS TAB --- */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-800 animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Audit Trail
            </h3>
            <div className="space-y-3 font-mono">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">No activity recorded.</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="text-indigo-400 font-bold">[{log.action}]</span> 
                      <span className="text-slate-400 ml-2">{log.userEmail}</span>
                      <p className="text-slate-200 mt-1">{log.details}</p>
                    </div>
                    <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </PullToRefresh>
  );
}

// Needed icon that wasn't imported
function Check(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );
}
