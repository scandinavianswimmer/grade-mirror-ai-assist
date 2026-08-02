import { isScoreWithheld } from './teacherFeedbackExport';

export interface HistoryScoreInput {
  overallScore: number | null;
  overallMax: number | null;
  flags: unknown;
}

export interface HistoryScorePresentation {
  label: string;
  withheld: boolean;
}

export const presentHistoryScore = ({
  overallScore,
  overallMax,
  flags,
}: HistoryScoreInput): HistoryScorePresentation => {
  if (isScoreWithheld(flags)) {
    return { label: 'Score withheld', withheld: true };
  }

  if (overallScore == null) {
    return { label: '—', withheld: false };
  }

  const maximum = overallMax ? `/${overallMax}` : '';
  return { label: `${overallScore}${maximum}`, withheld: false };
};
