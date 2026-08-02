import { useState } from 'react';
import { useMyDues } from '../hooks/useMyDues';
import { generateReceiptPDF } from '../utils/pdfGenerator';
import { PullToRefresh } from '../components/ui/pull-to-refresh';
import { Skeleton } from '../components/ui/skeleton';
import { Download, Receipt, Users, CheckCircle2, CircleDashed } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function MyDues() {
  const { memberInfo, payments, allMembers, loading, refetch } = useMyDues();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'team'
  const isDesktop = useMediaQuery('(min-width: 768px)');

  function downloadReceipt(txData) {
    if (!memberInfo) return;
    generateReceiptPDF(txData, memberInfo);
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-[50vh] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dues & Contributions</h1>
          <p className="text-sm text-slate-500 mt-1">Track your payments and view team progress.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl max-w-sm">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Dues
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Team Status
          </button>
        </div>

        {activeTab === 'personal' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            {/* Balance Card */}
            <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Expected Balance Due</p>
                <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                  ₹{(memberInfo?.totalDue || 0).toLocaleString()}
                </h2>
                <p className="text-sm font-medium text-slate-400 mt-4 max-w-sm">
                  Please coordinate with the team treasurer to clear your dues promptly via UPI or Cash.
                </p>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-4 px-2">Payment History</h3>
              
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {payments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center">
                    <Receipt className="w-12 h-12 text-slate-300 mb-3" />
                    You haven't made any recorded payments yet.
                  </div>
                ) : isDesktop ? (
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                          <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                          <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 text-sm font-medium text-slate-500">
                              {p.createdAt ? new Date(p.createdAt.toDate()).toLocaleDateString('en-GB') : 'Recently'}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900">{p.description}</td>
                            <td className="py-4 px-4 text-right font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right">
                              {p.receiptPdfUrl ? (
                                <a href={p.receiptPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm">
                                  <Download className="w-4 h-4" /> Download
                                </a>
                              ) : (
                                <button onClick={() => downloadReceipt(p)} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm">
                                  <Download className="w-4 h-4" /> Generate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {payments.map(p => (
                      <div key={p.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{p.createdAt ? new Date(p.createdAt.toDate()).toLocaleDateString('en-GB') : 'Recently'}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600 shrink-0">₹{p.amount.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-end">
                          {p.receiptPdfUrl ? (
                            <a href={p.receiptPdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold">
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          ) : (
                            <button onClick={() => downloadReceipt(p)} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform">
                              <Download className="w-3.5 h-3.5" /> Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Team Collection Status</h3>
                <p className="text-xs text-slate-500 mt-1">See who has completed their contributions.</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allMembers.map(m => {
                const isPaid = (m.totalDue || 0) === 0;
                return (
                  <div key={m.email} className={`rounded-2xl p-4 border flex items-center gap-4 ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{m.role}</p>
                    </div>
                    <div className="shrink-0 flex items-center">
                      {isPaid ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Paid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <CircleDashed className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
      </div>
    </PullToRefresh>
  );
}
