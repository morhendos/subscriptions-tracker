export function Section({ 
  title, 
  children,
  className 
}: { 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`paper-texture bg-paper rounded-lg p-4 sm:p-8 journal-shadow transition-colors duration-200 flex flex-col min-h-0 ${className}`}>
      <h2 className="journal-heading text-xl sm:text-2xl font-semibold text-ink mb-6 text-center transition-colors flex-shrink-0">
        {title}
      </h2>
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}