"use client";
import React from 'react';
import { Footer } from '../components/ui';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex-grow">

                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2 animate-fade-up">
                    Privacy Policy
                </h1>
                <p className="text-sm text-zinc-500 mb-10 animate-fade-up delay-1">
                    Last updated: February 2026
                </p>

                <div className="prose prose-sm max-w-none space-y-8 animate-fade-up delay-2">

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Information We Collect</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We collect information you provide when creating an account, placing an order, or contacting support. This includes your name, email, shipping address, and any photos or details submitted for custom products. Payment information is processed securely by third-party providers and is never stored on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">2. How We Use Your Information</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We use your information to process and fulfill orders, communicate shipping updates, improve our services, and detect fraud. We may send promotional offers which you can opt out of at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Data Security</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We use encryption and industry-standard security practices to protect your data. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Sharing of Information</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We do not sell or rent your personal information. We may share data with trusted service providers (payment processors, shipping carriers) under confidentiality agreements, or when required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Cookies</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We use cookies to maintain your session and remember preferences. You can disable cookies in your browser settings, though this may affect site functionality. We do not use third-party advertising trackers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Your Rights</h2>
                        <p className="text-slate-500 leading-relaxed">
                            You may request access to, correction of, or deletion of your personal data at any time by contacting support. You can also opt out of promotional communications.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Changes to This Policy</h2>
                        <p className="text-slate-500 leading-relaxed">
                            We may update this policy from time to time. Changes will be posted on this page. Continued use of our services after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Contact</h2>
                        <p className="text-slate-500 leading-relaxed">
                            For any privacy-related questions or requests, please reach out through our support channels.
                        </p>
                    </section>

                </div>
            </div>
            <Footer />
        </div>
    );
}
