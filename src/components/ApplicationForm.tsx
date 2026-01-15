import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Briefcase, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { jobs, locations, educationLevels, Job } from "@/data/jobs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job | null;
  onSubmit: (data: ApplicationData) => void;
}

export interface ApplicationData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  currentLocation: string;
  position: string;
  workType: "full-time" | "part-time";
}

const ApplicationForm = ({ isOpen, onClose, selectedJob, onSubmit }: ApplicationFormProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    education: "",
    currentLocation: "",
    position: selectedJob?.id || "",
    workType: "full-time",
  });

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Location & Education", icon: MapPin },
    { number: 3, title: "Job Preferences", icon: Briefcase },
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(formData);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (field: keyof ApplicationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.email && formData.phone;
      case 2:
        return formData.location && formData.education && formData.currentLocation;
      case 3:
        return formData.position && formData.workType;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-card rounded-2xl shadow-elevated overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-primary p-6 text-primary-foreground">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-display font-bold mb-2">Apply Now</h2>
            <p className="text-primary-foreground/80 text-sm">
              Complete the form below to start your journey with CleanShelf
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      step >= s.number
                        ? "bg-gradient-primary text-primary-foreground shadow-glow-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`hidden sm:block ml-2 text-sm font-medium ${
                      step >= s.number ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 transition-colors ${
                        step > s.number ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                    Personal Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+254 700 000 000"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                    Location & Education
                  </h3>
                  <div className="space-y-2">
                    <Label>Preferred Work Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => updateFormData("location", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level of Education *</Label>
                    <Select
                      value={formData.education}
                      onValueChange={(value) => updateFormData("education", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location *</Label>
                    <Input
                      id="currentLocation"
                      placeholder="Enter your current location"
                      value={formData.currentLocation}
                      onChange={(e) => updateFormData("currentLocation", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                    Job Preferences
                  </h3>
                  <div className="space-y-2">
                    <Label>Position Applying For *</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => updateFormData("position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.icon} {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Work Type *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateFormData("workType", "full-time")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.workType === "full-time"
                            ? "border-primary bg-primary/5 shadow-glow-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-semibold text-foreground">Full Time</span>
                        <p className="text-xs text-muted-foreground mt-1">40+ hours/week</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("workType", "part-time")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.workType === "part-time"
                            ? "border-primary bg-primary/5 shadow-glow-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-semibold text-foreground">Part Time</span>
                        <p className="text-xs text-muted-foreground mt-1">&lt;40 hours/week</p>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex gap-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1"
            >
              {step === 3 ? "Submit Application" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApplicationForm;
