import { SearchCheck } from 'lucide-react';

interface TeacherTestQuestionProps {
  number: number;
  title: string;
  inspection: string;
}

const TeacherTestQuestion = ({ number, title, inspection }: TeacherTestQuestionProps) => (
  <li className="grid gap-3 border-b border-border/80 py-5 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
    <span
      className="metric grid h-10 w-10 place-items-center rounded-md border border-primary/45 bg-primary/5 text-sm font-semibold text-primary"
      aria-hidden="true"
    >
      {String(number).padStart(2, '0')}
    </span>
    <div className="min-w-0">
      <h3 className="text-xl font-semibold leading-7 text-foreground">{title}</h3>
      <p className="mt-1.5 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
        <SearchCheck className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{inspection}</span>
      </p>
    </div>
  </li>
);

export default TeacherTestQuestion;
