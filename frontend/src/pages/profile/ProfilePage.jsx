import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { profileApi } from '../../features/profile/profileApi.js';
import '../../styles/pages/profile.css';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland',
];

function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, fetchMe } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile().then((r) => r.data.data),
  });

  const initForm = (p) => {
    if (p && !name) {
      setName(p.name || '');
      setEmail(p.email || '');
      setPhone(p.phone || '');
      setJobTitle(p.jobTitle || '');
      setTimezone(p.timezone || 'UTC');
    }
  };

  if (profile && !name) initForm(profile);

  const updateMutation = useMutation({
    mutationFn: (data) => profileApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old) => ({ ...old, ...res.data.data }));
      fetchMe();
      setSuccessMsg('Profile updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => profileApi.changePassword(data),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setSuccessMsg('Password changed successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setPasswordError(err?.response?.data?.error?.message || 'Failed to change password');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => profileApi.uploadPicture(file),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old) => ({ ...old, ...res.data.data }));
      fetchMe();
      setSuccessMsg('Profile picture updated');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const removePicMutation = useMutation({
    mutationFn: () => profileApi.removePicture(),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old) => ({ ...old, ...res.data.data }));
      fetchMe();
    },
  });

  const handleSaveInfo = () => {
    updateMutation.mutate({ name, email, phone, jobTitle, timezone });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File must be under 5MB');
        return;
      }
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  };

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="skeleton-block" style={{ height: 200, marginBottom: 24 }} />
        <div className="skeleton-block" style={{ height: 300 }} />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1 className="page-title">My Profile</h1>

      {successMsg && <div className="profile-success">{successMsg}</div>}

      <div className="profile-top-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar" onClick={() => fileInputRef.current?.click()}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt={profile?.name} className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-initials">{getInitials(profile?.name)}</span>
            )}
            <div className="profile-avatar-overlay">
              <span>Change</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div className="profile-avatar-info">
            <h2 className="profile-avatar-name">{profile?.name}</h2>
            <span className="profile-avatar-role">{profile?.role?.replace('_', ' ')}</span>
            {profile?.profilePicture && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 4, color: '#B3261E', fontSize: 12 }}
                onClick={() => removePicMutation.mutate()}
                disabled={removePicMutation.isPending}
              >
                Remove picture
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Personal Information
        </button>
        <button
          className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>

      <div className="profile-card">
        {activeTab === 'info' && (
          <div className="profile-form">
            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label">Job title</label>
                <input
                  className="form-input"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Legal Counsel"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="profile-form-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveInfo}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-form">
            {passwordError && <div className="profile-error">{passwordError}</div>}
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input
                className="form-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="profile-form-row">
              <div className="form-group">
                <label className="form-label">New password</label>
                <input
                  className="form-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="profile-form-actions">
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={passwordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
