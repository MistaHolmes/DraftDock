import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Code, Type, Palette, RotateCcw } from 'lucide-react';

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
  placeholder = "Write your blog...",
  className = "",
  error = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleFontSize = (size: string) => {
    execCommand('fontSize', '3');
    // After setting fontSize, we need to wrap the selection in a span with the desired size
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch (e) {
        // If we can't surround contents, insert the span
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setShowFontSizeDropdown(false);
    handleInput();
  };

  const handleTextColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorDropdown(false);
  };

  const handleFontFamily = (fontFamily: string) => {
    execCommand('fontName', fontFamily);
    setShowFontFamilyDropdown(false);
  };

  const resetColor = () => {
    execCommand('foreColor', '#000000');
    setShowColorDropdown(false);
  };

  const fontSizes = [
    { label: '12px (Tiny)', value: '12px' },
    { label: '14px (Small)', value: '14px' },
    { label: '16px (Default)', value: '16px' },
    { label: '18px (Lead)', value: '18px' },
    { label: '24px (Large)', value: '24px' },
    { label: '36px (Huge)', value: '36px' }
  ];

  const colors = [
    '#1A56DB', '#0E9F6E', '#FACA15', '#F05252', '#FF8A4C', '#0694A2',
    '#B4C6FC', '#8DA2FB', '#5145CD', '#771D1D', '#FCD9BD', '#99154B',
    '#7E3AF2', '#CABFFD', '#D61F69', '#F8B4D9', '#F6C196', '#A4CAFE',
    '#5145CD', '#B43403', '#FCE96A', '#1E429F', '#768FFD', '#BCF0DA',
    '#EBF5FF', '#16BDCA', '#E74694', '#83B0ED', '#03543F', '#111928',
    '#4B5563', '#6B7280', '#D1D5DB', '#F3F4F6', '#F9FAFB'
  ];

  const fontFamilies = [
    { label: 'Default', value: 'Inter, ui-sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Lucida Sans Unicode', value: 'Lucida Sans Unicode, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' }
  ];

  return (
    <div className={`w-full border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-1">
          {/* Basic formatting */}
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          {/* Code */}
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'pre')}
            className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Font Size Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
              className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Font Size"
            >
              <Type className="w-4 h-4" />
            </button>
            
            {showFontSizeDropdown && (
              <div className="absolute top-full left-0 z-10 w-40 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                <div className="p-1">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => handleFontSize(size.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      style={{ fontSize: size.value }}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
            </button>
            
            {showColorDropdown && (
              <div className="absolute top-full left-0 z-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                <div className="p-2">
                  <div className="grid grid-cols-6 gap-1 mb-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleTextColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={resetColor}
                    className="w-full px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Color
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontFamilyDropdown(!showFontFamilyDropdown)}
              className="p-1.5 text-gray-500 rounded-sm hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Font Family"
            >
              <span className="text-xs font-medium">Aa</span>
            </button>
            
            {showFontFamilyDropdown && (
              <div className="absolute top-full left-0 z-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                <div className="p-1">
                  {fontFamilies.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handleFontFamily(font.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="px-4 py-2 bg-white rounded-b-lg">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={`min-h-[280px] sm:min-h-[320px] md:min-h-[420px] w-full px-2 py-4 text-gray-800 text-lg sm:text-xl md:text-2xl font-serif leading-relaxed focus:outline-none ${
            error ? 'border-red-500' : ''
          }`}
          style={{ wordWrap: 'break-word' }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
        
        <style>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            font-style: italic;
          }
        `}</style>
      </div>
    </div>
  );
};

export default RichTextEditor;