"use client";

import dynamic from "next/dynamic";

const DocumentViewer = dynamic(
  () => import("@/components/DocumentViewer"),
  { ssr: false }
);

export default function ReadPage() {
  return <DocumentViewer />;
}
