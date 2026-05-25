'use client';

import { useParams } from "next/navigation";
import GuestUploadsManager from "../components/GuestUploadsManager";

export default function EventUploadsTab() {
  const params = useParams<{ eventId?: string }>();
    const eventId = params.eventId;
  return (
    <div className="min-h-screen bg-white/95 dark:bg-[#090b10] text-[#e5e2e3] px-5 py-6 sm:px-8 lg:px-10 lg:py-7">
      <GuestUploadsManager eventId={eventId} />
    </div>
  );
}