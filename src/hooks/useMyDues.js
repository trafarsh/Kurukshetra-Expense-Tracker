import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export function useMyDues() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchMyData() {
    setLoading(true);
    try {
      if (!currentUser?.email) return;

      // Fetch Personal Info
      const memberRef = doc(db, 'members', currentUser.email);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        setMemberInfo(memberSnap.data());
      }

      // Fetch Payments
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'income'),
        where('paidBy', '==', currentUser.email)
      );
      
      const snap = await getDocs(q);
      const data = [];
      snap.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setPayments(data);

      // Fetch all members for the team dues directory
      const allMemSnap = await getDocs(collection(db, 'members'));
      const allMemData = [];
      allMemSnap.forEach((doc) => {
        if (doc.data().email !== 'mohamedarshad1507@gmail.com') {
          allMemData.push(doc.data());
        }
      });
      setAllMembers(allMemData);

    } catch (error) {
      console.error("Error fetching dues:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyData();
  }, [currentUser]);

  return { memberInfo, payments, allMembers, loading, refetch: fetchMyData };
}
