export default function OrdersLoading() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
                {/* Header skeleton */}
                <div className="mb-8 sm:mb-10 animate-pulse">
                    <div className="h-9 w-48 bg-white/[0.04] rounded-lg" />
                    <div className="mt-2 h-4 w-32 bg-white/[0.04] rounded" />
                </div>

                {/* Order cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="glass p-5 animate-pulse">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-5 w-28 bg-white/[0.06] rounded" />
                                <div className="h-4 w-20 bg-white/[0.06] rounded" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3.5 w-24 bg-white/[0.04] rounded" />
                                <div className="h-3.5 w-12 bg-white/[0.04] rounded" />
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                <div className="h-5 w-16 bg-white/[0.06] rounded" />
                                <div className="h-3 w-20 bg-white/[0.04] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
