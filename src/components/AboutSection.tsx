import { motion } from "framer-motion";
import { Heart, MapPin, Shield, Users } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            About Us
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Why Join CleanShelf?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're more than just a supermarket – we're a family committed to excellence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Shield,
              title: "Job Security",
              description: "Stable employment with growth opportunities",
            },
            {
              icon: Heart,
              title: "Medical Cover",
              description: "Comprehensive medical allowance for all staff",
            },
            {
              icon: MapPin,
              title: "Nationwide",
              description: "Positions available across Kenya",
            },
            {
              icon: Users,
              title: "Great Team",
              description: "Work with supportive and friendly colleagues",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 text-center border border-border hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <item.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
