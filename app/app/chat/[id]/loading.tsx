export default function ChatLoading() {
  return (
    <div className="mx-auto flex h-[70vh] w-full max-w-[1920px] animate-pulse gap-4 p-4">
      <div className="flex-1 rounded-[2rem] border border-slate-100 bg-white p-6">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="mt-10 space-y-5">
          <div className="h-16 w-2/3 rounded-2xl bg-slate-100" />
          <div className="ml-auto h-16 w-1/2 rounded-2xl bg-indigo-100" />
          <div className="h-16 w-3/5 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="hidden w-80 rounded-[2rem] bg-slate-100 lg:block" />
    </div>
  );
}
