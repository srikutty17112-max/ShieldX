import React from 'react';
import { Shield, Mail, Instagram, Linkedin, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-cyber-950 border-t border-cyber-border/80 pt-16 pb-12 px-6 lg:px-12 text-sm">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Grid: Columns styled like Cursor's footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-16">
          
          {/* Column 1: Product */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-cyber-muted">
              <li><a href="#features" className="hover:text-cyber-green transition-colors">Features</a></li>
              <li><a href="#voice-assistant" className="hover:text-cyber-green transition-colors">Voice Assistant</a></li>
              <li><a href="#pricing" className="hover:text-cyber-green transition-colors">Pricing</a></li>
              <li><a href="#security" className="hover:text-cyber-green transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-cyber-muted">
              <li><a href="#documentation" className="hover:text-cyber-green transition-colors">Documentation</a></li>
              <li><a href="#download-agent" className="hover:text-cyber-green transition-colors">Download Agent</a></li>
              <li><a href="#faq" className="hover:text-cyber-green transition-colors">FAQ</a></li>
              <li><a href="#community" className="hover:text-cyber-green transition-colors">Community</a></li>
              <li><a href="#status" className="hover:text-cyber-green transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-cyber-muted">
              <li><a href="#about" className="hover:text-cyber-green transition-colors">About ShieldX</a></li>
              <li><a href="#contact" className="hover:text-cyber-green transition-colors">Contact</a></li>
              <li><a href="#blog" className="hover:text-cyber-green transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-cyber-muted">
              <li><a href="#terms" className="hover:text-cyber-green transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-cyber-green transition-colors">Privacy Policy</a></li>
              <li><a href="#aup" className="hover:text-cyber-green transition-colors">Acceptable Use Policy</a></li>
              <li><a href="#data-use" className="hover:text-cyber-green transition-colors">Data Use</a></li>
              <li><a href="#security-legal" className="hover:text-cyber-green transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Column 5: Connect */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5 text-cyber-muted">
              <li>
                <a 
                  href="mailto:srikutty9080@gmail.com" 
                  className="flex items-center space-x-2 hover:text-cyber-cyan transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyber-cyan" />
                  <span className="truncate">srikutty9080@gmail.com</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com/_vasan__18" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center space-x-2 hover:text-pink-400 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>@_vasan__18</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/in/vasan-s-profile" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="w-4 h-4 text-blue-400" />
                  <span>LinkedIn Profile</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line: Logo & Copyright */}
        <div className="pt-8 border-t border-cyber-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-cyber-muted space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-cyber-green" />
            <span className="font-mono font-bold text-white tracking-wider">SHIELDX</span>
            <span className="text-cyber-border">|</span>
            <span>Autonomous Voice Threat Detection & Containment</span>
          </div>
          <p className="font-mono">
            &copy; 2026 ShieldX. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
};
