import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import JobsSection from "@/components/JobsSection";
import QualificationsSection from "@/components/QualificationsSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import ApplicationForm, { ApplicationData } from "@/components/ApplicationForm";
import ProcessingLoader from "@/components/ProcessingLoader";
import CongratulationsScreen from "@/components/CongratulationsScreen";
import PaymentFlow from "@/components/PaymentFlow";
import FinalSuccess from "@/components/FinalSuccess";
import { Job } from "@/data/jobs";

type AppState = "idle" | "applying" | "processing" | "congratulations" | "payment" | "success";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setAppState("applying");
  };

  const handleFormSubmit = (data: ApplicationData) => {
    setApplicationData(data);
    setAppState("processing");
  };

  const handleProcessingComplete = () => {
    setAppState("congratulations");
  };

  const handleContinueToPayment = () => {
    setAppState("payment");
  };

  const handlePaymentComplete = () => {
    setAppState("success");
  };

  const handleClose = () => {
    setAppState("idle");
    setSelectedJob(null);
    setApplicationData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <section id="jobs">
        <JobsSection onApply={handleApply} />
      </section>
      <QualificationsSection />
      <AboutSection />
      
      {/* Apply CTA Section */}
      <section id="apply" className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
            Ready to Start Your Career?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join the CleanShelf family today. Apply now and take the first step towards a rewarding career.
          </p>
          <button
            onClick={() => setAppState("applying")}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg shadow-elevated hover:scale-105 transition-transform duration-300"
          >
            Apply Now — It's Easy
          </button>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      <ApplicationForm
        isOpen={appState === "applying"}
        onClose={handleClose}
        selectedJob={selectedJob}
        onSubmit={handleFormSubmit}
      />

      <ProcessingLoader
        isOpen={appState === "processing"}
        onComplete={handleProcessingComplete}
      />

      <CongratulationsScreen
        isOpen={appState === "congratulations"}
        positionId={applicationData?.position || ""}
        onContinue={handleContinueToPayment}
      />

      <PaymentFlow
        isOpen={appState === "payment"}
        onBack={() => setAppState("congratulations")}
        onComplete={handlePaymentComplete}
      />

      <FinalSuccess
        isOpen={appState === "success"}
        onClose={handleClose}
      />
    </div>
  );
};

export default Index;
