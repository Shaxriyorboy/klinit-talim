export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8" aria-busy="true">
      <div className="h-3 w-40 rounded bg-line" />
      <div className="mt-5 h-8 w-3/4 rounded bg-line" />
      <div className="mt-3 h-4 w-1/2 rounded bg-line" />
      <div className="mt-8 aspect-video w-full rounded-md bg-line/70" />
    </div>
  );
}
