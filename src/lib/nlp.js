import { format, addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, parse } from 'date-fns';

const DAY_MAP = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const NEXT_DAY_FN = [nextSunday, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday];

// Parse natural language chore input
// e.g. "Empty trash tomorrow at 9am assign to Alex"
export function parseQuickAdd(input, members = []) {
  const result = {
    title: '',
    date: null,
    startTime: null,
    assigneeName: null,
    assigneeId: null,
    raw: input,
  };

  let text = input.trim();

  // Extract "assign to <name>" or "for <name>"
  const assignMatch = text.match(/(?:assign(?:ed)?\s+to|for)\s+(\w+)/i);
  if (assignMatch) {
    const name = assignMatch[1].toLowerCase();
    const member = members.find((m) => m.name.toLowerCase().startsWith(name));
    if (member) {
      result.assigneeName = member.name;
      result.assigneeId = member.id;
    }
    text = text.replace(assignMatch[0], '').trim();
  }

  // Extract time "at 9am" or "at 14:00" or "at 2pm"
  const timeMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    result.startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    text = text.replace(timeMatch[0], '').trim();
  }

  // Extract date references
  const today = new Date();

  if (/\btoday\b/i.test(text)) {
    result.date = format(today, 'yyyy-MM-dd');
    text = text.replace(/\btoday\b/i, '').trim();
  } else if (/\btomorrow\b/i.test(text)) {
    result.date = format(addDays(today, 1), 'yyyy-MM-dd');
    text = text.replace(/\btomorrow\b/i, '').trim();
  } else if (/\bnext\s+week\b/i.test(text)) {
    result.date = format(addDays(today, 7), 'yyyy-MM-dd');
    text = text.replace(/\bnext\s+week\b/i, '').trim();
  } else {
    // Check for day names: "next Monday", "on Friday"
    const dayMatch = text.match(/(?:next|on|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
    if (dayMatch) {
      const dayNum = DAY_MAP[dayMatch[1].toLowerCase()];
      if (dayNum !== undefined) {
        result.date = format(NEXT_DAY_FN[dayNum](today), 'yyyy-MM-dd');
        text = text.replace(dayMatch[0], '').trim();
      }
    }
  }

  // Check for date format: "2/20" or "Feb 20" or "2024-02-20"
  const dateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dateMatch && !result.date) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3], 10) : parseInt(dateMatch[3], 10)) : today.getFullYear();
    result.date = format(new Date(year, month, day), 'yyyy-MM-dd');
    text = text.replace(dateMatch[0], '').trim();
  }

  // Remaining text is the title
  result.title = text.replace(/\s+/g, ' ').trim();

  // Default to today if no date specified
  if (!result.date) {
    result.date = format(today, 'yyyy-MM-dd');
  }

  return result;
}
