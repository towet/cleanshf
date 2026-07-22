import { motion } from "framer-motion";
import { Check, FileCheck, Clock, Users, Phone, Truck, Package } from "lucide-react";
import { qualifications } from "@/data/jobs";

const iconMap = [FileCheck, Users, Clock, Phone, Users, Truck, Package];

const QualificationsSection = () => {
  return (
    <section id="qualifications" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
            Requirements
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Who We're Looking For
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet these basic requirements and join our growing team
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualifications.map((qualification, index) => {
            const Icon = iconMap[index] || Check;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-foreground font-medium pt-2">{qualification}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QualificationsSection;
