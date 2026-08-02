import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Wallet, Users, Landmark, ArrowRight, Activity, ArrowUpRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PullToRefresh } from '../components/ui/pull-to-refresh';
import { Skeleton } from '../components/ui/skeleton';

const SUBTEAMS = {
  "DRIVER": [
    { name: "RAM NARESH K", roll: "25EE229", role: "PRIMARY DRIVER" },
    { name: "PANGAJ T", roll: "25EE216", role: "SECONDARY DRIVER" }
  ],
  "STEERING": [
    { name: "SUBASHRE", roll: "25EE186", role: "TEAM LEAD" },
    { name: "MUTHASHIM HUSSAIN", roll: "25EE177", role: "" },
    { name: "NITHISH N", roll: "25EE187", role: "" },
    { name: "HARISH S", roll: "25EE238", role: "" }
  ],
  "COST": [
    { name: "YESHWANTH V", roll: "25EE208", role: "TEAM LEAD" },
    { name: "RAM NARESH K", roll: "25EE229", role: "" }
  ],
  "CHASSIS": [
    { name: "SANJAY RAJ B", roll: "25EE233", role: "TEAM LEAD" },
    { name: "ANUSHREE S", roll: "25EE196", role: "" },
    { name: "MOHAMED ARSHAD M", roll: "25EE174", role: "" },
    { name: "GURUPRASAD C G", roll: "25EE170", role: "" }
  ],
  "WHEEL ASSEMBLY / BRAKING": [
    { name: "GOKULKARTHIC K", roll: "25EE189", role: "TEAM LEAD" },
    { name: "YESHWANTH V", roll: "25EE208", role: "" }
  ],
  "POWER TRAIN / SUBSYSTEM": [
    { name: "VEERA AVINASH V", roll: "25EE224", role: "TEAM LEAD" },
    { name: "YESHWANTH V", roll: "25EE208", role: "" },
    { name: "SANTOSH V", roll: "25ee175", role: "" }
  ],
  "DESIGN": [
    { name: "PANGAJ T", roll: "25EE216", role: "TEAM LEAD" },
    { name: "MUTHASHIM HUSSAIN", roll: "25EE177", role: "" },
    { name: "MOHAMED ARSHAD M", roll: "25EE174", role: "" }
  ],
  "MEDIA": [
    { name: "PANGAJ T", roll: "25EE216", role: "" },
    { name: "ANUSHREE S", roll: "25EE196", role: "" }
  ],
  "INNOVATION": [
    { name: "MUTHASHIM HUSSAIN", roll: "25EE177", role: "" }
  ],
  "B-PLAN": [
    { name: "YESHWANTH V", roll: "25EE208", role: "TEAM LEAD" },
    { name: "MUTHASHIM HUSSAIN", roll: "25EE177", role: "" }
  ]
};

