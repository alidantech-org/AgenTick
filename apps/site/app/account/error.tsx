"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <section className="account-panel account-error-state" role="alert">
      <AlertTriangle size={24} />
      <div>
        <h2>We could not load your account</h2>
        <p>
          Your data is safe. Retry the request, and check the database
          connection if the problem continues.
        </p>
      </div>
      <button className="button button-secondary" onClick={reset} type="button">
        <RotateCcw size={16} />
        Retry
      </button>
    </section>
  );
}
