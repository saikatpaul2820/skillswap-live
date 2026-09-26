import React, { useState } from 'react';
import { X, Send, Sparkles, Monitor, MapPin, Globe } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SkillExchangeRequest } from '../types';

interface CreateExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (exchange: SkillExchangeRequest) => void;
  existingExchange?: SkillExchangeRequest | null;
}

export const CreateExchangeModal: React.FC<CreateExchangeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  existingExchange,
}) => {
  const { userSkills } = useAuth();

  const [learningSkill, setLearningSkill] = useState(existingExchange?.learningSkillName || '');
  const [teachingSkill, setTeachingSkill] = useState(existingExchange?.teachingSkillName || '');
  const [description, setDescription] = useState(existingExchange?.description || '');
  const [mode, setMode] = useState<'Online' | 'Offline' | 'Either'>(
    existingExchange?.mode || 'Online'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const teachSuggestions = userSkills.filter(s => s.type === 'TEACH').map(s => s.skillName);
  const learnSuggestions = userSkills.filter(s => s.type === 'LEARN').map(s => s.skillName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!learningSkill.trim() || !teachingSkill.trim() || !description.trim()) {
      setError('Please provide the skill you want to learn, the skill you can teach, and a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingExchange) {
        const updated = await api.updateExchange(existingExchange.id, {
          learningSkill: learningSkill.trim(),
          teachingSkill: teachingSkill.trim(),
          description: description.trim(),
          mode,
        });
        onCreated(updated);
      } else {
        const created = await api.createExchange({
          learningSkill: learningSkill.trim(),
          teachingSkill: teachingSkill.trim(),
          description: description.trim(),
          mode,
        });
        onCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post skill exchange request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {existingExchange ? 'Edit Skill Exchange' : 'Create Skill Exchange'}
            </h3>
            <p className="text-xs text-slate-500">
              Post your exchange request to the community exchange board.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skill I Want to Learn *
            </label>
            <input
              type="text"
              required
              value={learningSkill}
              onChange={(e) => setLearningSkill(e.target.value)}
              placeholder="e.g. Java, Python, UI/UX Design, React"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {learnSuggestions.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">From your wishlist:</span>
                {learnSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setLearningSkill(s)}
                    className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skill I Can Teach *
            </label>
            <input
              type="text"
              required
              value={teachingSkill}
              onChange={(e) => setTeachingSkill(e.target.value)}
              placeholder="e.g. Graphic Design, Figma, Spring Boot, Video Editing"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {teachSuggestions.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">From your expertise:</span>
                {teachSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setTeachingSkill(s)}
                    className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Exchange Goals *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Looking for someone interested in exchanging programming and design skills. We can do weekly 1-hour sessions..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Preferred Learning Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Online', label: 'Online', icon: Monitor },
                { id: 'Offline', label: 'Offline / In-Person', icon: MapPin },
                { id: 'Either', label: 'Either', icon: Globe },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = mode === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{existingExchange ? 'Update Request' : 'Post Exchange'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
