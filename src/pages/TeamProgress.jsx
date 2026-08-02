import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Flag, CheckCircle, Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeamProgress } from '../hooks/useTeamProgress';
import { PullToRefresh } from '../components/ui/pull-to-refresh';
import { Skeleton } from '../components/ui/skeleton';

const CATEGORY_COLORS = {
  Design: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Development: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Testing: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Final Review': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Goal: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-600' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

const CATEGORIES = ['Design', 'Development', 'Testing', 'Final Review', 'Goal', 'General'];
const FINAL_GOAL_DATE = '2026-09-25';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysRemaining() {
  const now = new Date();
  const goal = new Date(FINAL_GOAL_DATE);
  const diff = Math.ceil((goal - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function TeamProgress() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const { timelineData, loading, refetch, handleAdd, handleUpdate, handleDelete } = useTeamProgress();
  const daysLeft = getDaysRemaining();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');

  async function onAddSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await handleAdd(newDate, newCategory, newDescription);
    setNewDate('');
    setNewCategory('General');
    setNewDescription('');
    setShowAddForm(false);
    setSubmitting(false);
  }

  async function onUpdateSubmit(id) {
    setSubmitting(true);
    await handleUpdate(id, editDate, editCategory, editDescription);
    setEditingId(null);
    setSubmitting(false);
  }

  function startEditing(item) {
    setEditingId(item.id);
    setEditDate(item.date);
    setEditCategory(item.category);
    setEditDescription(item.description);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-8">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl ml-8" />
        <Skeleton className="h-24 w-full rounded-2xl ml-8" />
        <Skeleton className="h-24 w-full rounded-2xl ml-8" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="min-h-screen font-sans p-4 md:p-8 relative pb-24">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-2xl mx-auto"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
            Every Day. Every Bolt. Every Improvement.
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Team Progress Timeline</p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 inline-flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full px-6 py-3"
          >
            <Flag className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-slate-600 font-medium hidden md:inline">Final Goal:</span>
            <span className="text-sm font-bold text-indigo-700">25 Sep 2026</span>
            <span className="w-px h-5 bg-slate-200 mx-1"></span>
            <span className="text-sm font-bold text-indigo-600">{daysLeft} days left</span>
          </motion.div>
        </motion.div>

        {/* Admin Form */}
        <AnimatePresence>
          {isAdmin && showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-3xl mx-auto mb-8 overflow-hidden"
            >
              <form onSubmit={onAddSubmit} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-lg">New Timeline Entry</h3>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 p-2 min-w-[44px] min-h-[44px] flex justify-center items-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white min-h-[44px]"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="What was accomplished today?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[56px] bg-indigo-600 text-white text-base font-bold rounded-2xl shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Timeline */}
        <div className="max-w-3xl mx-auto">
          {timelineData.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No updates yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>

              <div className="space-y-0">
                {timelineData.map((item, idx) => {
                  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General;
                  const isGoal = item.category === 'Goal';
                  const isEditing = editingId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.4 }}
                      className="relative pl-16 md:pl-20 pb-8"
                    >
                      {/* Dot */}
                      <div className={`absolute left-4 md:left-6 top-1.5 w-5 h-5 rounded-full border-[3px] border-white shadow-sm ${isGoal ? 'bg-indigo-600 ring-4 ring-indigo-100' : colors.dot}`}></div>

                      {/* Card */}
                      <div className={`rounded-3xl p-5 border transition-shadow shadow-sm ${isGoal ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={editDate}
                                onChange={e => setEditDate(e.target.value)}
                                className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                              />
                              <select
                                value={editCategory}
                                onChange={e => setEditCategory(e.target.value)}
                                className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white min-h-[44px]"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <textarea
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none min-h-[44px]"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 min-h-[44px] font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => onUpdateSubmit(item.id)}
                                disabled={submitting}
                                className="flex-1 min-h-[44px] font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              >
                                {submitting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(item.date)}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                {item.category}
                              </span>
                              {isGoal && <CheckCircle className="w-4 h-4 text-indigo-600" />}

                              {isAdmin && (
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => window.confirm('Delete entry?') && handleDelete(item.id)}
                                    className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm md:text-base font-medium leading-relaxed ${isGoal ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {item.description}
                            </p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Admin FAB */}
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-95 transition-transform z-30"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </PullToRefresh>
  );
}
