import { supabase } from './supabase';
import { format, addDays, getDay, setDate } from 'date-fns';

// Compute floating US federal holidays
function getNthWeekday(year, month, weekday, n) {
  let date = new Date(year, month, 1);
  let count = 0;
  while (count < n) {
    if (date.getDay() === weekday) count++;
    if (count < n) date = addDays(date, 1);
  }
  return date;
}

function getLastWeekday(year, month, weekday) {
  let date = new Date(year, month + 1, 0); // last day of month
  while (date.getDay() !== weekday) {
    date = addDays(date, -1);
  }
  return date;
}

export function computeUSHolidays(year) {
  return [
    { name: "New Year's Day", date: format(new Date(year, 0, 1), 'yyyy-MM-dd') },
    { name: "Martin Luther King Jr. Day", date: format(getNthWeekday(year, 0, 1, 3), 'yyyy-MM-dd') },
    { name: "Presidents' Day", date: format(getNthWeekday(year, 1, 1, 3), 'yyyy-MM-dd') },
    { name: "Memorial Day", date: format(getLastWeekday(year, 4, 1), 'yyyy-MM-dd') },
    { name: "Juneteenth", date: format(new Date(year, 5, 19), 'yyyy-MM-dd') },
    { name: "Independence Day", date: format(new Date(year, 6, 4), 'yyyy-MM-dd') },
    { name: "Labor Day", date: format(getNthWeekday(year, 8, 1, 1), 'yyyy-MM-dd') },
    { name: "Columbus Day", date: format(getNthWeekday(year, 9, 1, 2), 'yyyy-MM-dd') },
    { name: "Veterans Day", date: format(new Date(year, 10, 11), 'yyyy-MM-dd') },
    { name: "Thanksgiving Day", date: format(getNthWeekday(year, 10, 4, 4), 'yyyy-MM-dd') },
    { name: "Christmas Day", date: format(new Date(year, 11, 25), 'yyyy-MM-dd') },
  ];
}

export function isHoliday(dateStr, holidays) {
  return holidays.some((h) => h.date === dateStr);
}

export function getHolidayName(dateStr, holidays) {
  const h = holidays.find((h) => h.date === dateStr);
  return h ? h.name : null;
}

export async function fetchHolidays(startYear, endYear) {
  // Try fetching from DB first
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .gte('date', `${startYear}-01-01`)
    .lte('date', `${endYear}-12-31`)
    .order('date');

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: compute locally
  const holidays = [];
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...computeUSHolidays(year));
  }
  return holidays;
}
