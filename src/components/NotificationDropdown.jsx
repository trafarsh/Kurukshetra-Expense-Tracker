import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    function handleClickOutside(event) {
      if (isDesktop && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDesktop]);

  const NotificationList = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 flex-shrink-0">
        <h3 className="font-bold text-slate-800 text-lg">Notifications</h3>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsRead()}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-bold min-h-[44px] px-2 flex items-center justify-center"
            >
              Mark all read
            </button>
          )}
          {!isDesktop && (
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">
            No notifications yet.
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-sm leading-relaxed ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                  {n.message}
                </p>
                {!n.read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="text-indigo-500 hover:text-indigo-700 bg-white shadow-sm border border-slate-100 p-2 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center flex-shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-400 mt-2 block uppercase tracking-wider">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative min-h-[44px] min-w-[44px]"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 md:top-3 md:right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        {isDesktop && isOpen && (
          <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-[500px] flex flex-col">
            <NotificationList />
          </div>
        )}
      </div>

      {/* Mobile Drawer/Modal */}
      {!isDesktop && isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-[85vw] max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-right flex flex-col">
            <NotificationList />
          </div>
        </div>
      )}
    </>
  );
}
