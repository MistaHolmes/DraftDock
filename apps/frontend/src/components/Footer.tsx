export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-80 text-gray-600 px-6 py-10 text-sm text-center z-10 relative mt-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-center gap-6 flex-wrap">
          <a href="#" className="hover:text-black transition">
            Privacy
          </a>
          <a href="#" className="hover:text-black transition">
            Terms
          </a>
          <a href="#" className="hover:text-black transition">
            Contact
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/MistaHolmes"
            className="hover:text-black transition"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} DraftDock.app. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
