import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Github,
  Twitter,
  Linkedin,
  Coffee,
  MapPin,
  ExternalLink,
  PenLine,
} from "lucide-react";
import {
  FooterBackgroundGradient,
  TextHoverEffect,
} from "@/components/ui/hover-footer";

export function Footer() {
  const [play, setPlay] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (triggeredRef.current) return;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;
      if (atBottom) {
        triggeredRef.current = true;
        setPlay(true);
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    // check immediately in case user is already at bottom
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  type FooterLink = { label: string; href: string; external?: boolean; pulse?: boolean };
  type FooterSection = { title: string; links: FooterLink[] };

  const footerLinks: FooterSection[] = [
    {
      title: "Resources",
      links: [
        { label: "My Story", href: "/my-story" },
        { label: "Contact", href: "/contact" },
        {
          label: "API Docs",
          href: "https://app.swaggerhub.com/apis/mistaholmes/DraftDock/0.0.1",
          external: true,
        },
      ],
    },
    {
      title: "Quick Links",
      links: [
        { label: "Draft a Blog", href: "/create-blog" },
        { label: "Explore Drafts", href: "/blogs" },
        { label: "Support", href: "/contact", pulse: true },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={16} className="text-accent flex-shrink-0" />,
      text: "hello@draftdock.app",
      href: "mailto:hello@draftdock.app",
    },
    {
      icon: <MapPin size={16} className="text-accent flex-shrink-0" />,
      text: "DraftDock.app",
    },
  ];

  const socialLinks = [
    {
      icon: <Github size={18} />,
      label: "GitHub",
      href: "https://github.com/MistaHolmes/DraftDock",
    },
    {
      icon: <Twitter size={18} />,
      label: "Twitter",
      href: "https://x.com/AbhasBehera1",
    },
    {
      icon: <Linkedin size={18} />,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/abhash-behera-70b77528b/",
    },
  ];

  return (
    <footer className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-sm relative h-fit rounded-3xl overflow-hidden m-4 md:m-8 border border-slate-200/80 dark:border-gray-800 shadow-sm text-slate-600 dark:text-slate-200">
      <div className="max-w-7xl mx-auto p-8 md:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 lg:gap-16 pb-12">

          {/* Brand section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
              <PenLine className="text-accent w-7 h-7" strokeWidth={2.5} />
              <span className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">
                DraftDock
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
              A modern platform for writing, sharing, and discovering
              thoughtful drafts and blogs.
            </p>
            <a
              href="https://coff.ee/abhastheain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition-colors font-medium text-sm w-fit shadow-sm hover:shadow"
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
            </a>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-slate-900 dark:text-slate-100 text-base font-semibold mb-5">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-slate-700 dark:text-slate-300 hover:text-accent transition-colors text-sm flex items-center gap-1 font-semibold"
                    >
                      {link.label}
                      {link.external && (
                        <ExternalLink size={11} className="opacity-60" />
                      )}
                    </a>
                    {link.pulse && (
                      <span className="absolute top-1 right-[-10px] w-2 h-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect section */}
          <div>
              <h4 className="text-slate-900 dark:text-slate-100 text-base font-semibold mb-5">
              Connect
            </h4>
            <ul className="space-y-3 mb-6">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-2">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-slate-700 dark:text-slate-300 hover:text-accent transition-colors text-sm font-medium"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-slate-500 text-sm">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
              <div className="flex gap-3">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-accent transition-all shadow-sm"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-t border-slate-200 my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs space-y-2 md:space-y-0 text-slate-400">
          <p>&copy; {new Date().getFullYear()} DraftDock.app. All rights reserved.</p>
          <p>Built with ♡ for writers everywhere</p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[28rem] -mt-48 -mb-32">
        <TextHoverEffect text="DraftDock" className="z-50" play={play} />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
