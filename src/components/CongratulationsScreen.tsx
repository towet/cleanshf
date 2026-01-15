import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { jobs } from "@/data/jobs";
import confetti from "canvas-confetti";

interface CongratulationsScreenProps {
  isOpen: boolean;
  positionId: string;
  onContinue: () => void;
}

const CongratulationsScreen = ({ isOpen, positionId, onContinue }: CongratulationsScreenProps) => {
  const [showContent, setShowContent] = useState(false);
  const position = jobs.find((j) => j.id === positionId);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#228B22", "#DC2626", "#22C55E", "#EF4444"];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      setTimeout(() => setShowContent(true), 300);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-elevated overflow-hidden"
      >
        {/* Animated Background */}
        <div className="relative bg-gradient-primary p-8 text-center overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            className="relative inline-flex items-center justify-center w-24 h-24 mb-4 bg-white/20 rounded-full"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <CheckCircle className="w-14 h-14 text-primary-foreground" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative text-3xl font-display font-bold text-primary-foreground mb-2"
          >
            Congratulations! 🎉
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative text-primary-foreground/90"
          >
            Your application has been successfully processed!
          </motion.p>
        </div>

        {/* Content */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm text-primary font-medium">Application Approved</span>
                  <h3 className="font-display font-bold text-foreground">
                    {position?.title || "Your Position"}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your application has been reviewed and meets our requirements.
              </p>
            </div>

            <p className="text-center text-muted-foreground mb-6">
              You're now eligible to proceed to the next stage of our hiring process.
            </p>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={onContinue}
            >
              Continue to Next Step
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CongratulationsScreen;
