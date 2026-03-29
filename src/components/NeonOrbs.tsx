import { motion } from "framer-motion";

const NeonOrbs = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
      style={{ background: "hsl(152 100% 50%)", top: "10%", left: "10%" }}
      animate={{ x: [0, 60, -30, 0], y: [0, -50, 30, 0], scale: [1, 1.2, 0.9, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
      style={{ background: "hsl(25 100% 55%)", top: "50%", right: "5%" }}
      animate={{ x: [0, -40, 20, 0], y: [0, 40, -60, 0], scale: [1, 0.8, 1.15, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    <motion.div
      className="absolute w-[350px] h-[350px] rounded-full opacity-15 blur-[100px]"
      style={{ background: "hsl(330 100% 60%)", bottom: "10%", left: "30%" }}
      animate={{ x: [0, 50, -50, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.85, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />
  </div>
);

export default NeonOrbs;
