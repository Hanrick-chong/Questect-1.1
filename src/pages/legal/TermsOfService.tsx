import React from 'react';
import LegalLayout from '../../components/LegalLayout';
import { APP_NAME } from '@/src/lib/constants';

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="26th March 2026">
      <section className="space-y-6">
        <div className="bg-cyan-400/5 border-l-4 border-cyan-400 p-6 rounded-r-xl mb-8">
          <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl mb-3">1. About {APP_NAME}</h2>
          <p className="text-slate-200 font-medium">
            {APP_NAME} is an AI-powered educational assistance platform designed to streamline the grading process for educators. 
            Our services include Optical Character Recognition (OCR) for digitizing handwritten student work, 
            automated multi-student segmentation, and AI-driven feedback generation based on user-provided marking schemes.
          </p>
        </div>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">2. Acceptance of Terms</h2>
        <p>
          By accessing or using {APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, 
          do not use our services.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">3. User Responsibilities</h2>
        <p>
          As an educator or institutional leader, you are solely responsible for the legality and accuracy of the content you upload to {APP_NAME}. 
          This includes ensuring you have the necessary permissions and consents to process student data and educational materials.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">4. AI-Assisted Grading Disclaimer</h2>
        <p>
          {APP_NAME} provides AI-assisted grading suggestions. These are intended to support, not replace, professional academic judgment. 
          Final grading decisions remain the responsibility of the educator.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">5. Intellectual Property</h2>
        <p>
          {APP_NAME} and its original content, features, and functionality are and will remain the exclusive property of {APP_NAME} and its licensors. 
          The content you upload remains your property, but you grant {APP_NAME} a license to process it for the purpose of providing our services.
        </p>

        <div className="bg-red-500/5 border-l-4 border-red-500/50 p-6 rounded-r-xl mt-12">
          <h2 className="text-red-400 font-black uppercase tracking-widest text-xl mb-3">15. Limitation of Liability</h2>
          <p className="text-slate-300 italic">
            In no event shall {APP_NAME}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
            incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; 
            (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; 
            and (iv) unauthorized access, use or alteration of your transmissions or content.
          </p>
        </div>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">16. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-cyan-400 font-black uppercase tracking-widest text-xl">17. Changes</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
          we will try to provide at least 30 days' notice prior to any new terms taking effect.
        </p>
      </section>
    </LegalLayout>
  );
}
