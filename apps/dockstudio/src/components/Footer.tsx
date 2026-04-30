"use client";

import { motion } from "framer-motion";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Coffee,
  PenLine,
  ExternalLink,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

type FooterLink = { label: string; href: string; external?: boolean };

const resourceLinks: FooterLink[] = [
  { label: "My Story", href: "https://draftdock.vercel.app/my-story", external: true },
  { label: "Contact", href: "https://draftdock.vercel.app/contact", external: true },
  { label: "API Docs", href: "https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1", external: true },
];

const quickLinks: FooterLink[] = [
  { label: "DraftDock", href: "https://draftdock.vercel.app", external: true },
  { label: "DockStudio", href: "/" },
  { label: "Dashboard", href: "/main" },
];

const socialLinks = [
  { icon: Github, href: "https://github.com/abhas-kumar-sinha", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@draftdock.com", label: "Email" },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-8 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 md:p-12 dark:bg-white/[0.98] dark:border-slate-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
            {/* Brand column */}
            <motion.div variants={fadeIn} className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center dark:bg-transparent dark:border-slate-200">
                  <PenLine className="w-3.5 h-3.5 text-white dark:text-[#00042e]" />
                </div>
                <span className="font-headline text-lg font-bold text-white dark:text-[#00042e]">
                  DockStudio
                </span>
              </div>
              <p className="text-sm text-violet-200/50 leading-relaxed mb-6 dark:text-slate-600">
                AI-powered app builder. Describe what you want, approve the
                plan, and watch it run live — a DraftDock feature.
              </p>
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-300 text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Coffee className="w-4 h-4" />
                Buy Me a Coffee
              </a>
            </motion.div>

            {/* Resources */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xs font-semibold text-violet-300/50 uppercase tracking-wider mb-4 dark:text-slate-600">
                Resources
              </h3>
              <ul className="space-y-2.5">
                {resourceLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-violet-200/50 hover:text-white transition-colors inline-flex items-center gap-1 dark:text-slate-600 dark:hover:text-slate-800"
                    >
                      {link.label}
                      {link.external && <ExternalLink className="w-3 h-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xs font-semibold text-violet-300/50 uppercase tracking-wider mb-4 dark:text-slate-600">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-violet-200/50 hover:text-white transition-colors inline-flex items-center gap-1 dark:text-slate-600 dark:hover:text-slate-800"
                    >
                      {link.label}
                      {link.external && <ExternalLink className="w-3 h-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Connect */}
            <motion.div variants={fadeIn}>
              <h3 className="text-xs font-semibold text-violet-300/50 uppercase tracking-wider mb-4 dark:text-slate-600">
                Connect
              </h3>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-violet-200/50 hover:text-white hover:border-white/20 transition-all dark:border-slate-200 dark:text-slate-600 dark:hover:text-slate-800"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-violet-200/40 leading-relaxed dark:text-slate-500">
                Built with Next.js, FastAPI, Claude AI &amp; WebContainers.
              </p>
            </motion.div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 dark:border-slate-200">
            <p className="text-xs text-violet-200/40 dark:text-slate-500">
              &copy; {new Date().getFullYear()} DockStudio &middot; A DraftDock Feature
            </p>
            <p className="text-xs text-violet-200/40 dark:text-slate-500">
              Made with care by the DraftDock team
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
