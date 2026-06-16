"use client";

import { useState, useRef } from "react";

type Props = {
  name: string; // hidden input name that carries the final URL into the form
  defaultUrl?: string | null;
};

export default function ImageUpload({ name, defaultUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError("");

    // Instant local preview while the upload is in flight
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setPreview(defaultUrl ?? null);
      } else {
        setPreview(data.url);
        // Write the final hosted URL into the hidden input so the
        // surrounding <form action={...}> picks it up on submit.
        const hidden = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (hidden) hidden.value = data.url;
      }
    } catch {
      setError("Upload failed. Check your connection.");
      setPreview(defaultUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleRemove() {
    setPreview(null);
    setError("");
    const hidden = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (hidden) hidden.value = "";
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {/* This hidden input is what actually gets submitted with the form */}
      <input type="hidden" name={name} defaultValue={defaultUrl ?? ""} />

      {preview ? (
        <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-200 group">
          <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-medium">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex w-40 h-40 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition ${
            dragging ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs text-gray-500 px-2">Click or drag image</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="mt-1.5 text-xs text-danger-600 max-w-40">{error}</p>}
      <p className="mt-1.5 text-xs text-gray-400">JPG, PNG, WEBP or GIF · max 5MB</p>
    </div>
  );
}
