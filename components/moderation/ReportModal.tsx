"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ReportReason } from "@/lib/moderation";

const reasons: { value: ReportReason; label: string }[] = [
  { value: "scam_or_fraud", label: "Scam or fraud" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "prohibited_item", label: "Prohibited item" },
  { value: "counterfeit", label: "Counterfeit goods" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

type ReportModalProps = {
  title: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => Promise<void>;
};

export default function ReportModal({ title, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit(reason, details);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Couldn't submit report. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-gray-900">Report submitted</p>
            <p className="mt-1 text-sm text-gray-500">
              Thanks — our team will review this.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-teal px-6 py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}