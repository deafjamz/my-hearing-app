import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

export function TermsOfService() {
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
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileText className="text-teal-600 dark:text-teal-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
            <p className="text-sm text-slate-500">Last updated: January 24, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Agreement to Terms</h2>
            <p className="text-slate-600 dark:text-slate-400">
              By accessing or using SoundSteps ("the app"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Description of Service</h2>
            <p className="text-slate-600 dark:text-slate-400">
              SoundSteps is a hearing training application that provides listening exercises and practice
              activities. The app is designed as a <strong>wellness and training tool</strong> to help users
              practice listening skills at their own pace.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                <strong>Important Disclaimer:</strong> SoundSteps is NOT a medical device. It does not
                diagnose, treat, cure, or prevent any disease or medical condition. The app is not a
                substitute for professional medical advice, diagnosis, or treatment. Always seek the
                advice of a qualified healthcare provider with any questions you may have regarding
                a medical condition.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">User Accounts</h2>
            <p className="text-slate-600 dark:text-slate-400">
              You may use SoundSteps as a guest or create an account. If you create an account:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mt-2">
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You agree to provide accurate information</li>
              <li>You are responsible for all activity under your account</li>
              <li>You must be at least 13 years old to create an account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Acceptable Use</h2>
            <p className="text-slate-600 dark:text-slate-400">You agree not to:</p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mt-2">
              <li>Use the app for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the app's functionality</li>
              <li>Copy, modify, or distribute our content without permission</li>
              <li>Use automated systems to access the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Intellectual Property</h2>
            <p className="text-slate-600 dark:text-slate-400">
              All content in SoundSteps, including but not limited to audio files, text, graphics,
              and software, is owned by us or our licensors and is protected by copyright and other
              intellectual property laws. You may not reproduce, distribute, or create derivative
              works without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Subscription & Payments</h2>
            <p className="text-slate-600 dark:text-slate-400">
              SoundSteps offers both free and premium subscription tiers. If you purchase a subscription:
            </p>
            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mt-2">
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>You may cancel at any time through your account settings</li>
              <li>Refunds are handled according to the app store's refund policy</li>
              <li>We may change pricing with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Disclaimer of Warranties</h2>
            <p className="text-slate-600 dark:text-slate-400">
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              YOUR USE OF THE APP IS AT YOUR OWN RISK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Limitation of Liability</h2>
            <p className="text-slate-600 dark:text-slate-400">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF
              THE APP. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP
              IN THE PAST 12 MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Termination</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may terminate or suspend your account at any time for violation of these terms.
              You may delete your account at any time through the app settings. Upon termination,
              your right to use the app will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Changes to Terms</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We may modify these Terms of Service at any time. We will notify you of material
              changes by posting a notice in the app. Your continued use of the app after changes
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Governing Law</h2>
            <p className="text-slate-600 dark:text-slate-400">
              These terms shall be governed by the laws of the State of Wyoming, without regard
              to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-400">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              <strong>Email:</strong> support@soundsteps.app
            </p>
          </section>

          <section className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              By using SoundSteps, you acknowledge that you have read, understood, and agree
              to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
