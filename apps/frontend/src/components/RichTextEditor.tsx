import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Type,
  Palette,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

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
  placeholder = 'Write your blog...',
  className = '',
  error = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    code: false,
  });

  const updateFormats = () => {
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      code: document.queryCommandValue('formatBlock') === 'pre',
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormats();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

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
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch (e) {
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

  const toggleCodeFormat = () => {
    const isCode = document.queryCommandValue('formatBlock') === 'pre';
    execCommand('formatBlock', isCode ? 'div' : 'pre');
    updateFormats();
  };

  const fontSizes = [
    { label: '12px (Tiny)', value: '12px' },
    { label: '14px (Small)', value: '14px' },
    { label: '16px (Default)', value: '16px' },
    { label: '18px (Lead)', value: '18px' },
    { label: '24px (Large)', value: '24px' },
    { label: '36px (Huge)', value: '36px' },
  ];

  const colors = [
    '#1A56DB', '#0E9F6E', '#FACA15', '#F05252', '#FF8A4C', '#0694A2',
    '#B4C6FC', '#8DA2FB', '#5145CD', '#771D1D', '#FCD9BD', '#99154B',
    '#7E3AF2', '#CABFFD', '#D61F69', '#F8B4D9', '#F6C196', '#A4CAFE',
    '#5145CD', '#B43403', '#FCE96A', '#1E429F', '#768FFD', '#BCF0DA',
    '#EBF5FF', '#16BDCA', '#E74694', '#83B0ED', '#03543F', '#111928',
    '#4B5563', '#6B7280', '#D1D5DB', '#F3F4F6', '#F9FAFB',
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
    { label: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  return (
    <div className={`w-full border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-1">
          {/* Basic formatting buttons */}
          <button 
            onClick={() => execCommand('bold')} 
            className={`p-1.5 rounded-sm transition-colors ${formats.bold ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} 
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => execCommand('italic')} 
            className={`p-1.5 rounded-sm transition-colors ${formats.italic ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} 
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => execCommand('underline')} 
            className={`p-1.5 rounded-sm transition-colors ${formats.underline ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} 
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button 
            onClick={() => execCommand('strikeThrough')} 
            className={`p-1.5 rounded-sm transition-colors ${formats.strikeThrough ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} 
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleCodeFormat} 
            className={`p-1.5 rounded-sm transition-colors ${formats.code ? 'text-gray-900 bg-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} 
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFontFamilyDropdown(!showFontFamilyDropdown)}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
              title="Font Family"
            >
              <Type className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFontFamilyDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[180px]">
                {fontFamilies.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontFamily(font.value)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
              title="Font Size"
            >
              <span className="text-xs font-medium">Size</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFontSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleFontSize(size.value)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColorDropdown(!showColorDropdown)}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showColorDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 w-[240px]">
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleTextColor(color)}
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={resetColor}
                  className="flex items-center gap-2 w-full px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Color
                </button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Heading buttons */}
          <button
            onClick={() => execCommand('formatBlock', 'h2')}
            className="px-2 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => execCommand('formatBlock', 'h3')}
            className="px-2 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            title="Heading 3"
          >
            H3
          </button>

          {/* List buttons */}
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            title="Numbered List"
          >
            1. List
          </button>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 rounded-b-lg">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={`min-h-[280px] sm:min-h-[320px] md:min-h-[420px] w-full px-2 py-4 text-gray-800 text-lg sm:text-xl md:text-2xl font-serif leading-relaxed focus:outline-none prose-code:rounded-md prose-code:bg-[#1e1e1e] prose-code:text-white prose-code:px-3 prose-code:py-2 prose-code:font-mono prose-code:whitespace-pre-wrap ${error ? 'border-red-500' : ''}`}
          style={{ wordWrap: 'break-word' }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
        <style>
          {`
            [contenteditable]:empty:before { 
              content: attr(data-placeholder); 
              color: #9ca3af; 
              font-style: italic; 
            }
            pre {
              background-color: #1e1e1e;
              color: white;
              padding: 1rem;
              border-radius: 0.5rem;
              font-family: monospace;
              white-space: pre-wrap;
              overflow-x: auto;
            }
            h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
            h2 { font-size: 1.5em; font-weight: bold; margin: 0.4em 0; }
            h3 { font-size: 1.25em; font-weight: bold; margin: 0.3em 0; }
            ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
            li { margin: 0.25em 0; }
          `}
        </style>
      </div>
    </div>
  );
};

export default RichTextEditor;