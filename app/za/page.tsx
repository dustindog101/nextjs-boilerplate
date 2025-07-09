"use client";

import React, { useEffect } from 'react';

/**
 * A Next.js page component that automatically redirects the user to an external URL.
 *
 * This component uses the useEffect hook to trigger a client-side redirect
 * as soon as the page is loaded in the browser. It's a simple and effective
 * way to handle external redirects within a Next.js application.
 *
 * To use this, save this code as a file (e.g., `redirect.js`) in your `app`
 * directory. Navigating to `/redirect` in your app will then trigger the
 * redirect to the specified URL.
 */
const RedirectPage = () => {
  useEffect(() => {
    // The URL to redirect to.
    const targetUrl = "https://photos.app.goo.gl/fFC9LfZYvA4349Wc9";

    // Performs the client-side redirect.
    // We use window.location.href to navigate the browser to the new page.
    window.location.href = targetUrl;
  }, []); // The empty dependency array ensures this effect runs only once after the component mounts.

  // You can render a loading message or a spinner here.
  // This content will be briefly visible to the user before the redirect occurs.
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Redirecting...</p>
    </div>
  );
};

export default RedirectPage;
