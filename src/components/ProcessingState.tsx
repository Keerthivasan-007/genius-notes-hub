import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Extracting text from documents...",
  "Running OCR on images...",
  "Identifying common keywords...",
  "Merging unique content...",
  "Correcting errors & filling gaps...",
  "Generating flashcards...",
  "Building quiz questions...",
  "Finalizing your study guide...",
];

const ProcessingState = () => {
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="glass-strong gradient-border p-8 rounded-2xl text-center space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className="w-16 h-16 mx-auto rounded-full neon-glow flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="text-lg font-medium gradient-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>

      <Progress value={progress} className="h-2 bg-muted" />
      <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
    </motion.div>
  );
};

export default ProcessingState;
