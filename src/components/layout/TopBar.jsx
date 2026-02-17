import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCalendarStore } from '../../stores/calendarStore';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import {
  ChevronLeft, ChevronRight, Calendar, LayoutDashboard,
  Settings, Sun, Moon, LogOut, Menu, Flag,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function TopBar({ showHolidays, onToggleHolidays }) {
  const { view, setView, navigate: navCalendar, goToday, getHeaderText } = useCalendarStore();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUiStore();
  const { signOut, profile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isCalendar = location.pathname === '/' || location.pathname === '/calendar';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="btn-icon" onClick={toggleSidebar} title="Toggle sidebar">
          <Menu size={16} />
        </button>
        {isCalendar && (
          <button className="btn" onClick={goToday}>
            <Calendar size={14} /> Today
          </button>
        )}
      </div>

      {isCalendar && (
        <div className="toolbar-center">
          <button className="btn-icon" onClick={() => navCalendar(-1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="nav-date">{getHeaderText()}</span>
          <button className="btn-icon" onClick={() => navCalendar(1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {isDashboard && (
        <div className="toolbar-center">
          <span className="nav-date">Workload Dashboard</span>
        </div>
      )}

      <div className="toolbar-right">
        {isCalendar && (
          <>
            <button
              className={clsx('btn-icon', showHolidays && 'active')}
              onClick={onToggleHolidays}
              title="Toggle holidays"
            >
              <Flag size={14} />
            </button>
            <div className="view-toggle">
              <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button>
              <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
            </div>
          </>
        )}

        <button
          className={clsx('btn-icon', isCalendar && 'active')}
          onClick={() => navigate('/')}
          title="Calendar"
        >
          <Calendar size={14} />
        </button>
        <button
          className={clsx('btn-icon', isDashboard && 'active')}
          onClick={() => navigate('/dashboard')}
          title="Dashboard"
        >
          <LayoutDashboard size={14} />
        </button>
        <button className="btn-icon" onClick={() => navigate('/settings')} title="Settings">
          <Settings size={14} />
        </button>
        <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button className="btn-icon" onClick={signOut} title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
