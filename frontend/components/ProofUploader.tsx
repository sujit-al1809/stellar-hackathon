"use client";

import React, { useState } from "react";
import { uploadProofFile, validateFile } from "@/lib/upload";
import { detectProofType, verifyStellarTransaction } from "@/lib/verify-proof";

interface ProofItem {
  id: string;
  type: "image" | "transaction" | "url" | "text";
  content: string;
  verified?: boolean;
  verifying?: boolean;
  error?: string;
}

interface ProofUploaderProps {
  onProofChange?: (proofs: ProofItem[]) => void;
  onFilesUploaded?: (files: { url: string; name: string }[]) => void;
  maxItems?: number;
  disabled?: boolean;
}

export function ProofUploader({ onProofChange, onFilesUploaded, maxItems = 10, disabled = false }: ProofUploaderProps) {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState("");

  const updateProofs = (newProofs: ProofItem[]) => {
    setProofs(newProofs);
    onProofChange?.(newProofs);
    onFilesUploaded?.(newProofs.map(p => ({ url: p.content, name: p.id })));
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      try {
        const url = await uploadProofFile(file);

        const newProof: ProofItem = {
          id: `img_${Date.now()}_${i}`,
          type: "image",
          content: url,
          verified: true,
        };

        updateProofs([...proofs, newProof]);
      } catch (error: any) {
        alert(`Upload failed: ${error.message}`);
      }
    }

    setUploading(false);
    e.target.value = ""; // Reset input
  };

  // Handle text/URL/hash input
  const handleAddText = async () => {
    if (!textInput.trim()) return;

    const detected = detectProofType(textInput);

    const newProof: ProofItem = {
      id: `txt_${Date.now()}`,
      type: detected.type,
      content: textInput.trim(),
      verifying: detected.type === "transaction",
    };

    updateProofs([...proofs, newProof]);
    setTextInput("");

    // Verify if it's a transaction
    if (detected.type === "transaction" && detected.chain === "stellar") {
      const index = proofs.length;
      const result = await verifyStellarTransaction(newProof.content);

      updateProofs(
        proofs.map((p, i) =>
          i === index
            ? {
                ...p,
                verified: result.valid,
                verifying: false,
                error: result.error,
              }
            : p
        )
      );
    }
  };

  // Remove proof item
  const removeProof = (id: string) => {
    updateProofs(proofs.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2 font-medium">
          Upload Screenshots / Documents
        </label>
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer">
            <div className="surface-input flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>Choose files to upload</span>
                </>
              )}
            </div>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading || proofs.length >= maxItems}
            />
          </label>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          JPG, PNG, WEBP, or PDF • Max 10MB per file
        </p>
      </div>

      {/* Text Input (URLs, Transaction Hashes) */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2 font-medium">
          Add Evidence (TX Hash, URL, or Text)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddText()}
            className="surface-input flex-1"
            placeholder="https://i.imgur.com/... or TX hash or description"
            disabled={proofs.length >= maxItems}
          />
          <button
            onClick={handleAddText}
            disabled={!textInput.trim() || proofs.length >= maxItems}
            className="btn-primary !px-6 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-1">
          Paste screenshot URLs, Stellar TX hashes, or descriptions
        </p>
      </div>

      {/* Proof Items List */}
      {proofs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-zinc-400 font-medium">
              Evidence Submitted ({proofs.length}/{maxItems})
            </label>
            <button
              onClick={() => updateProofs([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {proofs.map((proof, index) => (
              <div
                key={proof.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 group hover:border-zinc-700 transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {proof.type === "image" && <span className="text-lg">📷</span>}
                  {proof.type === "transaction" && (
                    <span className="text-lg">
                      {proof.verifying ? "⏳" : proof.verified ? "✅" : "❌"}
                    </span>
                  )}
                  {proof.type === "url" && <span className="text-lg">🔗</span>}
                  {proof.type === "text" && <span className="text-lg">📝</span>}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-600 font-mono uppercase">
                      {proof.type}
                    </span>
                    {proof.type === "transaction" && proof.verified && (
                      <span className="text-xs text-emerald-400 font-medium">
                        Verified on-chain ✓
                      </span>
                    )}
                  </div>

                  {proof.type === "image" ? (
                    <a
                      href={proof.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-lime-400 hover:text-lime-300 underline break-all"
                    >
                      {proof.content.substring(0, 60)}...
                    </a>
                  ) : (
                    <div className="text-sm text-zinc-300 break-all font-mono">
                      {proof.content.length > 80
                        ? `${proof.content.substring(0, 80)}...`
                        : proof.content}
                    </div>
                  )}

                  {proof.error && (
                    <div className="text-xs text-red-400 mt-1">{proof.error}</div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeProof(proof.id)}
                  className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="surface-card !border-blue-500/20 !bg-blue-500/5">
        <div className="text-xs text-blue-400 font-medium mb-2">
          💡 Strong Evidence Includes:
        </div>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>✓ Screenshots of trades with timestamps</li>
          <li>✓ Stellar transaction hashes (verifiable on-chain)</li>
          <li>✓ P&L reports with metrics</li>
          <li>✓ Links to exchange trade history</li>
          <li>✓ Multiple pieces of corroborating evidence</li>
        </ul>
      </div>
    </div>
  );
}
