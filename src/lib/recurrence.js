import { addDays, addWeeks, addMonths, format, getDay, setDay, startOfDay, isBefore, isAfter, isEqual } from 'date-fns';

export function getRecurrenceDates(rule, startStr, endStr) {
  const start = startOfDay(new Date(startStr));
  const end = startOfDay(new Date(endStr));
  const dates = [];

  if (!rule || !rule.type) return dates;

  switch (rule.type) {
    case 'daily': {
      let current = new Date(start);
      while (current <= end) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, rule.interval || 1);
      }
      break;
    }

    case 'weekly': {
      const targetDay = rule.day ?? 1; // 0=Sun
      let current = new Date(start);
      // Find first occurrence of target day
      while (getDay(current) !== targetDay && current <= end) {
        current = addDays(current, 1);
      }
      while (current <= end) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 7);
      }
      break;
    }

    case 'biweekly': {
      const targetDay = rule.day ?? 1;
      let current = new Date(start);
      while (getDay(current) !== targetDay && current <= end) {
        current = addDays(current, 1);
      }
      while (current <= end) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 14);
      }
      break;
    }

    case 'monthly': {
      const dayOfMonth = rule.dayOfMonth ?? 1;
      let current = new Date(start);
      current.setDate(1);
      while (current <= end) {
        const target = new Date(current.getFullYear(), current.getMonth(), Math.min(dayOfMonth, 28));
        if (target >= start && target <= end) {
          dates.push(format(target, 'yyyy-MM-dd'));
        }
        current = addMonths(current, 1);
      }
      break;
    }

    case 'custom': {
      // Custom day-of-week selection: rule.days = [0, 2, 4] (Sun, Tue, Thu)
      const targetDays = rule.days || [];
      const interval = rule.interval || 1;
      let current = new Date(start);
      let weekCount = 0;

      // Find start of the first week
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      let week = new Date(weekStart);
      while (week <= end) {
        if (weekCount % interval === 0) {
          for (const day of targetDays) {
            const date = addDays(week, day);
            if (date >= start && date <= end) {
              dates.push(format(date, 'yyyy-MM-dd'));
            }
          }
        }
        week = addDays(week, 7);
        weekCount++;
      }
      break;
    }

    case 'once': {
      if (rule.date) {
        const d = startOfDay(new Date(rule.date));
        if (d >= start && d <= end) {
          dates.push(rule.date);
        }
      }
      break;
    }
  }

  // Filter by end date if rule has one
  let filtered = [...new Set(dates)].sort();
  if (rule.endDate) {
    const ruleEnd = rule.endDate;
    filtered = filtered.filter((d) => d <= ruleEnd);
  }

  return filtered;
}

export function describeRecurrence(rule) {
  if (!rule) return 'No recurrence';

  switch (rule.type) {
    case 'once': return 'One-time';
    case 'daily': return rule.interval > 1 ? `Every ${rule.interval} days` : 'Daily';
    case 'weekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Weekly on ${dayNames[rule.day ?? 1]}`;
    }
    case 'biweekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Every 2 weeks on ${dayNames[rule.day ?? 1]}`;
    }
    case 'monthly': return `Monthly on the ${rule.dayOfMonth ?? 1}${ordSuffix(rule.dayOfMonth ?? 1)}`;
    case 'custom': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = (rule.days || []).map((d) => dayNames[d]).join(', ');
      const interval = rule.interval > 1 ? `Every ${rule.interval} weeks` : 'Weekly';
      return `${interval} on ${days}`;
    }
    default: return rule.type;
  }
}

function ordSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
