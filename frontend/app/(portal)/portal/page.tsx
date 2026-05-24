
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { encodeEventId } from "@/lib/event-route-id";
import { apiGet, apiPost } from "@/lib/api/client";
import { logSessionActivity } from "@/lib/activity-logs";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

type EventItem = {
  id: string;
  name: string;
  location?: string | null;
  eventDate?: string | null;
  region: string;
  status: "ACTIVE" | "PAUSED";
  invitationCount: number;
  acceptedCount: number;
};

type EventsResponse = {
  data?: EventItem | EventItem[];
  message?: string;
  errors?: Record<string, string[]>;
};


function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="3" cy="4" r="1" fill="currentColor"/>
      <circle cx="3" cy="8" r="1" fill="currentColor"/>
      <circle cx="3" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2.5v10M2.5 7.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="12" cy="8" r="1.2" fill="currentColor"/>
    </svg>
  );
}

export default function PortalEventsPage() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return events;
    }

    return events.filter((event) => event.name.toLowerCase().includes(normalizedQuery));
  }, [events, query]);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const data = await apiGet<EventsResponse>("/api/events");

        if (!Array.isArray(data.data)) {
          throw new Error(data.message || "Could not load events.");
        }

        if (isMounted) {
          setEvents(data.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  async function createEvent() {
    if (!newEventName.trim() || !newEventLocation.trim() || !newEventDate) {
      setError("Enter an event name, location, and date.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const data = await apiPost<EventsResponse>("/api/events", {
        name: newEventName.trim(),
        location: newEventLocation.trim(),
        eventDate: newEventDate,
      });

      if (!data.data || Array.isArray(data.data)) {
        const validationErrors = data.errors ? Object.values(data.errors).flat().join(", ") : "";
        throw new Error(validationErrors || data.message || "Could not create event.");
      }

      setEvents((prev) => [data.data as EventItem, ...prev]);
      logSessionActivity(data.data.id, "event_created", `Created event: ${data.data.name}`, {
        event_name: data.data.name,
        location: data.data.location ?? undefined,
        date: data.data.eventDate ?? undefined,
      });
      setShowCreateModal(false);
      setNewEventName("");
      setNewEventLocation("");
      setNewEventDate("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setCreating(false);
    }
  }

  function scrollCarousel(direction: "left" | "right") {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const cardWidth = container.querySelector<HTMLElement>('[data-event-card="true"]')?.offsetWidth ?? 352;
    const gap = 16;
    const delta = (cardWidth + gap) * (direction === "left" ? -1 : 1);

    container.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <main className={`${uiFont.className} h-full relative overflow-x-clip bg-[#f2ead1] dark:bg-[#101112] text-[#f4eee9]`}>
        <div className="pointer-events-none absolute inset-y-0 right-[-22%] hidden w-[80%] md:block lg:right-[-14%] lg:w-[70%] xl:right-0 xl:w-[55%]">
            <Image
              src="/events.gif"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-right opacity-80"
              width={800}
              height={600}
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-l from-[#101112]/5 via-[#101112]/55 to-[#101112]" />
          </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative h-full overflow-hidden">
        <h1 className={`${displayFont.className} text-3xl font-semibold text-[#f7efe8] sm:text-4xl`}>Events</h1>
      
        <div className="mt-8 flex flex-col gap-4 lg:mt-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
            <label className="flex h-10 w-full items-center gap-3 rounded-md border border-[#2d2f31] bg-[#191a1c] px-3 text-[#898d92] sm:h-9 sm:w-[22rem]">
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#e6dad3] placeholder:text-[#6f7378] focus:outline-none"
                placeholder="Search for an event"
              />
            </label>
            <button className="h-9 rounded-md border border-dashed border-[#33363a] px-3 text-sm font-semibold text-[#e6dad3] sm:w-auto">
              Status
            </button>
            <button className="h-9 rounded-md border border-[#33363a] bg-[#1a1b1e] px-4 text-sm font-semibold text-[#f1e8df] shadow-sm sm:w-auto">
              Sorted by name
            </button>
          </div>

          <div className="flex w-full items-center gap-2 sm:gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowCreateModal(true);
              }}
              disabled={creating}
              className="ml-auto flex h-9 items-center gap-2 rounded-md bg-[#007a4d] px-4 text-sm font-bold text-white transition hover:bg-[#008d59] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusIcon />
              {creating ? "Creating..." : "New event"}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-[#ff9e9e]">{error}</p>}

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#2d2f31] bg-[#18191b] text-[#d6d9dd] transition hover:border-[#ffb77b]/45 hover:text-[#ffb77b]"
              aria-label="Scroll events left"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#2d2f31] bg-[#18191b] text-[#d6d9dd] transition hover:border-[#ffb77b]/45 hover:text-[#ffb77b]"
              aria-label="Scroll events right"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          {loading ? (
            <div className="flex min-w-[min(88vw,22rem)] snap-start items-center gap-3 rounded-md border border-[#2d2f31] bg-[#1b1c1e] px-6 py-8 text-sm font-semibold tracking-[0.14em] text-[#8f949a] sm:min-w-[20rem] lg:min-w-[22rem]">
              <span className="h-4 w-4 animate-spin rounded-full border border-[#3b3430] border-t-[#ffb77b]" />
              LOADING EVENTS
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="min-w-[min(88vw,22rem)] snap-start rounded-md border border-[#2d2f31] bg-[#1b1c1e] px-6 py-8 text-sm text-[#8f949a] sm:min-w-[20rem] lg:min-w-[22rem]">
              No events found.
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <motion.button
                key={event.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                onClick={() => router.push(`/portal/events/${encodeEventId(event.id)}`)}
                data-event-card="true"
                className="group w-[min(88vw,22rem)] flex-none snap-start rounded-md border border-[#2d2f31] bg-[#1b1c1e]/95 p-5 text-left transition hover:border-[#ffb77b]/45 hover:bg-[#202124] sm:w-[20rem] sm:p-6 lg:w-[22rem]"
                
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#f5f0eb]">{event.name}</h2>
                    <p className="mt-3 text-base text-[#9ca3ad] sm:text-lg">{event.location || event.region}</p>
                    {event.eventDate && <p className="mt-1 text-xs font-semibold tracking-[0.16em] text-[#777b80]">{event.eventDate}</p>}
                  </div>
                  <span className="text-[#777b80] transition group-hover:text-[#ffb77b]">
                    <DotsIcon />
                  </span>
                </div>

                <div className="mt-7 inline-flex rounded border border-[#34373b] px-2 py-1 text-[10px] font-semibold tracking-[0.22em] text-[#d7dbe0]">
                  EVENT
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-2 text-sm sm:mt-12">
                  <span className="font-semibold text-[#f1e8df]">
                    {event.status === "PAUSED" ? "Event is paused" : "Event is active"}
                  </span>
                  <span className="text-[#8f949a]">
                    {event.acceptedCount}/{event.invitationCount} accepted
                  </span>
                </div>
              </motion.button>
            ))
          )}
          </div>
        </div>
        </section>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void createEvent();
            }}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-[#34373b] bg-[#111316] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8f8078]">NEW_EVENT</p>
                <h2 className={`${displayFont.className} mt-1 text-3xl font-semibold text-[#f7efe8]`}>Create event</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-2xl leading-none text-[#8f8078] hover:text-[#ffb77b]"
                aria-label="Close new event modal"
              >
                X
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.2em] text-[#8f8078]">EVENT NAME</span>
              <input
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full rounded-sm border border-[#34373b] bg-[#191a1c] px-4 py-3 text-sm text-[#e6dad3] placeholder:text-[#6f7378] focus:border-[#ffb77b]/60 focus:outline-none"
                placeholder="Launch Night"
                autoFocus
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.2em] text-[#8f8078]">LOCATION</span>
              <input
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                className="w-full rounded-sm border border-[#34373b] bg-[#191a1c] px-4 py-3 text-sm text-[#e6dad3] placeholder:text-[#6f7378] focus:border-[#ffb77b]/60 focus:outline-none"
                placeholder="Mumbai, India"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.2em] text-[#8f8078]">DATE</span>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="w-full rounded-sm border border-[#34373b] bg-[#191a1c] px-4 py-3 text-sm text-[#e6dad3] focus:border-[#ffb77b]/60 focus:outline-none"
              />
            </label>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="border border-[#34373b] px-4 py-3 text-xs font-bold tracking-[0.18em] text-[#dac7bd] hover:border-[#ffb77b]/45"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-[#007a4d] px-4 py-3 text-xs font-bold tracking-[0.18em] text-white hover:bg-[#008d59] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? "CREATING" : "CREATE"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
