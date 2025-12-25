'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import InteractiveDemo from '@/components/InteractiveDemo';
import WelcomeDemo from '@/components/WelcomeDemo';
import { useLanguage } from '@/components/LanguageProvider';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative bg-warm-gradient">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-noise z-0" />
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large organic blob top right */}
        <div
          className="absolute -top-32 -right-32 w-[800px] h-[800px] opacity-40 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--matcha-200) 0%, rgba(255,255,255,0) 70%)',
            animation: 'blob-float 25s ease-in-out infinite',
            transformOrigin: 'center center',
          }}
        />
        {/* Medium blob left */}
        <div
          className="absolute top-1/4 -left-40 w-[600px] h-[600px] opacity-30 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--terra-300) 0%, rgba(255,255,255,0) 70%)',
            animation: 'blob-float 20s ease-in-out infinite reverse',
            transformOrigin: 'center center',
          }}
        />
        {/* Small accent blob */}
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] opacity-30 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--matcha-300) 0%, rgba(255,255,255,0) 70%)',
            animation: 'blob-float 18s ease-in-out infinite',
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow */}
          <div
            className={`flex justify-center mb-8 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'var(--matcha-100)',
                color: 'var(--matcha-700)',
                border: '1px solid var(--matcha-200)',
              }}
            >
              {t.landing.eyebrow}
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-center mb-6 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.1,
              color: 'var(--text-primary)',
            }}
          >
            {t.landing.headline}
            <br />
            <span className="text-gradient">{t.landing.headlineHighlight}</span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-center max-w-2xl mx-auto mb-10 text-lg transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            {t.landing.subheadline}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Link
              href="/signup"
              className="matcha-btn matcha-btn-primary text-base px-8 py-4"
            >
              {t.landing.ctaStart}
            </Link>
            <Link
              href="#how-it-works"
              className="matcha-btn matcha-btn-secondary text-base px-8 py-4"
            >
              {t.landing.ctaHow}
            </Link>
          </div>

          {/* Hero Visual - Abstract Brain Pattern */}
          <div
            className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-500 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--cream-100) 0%, var(--cream-200) 100%)',
                border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-xl)',
                aspectRatio: '16/9',
              }}
            >
              {/* Abstract visualization representing mind analysis */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Central element */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, var(--matcha-400) 0%, var(--matcha-600) 100%)',
                      boxShadow: '0 0 60px rgba(104, 166, 125, 0.4)',
                    }}
                  />
                  {/* Orbiting elements */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        width: `${180 + i * 60}px`,
                        height: `${180 + i * 60}px`,
                        marginLeft: `-${(180 + i * 60) / 2}px`,
                        marginTop: `-${(180 + i * 60) / 2}px`,
                        border: `1px solid rgba(104, 166, 125, ${0.3 - i * 0.04})`,
                        borderRadius: '50%',
                        animation: `spin ${20 + i * 5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
                      }}
                    >
                      <div
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          background: i % 2 === 0 ? 'var(--matcha-500)' : 'var(--terra-400)',
                          top: '0',
                          left: '50%',
                          marginLeft: '-6px',
                          marginTop: '-6px',
                        }}
                      />
                    </div>
                  ))}
                  {/* Floating labels */}
                  <div
                    className="absolute top-1/4 left-1/4 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--matcha-700)',
                      boxShadow: 'var(--shadow-md)',
                      animation: 'float 4s ease-in-out infinite',
                    }}
                  >
                    {t.landing.cognitiveBiases}
                  </div>
                  <div
                    className="absolute top-1/3 right-1/4 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--terra-500)',
                      boxShadow: 'var(--shadow-md)',
                      animation: 'float 5s ease-in-out infinite 1s',
                    }}
                  >
                    {t.landing.thoughtPatterns}
                  </div>
                  <div
                    className="absolute bottom-1/3 left-1/3 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--matcha-600)',
                      boxShadow: 'var(--shadow-md)',
                      animation: 'float 4.5s ease-in-out infinite 0.5s',
                    }}
                  >
                    {t.demo.analysisTitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Demo - Video Explainer */}
      <WelcomeDemo />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.landing.howItWorks}
            </h2>
            <p
              className="max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.landing.howItWorksDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: t.landing.step1Title,
                description: t.landing.step1Desc,
              },
              {
                step: '02',
                title: t.landing.step2Title,
                description: t.landing.step2Desc,
              },
              {
                step: '03',
                title: t.landing.step3Title,
                description: t.landing.step3Desc,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="matcha-card p-8 relative overflow-hidden group"
              >
                <span
                  className="absolute -top-4 -right-4 text-8xl font-bold opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--matcha-600)',
                  }}
                >
                  {item.step}
                </span>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: 'var(--matcha-100)',
                    color: 'var(--matcha-700)',
                  }}
                >
                  <span
                    className="text-lg font-semibold"
                    style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3
                  className="text-xl mb-3"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <InteractiveDemo />

      {/* Testimonial Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="matcha-card p-10 md:p-12 relative overflow-hidden"
          >
            {/* Decorative quote marks */}
            <div
              className="absolute top-6 left-8 text-7xl opacity-10 leading-none"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--matcha-600)',
              }}
            >
              "
            </div>

            <div className="relative z-10">
              <blockquote
                className="text-lg md:text-xl leading-relaxed mb-8"
                style={{
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                }}
              >
                <p className="mb-4">
                  Matcha is a really good idea.
                </p>
                <p className="mb-4">
                  I spent a long time thinking about visiting a psychologist, but I didn't feel comfortable sharing my real thoughts with a person. I was afraid of being judged; I also know that when I am talking to a professional, I am not truly myself—even when I try to act natural.
                </p>
                <p className="mb-4">
                  I also tried talking to ChatGPT so I could have a session where it could analyze my thoughts and tell me what is wrong with me. In the end, ChatGPT didn't give me the session I needed and didn't help me.
                </p>
                <p>
                  However, <span style={{ color: 'var(--matcha-600)', fontWeight: 500 }}>Matcha really applied the concept in my real-life situation.</span>
                </p>
              </blockquote>

              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--matcha-200) 0%, var(--matcha-300) 100%)',
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--matcha-700)' }}
                  >
                    IK
                  </span>
                </div>
                <div>
                  <p
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Anonymous User
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    First Matcha User
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="py-24 px-4"
        style={{ background: 'var(--cream-100)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.landing.whatReveals}
            </h2>
            <p
              className="max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.landing.whatRevealsDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: t.landing.cognitiveBiases,
                description: t.landing.cognitiveBiasesDesc,
                color: 'var(--matcha-500)',
              },
              {
                title: t.landing.thoughtPatterns,
                description: t.landing.thoughtPatternsDesc,
                color: 'var(--terra-400)',
              },
              {
                title: t.landing.emotionalBlockers,
                description: t.landing.emotionalBlockersDesc,
                color: 'var(--matcha-600)',
              },
              {
                title: t.landing.psychProfile,
                description: t.landing.psychProfileDesc,
                color: 'var(--terra-500)',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex gap-6 p-6 rounded-2xl transition-all duration-300 hover:bg-white/50"
              >
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ background: feature.color }}
                />
                <div>
                  <h3
                    className="text-xl mb-2"
                    style={{
                      fontFamily: 'var(--font-dm-serif), Georgia, serif',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section
        className="py-24 px-4"
        style={{ background: 'var(--cream-100)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl mb-4"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: 'var(--text-primary)',
            }}
          >
            {t.landing.startFree}
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            {t.landing.startFreeDesc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="matcha-btn matcha-btn-primary text-base px-8 py-4"
            >
              {t.landing.createFreeAccount}
            </Link>
            <Link
              href="/pricing"
              className="matcha-btn matcha-btn-secondary text-base px-8 py-4"
            >
              {t.landing.seePricing}
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-700) 100%)',
            }}
          >
            {/* Decorative elements */}
            <div
              className="absolute top-0 right-0 w-64 h-64 opacity-10"
              style={{
                background: 'radial-gradient(circle, white 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 opacity-10"
              style={{
                background: 'radial-gradient(circle, white 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(-30%, 30%)',
              }}
            />

            <h2
              className="text-3xl md:text-4xl mb-4 relative z-10"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'white',
              }}
            >
              {t.landing.readyToUnderstand}
            </h2>
            <p
              className="mb-8 max-w-xl mx-auto relative z-10"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {t.landing.joinThousands}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl transition-all relative z-10"
              style={{
                background: 'white',
                color: 'var(--matcha-700)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              }}
            >
              {t.landing.startNow}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-4 border-t"
        style={{
          background: 'var(--cream-50)',
          borderColor: 'var(--border-soft)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p
                className="text-xl font-semibold mb-1"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--matcha-600)',
                }}
              >
                Matcha
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t.landing.footerTagline}
              </p>
            </div>
            <div className="flex gap-8">
              <Link
                href="/pricing"
                className="text-sm hover:text-[var(--matcha-600)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.pricing}
              </Link>
              <Link
                href="/login"
                className="text-sm hover:text-[var(--matcha-600)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.login}
              </Link>
              <Link
                href="/signup"
                className="text-sm hover:text-[var(--matcha-600)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.common.signup}
              </Link>
            </div>
          </div>

          <div
            className="mt-8 pt-8 border-t text-center text-sm"
            style={{
              borderColor: 'var(--border-soft)',
              color: 'var(--text-muted)',
            }}
          >
            © 2024 Matcha. {t.landing.allRightsReserved}
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes blob-float {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(20px, -20px) scale(1.05);
          }
          66% {
            transform: translate(-10px, 10px) scale(0.95);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
