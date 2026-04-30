/**
 * CoAuthorPresenceBar — shows connected collaborators' avatars, save/publish
 * controls, and an invite link generator.
 */

import React, { useState } from 'react';
import { Copy, Check, Save, Link2, Users, Loader2 } from 'lucide-react';
import type { CollabUser } from '@/hooks/useCollaboration';

interface Props {
  connectedUsers: CollabUser[];
  localUser: CollabUser;
  status: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  inviteLink?: string | null;
  onGenerateLink?: () => void;
  isOwner: boolean;
  generatingLink?: boolean;
}

export const CoAuthorPresenceBar: React.FC<Props> = ({
  connectedUsers,
  localUser,
  status,
  isSaving,
  lastSavedAt,
  onSave,
  inviteLink,
  onGenerateLink,
  isOwner,
  generatingLink,
}) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 mb-4">
      {/* Left: Connected users */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Users size={16} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {connectedUsers.length} online
          </span>
        </div>

        <div className="flex -space-x-2">
          {connectedUsers.map((u) => (
            <div
              key={u.userId}
              className="relative group"
              title={u.name}
            >
              {u.avatar ? (
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-8 h-8 rounded-full border-2 object-cover"
                  style={{ borderColor: u.color }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                  style={{ borderColor: u.color, backgroundColor: u.color }}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Tooltip */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {u.userId === localUser.userId ? 'You' : u.name}
              </div>
              {/* Active dot */}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900"
                style={{ backgroundColor: status === 'connected' ? '#22c55e' : '#eab308' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Invite link section */}
        {isOwner && (
          <>
            {inviteLink ? (
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            ) : (
              <button
                onClick={onGenerateLink}
                disabled={generatingLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              >
                {generatingLink ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Generate Link
              </button>
            )}
          </>
        )}

        {/* Save status */}
        {lastSavedAt && (
          <span className="text-[10px] text-gray-400">
            Saved {lastSavedAt.toLocaleTimeString()}
          </span>
        )}

        {/* Save button (owner only) */}
        {isOwner && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CoAuthorPresenceBar;
