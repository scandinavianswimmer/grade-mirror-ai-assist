import { Link } from 'react-router-dom';
import LegalPreviewLayout, {
  LegalSection,
  type LegalPageSection,
} from '@/components/public/LegalPreviewLayout';

const sections: LegalPageSection[] = [
  { id: 'status', title: 'Status of this preview' },
  { id: 'service', title: 'What aiTA provides' },
  { id: 'accounts', title: 'Accounts and authorized use' },
  { id: 'teacher-review', title: 'Teacher review and AI limits' },
  { id: 'content', title: 'Your content and permissions' },
  { id: 'acceptable-use', title: 'Acceptable use' },
  { id: 'plans', title: 'Plans and billing' },
  { id: 'availability', title: 'Preview availability' },
  { id: 'ending-use', title: 'Ending use and data' },
  { id: 'legal-details', title: 'Legal details still needed' },
];

const Terms = () => (
  <LegalPreviewLayout
    currentPath="/terms"
    eyebrow="Terms overview"
    title="Clear expectations for using aiTA"
    summary="These preview terms describe the working rules for a teacher-controlled grading assistant. They are deliberately candid about the product's limits and the legal details that must be completed before launch."
    sections={sections}
  >
    <LegalSection id="status" title="Status of this preview">
      <p>
        These are launch-preview terms, not a final contract. They help reviewers understand the intended product relationship while counsel completes the legal entity, effective date, contact channel, governing law, warranties, liability terms, and any institution-specific agreement.
      </p>
      <p>
        The production signup and purchase flows should point to a finalized version and record acceptance only after that version is approved and published.
      </p>
    </LegalSection>

    <LegalSection id="service" title="What aiTA provides">
      <p>
        aiTA is a teacher-facing workspace that can organize assignments and rubrics, extract text from uploaded work, draft annotations and feedback, propose grades, learn from approved examples, and export results for teacher use.
      </p>
      <p>
        Features may differ by plan or deployment. Any trial, school integration, automated workflow, or beta feature should be described where it is offered, including important limits and whether teacher approval is required.
      </p>
    </LegalSection>

    <LegalSection id="accounts" title="Accounts and authorized use">
      <p>
        Users should provide accurate account information, protect their credentials, and use aiTA only for work they are authorized to perform. A teacher using student material is responsible for confirming that their school or institution permits the chosen workflow.
      </p>
      <p>
        The final terms must specify who may create an account, any minimum age, whether institution administrators can manage accounts, and what happens when a user&apos;s role or employment changes.
      </p>
    </LegalSection>

    <LegalSection id="teacher-review" title="Teacher review and AI limits">
      <p>
        aiTA produces machine-generated drafts. Outputs can be incomplete, inaccurate, inconsistent, or inappropriate for a particular student. Teachers remain responsible for reviewing the underlying work, applying professional judgment, correcting errors, and making final instructional and grading decisions.
      </p>
      <p>
        Human review is the default product approach. If a teacher deliberately enables an eligible automated-finalization feature, they remain responsible for its configuration, monitoring, and results. Low-confidence, off-topic, or integrity-flagged work is designed to return to the review queue, but no automated safeguard is perfect.
      </p>
      <p>
        aiTA should not be used as the sole basis for high-impact disciplinary, admissions, employment, legal, medical, or safety decisions.
      </p>
    </LegalSection>

    <LegalSection id="content" title="Your content and permissions">
      <p>
        The working launch position is that users keep their rights in the assignments, rubrics, student work, and feedback they provide. Users give aiTA only the permission needed to host, process, reproduce, and return that content for the services they request.
      </p>
      <p>
        Users must have the rights and authority needed to upload content. They should not submit material that violates another person&apos;s privacy, intellectual-property rights, confidentiality obligations, or school policies.
      </p>
      <p>
        aiTA&apos;s software, design, branding, and product materials remain separate from user content. The final terms must define both ownership positions precisely and explain what happens to optional, consented personalization examples after consent is changed.
      </p>
    </LegalSection>

    <LegalSection id="acceptable-use" title="Acceptable use">
      <p>Users should not use aiTA to:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        <li>break the law, violate school rules, or infringe another person&apos;s rights;</li>
        <li>upload malicious code or content intended to disrupt or manipulate the service;</li>
        <li>probe, bypass, or interfere with security, access controls, rate limits, or other users&apos; accounts;</li>
        <li>misrepresent AI-generated work as having been independently reviewed when it has not; or</li>
        <li>use the service to harass, discriminate against, exploit, or endanger a person.</li>
      </ul>
      <p>
        Reasonable testing and responsible security reporting should have a documented, monitored channel before launch; it should not be treated as abuse merely because it identifies a defect.
      </p>
    </LegalSection>

    <LegalSection id="plans" title="Plans and billing">
      <p>
        aiTA may offer free, trial, paid, or institution plans. The price, billing interval, included usage, trial conversion, taxes, and cancellation terms shown at checkout should control for that purchase. Payment processing is handled by the configured payment provider.
      </p>
      <p>
        A purchase flow should not open until pricing and the payment configuration are live, and a school sales option should not advertise an unmonitored address. Refund, renewal, and cancellation language still requires final business and legal approval.
      </p>
    </LegalSection>

    <LegalSection id="availability" title="Preview availability">
      <p>
        During launch preview, features may be changed, paused, rate-limited, or removed as the team fixes defects and validates the production system. Users should keep source copies of important classroom material and verify exported results before relying on them.
      </p>
      <p>
        The final terms must set realistic commitments for support, uptime, maintenance, data recovery, and service changes. This preview makes no service-level promise.
      </p>
    </LegalSection>

    <LegalSection id="ending-use" title="Ending use and data">
      <p>
        Teachers can use in-product controls to export and delete user-owned workspace data. Those controls do not currently delete the authentication account itself, so the final launch process must provide a clear account-closure path and explain any remaining billing or records obligations.
      </p>
      <p>
        aiTA may need to restrict access when an account creates a security risk, seriously violates the final terms, or has an unpaid plan. Final terms should define notice, appeal where appropriate, and what users can retrieve after access ends.
      </p>
    </LegalSection>

    <LegalSection id="legal-details" title="Legal details still needed">
      <p>The following provisions are intentionally placeholders until qualified counsel and the launch owner approve them:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        <li>the contracting entity and monitored notice address;</li>
        <li>effective date, change-notice process, and acceptance record;</li>
        <li>warranty disclaimers and any service commitments;</li>
        <li>limits of liability and legally required exceptions;</li>
        <li>indemnity, dispute process, governing law, and venue; and</li>
        <li>institution, student-data, regional, or accessibility terms that apply to the launch audience.</li>
      </ul>
      <p>
        Personal information used with aiTA is also described in the <Link to="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">Privacy preview</Link>.
      </p>
    </LegalSection>
  </LegalPreviewLayout>
);

export default Terms;
