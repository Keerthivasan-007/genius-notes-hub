import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Flashcard {
  front: string;
  back: string;
}

const Flashcards = ({ cards }: { cards: Flashcard[] }) => {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="cursor-pointer perspective-1000 h-48"
          onClick={() => setFlipped((p) => ({ ...p, [i]: !p[i] }))}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: flipped[i] ? 180 : 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front */}
            <div className="absolute inset-0 glass-strong gradient-border rounded-xl p-6 flex items-center justify-center text-center backface-hidden">
              <div className="text-sm font-medium"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{card.front}</ReactMarkdown></div>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 rounded-xl p-6 flex items-center justify-center text-center backface-hidden"
              style={{ transform: "rotateY(180deg)", background: "linear-gradient(135deg, hsl(152 100% 50% / 0.3), hsl(330 100% 60% / 0.3))", backgroundColor: "hsl(var(--card))" }}
            >
              <p className="text-sm text-foreground">{card.back}</p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default Flashcards;
