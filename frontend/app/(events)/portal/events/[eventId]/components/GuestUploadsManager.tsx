'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Space_Grotesk, Newsreader } from 'next/font/google';
import { apiGet, apiPost } from '@/lib/api/client';
import { decodeEventId } from '@/lib/event-route-id';
import { logSessionActivity } from '@/lib/activity-logs';

const uiFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const displayFont = Newsreader({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});


type GuestUpload = {
  id: string;
  guestName: string;
  guestEmail: string;
  uploadCount: number;
  images: Array<{
    path: string;
    url: string;
    filename: string;
    uploadedAt: string;
  }>;
  shareToken: string;
  shareUrl: string;
  uploadedAt: string;
  lastUpdated: string;
};

interface GuestUploadsProps {
  eventId?: string;
}

export default function GuestUploadsManager({ eventId }: GuestUploadsProps) {
  const backendEventId = decodeEventId(eventId);
  const [uploads, setUploads] = useState<GuestUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadUploads();
  }, [backendEventId]);

  async function loadUploads() {
    try {
      setLoading(true);
      if (!backendEventId) {
        setError('Open an event before managing uploads.');
        setUploads([]);
        return;
      }
      const data = await apiGet<{ data?: GuestUpload[] }>(`/api/events/${backendEventId}/uploads`);
      setUploads(data.data || []);
    } catch (err) {
      console.error('Failed to load uploads:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateLink() {
    if (!guestName.trim() || !guestEmail.trim()) {
      setError('Please enter guest name and email');
      return;
    }

    setGeneratingLink(true);
    setError(null);

    if (!backendEventId) {
      setError('Open an event before generating a share link.');
      setGeneratingLink(false);
      return;
    }

    try {
      await apiPost<{ message?: string }>(`/api/events/${backendEventId}/share-link`, {
        guest_name: guestName,
        guest_email: guestEmail,
        send_email: sendEmail,
      });

      logSessionActivity(backendEventId, 'upload_link_created', `Generated upload link for ${guestName}`, {
        guest_name: guestName,
        guest_email: guestEmail,
        email_sent: sendEmail,
      });

      setSuccess(sendEmail ? 'Share link generated and email sent!' : 'Share link generated! You can now share the link with the guest.');
      setGuestName('');
      setGuestEmail('');
      setSendEmail(true);
      setShowGenerateModal(false);
      await loadUploads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setGeneratingLink(false);
    }
  }

  function copyToClipboard(text: string, token: string) {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return (
      <div className={`${uiFont.className} space-y-4`}>
        <div className="h-32 animate-pulse rounded-lg bg-[#2a2c2e]" />
      </div>
    );
  }

  return (
    <div className={`${uiFont.className} space-y-6`}>
      {/* Header and Generate Button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`${displayFont.className} text-2xl italic text-[#68220D] dark:text-[#e6dad3]`}>
            Guest Photo Uploads
          </h2>
          <p className="mt-1 text-xs text-[#3d261f]  dark:text-[#8f8078] tracking-[0.16em]">
            {uploads.length} guest(s) with upload access
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="rounded-md bg-[#007a4d] px-4 py-2 text-xs font-bold tracking-[0.16em] text-white transition hover:bg-[#008d59]"
        >
          + GENERATE LINK
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-[#ff9e9e]/30 bg-[#341b03] dark:bg-[#ff9e9e]/10 p-3 text-xs text-[#ff9e9e]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-[#00d87e]/30 bg-[#00d87e]/10 p-3 text-xs text-[#00d87e]">
          ✓ {success}
        </div>
      )}

      {/* Uploads List */}
      {uploads.length === 0 ? (
        <div className="rounded-lg border border-[#3c332d] bg-[#2c1703] dark:bg-[#0f1319] px-6 py-12 text-center">
          <p className="text-[#8f8078]">No guest uploads yet. Generate a share link to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload, index) => (
            <motion.div
              key={upload.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-[#3c332d] bg-[#0f1319] p-5"
            >
              {/* Guest Info */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#f5f0eb]">{upload.guestName}</h3>
                  <p className="mt-1 text-xs text-[#8f949a]">{upload.guestEmail}</p>
                  <p className="mt-2 text-[10px] tracking-[0.16em] text-[#8f8078]">
                    {upload.uploadCount} OF 5 IMAGES UPLOADED
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(upload.shareUrl, upload.shareToken)}
                  className="rounded-md border border-[#3c332d] bg-[#1a1b1e] px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-[#d6d9dd] transition hover:border-[#ffb77b]/45 hover:text-[#ffb77b]"
                >
                  {copiedToken === upload.shareToken ? 'COPIED' : 'COPY LINK'}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2c2e]">
                <div
                  className="h-full bg-[#ffb77b] transition-all duration-300"
                  style={{ width: `${(upload.uploadCount / 5) * 100}%` }}
                />
              </div>

              {/* Images Grid */}
              {upload.images && upload.images.length > 0 && (
                <div className="mt-4">
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-[#8f8078]">
                    UPLOADED IMAGES ({upload.images.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {upload.images.map((image, imgIndex) => (
                      <a
                        key={imgIndex}
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-md border border-[#3c332d] transition hover:border-[#ffb77b]/45"
                      >
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <span className="text-[10px] text-white">View</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-4 border-t border-[#2a2c2e] pt-3 text-[10px] text-[#8f8078]">
                <p>Uploaded: {new Date(upload.uploadedAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Link Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleGenerateLink();
            }}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-[#3c332d] bg-[#0f1319] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.26em] text-[#8f8078]">SHARE_LINK</p>
                <h2 className={`${displayFont.className} mt-1 text-3xl font-semibold text-[#f7efe8]`}>
                  Invite Guest
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-2xl leading-none text-[#8f8078] transition hover:text-[#ffb77b]"
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.2em] text-[#8f8078]">
                GUEST NAME
              </span>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-sm border border-[#3c332d] bg-[#191a1c] px-4 py-3 text-sm text-[#e6dad3] placeholder:text-[#6f7378] focus:border-[#ffb77b]/60 focus:outline-none"
                placeholder="John Doe"
                autoFocus
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.2em] text-[#8f8078]">
                EMAIL
              </span>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full rounded-sm border border-[#3c332d] bg-[#191a1c] px-4 py-3 text-sm text-[#e6dad3] placeholder:text-[#6f7378] focus:border-[#ffb77b]/60 focus:outline-none"
                placeholder="john@example.com"
              />
            </label>

            <label className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-[#3c332d] bg-[#191a1c] accent-[#007a4d]"
              />
              <span className="text-sm text-[#dac7bd]">Send email with upload link</span>
            </label>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="border border-[#3c332d] px-4 py-3 text-xs font-bold tracking-[0.18em] text-[#dac7bd] hover:border-[#ffb77b]/45"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={generatingLink}
                className="bg-[#007a4d] px-4 py-3 text-xs font-bold tracking-[0.18em] text-white hover:bg-[#008d59] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {generatingLink ? 'GENERATING...' : 'GENERATE'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
