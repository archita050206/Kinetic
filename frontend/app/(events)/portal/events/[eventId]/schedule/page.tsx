"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useParams } from "next/navigation";
import { getEventSchedules, createEventSchedule, deleteEventSchedule, type EventSchedule } from "@/lib/api/eventSchedules";
import { logSessionActivity } from "@/lib/activity-logs";
import { decodeEventId } from "@/lib/event-route-id";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type CalendarEvent = EventSchedule;

type ComposerMode = "hover" | "click";

type ComposerState = {
  dateKey: string;
  mode: ComposerMode;
};

const EVENT_COLORS = [
  "#ffb77b",
  "#67d4ff",
  "#f9a8d4",
  "#a7f3d0",
  "#fca5a5",
  "#c4b5fd",
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function createDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function keyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value));
  return new Date(year, month - 1, day);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(keyToDate(dateKey));
}

function formatShortDay(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(keyToDate(dateKey));
}

function toMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function startOfToday() {
  const now = new Date();
  return createDateKey(now);
}

function createGrid(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth.getDay();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells: Array<{
    dateKey: string;
    day: number;
    inCurrentMonth: boolean;
  }> = [];

  for (let index = 0; index < 42; index += 1) {
    const offset = index - startOffset + 1;
    let day: number;
    let cellMonth = month;
    let cellYear = year;
    let inCurrentMonth = true;

    if (offset < 1) {
      day = previousMonthDays + offset;
      cellMonth = month - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear = year - 1;
      }
      inCurrentMonth = false;
    } else if (offset > daysInMonth) {
      day = offset - daysInMonth;
      cellMonth = month + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear = year + 1;
      }
      inCurrentMonth = false;
    } else {
      day = offset;
    }

    cells.push({
      dateKey: `${cellYear}-${pad(cellMonth + 1)}-${pad(day)}`,
      day,
      inCurrentMonth,
    });
  }

  return cells;
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function LeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 3.5H11.5M5 3.5V2.5C5 2.22386 5.22386 2 5.5 2H8.5C8.77614 2 9 2.22386 9 2.5V3.5M4.5 3.5L5 11C5 11.2761 5.22386 11.5 5.5 11.5H8.5C8.77614 11.5 9 11.2761 9 11L9.5 3.5M6 5.5V9.5M8 5.5V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 1.8V4.2M11 1.8V4.2M2 6H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function SchedulePage() {
  const params = useParams<{ eventId?: string }>();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const backendEventId = decodeEventId(eventId);
  const todayKey = startOfToday();

  const [viewMonth, setViewMonth] = useState(() => toMonthStart(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftStartTime, setDraftStartTime] = useState("09:00");
  const [draftEndTime, setDraftEndTime] = useState("10:00");
  const [draftNote, setDraftNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hoverCloseTimer = useRef<number | null>(null);
  const modalCloseTimer = useRef<number | null>(null);

  // Load events from backend on mount
  useEffect(() => {
    if (!backendEventId) return;
    const resolvedEventId = backendEventId;

    async function loadSchedules() {
      try {
        setLoading(true);
        setError(null);
        const schedules = await getEventSchedules(resolvedEventId);
        setEvents(schedules);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schedules");
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, [backendEventId]);

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current !== null) {
        window.clearTimeout(hoverCloseTimer.current);
      }
      if (modalCloseTimer.current !== null) {
        window.clearTimeout(modalCloseTimer.current);
      }
    };
  }, []);

  const calendarDays = useMemo(() => createGrid(viewMonth), [viewMonth]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((accumulator, event) => {
      if (!accumulator[event.date_key]) {
        accumulator[event.date_key] = [];
      }
      accumulator[event.date_key].push(event);
      return accumulator;
    }, {});
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    return [...(eventsByDate[selectedDateKey] ?? [])].sort((left, right) => left.start_time.localeCompare(right.start_time));
  }, [eventsByDate, selectedDateKey]);

  const monthEvents = useMemo(() => {
    const monthPrefix = `${viewMonth.getFullYear()}-${pad(viewMonth.getMonth() + 1)}`;
    return events.filter((event) => event.date_key.startsWith(monthPrefix));
  }, [events, viewMonth]);

  const composerTitle = composer ? formatDayLabel(composer.dateKey) : "";

  function clearTimers() {
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }

    if (modalCloseTimer.current !== null) {
      window.clearTimeout(modalCloseTimer.current);
      modalCloseTimer.current = null;
    }
  }

  function openComposer(dateKey: string, mode: ComposerMode) {
    clearTimers();
    const selectedEvents = events
      .filter((entry) => entry.date_key === dateKey)
      .sort((left, right) => left.start_time.localeCompare(right.start_time));

    setSelectedDateKey(dateKey);
    setComposer({ dateKey, mode });
    setDraftTitle("");
    setDraftNote("");
    // Set start time to 1 hour after the last event, or 09:00 if no events
    if (selectedEvents.length > 0) {
      const lastEvent = selectedEvents[selectedEvents.length - 1];
      setDraftStartTime(lastEvent.end_time);
      const [hours, mins] = lastEvent.end_time.split(":").map(Number);
      const endHours = (hours + 1) % 24;
      setDraftEndTime(`${String(endHours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    } else {
      setDraftStartTime("09:00");
      setDraftEndTime("10:00");
    }
  }

  function handleOpenComposerForSelectedDate() {
    openComposer(selectedDateKey, "click");
  }

  function scheduleHoverClose() {
    if (!composer || composer.mode === "click") {
      return;
    }

    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current);
    }

    hoverCloseTimer.current = window.setTimeout(() => {
      setComposer(null);
    }, 140);
  }

  function scheduleModalClose() {
    if (!composer || composer.mode === "click") {
      return;
    }

    if (modalCloseTimer.current !== null) {
      window.clearTimeout(modalCloseTimer.current);
    }

    modalCloseTimer.current = window.setTimeout(() => {
      setComposer(null);
    }, 140);
  }

  function goToToday() {
    const now = new Date();
    const key = createDateKey(now);
    setComposer({ dateKey: key, mode: "click" });
    setViewMonth(toMonthStart(now));
    setSelectedDateKey(key);
    setDraftTitle("");
    setDraftNote("");
    setDraftStartTime("09:00");
    setDraftEndTime("10:00");
  }

  function handleAddEvent() {
    if (!composer || !draftTitle.trim()) {
      setMessage("Add an event title before saving.");
      return;
    }

    if (!backendEventId) {
      setMessage("Event ID is missing.");
      return;
    }

    setIsSaving(true);

    // Use a color from the palette based on current event count
    const color = EVENT_COLORS[events.length % EVENT_COLORS.length];

    createEventSchedule(backendEventId, {
      date_key: composer.dateKey,
      start_time: draftStartTime,
      end_time: draftEndTime,
      title: draftTitle.trim(),
      note: draftNote.trim(),
      color,
    })
      .then((newSchedule) => {
        setEvents((current) => [...current, newSchedule]);

        // Log to session
        logSessionActivity(backendEventId, "schedule_created", `Created schedule: ${newSchedule.title}`, {
          schedule_id: newSchedule.id,
          title: newSchedule.title,
          date: newSchedule.date_key,
          time: `${newSchedule.start_time} - ${newSchedule.end_time}`,
        });

        setMessage(`Added ${newSchedule.title} on ${formatDayLabel(composer.dateKey)}.`);
        setDraftTitle("");
        setDraftNote("");
        setDraftStartTime("09:00");
        setDraftEndTime("10:00");
        setComposer({ ...composer, mode: "click" });
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setMessage(`Error saving event: ${errorMsg}`);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  function handleDeleteEvent(eventIdToDelete: number) {
    if (!backendEventId) {
      setMessage("Event ID is missing.");
      return;
    }

    const targetEvent = events.find((event) => event.id === eventIdToDelete);
    if (!targetEvent) {
      return;
    }

    setIsSaving(true);
    deleteEventSchedule(backendEventId, eventIdToDelete)
      .then(() => {
        setEvents((current) => current.filter((event) => event.id !== eventIdToDelete));
        logSessionActivity(backendEventId, "schedule_deleted", `Deleted schedule: ${targetEvent.title}`, {
          schedule_id: eventIdToDelete,
          title: targetEvent.title,
          date: targetEvent.date_key,
          time: `${targetEvent.start_time} - ${targetEvent.end_time}`,
        });
        setMessage(`Deleted ${targetEvent.title}.`);
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setMessage(`Error deleting event: ${errorMsg}`);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  function handleMonthChange(delta: number) {
    setComposer(null);
    setViewMonth((current) => addMonths(current, delta));
  }

  return (
    <main className={`${uiFont.className} relative min-h-screen overflow-y-auto bg-white/95 dark:bg-[#05070a] text-[#e9e1d8]`}>

      {loading && (
        <div className="relative z-20 flex h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-[#b9aca4]">Loading schedule...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="relative z-20 flex h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-[#ff6b6b]">Error loading schedule:</p>
            <p className="mt-2 text-sm text-[#b9aca4]">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="relative z-10 mx-auto flex w-full flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:gap-6 lg:px-8 lg:py-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-3 rounded-2xl border border-gray-400 dark:border-white/10 bg-white/95 dark:bg-[#0b1016]/85 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-4 lg:rounded-[28px] lg:p-6"
          >
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[9px] font-semibold tracking-[0.32em] text-[#5d3a30] dark:text-[#8f8078] sm:text-[10px]">SCHEDULE_CONTROL</p>
              <h1 className={`${displayFont.className} text-2xl italic leading-[0.95] text-[#68220D] dark:text-[#f1ddcc] sm:text-4xl lg:text-6xl`}>
                {formatMonthLabel(viewMonth)}
              </h1>
              <p className="max-w-2xl text-xs leading-5 text-[#5d3a30] dark:text-[#b9aca4] sm:text-sm sm:leading-6 lg:text-[15px]">
                Click any day to pin the composer, or hover a date to preview the add-event modal. New events are stored for this event page in your browser.
              </p>
            </div>

            <div className="grid gap-2 grid-cols-3 sm:gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#3b2a10] dark:bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">MONTH EVENTS</p>
                <p className="mt-1.5 text-2xl font-semibold text-[#ffcfaa] sm:mt-2 sm:text-3xl">{monthEvents.length.toString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#3b2a10] dark:bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">SELECTED DAY</p>
                <p className="mt-1.5 text-sm font-semibold text-[#e8ddd4] sm:mt-2 sm:text-base">{formatShortDay(selectedDateKey)}</p>
                <p className="mt-0.5 text-[9px] tracking-[0.16em] text-[#8f8078] sm:mt-1 sm:text-[11px]">{selectedDateEvents.length} event(s)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#3b2a10] dark:bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">STATUS</p>
                <p className="mt-1.5 text-sm font-semibold text-[#a7f3d0] sm:mt-2 sm:text-base">LIVE</p>
                <p className="mt-0.5 text-[9px] tracking-[0.16em] text-[#8f8078] sm:mt-1 sm:text-[11px]">Responsive calendar ready</p>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-2xl border border-gray-400 dark:border-white/10 bg-white/95 dark:bg-[#0a0e12]/88 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:backdrop-blur sm:rounded-3xl sm:p-4 lg:rounded-[28px] lg:p-5"
            >
              <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.3em] text-[#5d3a30] dark:text-[#8f8078] sm:text-[10px]">MONTH NAVIGATION</p>
                  <div className="mt-2 flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleMonthChange(-1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#68220D] dark:text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:bg-[#ffb77b]/10 hover:text-[#ffcfaa] sm:h-11 sm:w-11"
                      aria-label="Previous month"
                    >
                      <LeftIcon />
                    </button>
                    <button
                      type="button"
                      onClick={goToToday}
                      className="rounded-full border border-[#ffb77b]/30 bg-[#2a1f0e] px-3 py-1.5 text-[9px] font-semibold tracking-[0.28em] text-[#ffcfaa] transition hover:bg-[#ffb77b]/15 sm:px-4 sm:py-2 sm:text-[10px]"
                    >
                      TODAY
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#68220D] dark:text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:bg-[#ffb77b]/10 hover:text-[#ffcfaa] sm:h-11 sm:w-11"
                      aria-label="Next month"
                    >
                      <RightIcon />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[8px] tracking-[0.2em] text-[#a39288] sm:gap-2 sm:px-3 sm:py-2 sm:text-[9px] lg:text-[10px]">
                  <GridIcon />
                  7-DAY VIEW
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 pb-2 text-center text-[8px] font-semibold tracking-[0.2em] text-[#823a24]  dark:text-[#75665f] sm:grid-cols-6 sm:gap-1.5 sm:pb-2.5 sm:text-[9px] lg:grid-cols-7 lg:gap-2 lg:pb-3 lg:text-[10px]">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((label) => (
                  <div key={label} className="px-0.5 py-0.5 sm:px-1 lg:px-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-7 lg:gap-2">
                {calendarDays.map((day) => {
                  const dayEvents = eventsByDate[day.dateKey] ?? [];
                  const isSelected = selectedDateKey === day.dateKey;
                  const isToday = day.dateKey === todayKey;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => {
                        if (!day.inCurrentMonth) {
                          setViewMonth(keyToDate(day.dateKey));
                        }
                        setSelectedDateKey(day.dateKey);
                      }}

                      className={`group relative min-h-24 rounded-lg border p-1.5 text-left transition sm:min-h-28 sm:rounded-xl sm:p-2 lg:min-h-40 lg:rounded-[22px] lg:p-3 ${day.inCurrentMonth
                        ? "border-gray-200  bg-[#ececec]  hover:border-[#ffb77b]/30 hover:bg-[#fff7f0] dark:border-white/10 dark:bg-[#18181b] dark:hover:bg-[#ffb77b]/6"
                        : "border-gray-300 bg-[#dcdbdb]  dark:border-white/5 dark:bg-[#1a1a1a] dark:text-[#6e625d]"
                        } ${isSelected ? "ring-1 ring-[#68220D]/80 dark:ring-[#ffb77b]/60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1 sm:gap-2">
                        <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                          <span
                            className={`text-[9px] font-semibold tracking-[0.12em] sm:text-xs lg:text-sm ${day.inCurrentMonth ? "text-[#a2a2a0]" : "text-[#746862]"
                              } ${isToday ? "text-[#392506] dark:text-[#ffcfaa]" : ""}`}
                          >
                            {day.day}
                          </span>
                          {isToday && (
                            <span className="rounded-full border border-[#ffb77b]/30 bg-[#2a1f0e] px-1.5 py-0.5 text-[7px] tracking-[0.16em] text-[#ffcfaa] sm:px-2 sm:text-[8px]">
                              TODAY
                            </span>
                          )}
                        </div>

                        {dayEvents.length > 0 && (
                          <span className="rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[7px] tracking-[0.14em] text-[#a39288] sm:px-2 sm:text-[8px]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-1 sm:mt-2 sm:space-y-1.5 lg:mt-3">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="hidden rounded-lg border border-white/10 bg-[#111821] px-1.5 py-1 text-[8px] leading-3 text-[#efe3d9] shadow-[0_8px_20px_rgba(0,0,0,0.2)] sm:block sm:text-[9px] sm:leading-4 lg:rounded-xl lg:px-2 lg:py-1.5 lg:text-[10px]"
                          >
                            <div className="flex items-center gap-1">
                              <span className="h-1 w-1 shrink-0 rounded-full sm:h-1.5 sm:w-1.5" style={{ backgroundColor: event.color }} />
                              <span className="truncate font-semibold">{event.title}</span>
                            </div>
                            <div className="mt-0.5 text-[7px] tracking-[0.16em] text-[#9f8e86] sm:text-[8px]">{event.start_time}</div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[7px] tracking-[0.16em] text-[#8f8078] sm:text-[8px] sm:tracking-[0.18em]">+{dayEvents.length - 2} MORE</div>
                        )}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                      {day.inCurrentMonth && (
                        <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#ffb77b] opacity-0 shadow-[0_0_18px_rgba(255,183,123,0.9)] transition group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="rounded-2xl border border-gray-400 dark:border-white/10 bg-white/95 dark:bg-[#0b1016]/88 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur sm:rounded-3xl sm:p-4 lg:rounded-[28px] lg:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.28em] text-[#5d3a30] dark:text-[#8f8078] sm:text-[10px]">DAY AGENDA</p>
                  <h2 className={`${displayFont.className} mt-1.5 text-xl italic text-[#68220D]  dark:text-[#f1ddcc] sm:mt-2 sm:text-3xl`}>{formatShortDay(selectedDateKey)}</h2>
                </div>
                <button
                  type="button"
                  onClick={handleOpenComposerForSelectedDate}
                  className="flex items-center gap-1 rounded-full border border-[#ffb77b]/30 bg-[#3b2a10] px-2.5 py-1.5 text-[8px] font-semibold tracking-[0.2em] text-[#ffcfaa] transition hover:bg-[#ffb77b]/15 sm:px-3 sm:py-2 sm:text-[9px]"
                  aria-label="Add event for selected date"
                  title="Add event"
                >
                  <PlusIcon />
                  ADD EVENT
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/2.5 px-3 py-4 text-xs leading-5 text-[#5d3a30] dark:text-[#a39288] sm:rounded-2xl sm:px-4 sm:py-6 sm:text-sm sm:leading-6">
                    No events are scheduled for {formatShortDay(selectedDateKey)} yet. Use ADD EVENT to create one.
                  </div>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:rounded-2xl sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: event.color }} />
                            <p className="truncate text-xs font-semibold text-[#f1ddcc] sm:text-sm">{event.title}</p>
                          </div>
                          <p className="mt-1.5 text-[9px] tracking-[0.22em] text-[#9f8e86] sm:mt-2 sm:text-[10px] sm:tracking-[0.24em]">{event.start_time} - {event.end_time}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={isSaving}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#d1c4bb] transition hover:border-[#ff7b7b]/40 hover:bg-[#2a1111] hover:text-[#ff9d9d] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${event.title}`}
                          title="Delete event"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      {event.note && <p className="mt-2 text-xs leading-5 text-[#c7bab2] sm:mt-3 sm:text-sm sm:leading-6">{event.note}</p>}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#3b2a10] dark:bg-[#111821] p-3 sm:mt-5 sm:rounded-3xl sm:p-4">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:gap-2 sm:text-[10px]">
                  <CalendarIcon />
                  QUICK ADD
                </div>
                <p className="mt-2 text-xs leading-5 text-[#b9aca4] sm:text-sm sm:leading-6">
                  Choose a day, set a time, and save the event without leaving the calendar.
                </p>
              </div>
            </motion.aside>
          </section>

          {composer && (
            <div
              className="fixed inset-0 z-50 bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 lg:px-6 lg:py-10"
              onClick={() => setComposer(null)}
              onMouseMove={scheduleHoverClose}
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22 }}
                className="mx-auto flex h-full w-full max-w-2xl items-center justify-center"
                onClick={(event) => event.stopPropagation()}
                onMouseEnter={clearTimers}
                onMouseLeave={scheduleModalClose}
              >
                <div className="w-full rounded-2xl border border-white/10 bg-[#0a0f15] p-3 shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:rounded-3xl sm:p-4 lg:rounded-[28px] lg:p-6">
                  <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4 lg:mb-5">
                    <div>
                      <p className="text-[9px] font-semibold tracking-[0.3em] text-[#8f8078] sm:text-[10px]">ADD EVENT</p>
                      <h3 className={`${displayFont.className} mt-1.5 text-xl italic text-[#f1ddcc] sm:mt-2 sm:text-3xl lg:mt-2 lg:text-3xl`}>{composerTitle}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setComposer(null)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#e8ddd4] transition hover:border-[#ffb77b]/30 hover:bg-[#ffb77b]/10 hover:text-[#ffcfaa] sm:h-10 sm:w-10"
                      aria-label="Close composer"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-[1fr_150px] lg:grid-cols-[1fr_170px]">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="block">
                        <span className="mb-1.5 block text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em]">EVENT TITLE</span>
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          placeholder="Board review, dinner, rehearsal..."
                          disabled={isSaving}
                          className="w-full rounded-lg border border-white/10 bg-[#0f151d] px-3 py-2.5 text-xs text-[#efe3d9] outline-none transition placeholder:text-[#6f645f] focus:border-[#ffb77b]/40 disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm lg:rounded-2xl"
                        />
                      </label>

                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em]">START TIME</span>
                          <input
                            type="time"
                            value={draftStartTime}
                            onChange={(event) => setDraftStartTime(event.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-lg border border-white/10 bg-[#0f151d] px-3 py-2.5 text-xs text-[#efe3d9] outline-none transition focus:border-[#ffb77b]/40 disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm lg:rounded-2xl"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em]">END TIME</span>
                          <input
                            type="time"
                            value={draftEndTime}
                            onChange={(event) => setDraftEndTime(event.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-lg border border-white/10 bg-[#0f151d] px-3 py-2.5 text-xs text-[#efe3d9] outline-none transition focus:border-[#ffb77b]/40 disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm lg:rounded-2xl"
                          />
                        </label>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#0f151d] px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3 lg:rounded-2xl">
                        <p className="text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:text-[10px] sm:tracking-[0.28em]">DATE</p>
                        <p className="mt-1 text-xs font-semibold text-[#efe3d9] sm:mt-1.5 sm:text-sm">{formatDayLabel(composer.dateKey)}</p>
                      </div>

                      <label className="block">
                        <span className="mb-1.5 block text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em]">NOTES</span>
                        <textarea
                          value={draftNote}
                          onChange={(event) => setDraftNote(event.target.value)}
                          rows={3}
                          placeholder="Optional details for this event"
                          disabled={isSaving}
                          className="w-full rounded-lg border border-white/10 bg-[#0f151d] px-3 py-2.5 text-xs leading-5 text-[#efe3d9] outline-none transition placeholder:text-[#6f645f] focus:border-[#ffb77b]/40 disabled:opacity-50 sm:rows-4 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6 lg:rounded-2xl"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/3 p-3 sm:gap-4 sm:rounded-3xl sm:p-4 lg:rounded-3xl">
                      <div>
                        <p className="text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:text-[10px] sm:tracking-[0.28em]">PREVIEW</p>
                        <div className="mt-2 rounded-lg border border-white/10 bg-[#111821] p-2.5 sm:mt-3 sm:rounded-xl sm:p-4 lg:rounded-2xl">
                          <p className="text-xs font-semibold text-[#f1ddcc] sm:text-sm">{draftTitle.trim() || "Untitled event"}</p>
                          <p className="mt-1 text-[8px] tracking-[0.22em] text-[#9f8e86] sm:mt-1.5 sm:text-[10px] sm:tracking-[0.24em]">{draftStartTime || "--:--"} - {draftEndTime || "--:--"}</p>
                          <p className="mt-2 text-xs leading-5 text-[#b9aca4] sm:mt-2.5 sm:text-sm sm:leading-6">
                            {draftNote.trim() || "Add a note to keep this event context visible later."}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={handleAddEvent}
                          disabled={isSaving}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#ffb77b] px-3 py-2.5 text-[10px] font-bold tracking-[0.18em] text-[#2e1500] transition hover:bg-[#ffc994] disabled:opacity-50 disabled:cursor-not-allowed sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs sm:gap-2 lg:rounded-2xl"
                        >
                          <PlusIcon />
                          {isSaving ? "SAVING..." : "SAVE EVENT"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposer(null)}
                          disabled={isSaving}
                          className="rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-[10px] font-semibold tracking-[0.18em] text-[#d1c4bb] transition hover:border-[#ffb77b]/30 hover:text-[#ffcfaa] disabled:opacity-50 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs lg:rounded-2xl"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  </div>

                  {message && <p className="mt-3 text-xs text-[#a7f3d0] sm:mt-4 sm:text-sm">{message}</p>}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}


