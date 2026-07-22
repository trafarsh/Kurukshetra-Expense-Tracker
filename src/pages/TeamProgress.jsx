// src/pages/TeamProgress.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Flag, CheckCircle, Plus, Trash2, Edit3, X, Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// Category color mapping
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const daysLeft = getDaysRemaining();

  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // --- Firestore CRUD ---

  // READ
  async function fetchTimeline() {
    setLoading(true);
    try {
      const q = query(collection(db, 'teamProgress'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTimelineData(items);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTimeline();
  }, []);

  // CREATE
  async function handleAdd(e) {
    e.preventDefault();
    if (!newDate || !newDescription.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'teamProgress'), {
        date: newDate,
        category: newCategory,
        description: newDescription.trim(),
        createdAt: serverTimestamp(),
      });
      setNewDate('');
      setNewCategory('General');
      setNewDescription('');
      setShowAddForm(false);
      await fetchTimeline();
    } catch (err) {
      console.error('Error adding entry:', err);
    }
    setSubmitting(false);
  }

  // UPDATE
  async function handleUpdate(id) {
    if (!editDate || !editDescription.trim()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'teamProgress', id), {
        date: editDate,
        category: editCategory,
        description: editDescription.trim(),
      });
      setEditingId(null);
      await fetchTimeline();
    } catch (err) {
      console.error('Error updating entry:', err);
    }
    setSubmitting(false);
  }

  // DELETE
  async function handleDelete(id) {
    if (!window.confirm('Delete this timeline entry?')) return;
    try {
      await deleteDoc(doc(db, 'teamProgress', id));
      await fetchTimeline();
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);
    setEditDate(item.date);
    setEditCategory(item.category);
    setEditDescription(item.description);
  }

  return (
    <div className="min-h-screen font-sans">
      {isMobile && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-center text-sm font-medium">
          ⚠️ Please use a laptop or PC for the best experience.
        </div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Every Day. Every Bolt. Every Improvement.
        </h1>
        <p className="text-base text-slate-500 font-medium">Team Kurukshetra — Progress Timeline</p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 inline-flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full px-6 py-3"
        >
          <Flag className="w-5 h-5 text-indigo-500" />
          <span className="text-sm text-slate-600 font-medium">Final Goal:</span>
          <span className="text-sm font-bold text-indigo-700">25 Sep 2026</span>
          <span className="w-px h-5 bg-slate-200"></span>
          <span className="text-sm font-bold text-indigo-600">{daysLeft} days left</span>
        </motion.div>
      </motion.div>

      {/* Admin Add Button */}
      {isAdmin && (
        <div className="max-w-3xl mx-auto mb-6 flex justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Update'}
          </button>
        </div>
      )}

      {/* Admin Add Form */}
      <AnimatePresence>
        {isAdmin && showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-3xl mx-auto mb-8 overflow-hidden"
          >
            <form onSubmit={handleAdd} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-lg">New Timeline Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="What was accomplished today?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical Timeline */}
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-medium">Loading timeline...</p>
          </div>
        ) : timelineData.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No updates yet.</p>
            {isAdmin && <p className="text-sm text-slate-400 mt-1">Click "Add Update" to post the first entry.</p>}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

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
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    className="relative pl-16 pb-8"
                  >
                    {/* Dot on the line */}
                    <div className={`absolute left-4 top-1 w-5 h-5 rounded-full border-[3px] border-white shadow-sm ${isGoal ? 'bg-indigo-600 ring-4 ring-indigo-100' : colors.dot}`}></div>

                    {/* Card */}
                    <div className={`rounded-2xl p-5 border transition-shadow hover:shadow-md ${isGoal ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                      {isEditing ? (
                        /* Edit mode */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <textarea
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-4 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(item.id)}
                              disabled={submitting}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {submitting ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <>
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(item.date)}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {item.category}
                            </span>
                            {isGoal && <CheckCircle className="w-4 h-4 text-indigo-600" />}

                            {/* Admin actions */}
                            {isAdmin && (
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className={`text-sm font-medium leading-relaxed ${isGoal ? 'text-indigo-900' : 'text-slate-700'}`}>
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
    </div>
  );
}
