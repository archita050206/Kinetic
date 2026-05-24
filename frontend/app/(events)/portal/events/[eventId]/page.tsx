"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import { apiGet } from "@/lib/api/client";
import { decodeEventId } from "@/lib/event-route-id";
import { 
  ACTIVITY_LOGS_UPDATED_EVENT,
  getSessionActivityLogs, 
  formatAction, 
  getActionColor,
  type SessionActivityLog 
} from "@/lib/activity-logs";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type EventItem = {
  id: string;
  name: string;
  location?: string | null;
  eventDate?: string | null;
  region: string;
  status: string;
  invitationCount: number;
  acceptedCount: number;
};


export default function EventDashboardPage() {
  const { session } = useAuth();

  const params = useParams<{ eventId: string }>();
  const backendEventId = decodeEventId(params.eventId);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionActivityLog[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      try {
        const data = await apiGet<{ data?: EventItem }>(backendEventId ? `/api/events/${backendEventId}` : "/api/events/invalid");
        
        if (isMounted && data.data) {
          setEvent(data.data);
        }
      } catch {
        // Event not found or not accessible
      }
    }

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [backendEventId, params.eventId]);

  useEffect(() => {
    function refreshLogs() {
      setSessionLogs(backendEventId ? getSessionActivityLogs(backendEventId) : []);
    }

    queueMicrotask(refreshLogs);
    window.addEventListener(ACTIVITY_LOGS_UPDATED_EVENT, refreshLogs);
    window.addEventListener("storage", refreshLogs);

    return () => {
      window.removeEventListener(ACTIVITY_LOGS_UPDATED_EVENT, refreshLogs);
      window.removeEventListener("storage", refreshLogs);
    };
  }, [backendEventId]);

  const totalLogs = sessionLogs.length;
  const recentLogs = sessionLogs.slice(0, 5);

  // Load all activity logs when modal opens
  const handleOpenLogsModal = async () => {
    setShowLogsModal(true);
    const logs = getSessionActivityLogs(backendEventId ?? "");
    setSessionLogs(logs);
  };

  const acceptedPercent = event?.invitationCount ? Math.round((event.acceptedCount / event.invitationCount) * 100) : 0;

  return (
    <main className={`${uiFont.className} min-h-screen bg-white/95 dark:bg-[#0b0d0f] text-[#68220D] dark:text-[#e6e1dd] py-10`}> 
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="mx-auto px-6">
          <header className="mb-8">
            <p className="text-[10px] tracking-[0.28em] text-[#401508] dark:text-[#a58f83]">EVENT_STATUS: {event?.status ?? "LOADING"}</p>
            <h1 className={`${displayFont.className} text-5xl font-semibold italic text-[#60200d] dark:text-[#f6d3a6] leading-tight`}>Event Terminal</h1>
            <p className="mt-2 text-sm text-[#401508] dark:text-[#b9a59b]">Event-specific command center for managing high-stakes logistics, guest protocols, and synthetic telemetry.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <div className="rounded-lg border border-[#2c2520]  bg-gray-100/90 dark:bg-[#0f1113] p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={`${displayFont.className} text-3xl italic text-[#68220D] dark:text-[#e6dad3]`}>RSVP Momentum</h2>
                    <p className="text-[10px] tracking-[0.18em] text-[#401508] dark:text-[#8f8078] mt-1">{event?.region ?? "AWS | ap-south-1"}</p>
                  </div>
                  <div className="text-right ">
                    <p className="text-5xl font-semibold italic text-[#68220D] dark:text-[#f3bf7a]">{acceptedPercent}%</p>
                    <p className="text-[10px] tracking-[0.2em] text-[#401508] dark:text-[#8f8078]">ACCEPTED</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-56 rounded-md border border-[#302922] bg-[#e8cbae] dark:bg-[#0b0d0f] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[110px] font-extralight text-[#2a221f] -tracking-tight opacity-40">{acceptedPercent}%</p>
                        <p className="-mt-20 text-2xl font-semibold text-[#8a4a37] dark:text-[#f3bf7a]">{acceptedPercent}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-64">
                    <div className="rounded-md border border-[#2b2520] bg-[#e8cbae]  dark:bg-[#0e1113] p-4 mb-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#401508] dark:text-[#8f8078]">INVITES</p>
                      <p className="mt-1 text-2xl font-medium text-[rgb(158,75,3)]">{event?.invitationCount ?? 'Loading...'}</p>
                    </div>
                    <div className="rounded-md border border-[#2b2520] bg-[#e8cbae] dark:bg-[#0e1113] p-4 mb-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#401508] dark:text-[#8f8078]">ACCEPTED</p>
                      <p className="mt-1 text-2xl font-medium text-[#642b1a] dark:text-[#f3bf7a]">{event?.acceptedCount ?? 'Loading...'}</p>
                    </div>
                    <div className="rounded-md border border-[#2b2520] bg-[#e8cbae]  dark:bg-[#0e1113] p-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#401508] dark:text-[#8f8078]">PENDING</p>
                      <p className="mt-1 text-2xl font-medium text-[rgb(158,75,3)] dark:text-[#e6ddd5]">{Math.max((event?.invitationCount ?? 0) - (event?.acceptedCount ?? 0), 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#2b2520] bg-gray-100/90 dark:bg-[#0f1113] p-4 cursor-pointer hover:border-[#3c332d] transition" onClick={handleOpenLogsModal}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`${displayFont.className} text-xl italic text-[#68220D] dark:text-[#e6dad3]`}>Protocol Log</h3>
                    <p className="text-[9px] tracking-[0.18em] text-[#301107] dark:text-[#8f8078]">{totalLogs} TOTAL</p>
                  </div>
                  <div className="bg-[#341b03] dark:bg-[#070808] rounded-md p-4 text-xs  dark:text-[#c9bdae]" style={{ minHeight: 180 }}>
                    {recentLogs.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#9f8e86]">No activity logged yet</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {recentLogs.map((log) => (
                          <li key={log.id} className="text-[12px]">
                            <span className="text-[#9f8e86] mr-3">•</span>
                            <span style={{ color: getActionColor(log.action) }} className="font-mono mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[#d6c9bd]">{formatAction(log.action)}: {log.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-[10px] tracking-[0.1em] text-[#301006] dark:text-[#8f8078] mt-3 hover:text-[#a58f83] transition">CLICK TO VIEW ALL LOGS →</p>
                </div>

                <div className="rounded-lg border border-[#2b2520] bg-gray-100/90 dark:bg-[#0f1113] p-6">
                  <h3 className={`${displayFont.className} text-2xl italic text-[#68220D] dark:text-[#e6dad3]`}>Synthetic Catalyst 01</h3>
                  <p className="mt-2 text-sm text-[#381308] dark:text-[#c5b3a8]">Open the Guests rail to send event-specific invitations and initiate the primary catalyst protocol.</p>
                  <div className="mt-6 border-t border-[#2b2520] pt-4 text-sm text-[#2c0d03] dark:text-[#8f8078]">
                    <p className="text-[10px] tracking-[0.2em]">ACTIVE USER</p>
                    <p className="mt-1 text-sm font-medium  text-[#74311d] dark:text-[#ffcfaa]">{session?.user.name}</p>
                    <p className="text-xs text-[#2c0d03] dark:text-[#9f8e86]">{session?.user.email}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside>
              <div className="rounded-lg border border-[#2b2520] bg-gray-100/90 dark:bg-[#0f1113] p-6 flex flex-col items-center">
                <div className="h-44 w-44 rounded-full border border-[#3c332d] flex items-center justify-center mb-4" style={{ background: `conic-gradient(#723f0f 0deg, #723f0f ${acceptedPercent * 3.6}deg, #723f0f ${acceptedPercent * 3.6}deg 360deg)` }}>
                  <div className="h-36 w-36 rounded-full bg-[#723f0f] dark:bg-[#0b0d0f] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-semibold text-[#f3bf7a]">{acceptedPercent}%</p>
                      <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">RSVP</p>
                    </div>
                  </div>
                </div>
                <h4 className={`${displayFont.className} text-lg italic text-[#68220D] dark:text-[#e6dad3] mb-2`}>Guest Flow</h4>
                <p className="text-sm text-[#2b0e06] dark:text-[#c5b3a8] text-center">Real-time capacity and arrival sequencing for optimized entry protocols.</p>
              </div>
            </aside>
          </div>
        </div>
      </motion.div>

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0f1113] border border-[#2b2520] rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="border-b border-[#2b2520] p-6 flex items-center justify-between">
              <div>
                <h2 className={`${displayFont.className} text-2xl italic text-[#e6dad3]`}>Activity Protocol</h2>
                <p className="text-[10px] tracking-[0.18em] text-[#8f8078] mt-1">{totalLogs} TOTAL ENTRIES</p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-[#9f8e86] hover:text-[#e6dad3] transition text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {sessionLogs.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-[#9f8e86]">No activity recorded for this event</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sessionLogs.map((log) => (
                    <li key={log.id} className="border-l-4 pl-4 pb-4" style={{ borderColor: getActionColor(log.action) }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-semibold" style={{ color: getActionColor(log.action) }}>
                            {formatAction(log.action)}
                          </p>
                          <p className="text-sm text-[#d6c9bd] mt-1">{log.description}</p>
                          {log.metadata && (
                            <div className="text-xs text-[#9f8e86] mt-2 space-y-1">
                              {log.metadata.title && <p>Title: {log.metadata.title}</p>}
                              {log.metadata.image_count && <p>Images: {log.metadata.image_count}</p>}
                              {log.metadata.guest_name && <p>Guest: {log.metadata.guest_name}</p>}
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-[#9f8e86] whitespace-nowrap ml-4">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#2b2520] p-4 text-center">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-6 py-2 bg-[#2b2520] hover:bg-[#3c332d] text-[#d6c9bd] rounded text-sm transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

