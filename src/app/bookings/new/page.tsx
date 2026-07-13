"use client";

import { Suspense } from "react";
import NewBookingForm from "./NewBookingForm";

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <NewBookingForm />
    </Suspense>
  );
}
