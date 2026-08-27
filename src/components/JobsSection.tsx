import { motion } from "framer-motion";
import { jobs, Job } from "@/data/jobs";
import JobCard from "./JobCard";

interface JobsSectionProps {
  onApply: (job: Job) => void;
}

const JobsSection = ({ onApply }: JobsSectionProps) => {
  return (
    <section id="jobs" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            Open Positions
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Find Your Perfect Role
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our available positions with competitive salaries and comprehensive medical benefits
          </p>
        </motion.div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} onApply={onApply} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobsSection;
