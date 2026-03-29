import { useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface NotebookNotesProps {
  content: string;
}

const NotebookNotes = ({ content }: NotebookNotesProps) => {
  const notesRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!notesRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(notesRef.current, { scale: 2, backgroundColor: "#f5f0e8" });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
    pdf.save("study-notes.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportPDF} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Download className="w-4 h-4" /> Export to PDF
        </Button>
      </div>

      <motion.div
        ref={notesRef}
        className="notebook-paper rounded-xl shadow-lg min-h-[400px] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Spiral binding decoration */}
        <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full border-2 border-gray-400/50" />
          ))}
        </div>

        <div className="prose prose-sm max-w-none text-xl leading-[32px]">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-800 mb-2 font-handwriting underline decoration-neon-pink/30">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-700 mt-4 mb-2 font-handwriting highlight-green">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-medium text-gray-600 mt-3 mb-1 font-handwriting highlight-orange">{children}</h3>,
              p: ({ children }) => <p className="font-handwriting text-gray-700 mb-2">{children}</p>,
              strong: ({ children }) => <strong className="highlight-pink font-handwriting font-bold">{children}</strong>,
              li: ({ children }) => <li className="font-handwriting text-gray-700 ml-4">✏️ {children}</li>,
              code: ({ children }) => <code className="bg-yellow-100/50 px-1 rounded font-handwriting text-gray-800">{children}</code>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </motion.div>
    </div>
  );
};

export default NotebookNotes;
