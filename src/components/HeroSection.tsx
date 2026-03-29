import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const HeroSection = () => {
  const scrollToWorkspace = () => {
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-4xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 text-sm text-muted-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles className="w-4 h-4 text-neon-green" />
          <span>Powered by AI</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Merge Class Notes into{" "}
          <span className="gradient-text">Master Study Guides</span>
          {" "}using AI.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Upload your PDFs, images, handwritten notes — get synthesized study materials, 
          flashcards, and quizzes instantly.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={scrollToWorkspace}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow text-lg px-8 py-6 rounded-xl font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Try it Now
          </Button>
        </motion.div>

        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          {["PDF", "PPTX", "Images", "Handwritten", "DOCX"].map((f) => (
            <span key={f} className="glass px-3 py-1 rounded-full text-xs">{f}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
