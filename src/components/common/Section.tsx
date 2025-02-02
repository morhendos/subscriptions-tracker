import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Section({ title, children, className = '', action }: SectionProps) {
  return (
    <div className={`rounded-lg border bg-paper p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}