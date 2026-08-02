import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useDashboardData() {
  const { currentUser, actualRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);

  async function fetchData() {
    setLoading(true);
    try {
      const memSnap = await getDocs(collection(db, 'members'));
      const membersData = [];
      memSnap.forEach((doc) => membersData.push(doc.data()));
      setMembers(membersData);

      const dlSnap = await getDocs(collection(db, 'deadlines'));
      const dlData = [];
      dlSnap.forEach(doc => dlData.push({ id: doc.id, ...doc.data() }));
      dlData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const futureDl = dlData.filter(d => new Date(d.date) >= today);
      setDeadlines(futureDl);

      const txSnap = await getDocs(collection(db, 'transactions'));
      let total = 0;
      const txs = [];
      txSnap.forEach((doc) => {
        const tx = doc.data();
        txs.push({ id: doc.id, ...tx });
        if (tx.type === 'income') total += tx.amount;
        if (tx.type === 'expense') total -= tx.amount;
      });
      setBalance(total);
      
      // Sort txs descending to get recent transactions
      txs.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
        return dateB - dateA; // newest first
      });
      setTransactionsData(txs);

      // Chart Data
      const sortedTxsAsc = [...txs].sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(2024, 0, 1);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(2024, 0, 1);
        return dateA - dateB; // oldest first for chart
      });
      
      const groupedByDate = {};
      sortedTxsAsc.forEach(tx => {
        const dateObj = tx.createdAt ? tx.createdAt.toDate() : new Date(2024, 0, 1);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') groupedByDate[dateStr].income += tx.amount;
        if (tx.type === 'expense') groupedByDate[dateStr].expense += tx.amount;
      });

      const chartPoints = Object.keys(groupedByDate).map(dateStr => ({
        date: dateStr,
        Income: groupedByDate[dateStr].income,
        Expense: groupedByDate[dateStr].expense
      }));

      if (chartPoints.length === 0) {
        chartPoints.push({
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Income: 0,
          Expense: 0
        });
      }
      setChartData(chartPoints);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    members, 
    balance, 
    loading, 
    chartData, 
    deadlines, 
    transactionsData,
    refetch: fetchData 
  };
}
