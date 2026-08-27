import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface ProcessingLoaderProps {
  isOpen: boolean;
  onComplete: () => void;
}

const processingSteps = [
  "Reviewing personal information...",
  "Verifying education details...",
  "Processing job preferences...",
  "Looking for open positions...",
  "Finalizing application...",
];

const ProcessingLoader = ({ isOpen, onComplete }: ProcessingLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < processingSteps.length) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        clearInterval(stepInterval);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-elevated p-8 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative">
          {/* Spinner */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-muted"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-8 h-8 bg-gradient-primary rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-display font-bold text-center text-foreground mb-2"
          >
            Processing Your Application
          </motion.h2>
          <p className="text-center text-muted-foreground mb-8">
            Please wait while we review your information...
          </p>

          {/* Steps */}
          <div className="space-y-3">
            <AnimatePresence>
              {processingSteps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    completedSteps.includes(index)
                      ? "bg-primary/10"
                      : index === currentStep
                      ? "bg-muted"
                      : "bg-transparent"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      completedSteps.includes(index)
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "bg-muted-foreground/20"
                        : "bg-muted"
                    }`}
                  >
                    {completedSteps.includes(index) ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : index === currentStep ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      completedSteps.includes(index)
                        ? "text-primary"
                        : index === currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${(completedSteps.length / processingSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProcessingLoader;
