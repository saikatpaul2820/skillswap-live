import React from 'react';
import {
  ArrowLeftRight,
  Sparkles,
  Users,
  Compass,
  CheckCircle,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onExplore: () => void;
  onPostSkill: () => void;
  onJoin: () => void;
  onViewProfile?: (userId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExplore,
  onPostSkill,
  onJoin,
}) => {
  const { isAuthenticated, currentUser } = useAuth();

  const exampleExchanges = [
    {
      left: 'Java & Spring Boot',
      right: 'UI/UX Design & Figma',
      userA: 'Rahul Sharma',
      userB: 'Sarah Chen',
      category: 'Software ↔ Design',
      color: 'from-amber-500/10 to-indigo-500/10 border-indigo-200'
    },
    {
      left: 'Python & Data Science',
      right: 'Graphic Design & Branding',
      userA: 'Elena Rostova',
      userB: 'Alex Miller',
      category: 'Analytics ↔ Visual',
      color: 'from-emerald-500/10 to-sky-500/10 border-emerald-200'
    },
    {
      left: 'Advanced Excel & SQL',
      right: 'Digital Marketing & SEO',
      userA: 'Priya Patel',
      userB: 'Carlos Vance',
      category: 'Data ↔ Growth',
      color: 'from-purple-500/10 to-rose-500/10 border-purple-200'
    },
    {
      left: 'Video Editing & Motion',
      right: 'Web Development & React',
      userA: 'Marcus Brody',
      userB: 'David Kim',
      category: 'Media ↔ Code',
      color: 'from-blue-500/10 to-teal-500/10 border-blue-200'
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Your Profile',
      desc: 'Set up your background, location, and preferred learning style in minutes.',
      icon: Users,
    },
    {
      step: '02',
      title: 'Add Skills',
      desc: 'List what you can teach and specify the skills you are eager to master.',
      icon: GraduationCap,
    },
    {
      step: '03',
      title: 'Find a Match',
      desc: 'Our mutual matching engine pairs your teaching expertise with someone wanting to learn.',
      icon: Sparkles,
    },
    {
      step: '04',
      title: 'Start Learning',
      desc: 'Connect, coordinate over direct messaging, and exchange 1-on-1 knowledge.',
      icon: HeartHandshake,
    },
  ];

  const benefits = [
    {
      title: 'Learn Without Paying',
      desc: 'Zero tuition or subscription fees. Value is exchanged purely through mutual knowledge sharing.',
      icon: Zap,
    },
    {
      title: 'Share Your Expertise',
      desc: 'Solidify what you already know by coaching others and receiving direct, grateful feedback.',
      icon: BookOpen,
    },
    {
      title: 'Meet Like-Minded People',
      desc: 'Connect with motivated learners, college students, freelancers, and creative professionals.',
      icon: Users,
    },
    {
      title: 'Build Your Skills',
      desc: 'Gain practical, portfolio-worthy knowledge from real practitioners rather than boring tutorials.',
      icon: ShieldCheck,
    },
    {
      title: 'Peer-to-Peer Learning',
      desc: 'Collaborative, reciprocal learning fosters accountability, friendship, and professional networks.',
      icon: Globe2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Peer-to-Peer Knowledge Sharing Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
                Learn. Share.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Exchange.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
                Exchange your skills with others and learn something new without spending money.
                Connect directly with peers who can teach what you want to learn.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  id="hero-find-skill-btn"
                  onClick={onExplore}
                  className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
                >
                  <Compass className="w-4 h-4" />
                  <span>Find a Skill</span>
                </button>

                <button
                  id="hero-share-skill-btn"
                  onClick={onPostSkill}
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <span>Share Your Skill</span>
                </button>
              </div>

              {/* Social Proof metrics */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 flex items-center justify-center lg:justify-start gap-8 text-slate-600 text-xs">
                <div>
                  <span className="block text-xl font-bold text-slate-900">100% Free</span>
                  <span className="text-slate-500">No subscription fees</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="block text-xl font-bold text-slate-900">Direct Mutual</span>
                  <span className="text-slate-500">1-on-1 skill swaps</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="block text-xl font-bold text-slate-900">Active Match</span>
                  <span className="text-slate-500">Real-time matching</span>
                </div>
              </div>
            </div>

            {/* Right Visual Graphic */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                {/* Visual Exchange Diagram Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 relative">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live Mutual Exchange
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      100% Match Found
                    </span>
                  </div>

                  {/* Peer A */}
                  <div className="mt-4 flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
                      alt="Rahul"
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">Rahul Sharma</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-emerald-700 font-medium">Teaches Java</span>
                        <span className="text-[10px] text-slate-400">→</span>
                        <span className="text-[11px] text-violet-700 font-medium">Wants UI/UX</span>
                      </div>
                    </div>
                  </div>

                  {/* Central Exchange Animation Icon */}
                  <div className="my-3 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-300">
                      <ArrowLeftRight className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  {/* Peer B */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120"
                      alt="Sarah"
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">Sarah Chen</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-emerald-700 font-medium">Teaches UI/UX</span>
                        <span className="text-[10px] text-slate-400">→</span>
                        <span className="text-[11px] text-violet-700 font-medium">Wants Java</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat snippet preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 bg-indigo-50/40 rounded-xl p-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900 mb-1">
                      <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Skill Exchange Agreement</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      "I'll teach you Figma & user testing on Saturdays, and you teach me Java Spring Boot on Tuesdays!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Skill Exchanges */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Example Skill Exchanges
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              See how learners on SkillSwap are pairing diverse disciplines for reciprocal growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exampleExchanges.map((ex, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group"
              >
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-3">
                  {ex.category}
                </span>

                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                      Teach
                    </span>
                    <span className="text-sm font-bold text-emerald-950 block truncate">
                      {ex.left}
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                    <span className="text-[10px] font-semibold text-violet-800 uppercase block">
                      Learn
                    </span>
                    <span className="text-sm font-bold text-violet-950 block truncate">
                      {ex.right}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ex.userA}</span>
                  <span>↔</span>
                  <span>{ex.userB}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How It Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From signing up to your first exchange session in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all"
                >
                  <div className="text-3xl font-extrabold text-slate-100 absolute top-3 right-4 select-none group-hover:text-indigo-50 transition-colors">
                    {s.step}
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {s.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why SkillSwap? (5 Benefits) */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Platform Benefits
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Why SkillSwap?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Why pay thousands for courses when you can learn directly from practitioners while teaching your own passion?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to exchange skills?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Join students, developers, designers, and creators who are learning faster and smarter through mutual peer collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              id="cta-join-skillswap-btn"
              onClick={onJoin}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <span>Join SkillSwap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl transition-all"
            >
              Explore Public Requests
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
