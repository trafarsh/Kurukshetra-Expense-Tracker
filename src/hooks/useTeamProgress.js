import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export function useTeamProgress() {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchTimeline() {
    setLoading(true);
    try {
      const q = query(collection(db, 'teamProgress'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTimelineData(items);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTimeline();
  }, []);

  async function handleAdd(newDate, newCategory, newDescription) {
    if (!newDate || !newDescription.trim()) return;
    await addDoc(collection(db, 'teamProgress'), {
      date: newDate,
      category: newCategory,
      description: newDescription.trim(),
      createdAt: serverTimestamp(),
    });
    await fetchTimeline();
  }

  async function handleUpdate(id, editDate, editCategory, editDescription) {
    if (!editDate || !editDescription.trim()) return;
    await updateDoc(doc(db, 'teamProgress', id), {
      date: editDate,
      category: editCategory,
      description: editDescription.trim(),
    });
    await fetchTimeline();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'teamProgress', id));
    await fetchTimeline();
  }

  return { timelineData, loading, refetch: fetchTimeline, handleAdd, handleUpdate, handleDelete };
}
