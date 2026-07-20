export function Card({
  children,
  className = "",
  ...rest
}: React.ComponentPropsWithoutRef<"div"> & { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-graphite-700 bg-graphite-900/80 p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
