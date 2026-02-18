"use client";

import React, { useEffect } from 'react';
import { Spinner } from '../components/ui';

const RedirectPage = () => {
  useEffect(() => {
    window.location.href = "https://photos.app.goo.gl/fFC9LfZYvA4349Wc9";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-zinc-400">Redirecting…</p>
    </div>
  );
};

export default RedirectPage;
