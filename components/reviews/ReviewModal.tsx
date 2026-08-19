"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { submitReview } from "@/lib/reviews";

type ReviewModalProps = {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function ReviewModal({
  orderId,
  reviewerId,
  revieweeId,
  revieweeName,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitReview({ orderId, reviewerId, revieweeId, rating, comment });
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "Couldn't submit your review. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold">Leave a review</h3>
          <button onClick={onClose} disabled={submitting}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 break-words">
          How was your exchange with <span className="font-semibold">{revieweeName}</span>?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  size={28}
                  className={
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional — say a bit about how it went"
            rows={3}
            className="w-full resize-none rounded-xl bg-gray-50 px-4 py-3 text-base ring-1 ring-black/10 outline-none placeholder:text-gray-400"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}