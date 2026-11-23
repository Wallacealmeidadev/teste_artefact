"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>Unable to load this page</h1>
      <p role="alert">Please try again.</p>
      <button className="button" onClick={reset}>Try again</button>
    </main>
  );
}
