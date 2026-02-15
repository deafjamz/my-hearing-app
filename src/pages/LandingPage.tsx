import { motion, useReducedMotion } from 'framer-motion';
import { Headphones, BarChart3, Zap, Users, Ear, Volume2, ArrowRight, ChevronDown } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useUser } from '@/store/UserContext';
import { hapticSelection } from '@/lib/haptics';
import { Card } from '@/components/primitives';

const STATS = [
  { value: '30,000+', label: 'Audio exercises' },
  { value: '9', label: 'Professional voices' },
  { value: '7', label: 'Activity types' },
  { value: '4', label: 'Erber training levels' },
];

const FEATURES = [
  {
    icon: Ear,
    title: 'Structured progression',
    description: 'Follow the Erber hierarchy — from sound detection to full comprehension. Each level builds on the last.',
  },
  {
    icon: Volume2,
    title: 'Speech-in-noise training',
    description: 'Practice hearing in realistic backgrounds with adaptive difficulty that adjusts to your level.',
  },
  {
    icon: Users,
    title: '9 natural voices',
    description: 'Train with diverse, professional voices — US, UK, and Australian accents across male and female speakers.',
  },
  {
    icon: BarChart3,
    title: 'Detailed analytics',
    description: 'Track phoneme mastery, spot confusion patterns, and see your improvement over weeks and months.',
  },
  {
    icon: Zap,
    title: 'Quick sessions',
    description: 'Most exercises take 2–3 minutes. Practice fits into your day, not the other way around.',
  },
  {
    icon: Headphones,
    title: 'Built for hearing devices',
    description: 'Optimized for cochlear implants, hearing aids, and Bluetooth audio routing.',
  },
];

const STEPS = [
  { num: '1', title: 'Take a listening check', description: 'A quick assessment across 4 levels to find your starting point.' },
  { num: '2', title: 'Get your daily plan', description: 'Personalized exercises based on where you are right now.' },
  { num: '3', title: 'Practice daily', description: 'Short, focused sessions that fit into your routine.' },
  { num: '4', title: 'See your progress', description: 'Track improvement with charts, streaks, and exportable reports.' },
];

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const { user, loading } = useUser();

  // Authenticated users go straight to practice
  if (!loading && user) {
    return <Navigate to="/practice" replace />;
  }

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Background orbs */}
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-teal-500/[0.08] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-500/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <FadeIn className="relative z-10 max-w-2xl">
          <img src="/logo.png" alt="" className="w-16 h-16 rounded-2xl mx-auto mb-8" />

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Better hearing starts{' '}
            <span className="text-teal-400">with practice</span>
          </h1>

          <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto mb-10">
            SoundSteps is a listening training app for cochlear implant users and people with hearing loss. Short daily exercises. Real progress. At your own pace.
          </p>

          <Link
            to="/practice"
            onClick={() => hapticSelection()}
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full px-10 py-5 shadow-[0_0_30px_rgba(0,143,134,0.3)] hover:shadow-[0_0_40px_rgba(0,143,134,0.4)] transition-all"
          >
            Start Training Free
            <ArrowRight size={20} />
          </Link>

          <p className="text-slate-500 text-sm mt-4">Free account — no credit card needed</p>
        </FadeIn>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 text-slate-600"
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-3xl font-bold text-teal-400">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to train your hearing</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Built by someone who wears cochlear implants — every feature is designed for how you actually listen.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.08}>
              <Card variant="subtle" className="h-full hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center mb-4">
                  <feature.icon className="text-teal-400" size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-slate-900/30 border-y border-slate-800/50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">Get started in under a minute.</p>
          </FadeIn>

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-400 font-bold text-sm">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who It's For ─── */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for people like you</h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Cochlear implant users', desc: 'New or experienced — train at any stage of your hearing journey.' },
            { title: 'Hearing aid users', desc: 'Improve speech recognition alongside your devices.' },
            { title: 'Families & partners', desc: 'Understand the exercises and support your loved one\'s progress.' },
            { title: 'Audiologists', desc: 'Recommend structured, at-home practice between appointments.' },
          ].map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <Card variant="subtle" padding="p-5">
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-24 text-center px-6">
        <div className="absolute inset-0 bg-teal-500/[0.04] pointer-events-none" />
        <FadeIn className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start training today</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
            Your hearing is worth the practice. Start free — no credit card, no audiologist referral needed.
          </p>
          <Link
            to="/practice"
            onClick={() => hapticSelection()}
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full px-10 py-5 shadow-[0_0_30px_rgba(0,143,134,0.3)] hover:shadow-[0_0_40px_rgba(0,143,134,0.4)] transition-all"
          >
            Start Training Free
            <ArrowRight size={20} />
          </Link>
        </FadeIn>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-slate-300">SoundSteps</span>
          </div>

          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <a href="mailto:support@soundsteps.app" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>

          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} SoundSteps. Not a medical device.
          </p>
        </div>
      </footer>
    </div>
  );
}
