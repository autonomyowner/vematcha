'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

export default function Header() {
  const { user } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <header
      className="w-full border-b"
      style={{
        background: 'rgba(254, 253, 251, 0.95)',
        backdropFilter: 'blur(8px)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-semibold select-none"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: 'var(--matcha-600)',
            }}
          >
            Matcha
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-[var(--matcha-600)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.header.home}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors hover:text-[var(--matcha-600)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.header.pricing}
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium transition-colors hover:text-[var(--matcha-600)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.dashboard}
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium transition-colors hover:text-[var(--matcha-600)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.chat || 'Chat'}
              </Link>
            </SignedIn>
          </nav>

          {/* Desktop Auth Buttons + Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-[var(--cream-200)]"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-soft)',
              }}
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>

            <SignedIn>
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.hello}, {user?.firstName || user?.username || 'User'}
              </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: {
                      width: '32px',
                      height: '32px',
                    },
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors hover:text-[var(--matcha-600)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t.header.login}
              </Link>
              <Link href="/signup" className="matcha-btn matcha-btn-primary text-sm px-5 py-2">
                {t.header.getStarted}
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-elevated)]"
            aria-label="Menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-[var(--text-primary)] transition-transform ${
                  mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-[var(--text-primary)] ${
                  mobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-[var(--text-primary)] transition-transform ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border-soft)]">
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm font-medium py-2"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.header.home}
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium py-2"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.header.pricing}
              </Link>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium py-2"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.header.dashboard}
                </Link>
                <Link
                  href="/chat"
                  className="text-sm font-medium py-2"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t.header.chat || 'Chat'}
                </Link>
              </SignedIn>

              {/* Mobile Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="text-sm font-medium py-2 text-left flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    background: 'var(--cream-200)',
                  }}
                >
                  {language === 'en' ? 'EN' : 'FR'}
                </span>
                {language === 'en' ? 'Switch to French' : 'Passer en anglais'}
              </button>

              <div className="pt-3 border-t border-[var(--border-soft)]">
                <SignedIn>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: {
                              width: '32px',
                              height: '32px',
                            },
                          },
                        }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user?.firstName || user?.username || 'User'}
                      </span>
                    </div>
                  </div>
                </SignedIn>

                <SignedOut>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      className="matcha-btn matcha-btn-secondary text-sm w-full text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t.header.login}
                    </Link>
                    <Link
                      href="/signup"
                      className="matcha-btn matcha-btn-primary text-sm w-full text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t.header.getStarted}
                    </Link>
                  </div>
                </SignedOut>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
