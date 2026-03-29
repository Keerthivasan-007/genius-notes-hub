import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Layers, Trophy } from "lucide-react";
import NotebookNotes from "./NotebookNotes";
import Flashcards from "./Flashcards";
import QuizSystem from "./QuizSystem";
import ReactMarkdown from "react-markdown";

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

const ResultsDashboard = ({ result }: { result: SynthResult }) => {
  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="w-full glass-strong rounded-xl p-1 h-auto flex-wrap gap-1">
        <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg gap-2 py-3">
          <BookOpen className="w-4 h-4" /> Master Notes
        </TabsTrigger>
        <TabsTrigger value="summary" className="flex-1 data-[state=active]:bg-neon-orange/20 data-[state=active]:text-neon-orange rounded-lg gap-2 py-3">
          <Brain className="w-4 h-4" /> Summary & Formulas
        </TabsTrigger>
        <TabsTrigger value="flashcards" className="flex-1 data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink rounded-lg gap-2 py-3">
          <Layers className="w-4 h-4" /> Flashcards
        </TabsTrigger>
        <TabsTrigger value="quiz" className="flex-1 data-[state=active]:bg-neon-orange/20 data-[state=active]:text-neon-orange rounded-lg gap-2 py-3">
          <Trophy className="w-4 h-4" /> Quiz
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes" className="mt-6">
        <NotebookNotes content={result.master_notes} />
      </TabsContent>

      <TabsContent value="summary" className="mt-6">
        <div className="glass-strong gradient-border rounded-2xl p-8">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{result.summary}</ReactMarkdown>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="flashcards" className="mt-6">
        <Flashcards cards={result.flashcards} />
      </TabsContent>

      <TabsContent value="quiz" className="mt-6">
        <QuizSystem questions={result.quiz} />
      </TabsContent>
    </Tabs>
  );
};

export default ResultsDashboard;
