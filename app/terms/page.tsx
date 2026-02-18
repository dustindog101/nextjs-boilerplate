"use client";
import React from 'react';
import { Footer } from '../components/ui';

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex-grow">

                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2 animate-fade-up">
                    Terms of Service
                </h1>
                <p className="text-sm text-zinc-500 mb-10 animate-fade-up delay-1">
                    Last updated: February 2026
                </p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 animate-fade-up delay-2">

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            By accessing and using ID Pirate, you accept and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use of our services immediately. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">2. Use of Service</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            All products sold through ID Pirate are intended strictly for novelty and entertainment purposes. You agree not to use our products for any unlawful purpose. We reserve the right to refuse service to anyone for any reason at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">3. Account Responsibilities</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must be at least 18 years old to use this service. You agree to provide accurate and complete information when placing an order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">4. Orders & Payments</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            All orders are subject to acceptance and availability. Prices are subject to change without notice. Payment must be received in full before production begins. We reserve the right to refuse or cancel any order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">5. Shipping & Delivery</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We make every effort to ship orders promptly. Shipping times are estimates and not guaranteed. We are not responsible for delays caused by carriers, customs, or events outside our control.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">6. Refunds</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Due to the custom nature of our products, all sales are final. We do not accept returns or issue refunds unless there is a verified production error on our part. Contact support within 7 days of delivery with photos if you believe there is an issue.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">7. Limitation of Liability</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            ID Pirate shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of our services. Our total liability shall not exceed the amount paid for the specific product in question.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">8. Contact</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            If you have questions about these terms, please reach out through our support channels.
                        </p>
                    </section>

                </div>
            </div>
            <Footer />
        </div>
    );
}
