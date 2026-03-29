import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle, XCircle, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "tricky";
  common_error?: string;
}

interface QuizSystemProps {
  questions: QuizQuestion[];
}

const TIMER_SECONDS = 30;

const diffColor: Record<string, string> = {
  easy: "bg-neon-green/20 text-neon-green",
  medium: "bg-neon-orange/20 text-neon-orange",
  tricky: "bg-neon-pink/20 text-neon-pink",
};

const QuizSystem = ({ questions }: QuizSystemProps) => {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [finished, setFinished] = useState(false);

  const q = questions[current];

  const next = useCallback(() => {
    setAnswers((a) => [...a, selected]);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setTimer(TIMER_SECONDS);
    } else {
      setFinished(true);
    }
  }, [current, questions.length, selected]);

  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0) { next(); return; }
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, started, finished, next]);

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  if (!started) {
    return (
      <motion.div className="glass-strong gradient-border rounded-2xl p-8 text-center space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Trophy className="w-16 h-16 mx-auto text-neon-orange" />
        <h3 className="text-2xl font-bold">Ready for the Quiz?</h3>
        <p className="text-muted-foreground">{questions.length} questions • {TIMER_SECONDS}s per question • Tricky questions included</p>
        <Button onClick={() => setStarted(true)} className="neon-glow bg-primary text-primary-foreground px-8 py-3">Start Quiz</Button>
      </motion.div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div className="glass-strong gradient-border rounded-2xl p-8 space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 mx-auto text-neon-green" />
          <h3 className="text-3xl font-bold gradient-text">{pct}% Score</h3>
          <p className="text-muted-foreground">{score}/{questions.length} correct</p>
        </div>
        <div className="space-y-3 mt-6">
          {questions.map((qq, i) => (
            <div key={i} className={`glass rounded-xl p-4 ${answers[i] === qq.correct ? "border-l-4 border-neon-green" : "border-l-4 border-neon-pink"}`}>
              <div className="flex items-start gap-3">
                {answers[i] === qq.correct ? <CheckCircle className="w-5 h-5 text-neon-green shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-neon-pink shrink-0 mt-0.5" />}
                <div>
                  <div className="text-sm font-medium"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{qq.question}</ReactMarkdown></div>
                  {answers[i] !== qq.correct && (
                    <p className="text-xs text-neon-green mt-1">Correct: {qq.options[qq.correct]}</p>
                  )}
                  {qq.common_error && (
                    <p className="text-xs text-neon-orange mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Common error: {qq.common_error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="glass-strong gradient-border rounded-2xl p-6 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${diffColor[q.difficulty]}`}>
          {q.difficulty.toUpperCase()}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <Clock className={`w-4 h-4 ${timer <= 10 ? "text-neon-pink" : "text-muted-foreground"}`} />
          <span className={timer <= 10 ? "text-neon-pink font-bold" : "text-muted-foreground"}>{timer}s</span>
        </div>
        <span className="text-xs text-muted-foreground">{current + 1}/{questions.length}</span>
      </div>

      <Progress value={(timer / TIMER_SECONDS) * 100} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <div className="text-lg font-semibold mb-4"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question}</ReactMarkdown></div>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <motion.button
                key={i}
                className={`w-full text-left p-4 rounded-xl glass transition-all ${
                  selected === i ? "neon-glow border-primary" : "hover:border-primary/30"
                }`}
                onClick={() => setSelected(i)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-sm"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown></span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {q.common_error && (
        <div className="flex items-center gap-2 text-xs text-neon-orange glass rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Watch out: {q.common_error}</span>
        </div>
      )}

      <Button onClick={next} disabled={selected === null} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
        {current < questions.length - 1 ? "Next Question" : "Finish Quiz"}
      </Button>
    </motion.div>
  );
};

export default QuizSystem;
