"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ResumeUploadCardProps {
  onFileSelect?: (file: File) => void;
}

const ACCEPTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE_MB = 5;

export function ResumeUploadCard({ onFileSelect }: ResumeUploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((candidate: File) => {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      return "Only PDF and DOCX files are supported.";
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const candidate = Array.from(incoming)[0];
      if (!candidate) return;

      const validationError = validateFile(candidate);
      if (validationError) {
        setError(validationError);
        setFile(null);
        setProgress(0);
        return;
      }

      setError(null);
      setFile(candidate);
      setProgress(40);
      onFileSelect?.(candidate);

      const timer = window.setTimeout(() => setProgress(100), 400);
      return () => window.clearTimeout(timer);
    },
    [onFileSelect, validateFile]
  );

  const fileName = useMemo(() => file?.name ?? "No file selected", [file]);

  return (
    <Card className="overflow-hidden border-dashed border-primary/30 bg-gradient-to-br from-background to-secondary/40">
      <CardContent className="p-6">
        <motion.div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleFiles(event.dataTransfer.files);
          }}
          animate={{ scale: dragActive ? 1.01 : 1 }}
          className={cn("rounded-2xl border border-border/70 bg-card/80 p-6 text-center transition-all", dragActive && "border-primary bg-primary/5")}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">Drag & drop your resume</h3>
          <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX up to 5MB with instant validation</p>

          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            Choose file
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files ?? [])}
            />
          </label>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {error}
              </motion.div>
            ) : file ? (
              <motion.div key="success" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-success/20 bg-success/10 px-3 py-3 text-left text-sm text-success">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{fileName}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-success/80">
                    <span>Upload progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} indicatorClassName="bg-success" />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  );
}
