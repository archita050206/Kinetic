"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useParams } from "next/navigation";
import { decodeEventId } from "@/lib/event-route-id";
import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { logSessionActivity } from "@/lib/activity-logs";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 7L13 1L9 7L13 13L1 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 2h10M3 6h6M5 10h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v7M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 9v2h10V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8M4 14h8M5 2C5 5 8 7 8 7S11 9 11 14M11 2C11 5 8 7 8 7S5 9 5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="3" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="13" cy="8" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type GuestStatus = "ACCEPTED" | "PENDING" | "REJECTED";

interface Guest {
  id: string;
  name: string;
  email: string;
  peopleCount: number;
  guestResponseMessage: string | null;
  status: GuestStatus;
  date: string;
  icon: "user" | "hourglass";
}

type InvitationApiItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  customMessage?: string | null;
  additionalGuestNames?: string[];
  peopleCount?: number;
  guestResponseMessage?: string | null;
  status: GuestStatus;
  sentAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
};

type InvitationApiResponse = {
  data?: InvitationApiItem | InvitationApiItem[];
  message?: string;
  errors?: Record<string, string[]>;
};

// ── Data ───────────────────────────────────────────────────────────────────


function getTodayStr() {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/ /g, '_').toUpperCase();
}

function formatInviteDate(value?: string | null) {
  if (!value) {
    return getTodayStr();
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return getTodayStr();
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/ /g, '_').toUpperCase();
}

function mapInvitationToGuest(invitation: InvitationApiItem): Guest {
  return {
    id: invitation.id,
    name: invitation.guestName,
    email: invitation.guestEmail,
    peopleCount: invitation.peopleCount ?? 1,
    guestResponseMessage: invitation.guestResponseMessage ?? null,
    status: invitation.status,
    date: formatInviteDate(invitation.acceptedAt ?? invitation.rejectedAt ?? invitation.sentAt),
    icon: invitation.status === "ACCEPTED" ? "user" : "hourglass",
  };
}

const STATUS_STYLES: Record<GuestStatus, { bg: string; text: string; dot: string }> = {
  ACCEPTED: { bg: "bg-[#ffb77b]/12 border-[#ffb77b]/40", text: "text-[#ffb77b]",   dot: "bg-[#ffb77b]" },
  PENDING:  { bg: "bg-[#e6dad3]/10 border-[#8f8078]/40", text: "text-[#dac7bd]",   dot: "bg-[#dac7bd]" },
  REJECTED: { bg: "bg-[#ff7b7b]/10 border-[#ff7b7b]/35", text: "text-[#ff9e9e]",   dot: "bg-[#ff9e9e]" },
};

// ── Subcomponents ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  barAccent,
  delay,
}: {
  label: string;
  value: string;
  accent: string;
  barAccent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col gap-1"
    >
      <p className="text-[9px] tracking-[0.22em] text-[#5d3a30] dark:text-[#8f8078]">
        {label}
      </p>

      <p className={`text-4xl font-semibold leading-none ${accent}`}>
        {value}
      </p>

      <div className={`mt-1.5 h-0.5 w-8 rounded-full ${barAccent}`} />
    </motion.div>
  );
}

