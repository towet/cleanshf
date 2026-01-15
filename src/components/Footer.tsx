import { ShoppingCart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-primary">Clean</span>
                <span className="text-xl font-display font-bold text-accent">Shelf</span>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Kenya's leading supermarket chain, committed to providing quality products 
              and excellent career opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#jobs" className="text-primary-foreground/70 hover:text-primary transition-colors text-sm">
                  Open Positions
                </a>
              </li>
              <li>
                <a href="#qualifications" className="text-primary-foreground/70 hover:text-primary transition-colors text-sm">
                  Requirements
                </a>
              </li>
              <li>
                <a href="#about" className="text-primary-foreground/70 hover:text-primary transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#apply" className="text-primary-foreground/70 hover:text-primary transition-colors text-sm">
                  Apply Now
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4 text-primary" />
                careers@cleanshelf.co.ke
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4 text-primary" />
                +254 700 000 000
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 text-primary" />
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-primary-foreground/50 text-sm">
            © 2025 CleanShelf Supermarket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
