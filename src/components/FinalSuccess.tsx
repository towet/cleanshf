import { motion } from "framer-motion";
import { CheckCircle, PartyPopper, Star, Download } from "lucide-react";
import { Button } from "./ui/button";

interface FinalSuccessProps {
  isOpen: boolean;
  onClose: () => void;
}

const FinalSuccess = ({ isOpen, onClose }: FinalSuccessProps) => {
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
        {/* Celebration Header */}
        <div className="relative bg-gradient-primary p-8 text-center overflow-hidden">
          {/* Animated Stars */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </motion.div>
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.2 }}
            className="relative inline-flex items-center justify-center w-24 h-24 mb-4 bg-white/20 rounded-full"
          >
            <PartyPopper className="w-12 h-12 text-primary-foreground" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative text-3xl font-display font-bold text-primary-foreground mb-2"
          >
            Application Complete! 🎊
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative text-primary-foreground/90"
          >
            Thank you for applying to CleanShelf
          </motion.p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Payment Confirmed</span>
                <p className="text-xs text-muted-foreground">Your processing fee has been received</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl"
            >
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Application Submitted</span>
                <p className="text-xs text-muted-foreground">Your details are under review</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-3 p-4 bg-accent/5 rounded-xl border border-accent/20"
            >
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Download className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Next Step</span>
                <p className="text-xs text-muted-foreground">Expect a call within 48 hours</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-muted rounded-2xl p-4 text-center mb-6"
          >
            <p className="text-sm text-muted-foreground">
              Keep your phone close! Our hiring team will contact you soon to schedule your interview.
            </p>
          </motion.div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FinalSuccess;
