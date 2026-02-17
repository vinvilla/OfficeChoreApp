import React, { useEffect, useMemo } from 'react';
import { useChoreStore } from '../stores/choreStore';
import { useTeamStore } from '../stores/teamStore';
import { useCalendarStore } from '../stores/calendarStore';
import { getWorkloadByMember, computeFairnessScore } from '../lib/scheduling';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Trophy, Flame, BarChart3, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function DashboardPage() {
  const { instances, fetchInstances } = useChoreStore();
  const { members } = useTeamStore();
  const currentDate = useCalendarStore((s) => s.currentDate);

  useEffect(() => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    fetchInstances(start, end);
  }, [currentDate, fetchInstances]);

  const workload = useMemo(() => getWorkloadByMember(members, instances), [members, instances]);
  const fairness = useMemo(() => computeFairnessScore(members, instances), [members, instances]);

  const totalCompleted = instances.filter((i) => i.status === 'done').length;
  const totalOverdue = instances.filter((i) => i.status === 'overdue').length;
  const totalPending = instances.filter((i) => i.status === 'pending').length;

  const chartData = workload.map((w) => ({
    name: w.member.name,
    completed: w.completed,
    pending: w.pending,
    overdue: w.overdue,
    color: w.member.color,
  }));

  // Leaderboard: sorted by completed count
  const leaderboard = [...workload].sort((a, b) => b.completed - a.completed);

  // Streak tracking: consecutive completed days (simplified)
  const streaks = workload.map((w) => {
    const memberInstances = instances
      .filter((i) => i.assignee_id === w.member.id && i.status === 'done')
      .sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    const seen = new Set();
    for (const inst of memberInstances) {
      if (!seen.has(inst.date)) {
        seen.add(inst.date);
        streak++;
      }
    }
    return { member: w.member, streak };
  }).sort((a, b) => b.streak - a.streak);

  return (
    <div className="dashboard-page">
      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-stat">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{totalCompleted}</div>
          <div className="stat-label"><CheckCircle size={12} style={{ marginRight: 4 }} />Completed</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{totalPending}</div>
          <div className="stat-label"><Clock size={12} style={{ marginRight: 4 }} />Pending</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{totalOverdue}</div>
          <div className="stat-label"><AlertTriangle size={12} style={{ marginRight: 4 }} />Overdue</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value">{fairness.toFixed(1)}</div>
          <div className="stat-label"><Users size={12} style={{ marginRight: 4 }} />Fairness Score</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Workload Chart */}
        <div className="dashboard-card">
          <h3><BarChart3 size={16} /> Workload by Member</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="completed" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="var(--accent)" />
              <Bar dataKey="overdue" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fairness Chart */}
        <div className="dashboard-card">
          <h3><Users size={16} /> Hours Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={workload.map((w) => ({ name: w.member.name, hours: w.hours, color: w.member.color }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {workload.map((w, i) => (
                  <Cell key={i} fill={w.member.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leaderboard */}
        <div className="dashboard-card">
          <h3><Trophy size={16} /> Leaderboard</h3>
          {leaderboard.map((w, i) => (
            <div key={w.member.id} className="leaderboard-item">
              <span className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                #{i + 1}
              </span>
              <span className="member-dot" style={{ background: w.member.color }} />
              <span className="leaderboard-name">{w.member.name}</span>
              <span className="leaderboard-score">{w.completed}</span>
            </div>
          ))}
        </div>

        {/* Streak Tracker */}
        <div className="dashboard-card">
          <h3><Flame size={16} /> Completion Streaks</h3>
          {streaks.map((s) => (
            <div key={s.member.id} className="streak-item">
              <span className="member-dot" style={{ background: s.member.color }} />
              <span className="member-name">{s.member.name}</span>
              <span className="streak-count">{s.streak} days</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
