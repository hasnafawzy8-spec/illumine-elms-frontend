import { useState, useEffect } from 'react';
import { Button, Card, PageHeader, Badge, Input, Modal } from '../../components/ui';
import { View } from '../../types';
import { getStoredUser, setStoredUser, authAPI, studentsAPI } from '../../services/api';

interface Props {
  navigate: (view: View) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function Profile({ navigate: _navigate, showToast }: Props) {
  const [editing, setEditing] = useState(false);
  const storedUser = getStoredUser();

  const [form, setForm] = useState({
    fullName: storedUser ? `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim() : '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    dob: '',
    grade: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    profileImage: '',
  });

  const [studentId, setStudentId] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authAPI.getMe().then(res => {
      if (res?.user) {
        setStudentId(res.profile?._id || res.user._id);
        const nameParts = [res.user.firstName, res.user.lastName].filter(Boolean);
        setForm(f => ({
          ...f,
          fullName: nameParts.length > 0 ? nameParts.join(' ') : f.fullName,
          email: res.user.email || f.email,
          phone: res.user.phone || f.phone,
          dob: formatDateOfBirth(res.profile?.dateOfBirth),
          grade: res.profile?.grade || f.grade,
          address: res.profile?.address?.street ? `${res.profile.address.street}, ${res.profile.address.city || ''}` : f.address,
          guardianName: res.profile?.guardianName || '',
          guardianPhone: res.profile?.guardianPhone || '',
          profileImage: res.user.profileImage || f.profileImage,
        }));
      }
    }).catch((err: Error) => {
      showToast(err.message || 'Failed to load your profile.', 'error');
    });
  }, [showToast]);

  const handleSave = async () => {
    if (!selectedPhoto) {
      showToast('Choose a profile photo before saving.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', selectedPhoto);

      if (studentId) {
        const response = await studentsAPI.update(studentId, formData);
        const savedProfileImage = response?.data?.user?.profileImage || response?.data?.profileImage || form.profileImage;
        if (savedProfileImage) {
          setForm(current => ({ ...current, profileImage: savedProfileImage }));
        }
      }
      setSelectedPhoto(null);
      showToast('Profile photo updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile changes.', 'error');
      return;
    }

    const currentUser = getStoredUser();
    if (currentUser) setStoredUser({ ...currentUser, profileImage: form.profileImage });
    setEditing(false);
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      setPasswordError('New password must be at least 8 characters and include an uppercase letter, a number, and a special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password changed successfully.');
    } catch (err: any) {
      setPasswordError(err.message || 'Unable to change your password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoChange = (file?: File) => {
    if (!file) {
      showToast('No file selected. Please choose an image.', 'error');
      return;
    }

    // Accept common image formats: JPG, JPEG, PNG
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isExtensionValid = ['jpg', 'jpeg', 'png'].includes(extension || '');

    if (!validTypes.includes(file.type) && !isExtensionValid) {
      showToast('Invalid file format. Only JPG, JPEG, and PNG images are allowed.', 'error');
      return;
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit. Please choose a smaller photo.', 'error');
      return;
    }

    setSelectedPhoto(file);

    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = String(reader.result);
      setForm(current => ({ ...current, profileImage: previewUrl }));
      showToast('Photo preview updated. Save to apply it.', 'info');
    };
    reader.onerror = () => {
      showToast('Failed to read the selected file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fade-in-up space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Your personal information is managed by the institute."
        action={!editing ? <Button variant="outline" onClick={() => setEditing(true)}>Change Photo</Button> : undefined}
      />

      {/* Avatar */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-[#1E6BB8] flex items-center justify-center text-white text-3xl font-bold font-display overflow-hidden flex-shrink-0 shadow-md border-2 border-white">
              {form.profileImage ? (
                <img src={form.profileImage} alt="Student profile preview" className="w-full h-full object-cover" />
              ) : (
                <span>{form.fullName.charAt(0) || 'S'}</span>
              )}
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-900 font-display">{form.fullName}</h2>
            <p className="text-slate-500 text-sm">{form.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <Badge color="blue">{form.grade}</Badge>
              <Badge color="green">Active Student</Badge>
            </div>
            
            {editing && (
              <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E6BB8] hover:bg-[#155a9c] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer transition-colors">
                  <span>📷 Upload Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={e => {
                      handlePhotoChange(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Personal info */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 font-display">Personal Information</h3>
          <Badge color="slate">View only</Badge>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ProfileField label="Full Name" value={form.fullName} />
            <ProfileField label="Email Address" value={form.email} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ProfileField label="Phone Number" value={form.phone} />
            <ProfileField label="Date of Birth" value={form.dob} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ProfileField label="Grade" value={form.grade} />
          </div>
          <div>
            <ProfileField label="Address" value={form.address} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 font-display">Guardian Information</h3>
          <Badge color="slate">View only</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Guardian Name</p>
            <p className="text-sm font-medium text-slate-700">{form.guardianName || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Guardian Phone</p>
            <p className="text-sm font-medium text-slate-700">{form.guardianPhone || 'Not provided'}</p>
          </div>
        </div>
      </Card>

      {/* Account info */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-800 font-display mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-slate-500">Student ID</span>
            <span className="font-mono font-bold text-slate-800">STU-2026-0001</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-slate-500">Account Status</span>
            <Badge color="green">Active</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-slate-500">Member Since</span>
            <span className="text-slate-700">January 2026</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-500">Password</span>
            <button
              type="button"
              className="text-[#1E6BB8] text-xs hover:underline"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setShowPasswordModal(true);
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      </Card>

      {showPasswordModal && (
        <Modal
          title="Change Password"
          onClose={() => {
            if (changingPassword) return;
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError('');
            setPasswordSuccess('');
          }}
          size="md"
        >
          <div className="space-y-4">
            {passwordError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {passwordSuccess}
              </p>
            )}
            <Input
              label="Current Password"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={value => setPasswordForm(form => ({ ...form, currentPassword: value }))}
              required
            />
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters, including an uppercase letter, a number, and a special character."
              value={passwordForm.newPassword}
              onChange={value => setPasswordForm(form => ({ ...form, newPassword: value }))}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={value => setPasswordForm(form => ({ ...form, confirmPassword: value }))}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                disabled={changingPassword}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                {passwordSuccess ? 'Close' : 'Cancel'}
              </Button>
              {!passwordSuccess && (
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={() => { setEditing(false); setSelectedPhoto(null); }} className="flex-1">Cancel</Button>
          <Button size="lg" onClick={handleSave} disabled={!selectedPhoto} className="flex-1">Save Photo</Button>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      <p className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">{value || 'Not provided'}</p>
    </div>
  );
}

function formatDateOfBirth(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
