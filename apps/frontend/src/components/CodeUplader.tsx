import React, { useState } from "react";

interface CodeUploadBarProps {
  onCodeInsert: (codeSnippet: string) => void;
}

export function CodeUploadBar({ onCodeInsert }: CodeUploadBarProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showModal, setShowModal] = useState(false);

  // Read file and open modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    setLanguage(mapExtToLang(ext));

    const reader = new FileReader();
    reader.onload = () => {
      setCode(reader.result as string);
      setShowModal(true);
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  // Map file extensions to syntax highlighter languages
  const mapExtToLang = (ext: string) => {
    const map: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      jsx: "jsx",
      tsx: "tsx",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      rb: "ruby",
      go: "go",
      php: "php",
      html: "html",
      css: "css",
      json: "json",
      sh: "bash",
      md: "markdown",
    };
    return map[ext] || "text";
  };

  // Confirm insertion and close modal
  const handleInsert = () => {
    const snippet = `\`\`\`${language}\n${code.trim()}\n\`\`\``;
    onCodeInsert(snippet);
    setShowModal(false);
    setCode("");
  };

  // Delete selected lines from code
  const handleDeleteLine = (index: number) => {
    const lines = code.split("\n");
    lines.splice(index, 1);
    setCode(lines.join("\n"));
  };

  return (
    <>
      {/* Thin upload bar */}
      <label
        htmlFor="code-upload"
        className="inline-block cursor-pointer text-sm text-blue-600 underline mb-2"
        title="Upload code file"
      >
        Upload Code Snippet
      </label>
      <input
        id="code-upload"
        type="file"
        accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.rb,.go,.php,.html,.css,.json,.sh,.md,text/plain"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <header className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Preview & Edit Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>

            <div className="flex-1 overflow-auto p-4 bg-black rounded-b-lg text-white font-mono text-sm sm:text-base">
              {code.split("\n").map((line, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    onClick={() => handleDeleteLine(idx)}
                    className="text-red-500 hover:text-red-700 mr-2 select-none"
                    title="Delete this line"
                  >
                    &times;
                  </button>
                  <pre className="whitespace-pre-wrap flex-1">
                    {line || "\u00A0"}
                  </pre>
                </div>
              ))}
            </div>

            <footer className="flex justify-end gap-4 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleInsert}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Code
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
