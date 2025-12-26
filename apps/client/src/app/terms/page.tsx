'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="border-b border-warm-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="font-serif text-2xl text-matcha-600">
            Matcha
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-serif text-4xl text-warm-900 mb-8">Terms of Service</h1>

        <div className="prose prose-warm max-w-none space-y-6 text-warm-700">
          <p className="text-sm text-warm-500">Last updated: December 2024</p>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Matcha ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">2. Description of Service</h2>
            <p>
              Matcha is an AI-powered companion designed for personal wellness, self-reflection, and
              relaxation. The Service provides conversational support, guided breathing exercises, and
              tools for self-discovery and emotional exploration.
            </p>
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-semibold text-red-800 mb-2">Important Medical Disclaimer:</p>
              <ul className="list-disc pl-6 space-y-2 text-red-700">
                <li>Matcha is <strong>NOT</strong> a medical device, therapy, or healthcare service</li>
                <li>Matcha does <strong>NOT</strong> diagnose, treat, cure, or prevent any disease or mental health condition</li>
                <li>Matcha is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment</li>
                <li>The AI companion is for <strong>entertainment, self-reflection, and personal growth purposes only</strong></li>
                <li>Always seek the advice of a qualified healthcare provider with any questions regarding a medical or mental health condition</li>
              </ul>
            </div>
            <p className="mt-4 p-4 bg-warm-100 rounded-lg border border-warm-200">
              <strong>Crisis Resources:</strong> If you are experiencing a mental health crisis or having
              thoughts of self-harm, please contact emergency services (911), the National Suicide Prevention
              Lifeline (988), or go to your nearest emergency room immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service to harm or harass others</li>
              <li>Reverse engineer or attempt to extract the source code</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">5. Subscription and Payments</h2>
            <p>
              Matcha offers both free and paid subscription plans. Paid subscriptions are billed in advance
              on a monthly or yearly basis. You may cancel your subscription at any time, and cancellation
              will take effect at the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Matcha and are
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Matcha shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
              directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material
              changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@matcha.ai" className="text-matcha-600 hover:underline">
                support@matcha.ai
              </a>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-warm-200">
          <Link href="/" className="text-matcha-600 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
