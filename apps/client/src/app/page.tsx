'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import InteractiveDemo from '@/components/InteractiveDemo';
import WelcomeDemo from '@/components/WelcomeDemo';
import { useLanguage } from '@/components/LanguageProvider';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
  }
};

// Animated section wrapper
function AnimatedSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative bg-warm-gradient">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-noise z-0" />

      {/* Decorative Background Elements - Enhanced with parallax */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute -top-32 -right-32 w-[800px] h-[800px] opacity-40 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--matcha-200) 0%, rgba(255,255,255,0) 70%)',
          }}
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -20, 10, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/4 -left-40 w-[600px] h-[600px] opacity-30 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--terra-300) 0%, rgba(255,255,255,0) 70%)',
          }}
          animate={{
            x: [0, -20, 10, 0],
            y: [0, 20, -10, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] opacity-30 mix-blend-multiply filter blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--matcha-300) 0%, rgba(255,255,255,0) 70%)',
          }}
          animate={{
            x: [0, 15, -15, 0],
            y: [0, -15, 15, 0],
            scale: [1, 1.03, 0.97, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Hero Section - Enhanced with parallax */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-20 pb-32 px-4"
      >
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={mounted ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <span
              className="px-5 py-2.5 rounded-full text-sm font-medium backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--matcha-50) 100%)',
                color: 'var(--matcha-700)',
                border: '1px solid var(--matcha-200)',
                boxShadow: '0 2px 20px rgba(104, 166, 125, 0.15)',
              }}
            >
              {t.landing.eyebrow}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={mounted ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center mb-6"
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
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={mounted ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center max-w-2xl mx-auto mb-10 text-lg"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            {t.landing.subheadline}
          </motion.p>

          {/* CTA Buttons - Enhanced with hover effects */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={mounted ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              href="/signup"
              className="group relative matcha-btn matcha-btn-primary text-base px-8 py-4 overflow-hidden"
            >
              <span className="relative z-10">{t.landing.ctaStart}</span>
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </Link>
            <Link
              href="#how-it-works"
              className="group matcha-btn matcha-btn-secondary text-base px-8 py-4 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t.landing.ctaHow}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↓
                </motion.span>
              </span>
            </Link>
          </motion.div>

          {/* Hero Visual - Enhanced orb animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={mounted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative max-w-3xl mx-auto"
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--cream-100) 0%, var(--cream-200) 100%)',
                border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-xl), 0 0 60px rgba(104, 166, 125, 0.1)',
                aspectRatio: '16/9',
              }}
            >
              {/* Animated visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Central pulsing element */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, var(--matcha-400) 0%, var(--matcha-600) 100%)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 40px rgba(104, 166, 125, 0.3)',
                        '0 0 80px rgba(104, 166, 125, 0.5)',
                        '0 0 40px rgba(104, 166, 125, 0.3)',
                      ],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Orbiting rings with dots */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        width: `${180 + i * 60}px`,
                        height: `${180 + i * 60}px`,
                        marginLeft: `-${(180 + i * 60) / 2}px`,
                        marginTop: `-${(180 + i * 60) / 2}px`,
                        border: `1px solid rgba(104, 166, 125, ${0.3 - i * 0.04})`,
                        borderRadius: '50%',
                      }}
                      animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                      transition={{
                        duration: 20 + i * 5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <motion.div
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          background: i % 2 === 0 ? 'var(--matcha-500)' : 'var(--terra-400)',
                          top: '0',
                          left: '50%',
                          marginLeft: '-6px',
                          marginTop: '-6px',
                        }}
                        whileHover={{ scale: 1.5 }}
                      />
                    </motion.div>
                  ))}

                  {/* Floating labels with enhanced animation */}
                  <motion.div
                    className="absolute top-1/4 left-1/4 px-4 py-2 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--matcha-700)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {t.landing.cognitiveBiases}
                  </motion.div>
                  <motion.div
                    className="absolute top-1/3 right-1/4 px-4 py-2 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--terra-500)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    {t.landing.thoughtPatterns}
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1/3 left-1/3 px-4 py-2 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--matcha-600)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    {t.demo.analysisTitle}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Welcome Demo */}
      <WelcomeDemo />

      {/* How It Works - Enhanced cards */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
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
          </AnimatedSection>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                step: '01',
                title: t.landing.step1Title,
                description: t.landing.step1Desc,
                gradient: 'from-matcha-400/20 to-matcha-600/20',
              },
              {
                step: '02',
                title: t.landing.step2Title,
                description: t.landing.step2Desc,
                gradient: 'from-terra-300/20 to-terra-500/20',
              },
              {
                step: '03',
                title: t.landing.step3Title,
                description: t.landing.step3Desc,
                gradient: 'from-matcha-500/20 to-matcha-700/20',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="matcha-card p-8 relative overflow-hidden group cursor-pointer"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  border: '1px solid var(--border-soft)',
                }}
              >
                {/* Hover gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Large step number background */}
                <span
                  className="absolute -top-4 -right-4 text-8xl font-bold opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--matcha-600)',
                  }}
                >
                  {item.step}
                </span>

                {/* Step indicator */}
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative"
                  style={{
                    background: 'linear-gradient(135deg, var(--matcha-100) 0%, var(--matcha-200) 100%)',
                    color: 'var(--matcha-700)',
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span
                    className="text-lg font-semibold"
                    style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                  >
                    {item.step}
                  </span>
                </motion.div>

                <h3
                  className="text-xl mb-3 relative z-10"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.title}
                </h3>
                <p className="relative z-10" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo */}
      <InteractiveDemo />

      {/* Testimonial Section - Enhanced design */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <motion.div
              className="relative p-10 md:p-12 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--cream-100) 100%)',
                borderRadius: '32px',
                border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-xl)',
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative quote marks */}
              <motion.div
                className="absolute top-6 left-8 text-8xl opacity-[0.06] leading-none"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'var(--matcha-600)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 0.06, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                "
              </motion.div>

              {/* Decorative accent */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-20"
                style={{
                  background: 'radial-gradient(circle, var(--matcha-300) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)',
                }}
              />

              <div className="relative z-10">
                <blockquote
                  className="text-lg md:text-xl leading-relaxed mb-8"
                  style={{
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                  }}
                >
                  <motion.p
                    className="mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    Matcha is a really good idea.
                  </motion.p>
                  <motion.p
                    className="mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    I spent a long time thinking about visiting a psychologist, but I didn't feel comfortable sharing my real thoughts with a person. I was afraid of being judged; I also know that when I am talking to a professional, I am not truly myself—even when I try to act natural.
                  </motion.p>
                  <motion.p
                    className="mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    I also tried talking to ChatGPT so I could have a session where it could analyze my thoughts and tell me what is wrong with me. In the end, ChatGPT didn't give me the session I needed and didn't help me.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                  >
                    However, <span style={{ color: 'var(--matcha-600)', fontWeight: 600 }}>Matcha really applied the concept in my real-life situation.</span>
                  </motion.p>
                </blockquote>

                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--matcha-200) 0%, var(--matcha-400) 100%)',
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--matcha-800)' }}
                    >
                      IK
                    </span>
                  </div>
                  <div>
                    <p
                      className="font-semibold"
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
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section - Enhanced grid */}
      <section
        className="py-24 px-4"
        style={{ background: 'var(--cream-100)' }}
      >
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
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
          </AnimatedSection>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                title: t.landing.cognitiveBiases,
                description: t.landing.cognitiveBiasesDesc,
                color: 'var(--matcha-500)',
                bgGradient: 'from-matcha-100/50 to-transparent',
              },
              {
                title: t.landing.thoughtPatterns,
                description: t.landing.thoughtPatternsDesc,
                color: 'var(--terra-400)',
                bgGradient: 'from-terra-100/50 to-transparent',
              },
              {
                title: t.landing.emotionalBlockers,
                description: t.landing.emotionalBlockersDesc,
                color: 'var(--matcha-600)',
                bgGradient: 'from-matcha-100/50 to-transparent',
              },
              {
                title: t.landing.psychProfile,
                description: t.landing.psychProfileDesc,
                color: 'var(--terra-500)',
                bgGradient: 'from-terra-100/50 to-transparent',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, x: 4 }}
                className="group flex gap-6 p-6 rounded-2xl cursor-pointer transition-all duration-300"
                style={{
                  background: 'white',
                  border: '1px solid var(--border-soft)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <motion.div
                  className="w-1.5 rounded-full flex-shrink-0"
                  style={{ background: feature.color }}
                  whileHover={{ scaleY: 1.1 }}
                />
                <div>
                  <h3
                    className="text-xl mb-2 group-hover:translate-x-1 transition-transform duration-300"
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview - Enhanced */}
      <section
        className="py-24 px-4"
        style={{ background: 'var(--cream-100)' }}
      >
        <AnimatedSection className="max-w-3xl mx-auto text-center">
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="matcha-btn matcha-btn-primary text-base px-8 py-4 inline-block"
              >
                {t.landing.createFreeAccount}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/pricing"
                className="matcha-btn matcha-btn-secondary text-base px-8 py-4 inline-block"
              >
                {t.landing.seePricing}
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>
      </section>

      {/* Social Proof Section - Enhanced */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl mb-4"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)',
              }}
            >
              {t.landing.followUsTitle}
            </h2>
          </AnimatedSection>

          {/* Social Media Posts Grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              'your mind is not broken it is patterned.png',
              'you dont overthing you protect.png',
              'you dont lack discipline you lack safety.png',
              'your mind isnt chaotic.png',
            ].map((filename, i) => (
              <motion.a
                key={i}
                href="https://www.facebook.com/profile.php?id=61585651651139"
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square rounded-2xl overflow-hidden group"
                style={{
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-soft)',
                }}
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={`/social medea  posts/${filename}`}
                  alt={`Matcha social media post ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </motion.a>
            ))}
          </motion.div>

          {/* Social Media Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <motion.a
              href="https://www.facebook.com/profile.php?id=61585651651139"
              target="_blank"
              rel="noopener noreferrer"
              className="matcha-btn matcha-btn-secondary text-base px-8 py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {t.landing.followFacebook}
            </motion.a>
            <motion.a
              href="https://www.instagram.com/matcha.mind"
              target="_blank"
              rel="noopener noreferrer"
              className="matcha-btn matcha-btn-secondary text-base px-8 py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {t.landing.followInstagram}
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <motion.div
              className="rounded-[32px] p-12 md:p-16 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--matcha-500) 0%, var(--matcha-700) 100%)',
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated decorative elements */}
              <motion.div
                className="absolute top-0 right-0 w-80 h-80 opacity-10"
                style={{
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-64 h-64 opacity-10"
                style={{
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
                animate={{
                  x: [0, -15, 0],
                  y: [0, 15, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />

              <motion.h2
                className="text-3xl md:text-4xl mb-4 relative z-10"
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  color: 'white',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {t.landing.readyToUnderstand}
              </motion.h2>
              <motion.p
                className="mb-8 max-w-xl mx-auto relative z-10"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                {t.landing.joinThousands}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-xl transition-all relative z-10"
                  style={{
                    background: 'white',
                    color: 'var(--matcha-700)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {t.landing.startNow}
                </Link>
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer
        className="py-12 px-4 border-t"
        style={{
          background: 'var(--cream-50)',
          borderColor: 'var(--border-soft)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
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
            </motion.div>
            <motion.div
              className="flex gap-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {[
                { href: '/pricing', label: t.header.pricing },
                { href: '/login', label: t.header.login },
                { href: '/signup', label: t.common.signup },
              ].map((link, i) => (
                <motion.div key={i} whileHover={{ y: -2 }}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-[var(--matcha-600)] transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
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
    </div>
  );
}
