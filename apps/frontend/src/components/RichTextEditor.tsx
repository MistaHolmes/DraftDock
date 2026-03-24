import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useAuth } from '@clerk/clerk-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your blog in Markdown (e.g. ```bash for code blocks)...',
  className = '',
  error = false,
}) => {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }
      const data = await response.json();

      const markdownImage = `\n![${file.name}](${data.url})\n`;
      onChange(value + markdownImage);
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(`Image Upload Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`w-full bg-white rounded-lg overflow-hidden border ${error ? 'border-red-500' : 'border-gray-200'} ${className} relative`}
      data-color-mode="light"
    >
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={500}
        preview="edit"
        extraCommands={[]} // Removes the full-screen button since it normally lives in extraCommands
        visibleDragbar={true} // Explicitly strictly enables the draggable resize bar
        className="w-full !border-none custom-md-editor"
        textareaProps={{
          placeholder: placeholder,
          onDrop: (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
              e.preventDefault();
              handleImageUpload(file);
            }
          },
          onPaste: (e) => {
            const file = e.clipboardData.files[0];
            if (file) {
              e.preventDefault();
              handleImageUpload(file);
            }
          }
        }}
        previewOptions={{
          rehypePlugins: [], // Can add rehypeSanitize here if needed, but MDEditor is generally safe for input
        }}
      />
      <style>
        {`
          /* Custom CSS to make the Markdown Editor look integrated */
          .custom-md-editor.w-md-editor {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .custom-md-editor .w-md-editor-toolbar {
            background-color: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
            padding: 8px 16px !important;
          }
          /* Prettier syntax highlighted code blocks in both preview and blog view */
          .wmde-markdown pre {
            background-color: #1e1e1e !important;
            border-radius: 0.5rem !important;
          }
          .wmde-markdown pre > code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            background-color: transparent !important;
            color: #d4d4d4 !important;
            font-size: 0.95rem !important;
          }
        `}
      </style>

      {isUploading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">hourglass_empty</span>
            <span className="text-sm font-bold text-primary tracking-widest uppercase">Uploading to Cloud...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
