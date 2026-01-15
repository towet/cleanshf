import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Shield, Phone, CheckCircle, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PaymentFlowProps {
  isOpen: boolean;
  onBack: () => void;
  onComplete: () => void;
}

const PaymentFlow = ({ isOpen, onBack, onComplete }: PaymentFlowProps) => {
  const [step, setStep] = useState<"info" | "payment">("info");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const refundCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(Math.random() * 100)}`;

  useEffect(() => {
    if (!isOpen) {
      setStep("info");
      setIsPaying(false);
      setStatusText(null);
      setErrorText(null);
    }
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refundCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizeKenyanPhone = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length === 12) return digits;
    if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
    if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
    if (digits.startsWith("1") && digits.length === 9) return `254${digits}`;
    return null;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePayment = async () => {
    if (isPaying) return;

    setErrorText(null);

    const normalizedPhone = normalizeKenyanPhone(phoneNumber);
    if (!normalizedPhone) {
      setErrorText("Enter a valid M-Pesa number (e.g. 2547XXXXXXXX or 07XXXXXXXX). ");
      return;
    }

    setIsPaying(true);
    setStatusText("Sending STK push...");

    try {
      const initiateRes = await fetch("/api/swiftpay/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone_number: normalizedPhone,
          amount: 139,
          reference: refundCode,
          description: "Application processing fee",
        }),
      });

      const initiateJson = (await initiateRes.json()) as { checkoutRequestId?: string; message?: string };

      if (!initiateRes.ok) {
        throw new Error(initiateJson?.message || "Failed to initiate payment.");
      }

      const checkoutRequestId = initiateJson?.checkoutRequestId;

      if (!checkoutRequestId) {
        throw new Error("Failed to initiate payment.");
      }

      setStatusText("Waiting for payment confirmation...");

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await delay(3000);

        const statusRes = await fetch("/api/swiftpay/status", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ checkoutRequestId }),
        });

        const statusJson = (await statusRes.json()) as { state?: string; message?: string };

        if (!statusRes.ok) {
          throw new Error(statusJson?.message || "Failed to check payment status.");
        }

        const state = statusJson?.state;

        if (state === "success") {
          setStatusText(null);
          setIsPaying(false);
          onComplete();
          return;
        }

        if (state === "failed") {
          setStatusText(null);
          setIsPaying(false);
          setErrorText("Payment failed or was cancelled. Please try again.");
          return;
        }
      }

      setStatusText(null);
      setIsPaying(false);
      setErrorText("Payment confirmation timed out. Please try again.");
    } catch (err) {
      setStatusText(null);
      setIsPaying(false);
      setErrorText(err instanceof Error ? err.message : "Payment failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-card rounded-3xl shadow-elevated overflow-hidden my-4"
        >
          <AnimatePresence mode="wait">
            {step === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Header */}
                <div className="bg-gradient-primary p-6 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-primary-foreground mb-2">
                    Secure Your Position
                  </h2>
                  <p className="text-primary-foreground/80 text-sm">
                    Complete your application now
                  </p>
                </div>

                {/* Benefits */}
                <div className="p-6 space-y-4">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    After you complete the application you will get
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Guaranteed Placement</span>
                        <p className="text-xs text-muted-foreground">Priority consideration for immediate hiring</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Direct Call</span>
                        <p className="text-xs text-muted-foreground">Personal interview within 48 hours</p>
                      </div>
                    </div>
                  </div>

                  {/* Refund Notice */}
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-accent" />
                      <span className="font-semibold text-accent">100% Refundable Processing Fee</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your payment is fully refundable. We're committed to transparency and fairness.
                    </p>
                  </div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full mt-4"
                    onClick={() => setStep("payment")}
                  >
                    Continue to Payment Details
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <button
                    onClick={onBack}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Header */}
                <div className="bg-gradient-primary p-6 text-center">
                  <h2 className="text-xl font-display font-bold text-primary-foreground mb-2">
                    Application Processing Fee
                  </h2>
                  <p className="text-primary-foreground/80 text-sm">
                    Secure your position with our refundable processing fee
                  </p>
                </div>

                <div className="p-6">
                  {/* Amount Card */}
                  <div className="bg-muted rounded-2xl p-4 mb-6">
                    <div className="text-center mb-4">
                      <span className="text-4xl font-display font-bold text-primary">KSH 139</span>
                      <p className="text-sm text-muted-foreground">One-time processing fee</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <span className="text-sm text-muted-foreground">Processing Fee</span>
                        <p className="font-semibold text-foreground">KSH 139</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Refund Guarantee</span>
                        <p className="font-semibold text-primary">100%</p>
                      </div>
                    </div>
                  </div>

                  {/* Refund Code */}
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Your Refund Code</span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="block bg-background rounded-lg px-4 py-2 text-lg font-mono text-center font-bold text-foreground">
                      {refundCode}
                    </code>
                    <div className="flex items-start gap-2 mt-3">
                      <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <strong>Important:</strong> Save this code safely! You'll need it for refund processing if required.
                      </p>
                    </div>
                  </div>

                  {/* Why Pay */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">Why Pay Processing Fee?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Ensures serious candidates only
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Guarantees priority review
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Direct access to hiring managers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        100% refundable if not selected
                      </li>
                    </ul>
                  </div>

                  {/* M-Pesa Section */}
                  <div className="border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-8 bg-[#00A859] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">M-PESA</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">M-Pesa Payment</span>
                        <p className="text-xs text-muted-foreground">
                          Enter your phone number to receive STK push
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-3 mb-4 text-center">
                      <span className="text-2xl font-display font-bold text-primary">KSH 139</span>
                      <p className="text-xs text-muted-foreground">Will be deducted from your M-Pesa</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <Label htmlFor="mpesa">M-Pesa Phone Number *</Label>
                      <Input
                        id="mpesa"
                        placeholder="254700000000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number registered with M-Pesa
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted rounded-xl mb-4">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Secure Payment Process</span>
                        <p className="text-xs text-muted-foreground">
                          You'll receive an STK push notification
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep("info")}
                      className="flex-1"
                      disabled={isPaying}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      variant="hero"
                      onClick={handlePayment}
                      disabled={isPaying || !phoneNumber || phoneNumber.length < 9}
                      className="flex-1"
                    >
                      {isPaying ? "Processing..." : "Finish Application"}
                    </Button>
                  </div>

                  {statusText && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">{statusText}</p>
                  )}

                  {errorText && (
                    <p className="mt-4 text-sm text-destructive text-center">{errorText}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentFlow;
