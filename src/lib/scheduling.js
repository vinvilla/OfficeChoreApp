import { format, addDays, getDay, getHours, parseISO } from 'date-fns';

// Score a time slot based on workload balance
export function scoreTimeSlot(date, members, instances) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = getDay(date);

  // Prefer weekdays
  const weekendPenalty = (dayOfWeek === 0 || dayOfWeek === 6) ? 20 : 0;

  // Count existing chores on this day
  const dayLoad = instances.filter((i) => i.date === dateStr).length;

  return 100 - dayLoad * 15 - weekendPenalty;
}

// Find the best assignee based on current workload
export function suggestAssignee(members, instances, dateRange) {
  if (!members.length) return null;

  const workload = {};
  members.forEach((m) => { workload[m.id] = 0; });

  instances.forEach((inst) => {
    if (inst.assignee_id && workload[inst.assignee_id] !== undefined) {
      workload[inst.assignee_id]++;
    }
  });

  // Return member with lowest workload
  return members.reduce((best, m) =>
    (workload[m.id] || 0) < (workload[best.id] || 0) ? m : best
  );
}

// Suggest next available time slot
export function suggestTimeSlot(instances, date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayInstances = instances.filter((i) => i.date === dateStr);

  // Default work hours: 8am-6pm
  const workHours = Array.from({ length: 10 }, (_, i) => i + 8);

  // Find occupied hours
  const occupied = new Set();
  dayInstances.forEach((inst) => {
    if (inst.start_time) {
      const hour = parseInt(inst.start_time.split(':')[0], 10);
      occupied.add(hour);
    }
  });

  // Find first free hour
  const freeHour = workHours.find((h) => !occupied.has(h)) || 9;

  return {
    start_time: `${String(freeHour).padStart(2, '0')}:00`,
    end_time: `${String(freeHour + 1).padStart(2, '0')}:00`,
  };
}

// Compute fairness score (lower = more fair)
export function computeFairnessScore(members, instances) {
  if (!members.length) return 0;

  const hours = {};
  members.forEach((m) => { hours[m.id] = 0; });

  instances.forEach((inst) => {
    if (inst.assignee_id && hours[inst.assignee_id] !== undefined) {
      // Default 30 min per chore
      hours[inst.assignee_id] += (inst.duration_minutes || 30) / 60;
    }
  });

  const values = Object.values(hours);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;

  return Math.sqrt(variance); // Standard deviation
}

// Get workload per member
export function getWorkloadByMember(members, instances) {
  const workload = {};
  members.forEach((m) => {
    workload[m.id] = {
      member: m,
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      hours: 0,
    };
  });

  instances.forEach((inst) => {
    const w = workload[inst.assignee_id];
    if (w) {
      w.total++;
      w.hours += (inst.duration_minutes || 30) / 60;
      if (inst.status === 'done') w.completed++;
      else if (inst.status === 'overdue') w.overdue++;
      else w.pending++;
    }
  });

  return Object.values(workload);
}
