"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/stores/document-store";
import type { DocumentMeta } from "@/types";

export default function DocumentUploader() {
  const router = useRouter();
  const { setDocument, startSession } = useDocumentStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be under 50MB.");
        return;
      }

      const url = URL.createObjectURL(file);
      const doc: DocumentMeta = {
        id: `doc-${Date.now()}`,
        name: file.name,
        pageCount: 0,
        uploadTime: Date.now(),
        fileUrl: url,
      };

      setDocument(doc);
      startSession(doc);
      router.push("/read");
    },
    [setDocument, startSession, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-400 bg-gray-900/50"
        }`}
      >
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-xl text-gray-300 mb-2">
          {isDragging ? "Drop your PDF here" : "Upload a Document"}
        </p>
        <p className="text-gray-500 text-sm">
          Drag and drop a PDF file, or click to browse
        </p>
        <p className="text-gray-600 text-xs mt-2">Max 50MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="mt-4 text-red-400 text-center text-sm">{error}</p>
      )}
    </div>
  );
}
