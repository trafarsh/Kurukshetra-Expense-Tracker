import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Wallet, Users, Landmark, User, ArrowRight, Activity, ArrowUpRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SEED_MEMBERS = [
  { name: 'MOHAMED ARSHAD M', email: '25ee174@skcet.ac.in', role: 'admin', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'MUTHASHIM HUSSAIN', email: '25ee177@skcet.ac.in', role: 'admin', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'YESHWANTH V', email: '25ee208@skcet.ac.in', role: 'admin', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'RAM NARESH K', email: '25ee229@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'PANGAJ T', email: '25ee216@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'SUBASHRE', email: '25ee186@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'NITHISH N', email: '25ee187@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'HARISH S', email: '25ee238@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'SANJAY RAJ B', email: '25ee233@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'ANUSHREE S', email: '25ee196@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'SANTOSH V', email: '25ee175@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'GURUPRASAD C G', email: '25ee170@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'GOKULKARTHIC K', email: '25ee189@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'VEERA AVINASH V', email: '25ee224@skcet.ac.in', role: 'member', totalDue: 12000, joinedAt: new Date().toISOString() },
  { name: 'MOHAMED ARSHAD (Dev)', email: 'mohamedarshad1507@gmail.com', role: 'admin', totalDue: 0, joinedAt: new Date().toISOString() }
];

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
  const [members, setMembers] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [showAllDirectory, setShowAllDirectory] = useState(false);
  const [showAllTop, setShowAllTop] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const memSnap = await getDocs(collection(db, 'members'));
      const membersData = [];
      memSnap.forEach((doc) => membersData.push(doc.data()));
      setMembers(membersData);

      // Fetch deadlines
      const dlSnap = await getDocs(collection(db, 'deadlines'));
      const dlData = [];
      dlSnap.forEach(doc => dlData.push({ id: doc.id, ...doc.data() }));
      dlData.sort((a, b) => new Date(a.date) - new Date(b.date));
      // Keep only future or today deadlines
      const today = new Date();
      today.setHours(0,0,0,0);
      const futureDl = dlData.filter(d => new Date(d.date) >= today);
      setDeadlines(futureDl);

      const txSnap = await getDocs(collection(db, 'transactions'));
      let total = 0;
      const transactionsData = [];
      txSnap.forEach((doc) => {
        const tx = doc.data();
        transactionsData.push(tx);
        if (tx.type === 'income') total += tx.amount;
        if (tx.type === 'expense') total -= tx.amount;
      });
      setBalance(total);

      // Prepare chart data (Daily Income vs Daily Expense)
      transactionsData.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(2024, 0, 1);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(2024, 0, 1);
        return dateA - dateB;
      });
      
      const groupedByDate = {};
      transactionsData.forEach(tx => {
        const dateObj = tx.createdAt ? tx.createdAt.toDate() : new Date(2024, 0, 1);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') groupedByDate[dateStr].income += tx.amount;
        if (tx.type === 'expense') groupedByDate[dateStr].expense += tx.amount;
      });

      const chartPoints = Object.keys(groupedByDate).map(dateStr => {
        return {
          date: dateStr,
          Income: groupedByDate[dateStr].income,
          Expense: groupedByDate[dateStr].expense
        };
      });

      if (chartPoints.length === 0) {
        chartPoints.push({
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Income: 0,
          Expense: 0
        });
      }
      setChartData(chartPoints);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedData() {
    setSeeding(true);
    try {
      const snapshot = await getDocs(collection(db, 'members'));
      const deletePromises = [];
      snapshot.forEach((document) => {
        if (document.id.includes('EE')) {
          deletePromises.push(deleteDoc(doc(db, 'members', document.id)));
        }
      });
      await Promise.all(deletePromises);

      for (const member of SEED_MEMBERS) {
        await setDoc(doc(db, 'members', member.email), member);
      }

      alert('Duplicates completely cleaned and database perfectly seeded!');
      fetchData();
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error seeding data. Check console.');
    }
    setSeeding(false);
  }

  const displayMembers = members.filter(m => m.email !== 'mohamedarshad1507@gmail.com');
  const totalClubFunds = displayMembers.reduce((sum, m) => sum + (m.totalDue || 0), 0);
  const percentCollected = totalClubFunds > 0 ? Math.round((balance / totalClubFunds) * 100) : 0;
  const showSeedButton = actualRole === 'admin' && displayMembers.length === 0;

  const directoryMembers = showAllDirectory ? displayMembers : displayMembers.slice(0, 5);
  const topMembers = showAllTop ? displayMembers : displayMembers.slice(0, 3);

  // Determine user's subteams
  const userRoll = currentUser?.email?.split('@')[0]?.toUpperCase();
  const mySubteams = Object.entries(SUBTEAMS).filter(([teamName, membersList]) =>
    membersList.some(m => m.roll === userRoll)
  );

  const currentMember = members.find(m => m.email === currentUser?.email);
  const userDisplayName = currentMember?.name || userRoll;

  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-full">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8 min-w-0">

        {/* Hero Banner */}
        <div className="bg-indigo-600 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg shadow-indigo-600/20">
          <div className="relative z-10">
            <p className="text-indigo-200 font-semibold mb-2 uppercase tracking-[0.2em] text-xs">Overview</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-lg leading-tight tracking-tight">
              Sharpen Our Finances with Kurukshetra Tracker to have an transperncy
            </h2>
            {showSeedButton ? (
              <Button onClick={handleSeedData} disabled={seeding} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 py-6 font-semibold shadow-md transition-all group">
                {seeding ? 'Seeding...' : 'Seed Initial Members'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button onClick={() => navigate('/ledger')} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 py-6 font-semibold shadow-md transition-all group">
                Manage Dues
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
          <div className="absolute -bottom-10 right-10 text-indigo-400/30 text-[180px] leading-none font-serif select-none pointer-events-none">✦</div>
          <div className="absolute top-10 right-40 text-indigo-300/40 text-[80px] leading-none font-serif select-none pointer-events-none">✦</div>
        </div>

        {/* Small Stat Pills */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x scrollbar-hide">
          {/* Expected Dues */}
          <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expected Dues</p>
              <p className="font-bold text-slate-800 text-lg">₹{totalClubFunds.toLocaleString()}</p>
            </div>
            <div className="ml-auto text-slate-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Available Balance</p>
              <p className="font-bold text-slate-800 text-lg">₹{balance.toLocaleString()}</p>
            </div>
            <div className="ml-auto text-slate-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white px-5 py-4 rounded-full shadow-sm flex items-center gap-4 min-w-[240px] snap-start border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Members</p>
              <p className="font-bold text-slate-800 text-lg">{displayMembers.length}</p>
            </div>
            <div className="ml-auto text-slate-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Financial Analytics Chart */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Income vs Expenses</h3>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="h-[300px] w-full">
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
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Members List styled as table inside a rounded card */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Member Directory</h3>
            {displayMembers.length > 5 && (
              <button
                onClick={() => setShowAllDirectory(!showAllDirectory)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {showAllDirectory ? 'Show Less' : 'See all'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Loading members...</div>
            ) : displayMembers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium">No members found. Seed initial data to start!</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase h-10">Member</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase h-10">Email</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase h-10">Role</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-xs tracking-wider uppercase h-10 text-right">Total Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directoryMembers.map((member) => (
                      <TableRow key={member.email} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors border-none">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {member.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-slate-500 font-medium text-sm">{member.email}</TableCell>
                        <TableCell className="py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${member.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-slate-100 text-slate-500'
                            }`}>
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="font-bold text-slate-700 text-sm border border-slate-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                            ₹{member.totalDue?.toLocaleString() || 0}
                            <ArrowUpRight className="w-3 h-3 text-slate-400" />
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar (Subteam) */}
      <div className="w-full xl:w-[350px] space-y-6 flex-shrink-0">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Subteam</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <Activity className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-36 h-36 mx-auto mb-6 z-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              {/* Progress Circle */}
              <path className="text-indigo-600 drop-shadow-md" strokeWidth="2.5" strokeDasharray={`${percentCollected}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="w-full h-full bg-slate-100/80 rounded-full flex items-center justify-center text-3xl font-bold text-slate-700 shadow-inner">
                {currentUser?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="absolute top-2 right-0 bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-[3px] border-white shadow-sm">
              {percentCollected}%
            </div>
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-xl text-slate-900 tracking-tight">Hello {userDisplayName} 🔥</h4>
          </div>

          {/* Subteam Display */}
          <div className="text-left mt-6 relative z-10">
            {mySubteams.length > 0 ? (
              <div className="space-y-4">
                {mySubteams.map(([teamName, membersList]) => (
                  <div key={teamName} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h5 className="font-bold text-indigo-700 text-sm tracking-wider uppercase mb-3 flex items-center gap-2">
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
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">You are not currently assigned to a subteam.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight">Upcoming Deadlines</h3>
          </div>
          
          <div className="space-y-4">
            {deadlines.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
            ) : (
              deadlines.map(d => {
                const dateObj = new Date(d.date);
                // Compare just the dates (ignoring time)
                const today = new Date();
                today.setHours(0,0,0,0);
                const diffTime = dateObj.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays <= 7;
                
                return (
                  <div key={d.id} className={`p-4 rounded-2xl border ${isUrgent ? 'border-red-100 bg-red-50/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-bold text-sm ${isUrgent ? 'text-red-900' : 'text-slate-800'}`}>{d.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                        {diffDays === 0 ? 'Today' : `${diffDays} Day${diffDays === 1 ? '' : 's'} Left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    {d.description && <p className="text-xs text-slate-600">{d.description}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
