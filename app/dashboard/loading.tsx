export default function DashboardLoading() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                {/* Header skeleton */}
                <div className="mb-8 sm:mb-10 animate-pulse">
                    <div className="h-9 w-64 bg-white/[0.04] rounded-lg" />
                    <div className="mt-2 h-4 w-48 bg-white/[0.04] rounded" />
                </div>

                {/* Stat cards skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass p-5 animate-pulse">
                            <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
                            <div className="h-8 w-16 bg-white/[0.06] rounded" />
                        </div>
                    ))}
                </div>

                {/* Orders skeleton */}
                <div className="glass p-6 animate-pulse">
                    <div className="h-5 w-32 bg-white/[0.06] rounded mb-4" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
