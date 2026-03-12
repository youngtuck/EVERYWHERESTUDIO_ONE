import { useState } from "react";
import { Upload, File as FileIcon, X } from "lucide-react";
import type { VoiceDNA } from "../../utils/voiceDNAProcessor";

interface VoiceUploadProps {
  onComplete: (result: { voiceDna: VoiceDNA; markdown: string; fileSummaries: { name: string; size: number }[] }) => void;
}

interface LocalFile {
  id: string;
  file: File;
}

export function VoiceUpload({ onComplete }: VoiceUploadProps) {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const next: LocalFile[] = [];
    Array.from(fileList).forEach(f => {
      next.push({ id: `${f.name}-${f.lastModified}-${Math.random().toString(36).slice(2)}`, file: f });
    });
    setFiles(prev => [...prev, ...next]);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const analyze = async () => {
    if (!files.length || processing) return;
    setProcessing(true);

    // For now we do not stream real analysis from the frontend.
    // The parent owns the real call into voiceDNAProcessor; we
    // pass back a stub payload with file summaries.
    const fileSummaries = files.map(f => ({
      name: f.file.name,
      size: f.file.size,
    }));

    onComplete({
      voiceDna: {
        voice_fidelity: 0,
        voice_layer: 0,
        value_layer: 0,
        personality_layer: 0,
        traits: {
          vocabulary_and_syntax: 0,
          tonal_register: 0,
          rhythm_and_cadence: 0,
          metaphor_patterns: 0,
          structural_habits: 0,
        },
        voice_description: "",
        value_description: "",
        personality_description: "",
        contraction_frequency: "",
        sentence_length_avg: "",
        signature_phrases: [],
        prohibited_words: [],
        emotional_register: "",
        has_dual_mode: false,
        method: "upload",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      markdown: "",
      fileSummaries,
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".txt,.md,.pdf,.docx";
          input.multiple = true;
          input.onchange = () => handleFiles(input.files);
          input.click();
        }}
        style={{
          border: "2px dashed rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "60px 40px",
          textAlign: "center" as const,
          transition: "all 0.25s",
          cursor: "pointer",
        }}
      >
        <Upload size={32} color="rgba(255,255,255,0.5)" />
        <p
          style={{
            marginTop: 16,
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#ffffff",
          }}
        >
          Drop your writing here or click to browse
        </p>
        <p
          style={{
            marginTop: 8,
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Articles, blog posts, newsletters, emails, anything you have written.
        </p>
        <p
          style={{
            marginTop: 16,
            fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Accepts .txt, .md, .pdf, .docx
        </p>
      </div>

      {!!files.length && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map(item => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
              }}
            >
              <FileIcon size={16} color="rgba(255,255,255,0.6)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 14,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.file.name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {(item.file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 4,
                  borderRadius: 999,
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={!files.length || processing}
        onClick={analyze}
        style={{
          marginTop: 24,
          width: "100%",
          background: files.length && !processing ? "#C8961A" : "rgba(255,255,255,0.08)",
          color: files.length && !processing ? "#07090f" : "rgba(255,255,255,0.4)",
          border: "none",
          borderRadius: 999,
          padding: "14px 16px",
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: files.length && !processing ? "pointer" : "default",
        }}
      >
        {processing ? "Analyzing..." : "Analyze my writing"}
      </button>
    </div>
  );
}