function StatusBadge({ status }: { status: GuestStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[9px] font-semibold tracking-[0.18em] ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const params = useParams<{ eventId?: string }>();
  const eventId = params.eventId;
  const backendEventId = decodeEventId(eventId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [inviteMultiple, setInviteMultiple] = useState(false);
  const [additionalName, setAdditionalName] = useState("");
  const [additionalNames, setAdditionalNames] = useState<string[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [messageGuest, setMessageGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GuestStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "name" | "people">("date");

  useEffect(() => {
    let isMounted = true;

    async function loadInvitations() {
      if (!backendEventId) {
        setRosterLoading(false);
        setError("Open an event before managing invitations.");
        return;
      }

      try {
        const data = await apiGet<InvitationApiResponse>(`/api/events/${backendEventId}/invite-guest`);

        if (!Array.isArray(data.data)) {
          return;
        }

        if (isMounted) {
          setGuests(data.data.map(mapInvitationToGuest));
        }
      } catch {
        // Keep the invite form usable even if the saved roster cannot load.
      } finally {
        if (isMounted) {
          setRosterLoading(false);
        }
      }
    }

    void loadInvitations();

    return () => {
      isMounted = false;
    };
  }, [backendEventId]);

  async function handleSendNow() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    console.log("Sending invitation to:", { name, email, customMessage, additionalNames });
    try {
      if (!backendEventId) {
        throw new Error("Open an event before sending invitations.");
      }

      const data = await apiPost<InvitationApiResponse>(`/api/events/${backendEventId}/invite-guest`, {
        guestName: name,
        guestEmail: email,
        customMessage,
        additionalGuestNames: inviteMultiple ? additionalNames : [],
      });
      setSuccess("Invitation email sent successfully.");
      const savedInvitation = data.data && !Array.isArray(data.data) ? data.data : null;
      const peopleCount = savedInvitation?.peopleCount ?? 1 + (inviteMultiple ? additionalNames.length : 0);

      logSessionActivity(backendEventId, "guest_invited", `Sent invite to ${savedInvitation?.guestName ?? name}`, {
        guest_name: savedInvitation?.guestName ?? name,
        guest_email: savedInvitation?.guestEmail ?? email,
        people_count: peopleCount,
      });

      setGuests((prev) => [
        savedInvitation
          ? mapInvitationToGuest(savedInvitation)
          : {
              id: Date.now().toString(),
              name,
              email,
              peopleCount: 1 + (inviteMultiple ? additionalNames.length : 0),
              guestResponseMessage: null,
              status: "PENDING",
              date: getTodayStr(),
              icon: "hourglass",
            },
        ...prev,
      ]);
      setName("");
      setEmail("");
      setCustomMessage("");
      setInviteMultiple(false);
      setAdditionalName("");
      setAdditionalNames([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  }

  function handleAddAdditionalName() {
    const nextName = additionalName.trim();

    if (!nextName || additionalNames.some((existingName) => existingName.toLowerCase() === nextName.toLowerCase())) {
      return;
    }

    setAdditionalNames((prev) => [...prev, nextName]);
    setAdditionalName("");
  }

  function handleRemoveAdditionalName(nameToRemove: string) {
    setAdditionalNames((prev) => prev.filter((existingName) => existingName !== nameToRemove));
  }

  async function handleDeleteGuest(guest: Guest) {
    if (!backendEventId) {
      setError("Open an event before managing invitations.");
      return;
    }

    // const confirmed = window.confirm(
    //   guest.status === "ACCEPTED"
    //     ? `Delete ${guest.name}'s invitation and remove their uploaded photos?`
    //     : `Delete ${guest.name}'s invitation?`
    // );

    // if (!confirmed) {
    //   return;
    // }

    setDeletingGuestId(guest.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiDelete<InvitationApiResponse>(`/api/events/${backendEventId}/invite-guest/${guest.id}`);
      setGuests((prev) => prev.filter((entry) => entry.id !== guest.id));
      logSessionActivity(backendEventId, "guest_deleted", `Deleted invite for ${guest.name}`, {
        guest_name: guest.name,
        guest_email: guest.email,
        previous_status: guest.status,
      });

      if (messageGuest?.id === guest.id) {
        setMessageGuest(null);
      }

      setOpenActionsFor(null);
      setSuccess(response.message || (guest.status === "ACCEPTED" ? "Invitation and guest uploads deleted." : "Invitation deleted."));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete invitation.");
    } finally {
      setDeletingGuestId(null);
    }
  }
  const sentCount = guests.length;

  const acceptedCount = guests.filter(
    (guest) => guest.status === "ACCEPTED"
  ).length;

  const rejectedCount = guests.filter(
    (guest) => guest.status === "REJECTED"
  ).length;

  const scheduledCount = guests.filter(
    (guest) => guest.status === "PENDING"
  ).length;

  const filteredAndSortedGuests = guests
    .filter((guest) => {
      // Status filter
      if (statusFilter !== "ALL" && guest.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        return (
          guest.name.toLowerCase().includes(term) ||
          guest.email.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "people") {
        return b.peopleCount - a.peopleCount;
      }
      // sortBy === "date"
      return b.date.localeCompare(a.date);
    });

  return (
    <main className={`${uiFont.className} min-h-screen bg-white/95 dark:bg-[#090b10] text-[#e5e2e3] flex flex-col`}>

      {/* ── TOP PANEL ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 border-b border-gray-400/70 dark:border-[#2b2520]/70 lg:grid-cols-2"
      >
        {/* LEFT: Command Interface */}
        <div className="border-b border-gray-400/70 dark:border-[#2b2520]/70 px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r lg:py-8">
          <p className="text-[9px] tracking-[0.3em] text-[#5d3a30] dark:text-[#8f8078] mb-2">COMMAND_INTERFACE</p>
          <h1 className={`${displayFont.className} text-4xl italic font-semibold text-[#68220D] dark:text-[#e6dad3] leading-[1.05] mb-7`}>
            Invitation Control Center
          </h1>

          {/* Name, Email, and Message input */}
          <div className="mb-5">
            <p className="text-[9px] tracking-[0.24em] text-[#5d3a30] dark:text-[#8f8078] mb-2">GUEST NAME</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 bg-[#2a1f0e] dark:bg-[#0d1118] border border-[#3b3430]/80 rounded-sm px-4 py-3 text-sm tracking-widest text-[#dac7bd] placeholder:text-[#5a4e48] focus:outline-none focus:border-[#ffb77b]/60 transition"
              placeholder="Full Name"
            />
            <p className="text-[9px] tracking-[0.24em] text-[#5d3a30] dark:text-[#8f8078] mb-2">TARGET EMAIL ADDRESS</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 bg-[#2a1f0e] dark:bg-[#0d1118] border border-[#3b3430]/80 rounded-sm px-4 py-3 text-sm tracking-widest text-[#dac7bd] placeholder:text-[#5a4e48] focus:outline-none focus:border-[#ffb77b]/60 transition"
              placeholder="guest@email.com"
            />
            <label className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[#9f8e86]">
              <input
                type="checkbox"
                checked={inviteMultiple}
                onChange={(e) => {
                  setInviteMultiple(e.target.checked);
                  if (!e.target.checked) {
                    setAdditionalName("");
                    setAdditionalNames([]);
                  }
                }}
                className="h-3.5 w-3.5 accent-[#ffb77b]"
              />
              INVITE MULTIPLE
            </label>
            {inviteMultiple && (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={additionalName}
                    onChange={(e) => setAdditionalName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAdditionalName();
                      }
                    }}
                    className="min-w-0 flex-1 bg-[#2a1f0e] dark:bg-[#0d1118] border border-[#3b3430]/80 rounded-sm px-4 py-2.5 text-sm tracking-widest text-[#dac7bd] placeholder:text-[#5a4e48] focus:outline-none focus:border-[#ffb77b]/60 transition"
                    placeholder="Additional person name"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdditionalName}
                    disabled={!additionalName.trim()}
                    aria-label="Add person"
                    className="grid h-10.5 w-10.5 shrink-0 place-items-center rounded-sm border border-[#ffb77b]/55 bg-[#2a1f0e] text-[#ffcfaa] hover:bg-[#ffb77b]/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon />
                  </button>
                </div>
                {additionalNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {additionalNames.map((additionalGuestName) => (
                      <button
                        key={additionalGuestName}
                        type="button"
                        onClick={() => handleRemoveAdditionalName(additionalGuestName)}
                        className="rounded-sm border border-[#3b3430]/80 bg-[#141820] px-2.5 py-1 text-[10px] tracking-[0.12em] text-[#dac7bd] hover:border-[#ffb77b]/45"
                      >
                        {additionalGuestName} x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-[9px] tracking-[0.24em] text-[#5d3a30] dark:text-[#8f8078] mb-2">OPTIONAL MESSAGE</p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-[#2a1f0e] dark:bg-[#0d1118] border border-[#3b3430]/80 rounded-sm px-4 py-3 text-sm tracking-widest text-[#dac7bd] placeholder:text-[#5a4e48] focus:outline-none focus:border-[#ffb77b]/60 transition"
              placeholder="Add a custom message (optional)"
              rows={2}
            />
          </div>

          {/* Action buttons and status */}
          <div className="grid grid-cols-1 gap-3 mb-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSendNow}
              disabled={loading || !name || !email}
              className="flex items-center justify-center gap-2.5 bg-[#ffb77b] hover:bg-[#ffc994] transition px-5 py-3.5 text-xs font-bold tracking-[0.18em] text-[#2e1500] rounded-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <SendIcon />
              {loading ? "Sending..." : "Send Now"}
            </button>
            {/* <button
              type="button"
              className="flex items-center justify-center gap-2.5 bg-[#2a1f0e] border border-[#ffb77b]/55 hover:bg-[#ffb77b]/15 transition px-5 py-3.5 text-xs font-semibold tracking-[0.14em] text-[#ffcfaa] rounded-sm"
              disabled
            >
              <ClockIcon />
              Schedule for Later
            </button> */}
          </div>
          {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
          {success && <div className="text-xs text-green-400 mt-1">{success}</div>}
        </div>

        {/* RIGHT: Telemetry Stream */}
        <div className="px-5 py-6 sm:px-8 lg:py-8">
          <p className="text-[9px] tracking-[0.3em] text-[#5d3a30] dark:text-[#8f8078] mb-7">TELEMETRY_STREAM</p>
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            <StatCard
              label="SENT"
              value={sentCount.toString()}
              accent="text-[#8a827e] dark:text-[#e6dad3]"
              barAccent="bg-[#8a827e] dark:bg-[#e6dad3]"
              delay={0.1}
            />

            <StatCard
              label="ACCEPTED"
              value={acceptedCount.toString()}
              accent="text-[#ffa962] dark:text-[#ffb77b]"
              barAccent="bg-[#ffa962] dark:bg-[#ffb77b]"
              delay={0.15}
            />

            <StatCard
              label="REJECTED"
              value={rejectedCount.toString()}
              accent="text-[#ff8585] dark:text-[#ff9e9e]"
              barAccent="bg-[#ff8585] dark:bg-[#ff9e9e]"
              delay={0.2}
            />

              <StatCard
                label="SCHEDULED"
                value={scheduledCount.toString()}
                accent="text-[#5cbee5] dark:text-[#67d4ff]"
                barAccent="bg-[#5cbee5] dark:bg-[#67d4ff]"
                delay={0.25}
              />
          </div>
        </div>
      </motion.div>

      {/* ── ROSTER SECTION ────────────────────────────────────────────────── */}
      <div className="flex-1 px-5 py-6 sm:px-8">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[9px] tracking-[0.3em] text-[#5d3a30] dark:text-[#8f8078] mb-1.5">ARCHIVE_INDEX</p>
            <h2 className={`${displayFont.className} text-3xl italic text-[#68220D] dark:text-[#e6dad3]`}>Confirmed Guest Roster</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-[#3b3430]/80 bg-[#0d1118] hover:border-[#ffb77b]/40 transition px-3.5 py-2 text-[10px] tracking-[0.2em] text-[#9f8e86] hover:text-[#ffb77b] rounded-sm"
            >
              <FilterIcon />
              FILTER
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-[#3b3430]/80 bg-[#0d1118] hover:border-[#ffb77b]/40 transition px-3.5 py-2 text-[10px] tracking-[0.2em] text-[#9f8e86] hover:text-[#ffb77b] rounded-sm"
            >
              <ExportIcon />
              EXPORT_CSV
            </button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 border border-[#3b3430]/80 bg-[#2a1f0e] dark:bg-[#0d1118] rounded-sm p-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Search */}
              <div>
                <p className="text-[9px] tracking-[0.24em] text-[#8f8078] mb-2">SEARCH NAME / EMAIL</p>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter guests..."
                  className="w-full bg-[#090b10] border border-[#3b3430]/80 rounded-sm px-3 py-2 text-sm text-[#dac7bd] placeholder:text-[#5a4e48] focus:outline-none focus:border-[#ffb77b]/60 transition"
                />
              </div>

              {/* Status Filter */}
              <div>
                <p className="text-[9px] tracking-[0.24em] text-[#8f8078] mb-2">STATUS</p>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as GuestStatus | "ALL")}
                  className="w-full bg-[#090b10] border border-[#3b3430]/80 rounded-sm px-3 py-2 text-sm text-[#dac7bd] focus:outline-none focus:border-[#ffb77b]/60 transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <p className="text-[9px] tracking-[0.24em] text-[#8f8078] mb-2">SORT BY</p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "name" | "people")}
                  className="w-full bg-[#090b10] border border-[#3b3430]/80 rounded-sm px-3 py-2 text-sm text-[#dac7bd] focus:outline-none focus:border-[#ffb77b]/60 transition"
                >
                  <option value="date">Latest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="people">People Count</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setSortBy("date");
              }}
              className="mt-4 text-[10px] tracking-[0.2em] text-[#9f8e86] hover:text-[#ffb77b] transition"
            >
              CLEAR ALL FILTERS
            </button>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="overflow-x-auto rounded-sm border border-[#2b2520]/70"
        >
          {/* Table header */}
          <div className="grid min-w-215 grid-cols-[1fr_130px_180px_160px_80px] border-b border-[#2b2520]/70 bg-[#2a1f0e] dark:bg-[#0d1118]/60 px-5 py-3">
            {["IDENTIFICATION", "PEOPLE", "TRANSMISSION STATUS", "VALIDATION DATE", "ACTIONS"].map((col) => (
              <p key={col} className="text-[9px] tracking-[0.24em] text-[#6b5c54] font-semibold">{col}</p>
            ))}
          </div>

          {/* Rows */}
          {rosterLoading ? (
            <div className="flex items-center gap-3 px-5 py-8 text-[10px] font-semibold tracking-[0.24em] text-[#8f8078]">
              <span className="h-4 w-4 animate-spin rounded-full border border-[#3b3430] border-t-[#ffb77b]" />
              LOADING GUEST ROSTER
            </div>
          ) : guests.length === 0 ? (
            <div className="px-5 py-8 text-[10px] font-semibold tracking-[0.24em] text-[#6b5c54]">
              NO INVITATIONS FOUND
            </div>
          ) : filteredAndSortedGuests.length === 0 ? (
            <div className="px-5 py-8 text-[10px] font-semibold tracking-[0.24em] text-[#6b5c54]">
              NO MATCHING GUESTS FOUND
            </div>
          ) : (
            filteredAndSortedGuests.map((guest, i) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.06 }}
                className="grid min-w-215 grid-cols-[1fr_130px_180px_160px_80px] items-center px-5 py-4 border-b border-[#2b2520]/50 last:border-0 hover:bg-[#ffb77b]/3 transition group"
              >
              {/* Identification */}
              <div className="flex items-center gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-sm border ${
                  guest.icon === "user"
                    ? "border-[#ffb77b]/35 bg-[#ffb77b]/10 text-[#371a11] dark:text-[#ffb77b]"
                    : "border-[#8f8078]/35 bg-[#8f8078]/10 text-gray-600 dark:text-[#8f8078]"
                }`}>
                  {guest.icon === "user" ? <UserIcon /> : <HourglassIcon />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9b5844] dark:text-[#e6dad3]">{guest.name}</p>
                  <p className="text-[10px] tracking-widest text-[#6b5c54] mt-0.5">{guest.email}</p>
                </div>
              </div>

              {/* People Count */}
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#9b5844] dark:text-[#dac7bd]">{guest.peopleCount}</p>

              {/* Status */}
              <div>
                <StatusBadge status={guest.status} />
              </div>

              {/* Date */}
              <p className="text-[11px] tracking-[0.14em] text-[#9b5844] dark:text-[#9f8e86]">{guest.date}</p>

              {/* Actions */}
              <div className="relative flex justify-end">
                <button
                  type="button"
                  aria-label="More actions"
                  onClick={() => setOpenActionsFor((current) => current === guest.id ? null : guest.id)}
                  className="text-[#9b5844] dark:text-[#5a4e48] hover:text-[#ffb77b] transition group-hover:text-[#9f8e86]"
                >
                  <DotsIcon />
                </button>
                {openActionsFor === guest.id && (
                  <div className="absolute right-0 top-7 z-20 w-36 border border-[#3b3430]/80 bg-[#0d1118] shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMessageGuest(guest);
                        setOpenActionsFor(null);
                      }}
                      className="w-full px-3 py-2 text-left text-[10px] font-semibold tracking-[0.16em] text-[#dac7bd] hover:bg-[#ffb77b]/10 hover:text-[#ffb77b]"
                    >
                      READ MESSAGE
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGuest(guest)}
                      disabled={deletingGuestId === guest.id}
                      className="w-full px-3 py-2 text-left text-[10px] font-semibold tracking-[0.16em] text-[#ff9e9e] hover:bg-[#ff7b7b]/10 hover:text-[#ffb2b2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingGuestId === guest.id ? "DELETING..." : "DELETE REQUEST"}
                    </button>
                  </div>
                )}
              </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* View extended roster link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="flex justify-center mt-5"
        >
          <button
            type="button"
            className="text-[10px] tracking-[0.3em] text-[#6b5c54] hover:text-[#ffb77b] transition flex items-center gap-2"
          >
            VIEW_EXTENDED_ROSTER
            <span className="text-[8px]">▼</span>
          </button>
        </motion.div>
      </div>

      {/* ── STATUS FOOTER BAR ─────────────────────────────────────────────── */}
      {messageGuest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-md border border-[#3b3430]/80 bg-[#0d1118] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[9px] font-semibold tracking-[0.26em] text-[#8f8078]">GUEST_MESSAGE</p>
                <h3 className={`${displayFont.className} text-2xl italic text-[#e6dad3]`}>{messageGuest.name}</h3>
                <p className="mt-1 text-[10px] tracking-widest text-[#6b5c54]">{messageGuest.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessageGuest(null)}
                aria-label="Close message"
                className="text-lg leading-none text-[#8f8078] hover:text-[#ffb77b]"
              >
                x
              </button>
            </div>
            <p className="min-h-24 whitespace-pre-wrap border border-[#2b2520]/70 bg-[#090b10] px-4 py-3 text-sm leading-6 text-[#dac7bd]">
              {messageGuest.guestResponseMessage?.trim() || "No message was left with this response."}
            </p>
            <button
              type="button"
              onClick={() => setMessageGuest(null)}
              className="mt-5 w-full bg-[#ffb77b] px-5 py-3 text-xs font-bold tracking-[0.18em] text-[#2e1500] transition hover:bg-[#ffc994]"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-3 border-t border-[#2b2520]/60 bg-[#0d1016]/90 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4 lg:gap-7">
          {/* OPERATIONAL */}
          <div className="flex items-center gap-2">
            <p className="text-[8px] tracking-[0.22em] text-[#6b5c54]">CONN_TYPE</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffb77b] shadow-[0_0_6px_rgba(255,183,123,0.7)]" />
              <span className="text-[9px] tracking-[0.2em] font-semibold text-[#ffb77b]">OPERATIONAL</span>
            </div>
          </div>

          {/* Region */}
          <div className="flex items-center gap-2">
            <p className="text-[8px] tracking-[0.22em] text-[#6b5c54]">REGION</p>
            <span className="text-[9px] tracking-[0.2em] font-semibold text-[#9f8e86]">US-WEST-V1</span>
          </div>

          {/* Encryption */}
          <div className="flex items-center gap-2">
            <p className="text-[8px] tracking-[0.22em] text-[#6b5c54]">ENCRYPTION</p>
            <span className="text-[9px] tracking-[0.2em] font-semibold text-[#9f8e86]">AES-256-GCM</span>
          </div>
        </div>

        <p className="text-[8px] tracking-[0.18em] text-[#3a322e]">
          © 2026 KINETIC LABORATORY | INVITATION_INTERFACE
        </p>
      </footer>
    </main>
  );
}