export default function Dashboard() {
  const { currentUser, actualRole } = useAuth();
  const navigate = useNavigate();
  const { members, balance, loading, chartData, deadlines, transactionsData, refetch } = useDashboardData();

  const displayMembers = members.filter(m => m.email !== 'mohamedarshad1507@gmail.com');
  const totalClubFunds = displayMembers.reduce((sum, m) => sum + (m.totalDue || 0), 0);
  const percentCollected = totalClubFunds > 0 ? Math.round((balance / totalClubFunds) * 100) : 0;
  
  const directoryMembers = displayMembers.slice(0, 5);
  const recentTransactions = transactionsData.slice(0, 5);

  const userRoll = currentUser?.email?.split('@')[0]?.toUpperCase();
  const mySubteams = Object.entries(SUBTEAMS).filter(([teamName, membersList]) =>
    membersList.some(m => m.roll === userRoll)
  );
  const currentMember = members.find(m => m.email === currentUser?.email);
  const userDisplayName = currentMember?.name || userRoll;

  if (loading) {
    return (
      <div className="flex flex-col xl:flex-row gap-8 p-4">
        <div className="flex-1 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="flex gap-4 overflow-hidden">
            <Skeleton className="h-24 w-60 rounded-full" />
            <Skeleton className="h-24 w-60 rounded-full" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="flex flex-col xl:flex-row gap-8 min-h-full p-4 md:p-0">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          
          {/* Hero Banner */}
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-900 to-slate-900"></div>
            <div className="relative z-10">
              <p className="text-indigo-400 font-semibold mb-2 uppercase tracking-[0.2em] text-xs">Overview</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-lg leading-tight tracking-tight">
                Sharpen finances with Kurukshetra Tracker
              </h2>
              <Button onClick={() => navigate('/ledger')} className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-full px-6 py-6 font-bold shadow-md transition-all group min-h-[44px]">
                Manage Dues
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
            <div className="absolute -bottom-10 right-10 text-indigo-500/10 text-[180px] leading-none font-serif select-none pointer-events-none">✦</div>
          </div>

          {/* Small Stat Pills */}
          <div className="flex items-center gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x scrollbar-hide">
            <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Dues</p>
                <p className="font-bold text-slate-800 text-lg">₹{totalClubFunds.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Balance</p>
                <p className="font-bold text-slate-800 text-lg">₹{balance.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Members</p>
                <p className="font-bold text-slate-800 text-lg">{displayMembers.length}</p>
              </div>
            </div>
          </div>

          {/* Financial Analytics Chart */}
          <div>
            <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-4 px-2">Income vs Expenses</h3>
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100">
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8' }} 
                      tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions Mobile Card List */}
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Recent Transactions</h3>
              <button onClick={() => navigate('/ledger')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 min-h-[44px] px-2 flex items-center">
                See all
              </button>
            </div>
            
            <div className="bg-white rounded-3xl p-2 md:p-6 shadow-sm border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{tx.description}</p>
                        <p className="text-xs text-slate-500 truncate">{tx.createdAt ? new Date(tx.createdAt.toDate()).toLocaleDateString('en-GB') : 'Just now'}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-bold shrink-0 ml-2 ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="p-8 text-center text-slate-400 font-medium">No recent transactions.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Subteam & Deadlines) */}
        <div className="w-full xl:w-[350px] space-y-6 flex-shrink-0">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">My Subteam</h3>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>

            <div className="relative w-32 h-32 mx-auto mb-6 z-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-indigo-600 drop-shadow-md" strokeWidth="2.5" strokeDasharray={`${percentCollected}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-700 shadow-inner">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-[3px] border-white shadow-sm">
                {percentCollected}%
              </div>
            </div>

            <div className="relative z-10">
              <h4 className="font-bold text-xl text-slate-900 tracking-tight">Hello {userDisplayName} 🔥</h4>
            </div>

            <div className="text-left mt-6 relative z-10 space-y-3">
              {mySubteams.length > 0 ? (
                mySubteams.map(([teamName, membersList]) => (
                  <div key={teamName} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h5 className="font-bold text-indigo-700 text-xs tracking-wider uppercase mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      {teamName}
                    </h5>
                    <div className="space-y-2">
                      {membersList.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${m.roll === userRoll ? 'text-indigo-900' : 'text-slate-600'}`}>
                            {m.name}
                          </span>
                          {m.role && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {m.role}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-xs text-slate-500 font-medium">No subteam assigned.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Upcoming Deadlines</h3>
            </div>
            
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
              ) : (
                deadlines.map(d => {
                  const dateObj = new Date(d.date);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffDays = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = diffDays <= 7;
                  
                  return (
                    <div key={d.id} className={`p-4 rounded-2xl border ${isUrgent ? 'border-rose-100 bg-rose-50/50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-bold text-sm ${isUrgent ? 'text-rose-900' : 'text-slate-800'}`}>{d.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                          {diffDays === 0 ? 'Today' : `${diffDays} Days`}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {d.description && <p className="text-xs text-slate-600 font-medium">{d.description}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>
    </PullToRefresh>
  );
}
