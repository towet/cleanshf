import { motion } from "framer-motion";
import { Job } from "@/data/jobs";

interface JobCardProps {
  job: Job;
  index: number;
  onApply: (job: Job) => void;
}

const JobCard = ({ job, index, onApply }: JobCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-card border border-border rounded-2xl shadow-soft hover:shadow-elevated transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => onApply(job)}
    >
      {/* Job Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={job.image}
          alt={job.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Category Badge on Image */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            {job.category}
          </span>
        </div>
        
        {/* Icon Badge */}
        <div className="absolute top-3 right-3">
          <span className="text-2xl bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
            {job.icon}
          </span>
        </div>
        
        {/* Job Title on Image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-display font-bold text-white drop-shadow-lg">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {job.description}
        </p>

        {/* Salary Info */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Salary</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(job.salary)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Medical Allowance</span>
            <span className="text-sm font-medium text-accent">+{formatCurrency(job.medicalAllowance)}</span>
          </div>
        </div>

        {/* Apply Button */}
        <motion.div
          className="mt-4 pt-4 border-t border-border"
          initial={{ opacity: 0.8 }}
          whileHover={{ opacity: 1 }}
        >
          <button className="w-full py-3 bg-gradient-primary text-primary-foreground rounded-xl font-semibold text-sm group-hover:shadow-glow-primary transition-all duration-300">
            Apply for this Position
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JobCard;
