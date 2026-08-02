import { Link } from 'react-router-dom';
import LegalPreviewLayout, {
  LegalSection,
  type LegalPageSection,
} from '@/components/public/LegalPreviewLayout';

const sections: LegalPageSection[] = [
  { id: 'scope', title: 'Scope and status' },
  { id: 'data', title: 'Data Mr Selby handles' },
  { id: 'uses', title: 'How data is used' },
  { id: 'ai-providers', title: 'AI and service providers' },
  { id: 'choices', title: 'Your controls and choices' },
  { id: 'retention', title: 'Retention and deletion' },
  { id: 'security', title: 'Security approach' },
  { id: 'schools', title: 'Student and school data' },
  { id: 'updates', title: 'Updates and questions' },
];

const Privacy = () => (
  <LegalPreviewLayout
    currentPath="/privacy"
    eyebrow="Privacy overview"
    title="Privacy, written for people"
    summary="Mr Selby works with sensitive classroom material. This launch preview explains what the product handles, why it is needed, and the controls teachers have—without presenting unfinished legal details as settled."
    sections={sections}
  >
    <LegalSection id="scope" title="Scope and status">
      <p>
        This overview covers the teacher-facing Mr Selby grading workspace and the data processed when an authorized user creates an account, prepares an assignment, uploads student work, reviews feedback, or manages a plan.
      </p>
      <p>
        It is an operational summary for launch review, not the final privacy policy. The final version will identify the responsible legal entity, effective date, privacy contact, applicable locations, and complete service-provider list.
      </p>
    </LegalSection>

    <LegalSection id="data" title="Data Mr Selby handles">
      <p>Depending on how a teacher uses the product, the service may store or process:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        <li><strong className="text-foreground">Account and profile data</strong>, such as authentication details and teacher profile settings.</li>
        <li><strong className="text-foreground">Assignment material</strong>, including instructions, rubrics, criteria, and related classroom context.</li>
        <li><strong className="text-foreground">Student submissions</strong>, including uploaded files, student names supplied by the teacher, and text extracted from those files.</li>
        <li><strong className="text-foreground">Grading records</strong>, including proposed grades, annotations, feedback, teacher edits, approvals, dismissals, and status history.</li>
        <li><strong className="text-foreground">Optional learning examples</strong> saved through consent-based controls to help personalize grading style.</li>
        <li><strong className="text-foreground">Privacy and product settings</strong>, such as retention choices, name-masking preferences, and training consent.</li>
        <li><strong className="text-foreground">Billing metadata</strong> needed to manage a paid plan. Payment-card details are handled by the configured payment provider rather than entered into the service&apos;s application database.</li>
        <li><strong className="text-foreground">Product analytics</strong> only when an analytics service is configured for the deployment.</li>
      </ul>
      <p>
        Teachers should avoid uploading information that is not needed for the grading task, especially health, financial, disciplinary, or other highly sensitive records.
      </p>
    </LegalSection>

    <LegalSection id="uses" title="How data is used">
      <p>Mr Selby uses the information above to provide and operate the grading workflow. That includes:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        <li>authenticating users and keeping work associated with the correct account;</li>
        <li>extracting submission text and producing rubric-aligned draft feedback and grades;</li>
        <li>letting teachers review, edit, approve, export, and manage grading records;</li>
        <li>remembering privacy, retention, and personalization choices;</li>
        <li>operating subscriptions and preventing misuse; and</li>
        <li>understanding product reliability and usage when analytics is enabled.</li>
      </ul>
      <p>
        Mr Selby is not designed to sell classroom content or use it for advertising. Final counsel review will convert that launch position into binding policy language.
      </p>
    </LegalSection>

    <LegalSection id="ai-providers" title="AI and service providers">
      <p>
        When a teacher asks the service to analyze or grade work, relevant assignment and submission content may be sent to the configured AI provider so it can produce a draft. The current product architecture uses Google Gemini for grading and feedback generation.
      </p>
      <p>
        Other providers may support hosting, authentication, database and file storage, document processing, billing, email delivery, monitoring, or optional analytics. The final policy will name the providers actually configured for launch, explain their roles, and link to the governing notices or agreements.
      </p>
      <p>
        Teacher edits or student content can become a saved personalization example only through the product&apos;s optional consent flow. Turning on personalization is separate from using the ordinary grading workflow.
      </p>
    </LegalSection>

    <LegalSection id="choices" title="Your controls and choices">
      <p>Authenticated teachers have in-product controls designed to support:</p>
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        <li>choosing a retention period for uploaded files and grading data;</li>
        <li>masking student names in lists and exports, while recognizing that this does not remove names written inside an essay;</li>
        <li>allowing or declining use of selected content for grading-style personalization;</li>
        <li>exporting account-linked classroom data in a portable file; and</li>
        <li>deleting uploaded content, grades, training examples, and other user-owned workspace data.</li>
      </ul>
      <p>
        Deleting workspace data does not currently delete the authentication account itself. The final launch process must explain how to close an account and how to submit a request when the in-product controls are unavailable.
      </p>
    </LegalSection>

    <LegalSection id="retention" title="Retention and deletion">
      <p>
        The service includes teacher-selectable retention settings for uploaded files and grading data. It also includes controls to remove unfinalized AI-generated content and to delete user-owned workspace data.
      </p>
      <p>
        The final policy must state the launch default, when each retention choice takes effect, how long backups or security records remain, and any narrow legal or operational exceptions. Until those details are confirmed, this page does not promise a specific deletion deadline.
      </p>
    </LegalSection>

    <LegalSection id="security" title="Security approach">
      <p>
        The product is designed around authenticated access, account-scoped data controls, encrypted network connections, and managed infrastructure. Access and operational logging may be used to protect accounts and investigate reliability or security events.
      </p>
      <p>
        No online service can promise absolute security. Before launch, the final policy and security documentation should describe the controls that were actually verified in the production environment and provide a monitored way to report a concern.
      </p>
    </LegalSection>

    <LegalSection id="schools" title="Student and school data">
      <p>
        Student work may contain personal information even when a student does not have a Mr Selby account. Teachers and institutions should use Mr Selby only when they have authority to provide that material and should follow their school or district&apos;s review, notice, consent, and records requirements.
      </p>
      <p>
        This preview does not claim certification or compliance with FERPA, COPPA, GDPR, or another specific law. The final launch decision should be based on the actual deployment, contracts, age model, institution requirements, and qualified legal review.
      </p>
    </LegalSection>

    <LegalSection id="updates" title="Updates and questions">
      <p>
        Material changes should be explained in an updated policy with a visible effective date and any notice required for affected users. The final privacy and support contact will appear at the top of this page once it is monitored and ready.
      </p>
      <p>
        For now, this preview is part of the product-readiness review. You can also read the companion <Link to="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">Terms preview</Link>.
      </p>
    </LegalSection>
  </LegalPreviewLayout>
);

export default Privacy;
