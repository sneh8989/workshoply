import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workshopApi } from '../api/workshop.api';
import { WorkshopCard } from '../components/workshop/WorkshopCard';
import { WorkshopGridSkeleton } from '../components/common/LoadingSkeleton';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass,
  CheckCircle2,
  CreditCard,
  Award,
  Star
} from 'lucide-react';

export const HomePage = () => {
  const [featuredWorkshops, setFeaturedWorkshops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await workshopApi.getFeaturedWorkshops();
        setFeaturedWorkshops(res.data || []);
      } catch (err) {
        console.error('Failed to load featured workshops:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/workshops?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/workshops');
    }
  };

  const categories = [
    { title: 'Web Development', desc: 'React, Node, GraphQL & System Design', count: '14 Workshops', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400' },
    { title: 'Artificial Intelligence', desc: 'LLMs, RAG Pipelines & LangChain', count: '9 Workshops', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400' },
    { title: 'UI/UX Design', desc: 'Design Systems, Figma & Micro-interactions', count: '11 Workshops', image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400' },
    { title: 'Data Science', desc: 'Pandas, Visual Analytics & Machine Learning', count: '8 Workshops', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' },
    { title: 'Digital Marketing', desc: 'Performance Ads, Funnel & Growth Hacking', count: '7 Workshops', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400' },
    { title: 'Entrepreneurship', desc: 'Startup Validation, Unit Economics & Pitching', count: '6 Workshops', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400' }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-surface via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-light border border-secondary/30 text-secondary text-xs font-bold tracking-wide animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Live Cohorts • Spring 2026 Schedule</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight max-w-4xl mx-auto leading-tight">
            Learn from the practitioners shaping the <span className="text-secondary">future of tech.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Discover curated masterclasses led by principal engineers, design leads, and proven founders. Live coding, real cohort collaboration, and verifiable seat booking.
          </p>

          {/* Search Hero Box */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 bg-surface p-2.5 rounded-2xl shadow-card border border-border"
          >
            <div className="flex-1 flex items-center px-3 gap-2">
              <Compass className="w-5 h-5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What skill do you want to master? (e.g. React, LLMs, Figma)"
                className="w-full bg-transparent focus:outline-none text-sm text-main placeholder:text-muted py-2"
              />
            </div>
            <button
              type="submit"
              className="btn-primary text-sm whitespace-nowrap px-6 py-3"
            >
              Explore Workshops
            </button>
          </form>

          {/* Trust badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Razorpay Checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Small Cohort Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              Instant Booking Confirmations
            </span>
          </div>
        </div>
      </section>

      {/* Featured Workshops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Handpicked Sessions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Featured Masterclasses
            </h2>
          </div>
          <Link
            to="/workshops"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:text-secondary-hover transition group"
          >
            <span>View All Workshops</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <WorkshopGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredWorkshops.slice(0, 3).map((workshop) => (
              <WorkshopCard key={workshop._id} workshop={workshop} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Categories */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Broaden Your Horizons
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Explore by Discipline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              to={`/workshops?category=${encodeURIComponent(cat.title)}`}
              className="card-surface p-6 group hover:shadow-card-hover hover:border-secondary/40 transition flex items-center gap-4"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition duration-300"
              />
              <div>
                <h3 className="font-bold text-base text-main group-hover:text-secondary transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-muted line-clamp-1 mb-1">{cat.desc}</p>
                <span className="text-xs font-semibold text-accent">
                  {cat.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-surface border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Seamless Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              How Workshoply Works
            </h2>
            <p className="text-sm text-muted">
              From finding your next career milestone to walking into the cohort session.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover & Evaluate',
                desc: 'Explore hands-on curriculum, instructor credentials, prerequisites, and real-time remaining seat inventory.',
                icon: Compass
              },
              {
                step: '02',
                title: 'Lock Seat & Pay',
                desc: 'Enjoy atomic seat holds with instant Razorpay checkout supporting UPI, Cards, and Netbanking.',
                icon: CreditCard
              },
              {
                step: '03',
                title: 'Attend & Elevate',
                desc: 'Receive immediate printable admission passes, calendar invites, and participate in live mentor Q&A sessions.',
                icon: Award
              }
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.step} className="bg-background rounded-2xl p-6 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
                      <Icon className="w-6 h-6 text-secondary" />
                    </div>
                    <span className="text-2xl font-black text-stone-300">{st.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-main">{st.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Attendee Feedback
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Trusted by Ambitious Learners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: 'The Full-Stack React masterclass was exceptional. The backend concurrency patterns using MongoDB atomic locks solved problems we face at work every week.',
              name: 'Suhas Kulkarni',
              role: 'Senior Software Engineer',
              rating: 5,
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
            },
            {
              quote: 'Dr. Rohini’s Generative AI workshop took away the confusion around vector databases and RAG evaluation. Best 4 hours of learning I have had all year.',
              name: 'Pooja Bhatt',
              role: 'ML Engineer at FinNext',
              rating: 5,
              avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120'
            },
            {
              quote: 'Seamless Razorpay booking and immediate printable ticket. The design system tokens masterclass helped me revamp our entire design workflow in Figma.',
              name: 'Nikhil R.',
              role: 'Product Designer',
              rating: 5,
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'
            }
          ].map((t, idx) => (
            <div key={idx} className="card-surface p-6 flex flex-col justify-between space-y-4">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-main leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                />
                <div>
                  <h4 className="text-xs font-bold text-main">{t.name}</h4>
                  <p className="text-[11px] text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-modal flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Take the next step
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to learn directly from industry masters?
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Explore upcoming cohorts, reserve your seat before capacity fills, and unlock verifiable career growth with Workshoply.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/workshops"
              className="btn-secondary text-sm px-6 py-3 text-center whitespace-nowrap"
            >
              Browse All Workshops
            </Link>
            <Link
              to="/register"
              className="btn-outline text-sm px-6 py-3 text-center whitespace-nowrap bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
