import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`form-field ${error ? "form-field-error" : ""}`}>
      <div className="form-field-label-row">
        <label htmlFor={id}>{label}</label>
        {!required && <span>Optional</span>}
      </div>
      {hint && (
        <p className="form-field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="form-field-error-message" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="form-section">
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      <div className="form-section-content">{children}</div>
    </section>
  );
}
