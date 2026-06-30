export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-[2000px] animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-12">
      <div className="h-10 w-64 rounded-2xl bg-slate-200" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-48 rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <div className="space-y-4 p-6">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
