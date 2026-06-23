"use client";


export default function CompanyHeroSection() {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl mb-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_55%)]" />

            <div className="relative z-10 px-8 py-20 text-center max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    Zatrudnij najlepszych <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">studentów</span> <br />
                    do swojej firmy
                </h1>

                <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Wybierz model współpracy, który najlepiej pasuje do Twoich potrzeb.
                    Od pojedynczych zleceń po długofalowe staże.
                </p>
            </div>
        </section>
    );
}
