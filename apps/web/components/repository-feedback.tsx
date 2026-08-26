"use client";

import { useState } from "react";
import { getDecisionSessionId } from "@/components/decision-event";

export function RepositoryFeedback({
  repositoryId,
  repositoryFullName,
}: {
  repositoryId: string;
  repositoryFullName: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const submit = async (feedbackType: "helpful" | "not_helpful") => {
    if (status !== "idle") return;
    setStatus("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "repository",
          entityId: repositoryId,
          feedbackType,
          repositoryFullName,
          sessionId: getDecisionSessionId(),
        }),
      });
    } finally {
      setStatus("done");
    }
  };

  return (
    <section className="rail-card repository-feedback" aria-label="Repository feedback">
      <span>Was this useful?</span>
      {status === "done" ? (
        <p>Thanks — this helps improve the decision experience.</p>
      ) : (
        <div className="repository-feedback__actions">
          <button type="button" disabled={status === "sending"} onClick={() => void submit("helpful")} aria-label="Helpful">Yes</button>
          <button type="button" disabled={status === "sending"} onClick={() => void submit("not_helpful")} aria-label="Not helpful">Not yet</button>
        </div>
      )}
    </section>
  );
}
