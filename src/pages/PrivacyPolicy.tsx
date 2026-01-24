import { Link } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
        >
          <ChevronLeft size={20} />
          <span>Back to Settings</span>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Shield className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
            <p className="text-sm text-slate-500">Last updated: January 24, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Overview</h2>
            <p className="text-slate-600 dark:text-slate-400">
              SoundSteps ("we", "our", or "the app") is a hearing training application designed to help
              users practice listening skills. We are committed to protecting your privacy and being
              transparent about how we handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Information We Collect</h2>

            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mt-4 mb-2">Account Information</h3>
            <p className="text-slate-600 dark:text-slate-400">
              If you create an account, we collect your email address for authentication purposes.
              You may also use the app in guest mode without providing any personal information.
            </p>

            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mt-4 mb-2">Training Data</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We store your exercise responses and scores to track your progress and personalize
              difficulty levels. This data is associated with your account and is not shared with
              third parties.
            </p>

            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mt-4 mb-2">Device Information</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We may collect basic device information (device type, operating system) to ensure
              the app functions correctly on your device.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
              <li>To provide and improve the training exercises</li>
              <li>To track your progress and adjust difficulty</li>
              <li>To authenticate your account (if you create one)</li>
              <li>To respond to your support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Data Storage & Security</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your data is stored securely using Supabase, a trusted cloud infrastructure provider.
              We implement industry-standard security measures including encryption in transit and at rest.
              Access to user data is restricted and logged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Data Sharing</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We do not sell, rent, or share your personal information with third parties for marketing
              purposes. We may share anonymized, aggregated data for research purposes, but this data
              cannot be used to identify you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Your Rights</h2>
            <p className="text-slate-600 dark:text-slate-400">You have the right to:</p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your training history</li>
            </ul>
            <p className="text-slate-600 dark:text-slate-400 mt-3">
              To exercise these rights, contact us at support@soundsteps.app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Children's Privacy</h2>
            <p className="text-slate-600 dark:text-slate-400">
              SoundSteps is intended for users aged 13 and older. We do not knowingly collect
              information from children under 13. If you believe a child has provided us with
              personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Changes to This Policy</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting a notice in the app or sending you an email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              <strong>Email:</strong> support@soundsteps.app
            </p>
          </section>

          <section className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              <strong>Important:</strong> SoundSteps is a training and wellness application.
              It is not a medical device and should not be used to diagnose, treat, or manage
              any medical condition. Always consult with a qualified healthcare provider for
              medical advice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
