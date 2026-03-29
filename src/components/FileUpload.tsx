import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, File, X, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED = ".pdf,.pptx,.txt,.docx,.jpg,.jpeg,.png";
const MAX_FILES = 10;

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const fileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png"].includes(ext || "")) return <Image className="w-5 h-5 text-neon-pink" />;
  if (ext === "pptx") return <Presentation className="w-5 h-5 text-neon-orange" />;
  if (ext === "pdf") return <FileText className="w-5 h-5 text-destructive" />;
  return <File className="w-5 h-5 text-neon-green" />;
};

const FileUpload = ({ onFilesSelected, isProcessing }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).slice(0, MAX_FILES - files.length);
    const updated = [...files, ...arr];
    setFiles(updated);
    onFilesSelected(updated);
  }, [files, onFilesSelected]);

  const removeFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className="space-y-4">
      <motion.label
        className={`glass-strong gradient-border flex flex-col items-center justify-center p-10 rounded-2xl cursor-pointer transition-all duration-300 ${
          dragOver ? "neon-glow scale-[1.02]" : "hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        whileHover={{ scale: 1.01 }}
      >
        <input
          type="file"
          className="hidden"
          accept={ACCEPTED}
          multiple
          onChange={(e) => addFiles(e.target.files)}
          disabled={isProcessing}
        />
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <Upload className="w-12 h-12 text-neon-green mb-4" />
        </motion.div>
        <p className="text-lg font-semibold text-foreground">Drop your notes here</p>
        <p className="text-sm text-muted-foreground mt-1">PDF, PPTX, DOCX, TXT, JPG, PNG • Up to {MAX_FILES} files</p>
      </motion.label>

      <AnimatePresence>
        {files.map((f, i) => (
          <motion.div
            key={f.name + i}
            className="glass flex items-center gap-3 px-4 py-3 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.05 }}
          >
            {fileIcon(f.name)}
            <span className="flex-1 truncate text-sm">{f.name}</span>
            <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors" disabled={isProcessing}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
