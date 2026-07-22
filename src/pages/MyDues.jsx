import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { generateReceiptPDF } from '../utils/pdfGenerator';

export default function MyDues() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.email) {
      fetchMyData();
    }
  }, [currentUser]);

  async function fetchMyData() {
    try {
      // 1. Fetch Member Info (Total Due)
      const memberRef = doc(db, 'members', currentUser.email);
      const memberSnap = await getDoc(memberRef);
      let totalDue = 0;
      if (memberSnap.exists()) {
        const data = memberSnap.data();
        totalDue = data.totalDue || 0;
        setMemberInfo(data);
      }

      // 2. Fetch Payments (Income transactions where paidBy == currentUser.email)
      const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'income'),
        where('paidBy', '==', currentUser.email)
      );
      
      const snap = await getDocs(q);
      const data = [];
      let totalPaid = 0;
      snap.forEach(doc => {
        const tx = { id: doc.id, ...doc.data() };
        data.push(tx);
        totalPaid += tx.amount;
      });
      
      // Sort manually since we are querying by multiple fields and might not have a composite index ready
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      setPayments(data);
    } catch (error) {
      console.error("Error fetching dues:", error);
    } finally {
      setLoading(false);
    }
  }

  function downloadReceipt(txData) {
    if (!memberInfo) return;
    generateReceiptPDF(txData, memberInfo);
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading your dues...</div>;
  }

  return (
    <div className="space-y-8 p-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Dues</h1>
        <p className="text-muted-foreground text-slate-500 mt-1">Track your contributions and outstanding balance.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 text-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-200">Current Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">
              ₹{(memberInfo?.totalDue || 0).toLocaleString()}
            </div>
            <p className="text-slate-400 mt-2 text-sm">Please clear your dues promptly to support club operations.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">You have not made any recorded payments yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-slate-500">
                      {p.createdAt ? new Date(p.createdAt.toDate()).toLocaleDateString('en-GB') : 'Recently'}
                    </TableCell>
                    <TableCell className="font-medium">{p.description}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₹{p.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.receiptPdfUrl ? (
                        <a href={p.receiptPdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                          Download Old PDF
                        </a>
                      ) : (
                        <button onClick={() => downloadReceipt(p)} className="text-blue-600 hover:underline text-sm font-medium">
                          Download PDF
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
