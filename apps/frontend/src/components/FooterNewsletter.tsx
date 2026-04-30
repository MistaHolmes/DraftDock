'use client';

import { Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

const footerColumns = [
  {
    title: 'Solutions',
    links: [
      'Business Automation',
      'Cloud Services',
      'Analytics',
      'Integrations',
      'Support',
    ],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'Case Studies', 'Blog', 'Webinars', 'Community'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Contact', 'Partners', 'Press'],
  },
];

const legalLinks = [
  'Terms of Service',
  'Privacy Policy',
  'Cookie Settings',
  'Accessibility',
];

const socialIcons = [
  { icon: <Instagram className="h-5 w-5" />, href: '#' },
  { icon: <Twitter className="h-5 w-5" />, href: '#' },
  { icon: <Linkedin className="h-5 w-5" />, href: '#' },
  { icon: <Youtube className="h-5 w-5" />, href: '#' },
];

export default function FooterNewsletter() {
  return (
    <footer className="bg-background text-foreground relative w-full pt-20 pb-10 dark:bg-gray-900 dark:text-slate-200">
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
        <div className="bg-primary absolute top-1/3 left-1/4 h-64 w-64 rounded-full opacity-10 blur-3xl" />
        <div className="bg-primary absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full opacity-10 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-effect mb-16 rounded-2xl p-8 md:p-12 bg-white dark:bg-gray-800/40 bg-opacity-60 dark:bg-opacity-30">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-2xl font-bold md:text-3xl text-gray-900 dark:text-white">
                Stay ahead with DraftDock
              </h3>
              <p className="text-foreground/70 mb-6 dark:text-slate-300">
                Join thousands of professionals who trust DraftDock for
                innovative writing and discovery.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="border-foreground/20 bg-background dark:bg-gray-900/60 focus:ring-accent rounded-lg border px-4 py-3 focus:ring-2 focus:outline-none w-full sm:w-auto"
                />
                <button className="bg-accent text-white rounded-lg px-6 py-3 font-medium shadow-lg transition">
                  Subscribe Now
                </button>
              </div>
            </div>
            <div className="hidden justify-end md:flex">
              <div className="relative">
                <div className="bg-accent/20 absolute inset-0 rotate-6 rounded-xl" />
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&h=240&q=80"
                  alt="DraftDock team"
                  className="relative w-80 rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6 flex items-center space-x-2">
              <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">DraftDock</span>
            </div>
            <p className="text-foreground/60 mb-6 dark:text-slate-400">
              Empowering writers with reliable, scalable, and innovative
              tools.
            </p>
            <div className="flex space-x-4">
              {socialIcons.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="glass-effect hover:bg-accent/10 flex h-10 w-10 items-center justify-center rounded-full transition"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((text) => (
                  <li key={text}>
                    <a
                      href="#"
                      className="text-foreground/60 hover:text-foreground transition dark:text-slate-300"
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-foreground/10 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
          <p className="text-foreground/60 mb-4 text-sm md:mb-0 dark:text-slate-400">
            © {new Date().getFullYear()} DraftDock. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {legalLinks.map((text) => (
              <a
                key={text}
                href="#"
                className="text-foreground/60 hover:text-foreground text-sm dark:text-slate-300"
              >
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
