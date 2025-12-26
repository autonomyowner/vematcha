'use client';

import Link from 'next/link';

export default function DeleteAccountPage() {
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
        <h1 className="font-serif text-4xl text-warm-900 mb-8">Delete Your Account</h1>

        <div className="prose prose-warm max-w-none space-y-6 text-warm-700">
          <p>
            We're sorry to see you go. If you'd like to delete your Matcha account and all associated data,
            please follow the instructions below.
          </p>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">How to Delete Your Account</h2>

            <div className="bg-white p-6 rounded-lg border border-warm-200 space-y-4">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-matcha-100 text-matcha-700 rounded-full flex items-center justify-center font-semibold">1</span>
                <div>
                  <h3 className="font-semibold text-warm-900">Send a deletion request</h3>
                  <p className="text-warm-600 mt-1">
                    Email us at{' '}
                    <a href="mailto:privacy@vematcha.xyz?subject=Account%20Deletion%20Request" className="text-matcha-600 hover:underline">
                      privacy@vematcha.xyz
                    </a>
                    {' '}with the subject line "Account Deletion Request"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-matcha-100 text-matcha-700 rounded-full flex items-center justify-center font-semibold">2</span>
                <div>
                  <h3 className="font-semibold text-warm-900">Include your account email</h3>
                  <p className="text-warm-600 mt-1">
                    In your email, include the email address associated with your Matcha account so we can locate your data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-matcha-100 text-matcha-700 rounded-full flex items-center justify-center font-semibold">3</span>
                <div>
                  <h3 className="font-semibold text-warm-900">Receive confirmation</h3>
                  <p className="text-warm-600 mt-1">
                    We will process your request within 7 business days and send you a confirmation email once your account and data have been deleted.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">What Data Will Be Deleted</h2>
            <p>When you request account deletion, the following data will be permanently removed:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Your account information (email, name, profile)</li>
              <li>All conversation history and chat messages</li>
              <li>Mood tracking data and journal entries</li>
              <li>Session history and progress data</li>
              <li>Any stored preferences and settings</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">Data Retention</h2>
            <p>
              After your deletion request is processed:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>All personal data is deleted immediately from our active systems</li>
              <li>Backup copies are purged within 30 days</li>
              <li>Anonymized, aggregated analytics data may be retained (cannot be linked back to you)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-warm-900 mt-8 mb-4">Alternative: Delete Conversation Data Only</h2>
            <p>
              If you want to keep your account but delete your conversation history, you can request partial data deletion
              by emailing{' '}
              <a href="mailto:privacy@vematcha.xyz?subject=Conversation%20Data%20Deletion%20Request" className="text-matcha-600 hover:underline">
                privacy@vematcha.xyz
              </a>
              {' '}with the subject "Conversation Data Deletion Request".
            </p>
          </section>

          <section className="mt-8 p-4 bg-warm-100 rounded-lg border border-warm-200">
            <h3 className="font-semibold text-warm-900 mb-2">Need Help?</h3>
            <p>
              If you have any questions about the deletion process or your data, please contact us at{' '}
              <a href="mailto:privacy@vematcha.xyz" className="text-matcha-600 hover:underline">
                privacy@vematcha.xyz
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
