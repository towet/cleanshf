import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, PartyPopper, Star, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ApplicationData } from "./ApplicationForm";
import { jobs } from "@/data/jobs";

const HIRING_MANAGER_WHATSAPP = "254105575260";

interface FinalSuccessProps {
  isOpen: boolean;
  application: ApplicationData | null;
  onClose: () => void;
}

function buildApplicationId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CS-${stamp}-${rand}`;
}

function buildWhatsAppMessage(applicationId: string, application: ApplicationData) {
  const position =
    jobs.find((job) => job.id === application.position)?.title || application.position || "Open Role";

  return [
    "Hello CleanShelf Hiring Manager,",
    "",
    "I have completed my application and payment. Please confirm my application.",
    "",
    `Application ID: ${applicationId}`,
    `Full Name: ${application.fullName}`,
    `Phone: ${application.phone}`,
    `Email: ${application.email}`,
    `Position: ${position}`,
    `Work Type: ${application.workType}`,
    `Preferred Location: ${application.location}`,
    `Current Location: ${application.currentLocation}`,
    `Education: ${application.education}`,
    "",
    "Thank you.",
  ].join("\n");
}

const FinalSuccess = ({ isOpen, application, onClose }: FinalSuccessProps) => {
  const [copied, setCopied] = useState(false);
  const applicationId = useMemo(() => buildApplicationId(), [isOpen, application?.phone, application?.fullName]);

  if (!isOpen || !application) return null;

  const positionTitle =
    jobs.find((job) => job.id === application.position)?.title || application.position || "Open Role";
  const message = buildWhatsAppMessage(applicationId, application);
  const whatsappUrl = `https://wa.me/${HIRING_MANAGER_WHATSAPP}?text=${encodeURIComponent(message)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleForward = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-elevated overflow-hidden my-4"
      >
        <div className="relative bg-gradient-primary p-8 text-center overflow-hidden">
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
            Application Generated
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative text-primary-foreground/90"
          >
            Forward this to the hiring manager to confirm your application
          </motion.p>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-6">
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
              className="rounded-xl border border-border bg-muted/40 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Your Application</span>
                <code className="text-xs font-mono font-bold text-primary">{applicationId}</code>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground text-right">{application.fullName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium text-foreground text-right">{application.phone}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Position</dt>
                  <dd className="font-medium text-foreground text-right">{positionTitle}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium text-foreground text-right">{application.location}</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted-foreground"
            >
              Click <span className="font-semibold text-foreground">Forward to Hiring Manager</span> to open
              WhatsApp with your application details already filled in. Send the message to complete confirmation.
            </motion.div>
          </div>

          <div className="space-y-3">
            <Button variant="hero" size="lg" className="w-full" onClick={handleForward}>
              <MessageCircle className="w-5 h-5" />
              Forward to Hiring Manager
            </Button>

            <Button variant="outline" size="lg" className="w-full" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied application details" : "Copy application details"}
            </Button>

            <button
              onClick={onClose}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FinalSuccess;
