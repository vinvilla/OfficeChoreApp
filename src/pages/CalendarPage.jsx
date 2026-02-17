import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendarStore } from '../stores/calendarStore';
import { useChoreStore } from '../stores/choreStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { fetchHolidays } from '../lib/holidays';
import { hexToRgba } from '../lib/constants';
import { format, isSameDay } from 'date-fns';
import ChoreEvent from '../components/calendar/ChoreEvent';
import MiniCalendar from '../components/calendar/MiniCalendar';
import HolidayBanner from '../components/calendar/HolidayBanner';
import ChoreModal from '../components/chores/ChoreModal';
import InstanceModal from '../components/chores/InstanceModal';
import QuickAddBox from '../components/chores/QuickAddBox';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const { showHolidays } = useOutletContext();
  const calendarRef = useRef(null);
  const syncingRef = useRef(false); // guard to prevent infinite loop
  const { view, currentDate, setCurrentDate, getDateRange } = useCalendarStore();
  const { instances, fetchInstances, updateInstance } = useChoreStore();
  const { members, selectedMembers } = useTeamStore();
  const { activeModal, modalData, openModal, closeModal } = useUiStore();
  const [holidays, setHolidays] = useState([]);

  // Sync FullCalendar when store changes (one-way: store → FC)
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    syncingRef.current = true;

    const fcView = view === 'week' ? 'timeGridWeek' : 'dayGridMonth';
    if (api.view.type !== fcView) {
      api.changeView(fcView);
    }

    const fcDate = api.getDate();
    if (!isSameDay(fcDate, currentDate)) {
      api.gotoDate(currentDate);
    }

    // Allow datesSet to fire without looping back
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [view, currentDate]);

  // Fetch instances when date range changes
  useEffect(() => {
    const { start, end } = getDateRange();
    fetchInstances(start, end);
  }, [view, currentDate]);

  // Load holidays
  useEffect(() => {
    const year = currentDate.getFullYear();
    fetchHolidays(year - 1, year + 1).then(setHolidays);
  }, [currentDate.getFullYear()]);

  // Realtime subscriptions
  useRealtimeSubscription('chore_instances', {
    onInsert: () => {
      const { start, end } = getDateRange();
      fetchInstances(start, end);
    },
    onUpdate: () => {
      const { start, end } = getDateRange();
      fetchInstances(start, end);
    },
    onDelete: () => {
      const { start, end } = getDateRange();
      fetchInstances(start, end);
    },
  });

  // Filter instances by selected members
  const filteredInstances = selectedMembers.length > 0
    ? instances.filter((i) => selectedMembers.includes(i.assignee_id))
    : instances;

  // Convert instances to FullCalendar events
  const events = useMemo(() => {
    const choreEvents = filteredInstances.map((inst) => {
      const assignee = inst.assignee || members.find((m) => m.id === inst.assignee_id);
      const color = assignee?.color || '#9ca3af';

      return {
        id: inst.id,
        title: inst.title,
        start: inst.start_time
          ? `${inst.date}T${inst.start_time}`
          : inst.date,
        end: inst.end_time
          ? `${inst.date}T${inst.end_time}`
          : undefined,
        allDay: !inst.start_time,
        backgroundColor: hexToRgba(color, 0.12),
        borderColor: color,
        textColor: 'var(--text-primary)',
        extendedProps: {
          instance: inst,
          assignee,
          color,
        },
      };
    });

    const holidayEvents = showHolidays
      ? holidays.map((h) => ({
          id: `holiday-${h.date}`,
          title: h.name,
          start: h.date,
          allDay: true,
          display: 'background',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          extendedProps: { isHoliday: true, holidayName: h.name },
        }))
      : [];

    return [...choreEvents, ...holidayEvents];
  }, [filteredInstances, members, holidays, showHolidays]);

  // Event handlers
  const handleEventClick = (info) => {
    if (info.event.extendedProps.isHoliday) return;
    openModal('instance', info.event.extendedProps.instance);
  };

  const handleEventDrop = async (info) => {
    const inst = info.event.extendedProps.instance;
    const newDate = format(info.event.start, 'yyyy-MM-dd');
    const newStartTime = info.event.start && !info.event.allDay
      ? format(info.event.start, 'HH:mm')
      : null;
    const newEndTime = info.event.end && !info.event.allDay
      ? format(info.event.end, 'HH:mm')
      : null;

    try {
      await updateInstance(inst.id, {
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });
      toast.success('Chore rescheduled');
    } catch {
      info.revert();
    }
  };

  const handleEventResize = async (info) => {
    const inst = info.event.extendedProps.instance;
    const newEndTime = info.event.end
      ? format(info.event.end, 'HH:mm')
      : null;

    try {
      await updateInstance(inst.id, { end_time: newEndTime });
    } catch {
      info.revert();
    }
  };

  const handleDateClick = (info) => {
    openModal('chore', {
      date: info.dateStr,
      startTime: info.date.getHours() > 0 ? format(info.date, 'HH:mm') : null,
    });
  };

  // datesSet: only update store if FC navigated on its own (not from our sync)
  const handleDatesSet = (info) => {
    if (syncingRef.current) return;
    const newDate = info.view.currentStart;
    if (!isSameDay(newDate, currentDate)) {
      setCurrentDate(newDate);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Mini Calendars Sidebar */}
      <div style={{
        width: 200,
        minWidth: 200,
        borderRight: '1px solid var(--border)',
        overflow: 'auto',
        background: 'var(--bg-surface)',
        display: view === 'month' ? 'block' : 'none',
      }}>
        <MiniCalendar
          date={currentDate}
          instances={instances}
          onDateClick={(d) => setCurrentDate(d)}
          offset={0}
        />
        <MiniCalendar
          date={currentDate}
          instances={instances}
          onDateClick={(d) => setCurrentDate(d)}
          offset={1}
        />
      </div>

      {/* Main Calendar */}
      <div className="calendar-container">
        {showHolidays && <HolidayBanner holidays={holidays} currentDate={currentDate} />}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
          initialDate={currentDate}
          headerToolbar={false}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={4}
          weekends={true}
          nowIndicator={true}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          events={events}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          eventContent={(arg) => <ChoreEvent arg={arg} />}
          height="100%"
        />
      </div>

      {/* Modals */}
      {activeModal === 'chore' && (
        <ChoreModal
          chore={modalData}
          teamMembers={members}
          onClose={closeModal}
        />
      )}

      {activeModal === 'instance' && modalData && (
        <InstanceModal
          instance={modalData}
          teamMembers={members}
          onClose={closeModal}
        />
      )}

      {activeModal === 'quickAdd' && (
        <QuickAddBox
          members={members}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
