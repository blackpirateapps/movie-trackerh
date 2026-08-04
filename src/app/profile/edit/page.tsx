'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { User } from '@/types';
import { 
  User as UserIcon, Settings, ShieldAlert, Key, Trash2, CheckCircle2, AlertTriangle, ArrowLeft, Upload, Lock, Sliders, Globe, EyeOff, LayoutGrid
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
];

export default function EditProfile() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Basic Info Form
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Preferences Form
  const [prefDefaultLayout, setPrefDefaultLayout] = useState<'grid' | 'list'>('grid');
  const [prefHideNsfw, setPrefHideNsfw] = useState<boolean>(false);
  const [prefIsPrivate, setPrefIsPrivate] = useState<boolean>(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  // Danger Zone
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<{ user: User }>(`/api/user?username=${currentUser.username}`);
        if (data.user) {
          setDisplayName(data.user.display_name || '');
          setUsername(data.user.username || '');
          setBio(data.user.bio || '');
          setWebsite(data.user.website || '');
          setAvatarUrl(data.user.avatar_url || '');
          setPrefDefaultLayout(data.user.pref_default_layout || 'grid');
          setPrefHideNsfw(Boolean(data.user.pref_hide_nsfw));
          setPrefIsPrivate(Boolean(data.user.pref_is_private));
        }
      } catch (err) {
        console.error('Failed to load user profile for editing:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const { data } = await api.post<{ message: string; username: string }>('/api/user', {
        action: 'update_profile',
        displayName,
        username,
        bio,
        website,
        avatarUrl,
        prefDefaultLayout,
        prefHideNsfw,
        prefIsPrivate
      });

      setSuccess(data.message || 'Profile updated successfully!');
      if (data.username && data.username !== currentUser?.username) {
        window.location.href = `/profile/${data.username}`;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const { data } = await api.post<{ message: string }>('/api/user', {
        action: 'change_password',
        currentPassword,
        newPassword
      });

      setPasswordSuccess(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);

    try {
      await api.post('/api/user', {
        action: 'delete_account',
        confirmPassword: deletePassword
      });

      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account. Incorrect password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center max-w-sm w-full p-6 rounded space-y-3">
          <p className="text-xs text-[#A0A0A0]">Please log in to edit your profile.</p>
          <Link href="/login" className="btn btn-primary text-xs py-2 px-4 inline-block">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card text-center max-w-sm w-full bg-[#1E1E1E] border border-[#333333] p-6 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FF66] border-t-transparent mx-auto mb-3" />
          <p className="font-bold text-sm text-[#EDEDED]">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      
      {/* Header */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${currentUser.username}`} className="btn btn-ghost text-xs p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
              <Settings className="w-5 h-5 text-[#00FF66]" />
              Profile & Account Utility Settings
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Manage display info, avatar, layout preferences, and security.
            </p>
          </div>
        </div>

        <Link 
          href={`/profile/${currentUser.username}`} 
          className="btn btn-secondary text-xs py-1.5 px-3"
        >
          View Profile
        </Link>
      </div>

      {success && (
        <div className="card bg-[#00FF66]/10 border border-[#00FF66]/30 p-4 flex items-center gap-2 text-xs font-semibold text-[#00FF66]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="card bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 p-4 flex items-center gap-2 text-xs font-semibold text-[#ff4d4d]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile & Preferences Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        
        {/* Section 1: Basic Info & Avatar */}
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            BASIC INFORMATION & AVATAR
          </h2>

          {/* Avatar Management Area */}
          <div className="bg-[#121212] border border-[#333333] p-4 rounded space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">
              Avatar Image
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar Preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#00FF66]"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#00FF66] text-[#121212] rounded-full flex items-center justify-center font-bold text-2xl">
                    {(username || currentUser.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Paste avatar image URL (e.g. https://...)"
                  className="form-input text-xs py-2"
                />

                {/* Preset Avatars */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] text-[#A0A0A0] font-semibold">Or select preset:</span>
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition-transform ${
                        avatarUrl === url ? 'border-[#00FF66] scale-110' : 'border-[#333333] hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[10px] text-[#ff4d4d] hover:underline ml-2"
                    >
                      Remove Avatar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Cinema"
                className="form-input text-xs py-2"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="form-input text-xs py-2"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0]">
                Bio & Tagline
              </label>
              <span className="text-[10px] text-[#A0A0A0]">{bio.length}/250</span>
            </div>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 250))}
              placeholder="Film enthusiast, horror fan, TV addict..."
              className="form-input h-20 text-xs resize-none"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
              Website / Social Link
            </label>
            <div className="relative">
              <input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="letterboxd.com/username or github.com/user"
                className="form-input text-xs py-2 pl-9"
              />
              <Globe className="w-4 h-4 text-[#A0A0A0] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Section 2: Preferences */}
        <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            APP & PROFILE PREFERENCES
          </h2>

          <div className="space-y-3">
            {/* Layout Toggle */}
            <div className="flex items-center justify-between bg-[#121212] p-3 border border-[#333333] rounded">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#00FF66]" />
                <div>
                  <span className="text-xs font-bold text-[#EDEDED] block">Default Grid View</span>
                  <span className="text-[10px] text-[#A0A0A0]">Display media posters in responsive grid format</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#1E1E1E] p-1 border border-[#333333] rounded">
                <button
                  type="button"
                  onClick={() => setPrefDefaultLayout('grid')}
                  className={`btn text-[10px] py-1 px-2.5 ${prefDefaultLayout === 'grid' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'}`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setPrefDefaultLayout('list')}
                  className={`btn text-[10px] py-1 px-2.5 ${prefDefaultLayout === 'list' ? 'btn-primary' : 'btn-ghost text-[#A0A0A0]'}`}
                >
                  List
                </button>
              </div>
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center justify-between bg-[#121212] p-3 border border-[#333333] rounded">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-[#00FF66]" />
                <div>
                  <span className="text-xs font-bold text-[#EDEDED] block">Hide Sensitive/NSFW Content</span>
                  <span className="text-[10px] text-[#A0A0A0]">Filter out explicit media titles from search and feed</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefHideNsfw}
                onChange={(e) => setPrefHideNsfw(e.target.checked)}
                className="w-4 h-4 accent-[#00FF66] cursor-pointer"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between bg-[#121212] p-3 border border-[#333333] rounded">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#00FF66]" />
                <div>
                  <span className="text-xs font-bold text-[#EDEDED] block">Private Profile</span>
                  <span className="text-[10px] text-[#A0A0A0]">Restrict diary and watchlists to approved followers</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefIsPrivate}
                onChange={(e) => setPrefIsPrivate(e.target.checked)}
                className="w-4 h-4 accent-[#00FF66] cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary text-xs py-2.5 px-6 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
              Saving Profile...
            </>
          ) : (
            <span>Save Profile Settings</span>
          )}
        </button>
      </form>

      {/* Section 3: Account & Security */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
          <Key className="w-4 h-4 text-[#00FF66]" />
          ACCOUNT SECURITY & PASSWORD
        </h2>

        <div className="text-xs text-[#A0A0A0] space-y-1">
          <p><span className="font-bold text-[#EDEDED]">Linked Email:</span> {currentUser.email}</p>
        </div>

        {passwordSuccess && (
          <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded text-xs font-semibold text-[#00FF66] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded text-xs font-semibold text-[#ff4d4d] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
          <div>
            <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input text-xs py-2 max-w-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input text-xs py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-xs font-bold uppercase tracking-widest text-[#A0A0A0] mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="form-input text-xs py-2"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="btn btn-secondary text-xs py-2 px-5"
          >
            {passwordLoading ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Section 4: Account / Danger Zone */}
      <div className="card bg-[#1E1E1E] border border-[#ff4d4d]/40 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#ff4d4d] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          DANGER ZONE
        </h2>
        
        <p className="text-xs text-[#A0A0A0]">
          Deleting your account is permanent. All recorded movie logs, TV show entries, reviews, and watchlists will be wiped.
        </p>

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="btn bg-[#ff4d4d] text-[#121212] font-bold text-xs py-2.5 px-5 flex items-center gap-1.5 hover:bg-[#ff3333] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-[#121212]/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card bg-[#1E1E1E] border border-[#ff4d4d] max-w-md w-full p-6 space-y-4 rounded">
            <div className="flex items-center gap-2 text-[#ff4d4d]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">Confirm Account Deletion</h3>
            </div>
            
            <p className="text-xs text-[#A0A0A0]">
              This action cannot be undone. Please enter your account password to confirm deletion:
            </p>

            {deleteError && (
              <div className="p-2 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-xs text-[#ff4d4d] rounded">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor="deletePasswordInput" className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                  Account Password
                </label>
                <input
                  id="deletePasswordInput"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="form-input text-xs py-2"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="btn btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="btn bg-[#ff4d4d] text-[#121212] font-bold text-xs py-2 px-4 hover:bg-[#ff3333]"
                >
                  {deleteLoading ? 'Deleting Account...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
