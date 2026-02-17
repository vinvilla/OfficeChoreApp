import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import LeftPane from './LeftPane';
import { useUiStore } from '../../stores/uiStore';
import { useTeamStore } from '../../stores/teamStore';
import { useChoreStore } from '../../stores/choreStore';
import { useAuthStore } from '../../stores/authStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { clsx } from 'clsx';

export default function AppLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const organization = useAuthStore((s) => s.organization);
  const fetchMembers = useTeamStore((s) => s.fetchMembers);
  const fetchTemplates = useChoreStore((s) => s.fetchTemplates);
  const [showHolidays, setShowHolidays] = useState(true);

  useKeyboardShortcuts();
  useTheme();

  useEffect(() => {
    if (organization) {
      fetchMembers();
      fetchTemplates();
    }
  }, [organization, fetchMembers, fetchTemplates]);

  return (
    <div className={clsx('app-layout', !sidebarOpen && 'sidebar-collapsed')}>
      {sidebarOpen && <LeftPane />}
      <main className="main-content">
        <TopBar showHolidays={showHolidays} onToggleHolidays={() => setShowHolidays((v) => !v)} />
        <Outlet context={{ showHolidays }} />
      </main>
    </div>
  );
}
