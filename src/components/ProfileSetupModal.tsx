import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Sparkles, MapPin, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialSetup?: boolean;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
  isInitialSetup = false,
}) => {
  const { currentUser, userSkills, updateProfile, updateUserSkills } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');

  // Skills
  const initialTeach = userSkills.filter(s => s.type === 'TEACH').map(s => s.skillName);
  const initialLearn = userSkills.filter(s => s.type === 'LEARN').map(s => s.skillName);

  const [teachSkills, setTeachSkills] = useState<string[]>(initialTeach);
  const [learnSkills, setLearnSkills] = useState<string[]>(initialLearn);

  const [newTeachInput, setNewTeachInput] = useState('');
  const [newLearnInput, setNewLearnInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularSkills = [
    'Java', 'UI/UX Design', 'Python', 'React', 'Graphic Design',
    'Machine Learning', 'Video Editing', 'Digital Marketing',
    'Advanced Excel', 'Spring Boot', 'Figma', 'C++', 'SQL & Database Design'
  ];

  const handleAddTeach = (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    if (!teachSkills.some(item => item.toLowerCase() === s.toLowerCase())) {
      setTeachSkills([...teachSkills, s]);
    }
    setNewTeachInput('');
  };

  const handleAddLearn = (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    if (!learnSkills.some(item => item.toLowerCase() === s.toLowerCase())) {
      setLearnSkills([...learnSkills, s]);
    }
    setNewLearnInput('');
  };

  const handleRemoveTeach = (skill: string) => {
    setTeachSkills(teachSkills.filter(s => s !== skill));
  };

  const handleRemoveLearn = (skill: string) => {
    setLearnSkills(learnSkills.filter(s => s !== skill));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    if (teachSkills.length === 0 && learnSkills.length === 0) {
      setError('Please add at least one skill you can teach or want to learn.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        profileImage: profileImage.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'user'}`,
      });

      // Prepare skills array
      const allSkillsToSave = [
        ...teachSkills.map(s => ({ skillName: s, type: 'TEACH' as const })),
        ...learnSkills.map(s => ({ skillName: s, type: 'LEARN' as const })),
      ];
      await updateUserSkills(allSkillsToSave);

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isInitialSetup ? 'Complete Your SkillSwap Profile' : 'Edit Profile & Skills'}
            </h3>
            <p className="text-xs text-slate-500">
              {isInitialSetup
                ? 'Specify what you can teach and what you want to learn so others can find you.'
                : 'Keep your expertise, learning goals, and contact details up to date.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Chen"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 border border-slate-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location & Timezone
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA (PST)"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Bio & Teaching Style
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your background, experience level, and what makes you excited to exchange skills..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border-t border-slate-200 pt-5">
            {/* Skills I Can Teach */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Skills I Can Teach</h4>
                <span className="text-xs text-slate-400">({teachSkills.length} added)</span>
              </div>

              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  value={newTeachInput}
                  onChange={(e) => setNewTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTeach(newTeachInput);
                    }
                  }}
                  placeholder="Type a skill you can teach (e.g. Java, Python, UI/UX) and press Enter"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddTeach(newTeachInput)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {teachSkills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No teaching skills added yet. Add at least one!</span>
                ) : (
                  teachSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeach(s)}
                        className="hover:text-emerald-950"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Skills I Want to Learn */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <h4 className="text-sm font-bold text-slate-900">Skills I Want to Learn</h4>
                <span className="text-xs text-slate-400">({learnSkills.length} added)</span>
              </div>

              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  value={newLearnInput}
                  onChange={(e) => setNewLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLearn(newLearnInput);
                    }
                  }}
                  placeholder="Type a skill you want to learn (e.g. React, Machine Learning) and press Enter"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddLearn(newLearnInput)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {learnSkills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No learning skills added yet. Add at least one!</span>
                ) : (
                  learnSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLearn(s)}
                        className="hover:text-violet-950"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Quick suggestions */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Add Suggestions:
              </span>
              <div className="flex flex-wrap gap-1">
                {popularSkills.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => {
                      if (!teachSkills.includes(sk)) handleAddTeach(sk);
                      else if (!learnSkills.includes(sk)) handleAddLearn(sk);
                    }}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    + {sk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
