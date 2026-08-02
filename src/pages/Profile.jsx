import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogOut, ShieldAlert, User, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export default function Profile() {
  const { currentUser, actualRole, userRole, isMemberView, setIsMemberView, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-8 p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="text-muted-foreground text-slate-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-3xl">
        <div className="bg-indigo-600 h-24 w-full"></div>
        <div className="px-6 pb-6 relative">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-indigo-700 -mt-10 mb-4 mx-auto">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              {currentUser?.email?.split('@')[0]}
            </h2>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
            <div className="mt-3 inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {actualRole}
            </div>
          </div>
        </div>
      </Card>

      {/* Admin Control Center Link (Only for actual admins) */}
      {actualRole === 'admin' && (
        <Card 
          className="border border-indigo-100 shadow-sm bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer rounded-2xl"
          onClick={() => navigate('/admin')}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-900">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm">Admin Control Center</h3>
                <p className="text-xs text-indigo-700/70">Manage members, categories, and deadlines</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400" />
          </CardContent>
        </Card>
      )}

      {/* Settings List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {actualRole === 'admin' && (
          <button
            onClick={() => setIsMemberView(!isMemberView)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                {isMemberView ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{isMemberView ? 'Exit Member View' : 'View as Member'}</h3>
                <p className="text-xs text-slate-400">See the app as a regular member</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${isMemberView ? 'bg-indigo-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isMemberView ? 'left-7' : 'left-1'}`}></div>
            </div>
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors text-left text-red-600"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Log Out</h3>
            <p className="text-xs text-red-400/80">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
