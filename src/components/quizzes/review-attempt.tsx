"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { QuizReview, type ReviewItem } from "@/components/quizzes/take-quiz";

/**
 * Lets a student reopen the breakdown of an attempt they already submitted —
 * which questions they got right and what the correct option was.
 */
export function ReviewAttemptButton({ title, review }: { title: string; review: ReviewItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        View answers
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description="Your answers">
        <QuizReview review={review} />
      </Modal>
    </>
  );
}
