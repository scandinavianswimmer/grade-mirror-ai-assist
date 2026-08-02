export const NOT_CAPTURED_FOR_RELEASE = 'Not captured for this release';

export type ReleaseProofState = 'recorded' | 'not_captured';

export interface ReleaseProofItem {
  id:
    | 'release_sha'
    | 'deployed_version'
    | 'gemini_model'
    | 'google_cloud_service'
    | 'captured_at_utc'
    | 'trace_id'
    | 'agent_states'
    | 'persisted_result'
    | 'reload_proof';
  label: string;
  value: string;
  state: ReleaseProofState;
  description: string;
}

export interface ReleaseProofGroup {
  id: 'build' | 'operation' | 'teacher_control';
  label: string;
  items: ReleaseProofItem[];
}

export interface ReleaseProof {
  groups: ReleaseProofGroup[];
  recordedCount: number;
  totalCount: number;
}

export type ReleaseProofEnvironment = Record<string, string | boolean | undefined>;

const PLACEHOLDER_VALUE = /^(?:unknown|pending|todo|tbd|n\/a|none|placeholder|sample|demo|not captured(?: for this release)?)$/i;
const TEMPLATE_TOKEN = /^(?:\[[A-Z0-9][A-Z0-9_ -]*\]|\$\{[^}]+\}|<[^>]+>)$/;

const cleanEvidenceValue = (value: string | boolean | undefined): string | null => {
  if (typeof value === 'boolean') return value ? 'Recorded' : null;
  if (typeof value !== 'string') return null;

  const cleaned = value.trim();
  if (!cleaned || PLACEHOLDER_VALUE.test(cleaned) || TEMPLATE_TOKEN.test(cleaned)) return null;
  return cleaned;
};

const firstRecordedValue = (
  environment: ReleaseProofEnvironment,
  keys: readonly string[],
): string | null => {
  for (const key of keys) {
    const value = cleanEvidenceValue(environment[key]);
    if (value) return value;
  }
  return null;
};

const proofItem = (
  environment: ReleaseProofEnvironment,
  config: Omit<ReleaseProofItem, 'value' | 'state'> & { keys: readonly string[] },
): ReleaseProofItem => {
  const value = firstRecordedValue(environment, config.keys);

  return {
    id: config.id,
    label: config.label,
    description: config.description,
    value: value ?? NOT_CAPTURED_FOR_RELEASE,
    state: value ? 'recorded' : 'not_captured',
  };
};

/**
 * Builds the public, allow-listed release proof model.
 *
 * Only values deliberately exposed with the keys below can reach Judge Mode. Never put secrets,
 * customer details, student work, or private logs in these variables: Vite embeds them in the
 * browser bundle.
 */
export const buildReleaseProof = (
  environment: ReleaseProofEnvironment = import.meta.env as ReleaseProofEnvironment,
): ReleaseProof => {
  const groups: ReleaseProofGroup[] = [
    {
      id: 'build',
      label: 'Build identity',
      items: [
        proofItem(environment, {
          id: 'release_sha',
          label: 'Release SHA',
          keys: ['VITE_RELEASE_SHA', 'VITE_GIT_COMMIT_SHA'],
          description: 'Commit used for the deployed release.',
        }),
        proofItem(environment, {
          id: 'deployed_version',
          label: 'Deployed version',
          keys: ['VITE_DEPLOYED_VERSION', 'VITE_CLOUDFLARE_WORKER_VERSION'],
          description: 'Public deployment or Worker version tied to that commit.',
        }),
      ],
    },
    {
      id: 'operation',
      label: 'Production operation',
      items: [
        proofItem(environment, {
          id: 'gemini_model',
          label: 'Gemini model',
          keys: ['VITE_PROOF_GEMINI_MODEL'],
          description: 'Model observed in the exact production evidence window.',
        }),
        proofItem(environment, {
          id: 'google_cloud_service',
          label: 'Google Cloud service',
          keys: ['VITE_PROOF_GOOGLE_CLOUD_SERVICE'],
          description: 'Google Cloud product observed serving the deployed path.',
        }),
        proofItem(environment, {
          id: 'captured_at_utc',
          label: 'Captured at (UTC)',
          keys: ['VITE_PROOF_CAPTURED_AT_UTC'],
          description: 'UTC timestamp for the production proof capture.',
        }),
        proofItem(environment, {
          id: 'trace_id',
          label: 'Trace or job ID',
          keys: ['VITE_PROOF_TRACE_ID'],
          description: 'Privacy-safe identifier that can be reconciled with private logs.',
        }),
        proofItem(environment, {
          id: 'agent_states',
          label: 'Agent states',
          keys: ['VITE_PROOF_AGENT_STATES'],
          description: 'Observed states for the release run, including failures or skips.',
        }),
      ],
    },
    {
      id: 'teacher_control',
      label: 'Teacher control',
      items: [
        proofItem(environment, {
          id: 'persisted_result',
          label: 'Persisted result',
          keys: ['VITE_PROOF_PERSISTED_RESULT'],
          description: 'Evidence that the teacher decision persisted on the deployed service.',
        }),
        proofItem(environment, {
          id: 'reload_proof',
          label: 'Reload proof',
          keys: ['VITE_PROOF_RELOAD_PROOF'],
          description: 'Evidence that the saved decision remained after a fresh reload.',
        }),
      ],
    },
  ];

  const items = groups.flatMap((group) => group.items);

  return {
    groups,
    recordedCount: items.filter((item) => item.state === 'recorded').length,
    totalCount: items.length,
  };
};
