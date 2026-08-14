'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { 
  Key, Code, Copy, Check, Trash2, Plus, Terminal, RefreshCw, Shield, AlertTriangle, CheckCircle2, Server, BookOpen, Layers, ArrowLeft, ExternalLink, Play, Lock, Globe, EyeOff, LayoutGrid, Sliders, User as UserIcon, Bot, Sparkles
} from 'lucide-react';

interface ApiKeyRecord {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  is_active: number;
}

interface NewKeyResponse {
  id: number;
  name: string;
  rawKey: string;
  keyPrefix: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'api-keys' | 'docs'>(
    initialTab === 'api-keys' ? 'api-keys' : initialTab === 'docs' ? 'docs' : 'profile'
  );

  // API Keys state
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [creatingKey, setCreatingKey] = useState<boolean>(false);
  const [generatedKey, setGeneratedKey] = useState<NewKeyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [keyError, setKeyError] = useState<string>('');
  const [keySuccess, setKeySuccess] = useState<string>('');

  // Revoke state
  const [revokingId, setRevokingId] = useState<number | null>(null);

  // API Tester state
  const [selectedKeyForTest, setSelectedKeyForTest] = useState<string>('session');
  const [testIncludes, setTestIncludes] = useState<string>('profile,stats,movies,tv,episodes,watchlist');
  const [testSince, setTestSince] = useState<string>('');
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    timeMs: number;
    headers: Record<string, string>;
    data: any;
  } | null>(null);

  // Code Snippet Tab state
  const [codeLang, setCodeLang] = useState<'curl' | 'javascript' | 'python' | 'node'>('curl');

  // Profile Edit Form State (for embedded Profile tab)
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [prefDefaultLayout, setPrefDefaultLayout] = useState<'grid' | 'list'>('grid');
  const [prefHideNsfw, setPrefHideNsfw] = useState<boolean>(false);
  const [prefIsPrivate, setPrefIsPrivate] = useState<boolean>(false);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;
    fetchKeys();
    fetchUserProfile();
  }, [currentUser]);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      const { data } = await api.get<{ keys: ApiKeyRecord[] }>('/api/keys');
      setKeys(data.keys || []);
    } catch (err: any) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get(`/api/user?username=${currentUser?.username}`);
      if (data.user) {
        setDisplayName(data.user.display_name || '');
        setBio(data.user.bio || '');
        setWebsite(data.user.website || '');
        setAvatarUrl(data.user.avatar_url || '');
        setPrefDefaultLayout(data.user.pref_default_layout || 'grid');
        setPrefHideNsfw(Boolean(data.user.pref_hide_nsfw));
        setPrefIsPrivate(Boolean(data.user.pref_is_private));
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setKeySuccess('');
    setCreatingKey(true);

    try {
      const { data } = await api.post<{ message: string; key: NewKeyResponse }>('/api/keys', {
        action: 'create',
        name: newKeyName.trim() || 'Personal Key',
      });

      if (data.key) {
        setGeneratedKey(data.key);
        setNewKeyName('');
        setKeySuccess('API key created successfully!');
        fetchKeys();
      }
    } catch (err: any) {
      setKeyError(err.response?.data?.message || 'Failed to generate API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using this key will immediately lose access.')) {
      return;
    }

    try {
      setRevokingId(keyId);
      await api.post('/api/keys', {
        action: 'revoke',
        keyId,
      });
      fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRunApiTest = async () => {
    setTestLoading(true);
    setTestResult(null);

    const startTime = performance.now();
    try {
      let queryParams = `include=${encodeURIComponent(testIncludes)}`;
      if (testSince) {
        queryParams += `&since=${encodeURIComponent(testSince)}`;
      }

      const headers: Record<string, string> = {};
      if (selectedKeyForTest !== 'session' && selectedKeyForTest) {
        headers['Authorization'] = `Bearer ${selectedKeyForTest}`;
      }

      const res = await fetch(`/api/v1/export?${queryParams}`, {
        method: 'GET',
        headers,
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const data = await res.json();
      
      const responseHeaders: Record<string, string> = {
        'content-type': res.headers.get('content-type') || 'application/json',
        'x-ratelimit-limit': res.headers.get('x-ratelimit-limit') || '60',
        'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining') || '59',
        'x-ratelimit-reset': res.headers.get('x-ratelimit-reset') || '60',
      };

      setTestResult({
        status: res.status,
        timeMs,
        headers: responseHeaders,
        data,
      });
    } catch (err: any) {
      const endTime = performance.now();
      setTestResult({
        status: 500,
        timeMs: Math.round(endTime - startTime),
        headers: {},
        data: { error: err.message || 'Network error executing request' },
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      const { data } = await api.post('/api/user', {
        action: 'update_profile',
        displayName,
        username: currentUser?.username,
        bio,
        website,
        avatarUrl,
        prefDefaultLayout,
        prefHideNsfw,
        prefIsPrivate,
      });
      setProfileMessage('Profile settings updated successfully!');
    } catch (err: any) {
      setProfileMessage(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="card bg-[#1E1E1E] border border-[#333333] text-center max-w-sm w-full p-6 rounded space-y-3">
          <Lock className="w-8 h-8 text-[#00FF66] mx-auto" />
          <p className="font-bold text-sm text-[#EDEDED]">Authentication Required</p>
          <p className="text-xs text-[#A0A0A0]">Please log in to manage your API keys and developer settings.</p>
          <Link href="/login" className="btn btn-primary text-xs py-2 px-4 inline-block">Login to Account</Link>
        </div>
      </div>
    );
  }

  // Get active key for code examples
  const activeSampleKey = generatedKey?.rawKey || (keys.length > 0 ? `${keys[0].key_prefix}...` : 'cin_live_your_api_key_here');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/export` : 'https://cinetracker.app/api/v1/export';

  const [copiedAiDocs, setCopiedAiDocs] = useState<boolean>(false);

  const handleCopyAiDocs = () => {
    const aiDocsMarkdown = `# CineTracker REST Data Export API Specification for AI Agents

## Overview
CineTracker provides a REST API endpoint that allows authenticated users to export their complete movie and TV show tracking data, reviews, ratings, watchlists, episode breakdowns, platform tags, and social connections.

## Endpoints
- **Primary Endpoint**: \`GET ${baseUrl}\`
- **Alias Endpoint**: \`GET ${baseUrl.replace('/export', '/user/data')}\`

## Authentication
Supply your API key using any of the following HTTP mechanisms:
1. **HTTP Bearer Token**: Header \`Authorization: Bearer <YOUR_API_KEY>\`
2. **Custom HTTP Header**: Header \`X-API-Key: <YOUR_API_KEY>\`
3. **URL Query Parameter**: Parameter \`?api_key=<YOUR_API_KEY>\`

Key Format: \`cin_live_<48_hex_characters>\`

## Rate Limits
- **Limit**: 60 requests per minute per API key.
- **Headers Returned**:
  - \`X-RateLimit-Limit\`: Maximum requests per window (60).
  - \`X-RateLimit-Remaining\`: Remaining allowed requests in current window.
  - \`X-RateLimit-Reset\`: Time in seconds until rate limit resets.
- **Exceeded Limit**: Returns HTTP \`429 Too Many Requests\` with a \`Retry-After: <seconds>\` header.

## Query Parameters
- \`include\` (string, optional): Comma-separated list of modules to include. Options: \`profile,stats,movies,tv,episodes,watchlist,social\`. Default: all.
- \`since\` (string, optional): ISO date string (\`YYYY-MM-DD\` or full timestamp). Filters items updated or watched after this date.

## Data Payload Schema & Structure
\`\`\`json
{
  "status": "success",
  "data_version": "1.0",
  "generated_at": "${new Date().toISOString()}",
  "user": {
    "id": ${currentUser?.id || 1},
    "username": "${currentUser?.username || 'username'}",
    "email": "${currentUser?.email || 'user@example.com'}",
    "display_name": "${displayName || currentUser?.username || 'User'}",
    "bio": ${bio ? JSON.stringify(bio) : 'null'},
    "website": ${website ? JSON.stringify(website) : 'null'},
    "avatar_url": ${avatarUrl ? JSON.stringify(avatarUrl) : 'null'},
    "preferences": {
      "default_layout": "${prefDefaultLayout}",
      "hide_nsfw": ${prefHideNsfw},
      "is_private": ${prefIsPrivate}
    },
    "created_at": "2026-01-01T00:00:00Z"
  },
  "stats": {
    "total_movies_watched": 42,
    "total_tv_shows_tracked": 12,
    "total_episodes_watched": 185,
    "total_hours_watched": 340.5,
    "total_reviews": 30,
    "total_favorites": 5,
    "watchlist_count": 8
  },
  "movies": [
    {
      "log_id": 101,
      "movie_id": 550,
      "title": "Fight Club",
      "overview": "An insomniac office worker...",
      "release_date": "1999-10-15",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "backdrop_path": "/hZkgoQY85xsWFmPk8DcMkgWYwIh.jpg",
      "runtime_minutes": 139,
      "tmdb_vote_average": 8.4,
      "user_rating": 10,
      "user_review": "Masterpiece.",
      "watched_date": "2026-05-10",
      "created_at": "2026-05-10T12:00:00Z",
      "updated_at": "2026-05-10T12:00:00Z"
    }
  ],
  "tv_shows": [
    {
      "log_id": 201,
      "tv_show_id": 1396,
      "name": "Breaking Bad",
      "overview": "A high school chemistry teacher...",
      "first_air_date": "2008-01-20",
      "poster_path": "/zqImL2p7Ehn4b5f8Yn5h3Yn6Z.jpg",
      "backdrop_path": "/tsRy63MuZvKCZCkGZpB5Y2.jpg",
      "number_of_seasons": 5,
      "number_of_episodes": 62,
      "tmdb_vote_average": 8.9,
      "user_rating": 10,
      "user_review": "Unmatched character arc.",
      "is_favorite": true,
      "start_date": "2026-01-01",
      "end_date": "2026-02-15",
      "watched_where": ["Netflix", "Prime Video"],
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-02-15T20:00:00Z"
    }
  ],
  "episodes": [
    {
      "log_id": 301,
      "tv_show_id": 1396,
      "tv_show_name": "Breaking Bad",
      "season_number": 1,
      "episode_number": 1,
      "episode_name": "Pilot",
      "overview": "Walter White discovers...",
      "still_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "air_date": "2008-01-20",
      "runtime_minutes": 58,
      "tmdb_vote_average": 8.5,
      "watched": true,
      "watched_date": "2026-01-01",
      "user_rating": 9,
      "created_at": "2026-01-01T10:00:00Z",
      "updated_at": "2026-01-01T10:00:00Z"
    }
  ],
  "watchlist": [
    {
      "item_id": 401,
      "movie_id": 27205,
      "title": "Inception",
      "overview": "A thief who steals corporate secrets...",
      "release_date": "2010-07-15",
      "poster_path": "/oYuLEW9Wz152hT235u35.jpg",
      "backdrop_path": "/s3TBrRGB1iav7y5OiJ.jpg",
      "runtime_minutes": 148,
      "tmdb_vote_average": 8.3,
      "added_at": "2026-03-01T08:00:00Z"
    }
  ],
  "social": {
    "followers": [{ "id": 2, "username": "jane", "display_name": "Jane Doe", "avatar_url": null }],
    "following": [{ "id": 3, "username": "bob", "display_name": "Bob Smith", "avatar_url": null }]
  }
}
\`\`\`

## Quick Start Code Examples

### cURL
\`\`\`bash
curl -X GET "${baseUrl}?include=movies,tv,episodes,watchlist" \\
  -H "Authorization: Bearer ${activeSampleKey}"
\`\`\`

### JavaScript (fetch)
\`\`\`javascript
const response = await fetch('${baseUrl}?include=movies,tv,episodes,watchlist', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${activeSampleKey}'
  }
});
const data = await response.json();
console.log(data);
\`\`\`

### Python (requests)
\`\`\`python
import requests

url = "${baseUrl}"
headers = {"Authorization": "Bearer ${activeSampleKey}"}
params = {"include": "movies,tv,episodes,watchlist"}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print(data)
\`\`\`
`;

    navigator.clipboard.writeText(aiDocsMarkdown);
    setCopiedAiDocs(true);
    setTimeout(() => setCopiedAiDocs(false), 3000);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 bg-[#121212] text-[#EDEDED]">
      
      {/* Header Banner */}
      <div className="card bg-[#1E1E1E] border border-[#333333] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] rounded flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#EDEDED]">
              Developer Portal & Settings
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Manage production API keys, request full data exports, and configure preferences.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAiDocs}
            className="btn bg-[#00FF66] text-[#121212] font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 hover:bg-[#00CC52] transition-colors"
            title="Copy formatted markdown documentation for AI agent prompts (ChatGPT, Claude, Cursor)"
          >
            {copiedAiDocs ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>AI Docs Copied!</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>Copy AI Agent Docs</span>
              </>
            )}
          </button>
          <Link 
            href={`/profile/${currentUser.username}`} 
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Profile Page</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#333333] gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#1E1E1E]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E]/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Profile & App Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('api-keys')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'api-keys'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#1E1E1E]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E]/50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys & Management</span>
          <span className="bg-[#121212] border border-[#333333] text-[10px] px-1.5 py-0.5 rounded font-mono text-[#00FF66]">
            {keys.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'docs'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#1E1E1E]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#1E1E1E]/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>API Documentation & Tester</span>
        </button>
      </div>

      {/* TAB 1: API KEYS MANAGEMENT */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          
          {/* Key Generation Card */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              CREATE NEW API KEY
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Generate a secret API key to access your full media watched history, reviews, episode ratings, and watchlists programmatically.
            </p>

            {keyError && (
              <div className="p-3 bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-xs font-semibold text-[#ff4d4d] rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{keyError}</span>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key Label (e.g. Obsidian Sync, Data Backup Script)"
                className="form-input text-xs py-2.5 flex-1"
                required
              />
              <button
                type="submit"
                disabled={creatingKey}
                className="btn btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {creatingKey ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                    Generating Key...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Generate API Key
                  </>
                )}
              </button>
            </form>

            {/* Generated Raw Key Display Modal/Banner */}
            {generatedKey && (
              <div className="mt-4 bg-[#121212] border-2 border-[#00FF66] p-4 rounded space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    API Key Created - Copy Immediately
                  </div>
                  <span className="text-[10px] bg-[#00FF66]/20 text-[#00FF66] px-2 py-0.5 rounded font-mono">
                    Shown Once Only
                  </span>
                </div>

                <p className="text-xs text-[#A0A0A0]">
                  This key will <strong>never be shown again</strong>. Please copy and store it in a secure environment variable or password manager.
                </p>

                <div className="flex items-center gap-2 bg-[#1E1E1E] p-2.5 border border-[#333333] rounded">
                  <code className="text-xs font-mono text-[#00FF66] flex-1 break-all select-all">
                    {generatedKey.rawKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey.rawKey)}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Keys Table */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00FF66]" />
                ACTIVE API KEYS
              </h2>
              <button 
                onClick={fetchKeys} 
                className="btn btn-ghost text-[10px] py-1 px-2 flex items-center gap-1 text-[#A0A0A0] hover:text-[#EDEDED]"
              >
                <RefreshCw className={`w-3 h-3 ${loadingKeys ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingKeys ? (
              <div className="py-8 text-center text-xs text-[#A0A0A0]">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00FF66] border-t-transparent mx-auto mb-2" />
                Loading active API keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="py-8 text-center bg-[#121212] border border-[#333333] rounded p-6 space-y-2">
                <Shield className="w-8 h-8 text-[#A0A0A0] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[#EDEDED]">No API Keys Generated</p>
                <p className="text-[11px] text-[#A0A0A0]">
                  Create your first API key above to start querying your data via REST.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#333333] rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#121212] border-b border-[#333333] text-[10px] uppercase tracking-wider text-[#A0A0A0] font-bold">
                      <th className="p-3">Key Label</th>
                      <th className="p-3">Key Prefix</th>
                      <th className="p-3">Created</th>
                      <th className="p-3">Last Used</th>
                      <th className="p-3">Total Requests</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-[#2A2A2A]/50 transition-colors">
                        <td className="p-3 font-bold text-[#EDEDED]">
                          {k.name}
                        </td>
                        <td className="p-3 font-mono text-[#00FF66]">
                          {k.key_prefix}
                        </td>
                        <td className="p-3 text-[#A0A0A0]">
                          {new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-[#A0A0A0]">
                          {k.last_used_at ? (
                            new Date(k.last_used_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          ) : (
                            <span className="text-[#A0A0A0]/60 italic">Never</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[#EDEDED]">
                          {k.request_count}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={revokingId === k.id}
                            className="btn bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-[#121212] text-[10px] py-1 px-2.5 font-bold transition-colors inline-flex items-center gap-1"
                          >
                            {revokingId === k.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: API DOCUMENTATION & LIVE TESTER */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          
          {/* Section 1: Endpoint & Auth Overview */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            
            {/* AI Agent Copy Callout Banner */}
            <div className="bg-[#00FF66]/10 border border-[#00FF66]/30 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00FF66] text-[#121212] rounded flex items-center justify-center font-bold shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#EDEDED] flex items-center gap-1.5">
                    Prompting an AI Agent? (ChatGPT, Claude, Cursor, etc.)
                  </span>
                  <span className="text-[11px] text-[#A0A0A0] block">
                    Copy the complete API specification formatted as Markdown to paste directly into your AI prompt.
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyAiDocs}
                className="btn bg-[#00FF66] text-[#121212] font-bold text-xs py-2 px-4 flex items-center gap-1.5 shrink-0 hover:bg-[#00CC52] transition-colors"
              >
                {copiedAiDocs ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Markdown!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy AI Agent Docs</span>
                  </>
                )}
              </button>
            </div>

            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2 pt-2">
              <Server className="w-4 h-4" />
              API ENDPOINT SPECIFICATION
            </h2>

            <div className="bg-[#121212] border border-[#333333] p-4 rounded space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-[#00FF66] text-[#121212] font-bold px-2 py-0.5 rounded text-[11px]">
                  GET
                </span>
                <span className="text-[#EDEDED] font-semibold">{baseUrl}</span>
              </div>
              <p className="font-sans text-xs text-[#A0A0A0]">
                Returns full structured JSON export of the user's profile, lifetime stats, watched movies, tracked TV series, episode watch dates/ratings, watchlist, and social graph.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#121212] border border-[#333333] p-3 rounded space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#00FF66] block">
                  Authentication Headers
                </span>
                <p className="text-[#A0A0A0]">
                  Supply your API key via standard HTTP headers or query parameter:
                </p>
                <ul className="space-y-1 font-mono text-[11px] text-[#EDEDED] list-disc pl-4">
                  <li><code className="text-[#00FF66]">Authorization: Bearer cin_live_...</code></li>
                  <li><code className="text-[#00FF66]">X-API-Key: cin_live_...</code></li>
                  <li><code className="text-[#00FF66]">?api_key=cin_live_...</code></li>
                </ul>
              </div>

              <div className="bg-[#121212] border border-[#333333] p-3 rounded space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#00FF66] block">
                  Rate Limits & Headers
                </span>
                <p className="text-[#A0A0A0]">
                  Standard rate limit is <strong>60 requests per minute</strong> per key. Standard response headers:
                </p>
                <ul className="space-y-1 font-mono text-[11px] text-[#EDEDED] list-disc pl-4">
                  <li><code className="text-[#00FF66]">X-RateLimit-Limit: 60</code></li>
                  <li><code className="text-[#00FF66]">X-RateLimit-Remaining: 59</code></li>
                  <li><code className="text-[#00FF66]">X-RateLimit-Reset: 42</code> (seconds)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Code Snippets */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#EDEDED] flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00FF66]" />
              CODE INTEGRATION SNIPPETS
            </h2>

            {/* Code Language Toggles */}
            <div className="flex border-b border-[#333333] gap-2">
              <button
                onClick={() => setCodeLang('curl')}
                className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 transition-colors ${
                  codeLang === 'curl' ? 'border-[#00FF66] text-[#00FF66]' : 'border-transparent text-[#A0A0A0]'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setCodeLang('javascript')}
                className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 transition-colors ${
                  codeLang === 'javascript' ? 'border-[#00FF66] text-[#00FF66]' : 'border-transparent text-[#A0A0A0]'
                }`}
              >
                JavaScript (Fetch)
              </button>
              <button
                onClick={() => setCodeLang('python')}
                className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 transition-colors ${
                  codeLang === 'python' ? 'border-[#00FF66] text-[#00FF66]' : 'border-transparent text-[#A0A0A0]'
                }`}
              >
                Python (requests)
              </button>
              <button
                onClick={() => setCodeLang('node')}
                className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 transition-colors ${
                  codeLang === 'node' ? 'border-[#00FF66] text-[#00FF66]' : 'border-transparent text-[#A0A0A0]'
                }`}
              >
                Node.js (Axios)
              </button>
            </div>

            <div className="relative bg-[#121212] border border-[#333333] p-4 rounded font-mono text-xs overflow-x-auto text-[#00FF66]">
              {codeLang === 'curl' && (
                <pre>{`curl -X GET "${baseUrl}?include=movies,tv,episodes,watchlist" \\
  -H "Authorization: Bearer ${activeSampleKey}"`}</pre>
              )}

              {codeLang === 'javascript' && (
                <pre>{`const response = await fetch("${baseUrl}?include=movies,tv,episodes,watchlist", {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${activeSampleKey}'
  }
});
const data = await response.json();
console.log(data);`}</pre>
              )}

              {codeLang === 'python' && (
                <pre>{`import requests

url = "${baseUrl}"
headers = {
    "Authorization": "Bearer ${activeSampleKey}"
}
params = {
    "include": "movies,tv,episodes,watchlist"
}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print(data)`}</pre>
              )}

              {codeLang === 'node' && (
                <pre>{`const axios = require('axios');

async function getMediaData() {
  const { data } = await axios.get('${baseUrl}', {
    headers: {
      'Authorization': 'Bearer ${activeSampleKey}'
    },
    params: {
      include: 'movies,tv,episodes,watchlist'
    }
  });
  console.log(data);
}

getMediaData();`}</pre>
              )}
            </div>
          </div>

          {/* Section 3: Interactive Live API Tester */}
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
              <Play className="w-4 h-4" />
              INTERACTIVE API TEST CONSOLE
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Test the data export endpoint directly from your browser in real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121212] p-4 border border-[#333333] rounded">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                  Authentication Source
                </label>
                <select
                  value={selectedKeyForTest}
                  onChange={(e) => setSelectedKeyForTest(e.target.value)}
                  className="form-input text-xs py-2"
                >
                  <option value="session">Current Browser Session (Cookie)</option>
                  {generatedKey && (
                    <option value={generatedKey.rawKey}>Newly Generated Key ({generatedKey.keyPrefix})</option>
                  )}
                  {keys.map((k) => (
                    <option key={k.id} value={k.key_prefix}>Key #{k.id} - {k.name} ({k.key_prefix})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                  Include Modules
                </label>
                <input
                  type="text"
                  value={testIncludes}
                  onChange={(e) => setTestIncludes(e.target.value)}
                  placeholder="profile,stats,movies,tv,episodes,watchlist,social"
                  className="form-input text-xs py-2"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                    Filter Updated Since (Optional YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={testSince}
                    onChange={(e) => setTestSince(e.target.value)}
                    className="form-input text-xs py-2"
                  />
                </div>
                <button
                  onClick={handleRunApiTest}
                  disabled={testLoading}
                  className="btn btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2 self-end"
                >
                  {testLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#121212] border-t-transparent" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Execute API Call
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Results Display */}
            {testResult && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-[#121212] p-3 border border-[#333333] rounded">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      testResult.status === 200 ? 'bg-[#00FF66] text-[#121212]' : 'bg-[#ff4d4d] text-[#121212]'
                    }`}>
                      {testResult.status} {testResult.status === 200 ? 'OK' : 'ERROR'}
                    </span>
                    <span className="text-[#A0A0A0]">
                      Latency: <strong className="text-[#00FF66]">{testResult.timeMs} ms</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-[#A0A0A0]">
                    <span>RateLimit Remaining: <strong className="text-[#EDEDED]">{testResult.headers['x-ratelimit-remaining'] || '59'}</strong></span>
                  </div>
                </div>

                <div className="bg-[#121212] border border-[#333333] p-4 rounded font-mono text-xs max-h-96 overflow-y-auto text-[#EDEDED] scrollbar-thin">
                  <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMBEDDED PROFILE & PREFERENCES */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              PROFILE DETAILS
            </h2>

            {profileMessage && (
              <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 text-xs font-semibold text-[#00FF66] rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input text-xs py-2"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="form-input text-xs py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#A0A0A0] mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 250))}
                className="form-input text-xs h-20 resize-none"
              />
            </div>
          </div>

          <div className="card bg-[#1E1E1E] border border-[#333333] p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#00FF66] flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              DISPLAY & PRIVACY PREFERENCES
            </h2>

            <div className="space-y-3">
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

              <div className="flex items-center justify-between bg-[#121212] p-3 border border-[#333333] rounded">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-[#00FF66]" />
                  <div>
                    <span className="text-xs font-bold text-[#EDEDED] block">Hide Sensitive/NSFW Content</span>
                    <span className="text-[10px] text-[#A0A0A0]">Filter out explicit titles</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefHideNsfw}
                  onChange={(e) => setPrefHideNsfw(e.target.checked)}
                  className="w-4 h-4 accent-[#00FF66]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="btn btn-primary text-xs py-2.5 px-6 font-bold"
          >
            {profileSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}
    </div>
  );
}
