import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NeonOrbs from "@/components/NeonOrbs";
import HeroSection from "@/components/HeroSection";
import FileUpload from "@/components/FileUpload";
import ProcessingState from "@/components/ProcessingState";
import ResultsDashboard from "@/components/ResultsDashboard";

interface SynthResult {
  master_notes: string;
  summary: string;
  flashcards: { front: string; back: string }[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
    difficulty: "easy" | "medium" | "tricky";
    common_error?: string;
  }[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SynthResult | null>(null);
  const { toast } = useToast();

  const synthesize = async () => {
    if (files.length === 0) {
      toast({ title: "No files", description: "Please upload at least one file.", variant: "destructive" });
      return;
    }

    // Validate file sizes
    const oversized = files.find(f => f.size > MAX_FILE_SIZE);
    if (oversized) {
      toast({ title: "File too large", description: `"${oversized.name}" exceeds 10MB limit.`, variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Read all files as base64
      const fileData = await Promise.all(
        files.map(async (f) => {
          const buffer = await f.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          return { name: f.name, type: f.type, data: base64 };
        })
      );

      const { data, error } = await supabase.functions.invoke("synthesize", {
        body: { files: fileData },
      });

      if (error) {
        // Handle specific HTTP error codes
        const status = (error as any)?.status || (error as any)?.context?.status;
        if (status === 429) {
          toast({ title: "Rate Limited", description: "Too many requests. Please wait a moment and try again.", variant: "destructive" });
          return;
        }
        if (status === 402) {
          toast({ title: "Credits Exhausted", description: "AI credits have run out. Please add funds in workspace settings.", variant: "destructive" });
          return;
        }
        throw error;
      }

      if (!data || !data.master_notes) {
        throw new Error("Invalid response from AI. Please try again.");
      }

      setResult(data as SynthResult);
      toast({ title: "Done! ✨", description: "Your notes have been synthesized successfully." });
    } catch (err: any) {
      console.error("Synthesize error:", err);
      const message = err?.message || "Something went wrong. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <NeonOrbs />

      <div className="relative z-10">
        <HeroSection />

        <section id="workspace" className="max-w-4xl mx-auto px-4 py-16 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Upload Your Notes</span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Drop your class notes, slides, and handwritten pages below.
            </p>

            <FileUpload onFilesSelected={setFiles} isProcessing={isProcessing} />

            {files.length > 0 && !isProcessing && !result && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={synthesize}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow text-lg py-6 font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Synthesize Notes
                </Button>
              </motion.div>
            )}

            {files.length > 0 && result && (
              <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={() => { setResult(null); setFiles([]); }}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  Start Over
                </Button>
              </motion.div>
            )}
          </motion.div>

          {isProcessing && <ProcessingState />}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <ResultsDashboard result={result} />
            </motion.div>
          )}
        </section>

        <footer className="text-center py-8 text-xs text-muted-foreground">
          <p>NoteForge — Built with AI ✨</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
