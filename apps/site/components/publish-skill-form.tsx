"use client";

import { Check, ChevronLeft, ChevronRight, FileText, Package, Tags } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormField } from "@/components/form-field";

const steps = [
  { id: "package", label: "Package", icon: Package },
  { id: "metadata", label: "Metadata", icon: Tags },
  { id: "review", label: "Review", icon: FileText },
] as const;

type StepId = (typeof steps)[number]["id"];

type PublishDraft = {
  namespace: string;
  name: string;
  version: string;
  visibility: "public" | "private";
  description: string;
  license: string;
  keywords: string;
  instructions: string;
};

const initialDraft: PublishDraft = {
  namespace: "",
  name: "",
  version: "1.0.0",
  visibility: "public",
  description: "",
  license: "MIT",
  keywords: "",
  instructions: "",
};

export function PublishSkillForm({ namespaces }: { namespaces: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("package");
  const [draft, setDraft] = useState<PublishDraft>({
    ...initialDraft,
    namespace: namespaces[0] ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stepIndex = steps.findIndex((item) => item.id === step);
  const keywords = useMemo(
    () =>
      draft.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    [draft.keywords],
  );

  function update<K extends keyof PublishDraft>(key: K, value: PublishDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(currentStep: StepId) {
    const nextErrors: Record<string, string> = {};
    if (currentStep === "package") {
      if (!draft.namespace) nextErrors.namespace = "Choose a publishing namespace.";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.name)) {
        nextErrors.name = "Use lowercase letters, numbers, and single hyphens.";
      }
      if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(draft.version)) {
        nextErrors.version = "Use a version such as 1.0.0 or 1.2.0-beta.1.";
      }
    }
    if (currentStep === "metadata") {
      if (draft.description.trim().length < 20) {
        nextErrors.description = "Describe the outcome in at least 20 characters.";
      }
      if (draft.instructions.trim().length < 40) {
        nextErrors.instructions = "Add enough detail for another agent to follow the workflow.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validate(step)) return;
    const next = steps[stepIndex + 1];
    if (next) setStep(next.id);
  }

  function previousStep() {
    const previous = steps[stepIndex - 1];
    if (previous) setStep(previous.id);
  }

  async function publish() {
    if (!validate("metadata")) {
      setStep("metadata");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/account/skills/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json()) as { id?: string; error?: string };
    setBusy(false);
    if (!response.ok || !data.id) {
      setError(data.error ?? "Unable to publish skill");
      return;
    }
    router.push(`/skills/${data.id}`);
    router.refresh();
  }

  return (
    <section className="publisher-shell" aria-labelledby="publisher-title">
      <aside className="publisher-sidebar">
        <span className="kicker">Browser publisher</span>
        <h2 id="publisher-title">Publish a focused skill</h2>
        <p>
          Create a single-file skill here. Use the CLI for packages with references,
          scripts, or assets.
        </p>
        <ol className="publisher-steps" aria-label="Publishing progress">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = item.id === step;
            const complete = index < stepIndex;
            return (
              <li key={item.id} className={active ? "active" : complete ? "complete" : ""}>
                <span>{complete ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
                <div>
                  <small>Step {index + 1}</small>
                  <strong>{item.label}</strong>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="publisher-draft-summary">
          <span>Draft</span>
          <strong>{draft.namespace || "namespace"}/{draft.name || "skill-name"}</strong>
          <code>v{draft.version}</code>
        </div>
      </aside>

      <div className="publisher-content">
        {step === "package" && (
          <div className="publisher-step-panel">
            <header>
              <span>01</span>
              <div>
                <h3>Package identity</h3>
                <p>Choose where this skill lives and how releases are identified.</p>
              </div>
            </header>
            <div className="publisher-form-grid">
              <FormField id="publish-namespace" label="Namespace" hint="Personal or organisation scope." error={errors.namespace} required>
                <select id="publish-namespace" value={draft.namespace} onChange={(event) => update("namespace", event.target.value)}>
                  {namespaces.map((namespace) => <option key={namespace}>{namespace}</option>)}
                </select>
              </FormField>
              <FormField id="publish-name" label="Skill name" hint="Lowercase, URL-safe package name." error={errors.name} required>
                <input id="publish-name" value={draft.name} onChange={(event) => update("name", event.target.value.toLowerCase())} placeholder="nextjs-review" autoComplete="off" />
              </FormField>
              <FormField id="publish-version" label="Version" hint="Semantic version for compatibility and lockfiles." error={errors.version} required>
                <input id="publish-version" value={draft.version} onChange={(event) => update("version", event.target.value)} inputMode="decimal" autoComplete="off" />
              </FormField>
              <FormField id="publish-visibility" label="Visibility" hint="Private packages require an authorised account." required>
                <select id="publish-visibility" value={draft.visibility} onChange={(event) => update("visibility", event.target.value as PublishDraft["visibility"])}>
                  <option value="public">Public — visible to everyone</option>
                  <option value="private">Private — restricted access</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {step === "metadata" && (
          <div className="publisher-step-panel">
            <header>
              <span>02</span>
              <div>
                <h3>Describe the workflow</h3>
                <p>Help people discover the skill and understand exactly what it does.</p>
              </div>
            </header>
            <div className="publisher-form-grid">
              <FormField id="publish-description" label="Description" hint={`${draft.description.length}/1024 characters`} error={errors.description} required>
                <textarea id="publish-description" value={draft.description} onChange={(event) => update("description", event.target.value)} maxLength={1024} rows={4} placeholder="Review Next.js changes for server and client boundary mistakes." />
              </FormField>
              <div className="publisher-two-column">
                <FormField id="publish-license" label="License" hint="SPDX identifier, for example MIT.">
                  <input id="publish-license" value={draft.license} onChange={(event) => update("license", event.target.value)} placeholder="MIT" autoComplete="off" />
                </FormField>
                <FormField id="publish-keywords" label="Keywords" hint="Comma-separated discovery terms.">
                  <input id="publish-keywords" value={draft.keywords} onChange={(event) => update("keywords", event.target.value)} placeholder="nextjs, review, server components" autoComplete="off" />
                </FormField>
              </div>
              <FormField id="publish-instructions" label="Skill instructions" hint="Write the exact workflow another AI agent should follow." error={errors.instructions} required>
                <textarea id="publish-instructions" value={draft.instructions} onChange={(event) => update("instructions", event.target.value)} rows={14} placeholder="# Review workflow\n\nInspect the changed route, verify data boundaries, and report concrete findings…" />
              </FormField>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="publisher-step-panel publisher-review">
            <header>
              <span>03</span>
              <div>
                <h3>Review and publish</h3>
                <p>Confirm the package identity and immutable release content.</p>
              </div>
            </header>
            <dl className="publisher-review-grid">
              <div><dt>Package</dt><dd>{draft.namespace}/{draft.name}</dd></div>
              <div><dt>Version</dt><dd>{draft.version}</dd></div>
              <div><dt>Visibility</dt><dd>{draft.visibility}</dd></div>
              <div><dt>License</dt><dd>{draft.license || "Not specified"}</dd></div>
              <div className="wide"><dt>Description</dt><dd>{draft.description}</dd></div>
              <div className="wide"><dt>Keywords</dt><dd>{keywords.length > 0 ? keywords.join(" · ") : "None"}</dd></div>
            </dl>
            <div className="publisher-immutability-note">
              <strong>Immutable release</strong>
              <p>After publication, this version cannot be replaced. Publish a new version for every change.</p>
            </div>
          </div>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}

        <footer className="publisher-actions">
          <button type="button" className="button button-secondary" onClick={previousStep} disabled={stepIndex === 0 || busy}>
            <ChevronLeft aria-hidden="true" /> Back
          </button>
          <span>Step {stepIndex + 1} of {steps.length}</span>
          {step === "review" ? (
            <button type="button" className="button" onClick={() => void publish()} disabled={busy}>
              {busy ? "Publishing Release…" : "Publish Immutable Release"}
            </button>
          ) : (
            <button type="button" className="button" onClick={nextStep}>
              Continue <ChevronRight aria-hidden="true" />
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
