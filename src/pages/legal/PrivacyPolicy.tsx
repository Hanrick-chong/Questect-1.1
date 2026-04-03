import React from 'react';
import LegalLayout from '../../components/LegalLayout';
import { CONTACT_EMAIL, LEGAL_EMAIL, LEGAL_URLS, APP_NAME } from '@/src/lib/constants';

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="26th March 2026">
      <section className="space-y-6">
        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">1. Information Collection</h2>
        <p>
          {APP_NAME} collects information to provide better services to all our users. We collect information in the following ways:
        </p>

        <div className="bg-cyan-400/5 border-l-4 border-cyan-400 p-6 rounded-r-xl mb-8">
          <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl mb-3">1.B. Educational Content</h2>
          <p className="text-slate-200 font-medium">
            We collect and process educational materials you upload, including but not limited to: 
            Marking Schemes, Student Essays, Scanned Test Papers, and Rubrics. 
            This content is processed by our AI models to provide grading suggestions and feedback.
          </p>
        </div>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">2. Social Authentication</h2>
        <p>
          We offer the option to sign in using third-party services like Google and Facebook. 
          When you use these services, we receive information from them as permitted by their privacy policies and your settings 
          (such as your name, email address, and profile picture).
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">3. Use of Information</h2>
        <p>
          We use the information we collect to provide, maintain, protect and improve our services, 
          to develop new ones, and to protect {APP_NAME} and our users.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">4. Data Security</h2>
        <p>
          We work hard to protect {APP_NAME} and our users from unauthorized access to or unauthorized alteration, 
          disclosure or destruction of information we hold.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">5. Information Sharing</h2>
        <p>
          We do not share personal information with companies, organizations and individuals outside of {APP_NAME} 
          unless one of the following circumstances applies: With your consent, for external processing, or for legal reasons.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">6. Your Rights & Data Deletion</h2>
        <p>
          You have the right to access, update, or delete the information we have on you. 
          If you wish to request the deletion of your personal data collected via Facebook or Google login, 
          please follow the instructions in the section below.
        </p>

        <div className="bg-cyan-400/5 border-l-4 border-cyan-400 p-6 rounded-r-xl mb-8">
          <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl mb-3">Data Deletion Instructions</h2>
          <p className="text-slate-200 font-medium">
            To request the deletion of your {APP_NAME} account and all associated data, please send an email to 
            <span className="text-cyan-400 font-black ml-1">{CONTACT_EMAIL}</span> with the subject line "Data Deletion Request". 
            You may also visit <span className="text-cyan-400 underline">{LEGAL_URLS.PRIVACY}</span> for more details. 
            Our team will process your request and permanently remove your data from our servers within 30 days.
          </p>
        </div>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">7. Cookies</h2>
        <p>
          We use cookies and similar technologies to provide and support our services and each of the uses outlined 
          and described in this section of our policy.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">8. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at {LEGAL_EMAIL}.
        </p>
      </section>
    </LegalLayout>
  );
}
