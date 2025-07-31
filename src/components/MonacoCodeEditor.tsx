"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Editor, { Monaco, loader } from "@monaco-editor/react";

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface InkSuggestion {
  text: string;
  description: string;
  insertText: string;
  type: "macro" | "keyword" | "function" | "type";
}

// Configure Monaco loader for better performance
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

// Enhanced ink! and Rust suggestions with more detail
const INK_SUGGESTIONS: InkSuggestion[] = [
  // ink! macros
  {
    text: "#[ink::contract]",
    description: "Marks a module as an ink! smart contract",
    insertText: "ink::contract",
    type: "macro",
  },
  {
    text: "#[ink(storage)]",
    description: "Marks a struct as contract storage - the contract's persistent data",
    insertText: "ink(storage)",
    type: "macro",
  },
  {
    text: "#[ink(constructor)]",
    description: "Marks a function as a contract constructor - called when deploying",
    insertText: "ink(constructor)",
    type: "macro",
  },
  {
    text: "#[ink(message)]",
    description: "Marks a function as a contract message - callable from outside",
    insertText: "ink(message)",
    type: "macro",
  },
  {
    text: "#[ink(event)]",
    description: "Marks a struct as a contract event - emitted during execution",
    insertText: "ink(event)",
    type: "macro",
  },

  // Rust patterns for ink!
  {
    text: "pub struct",
    description: "Public structure definition - visible outside the module",
    insertText: "pub struct ${1:StructName} {\n    ${2:field}: ${3:Type},\n}",
    type: "keyword",
  },
  {
    text: "impl",
    description: "Implementation block - defines methods for a type",
    insertText: "impl ${1:TypeName} {\n    ${2:// methods here}\n}",
    type: "keyword",
  },
  {
    text: "pub fn new",
    description: "Constructor function - creates new instances",
    insertText: "pub fn new(${1:params}) -> Self {\n    Self {\n        ${2:// initialization}\n    }\n}",
    type: "function",
  },
  {
    text: "pub fn",
    description: "Public function - callable from outside the module",
    insertText: "pub fn ${1:function_name}(${2:&self}) ${3:-> ReturnType} {\n    ${4:// implementation}\n}",
    type: "keyword",
  },
  {
    text: "fn",
    description: "Private function - only callable within the module",
    insertText: "fn ${1:function_name}(${2:&self}) ${3:-> ReturnType} {\n    ${4:// implementation}\n}",
    type: "keyword",
  },
  {
    text: "Self",
    description: "The implementing type - refers to the current struct/enum",
    insertText: "Self",
    type: "type",
  },
  {
    text: "&self",
    description: "Immutable reference to self - read-only access to contract state",
    insertText: "&self",
    type: "keyword",
  },
  {
    text: "&mut self",
    description: "Mutable reference to self - can modify contract state",
    insertText: "&mut self",
    type: "keyword",
  },
  {
    text: "-> Self",
    description: "Returns Self type - typically used in constructors",
    insertText: "-> Self",
    type: "type",
  },
  {
    text: "-> bool",
    description: "Returns boolean - true or false value",
    insertText: "-> bool",
    type: "type",
  },
  {
    text: "-> Result<T, E>",
    description: "Returns Result type - success (Ok) or error (Err)",
    insertText: "-> Result<${1:T}, ${2:E}>",
    type: "type",
  },

  // Common patterns
  {
    text: "mod",
    description: "Module definition - organizes code into namespaces",
    insertText: "mod ${1:module_name} {\n    ${2:// module content}\n}",
    type: "keyword",
  },
  {
    text: "use",
    description: "Import statement - brings items into scope",
    insertText: "use ${1:path};",
    type: "keyword",
  },
  {
    text: "let",
    description: "Variable binding - creates a new variable",
    insertText: "let ${1:variable} = ${2:value};",
    type: "keyword",
  },
  {
    text: "let mut",
    description: "Mutable variable binding - can be changed after creation",
    insertText: "let mut ${1:variable} = ${2:value};",
    type: "keyword",
  },
  {
    text: "true",
    description: "Boolean true value",
    insertText: "true",
    type: "keyword",
  },
  {
    text: "false",
    description: "Boolean false value",
    insertText: "false",
    type: "keyword",
  },
  {
    text: "bool",
    description: "Boolean type - can be true or false",
    insertText: "bool",
    type: "type",
  },
  {
    text: "u32",
    description: "32-bit unsigned integer - numbers from 0 to 4,294,967,295",
    insertText: "u32",
    type: "type",
  },
  {
    text: "String",
    description: "Growable UTF-8 string type",
    insertText: "String",
    type: "type",
  },
  {
    text: "Vec<T>",
    description: "Dynamic array/list that can grow and shrink",
    insertText: "Vec<${1:T}>",
    type: "type",
  },

  // ink! specific patterns
  {
    text: "ink! constructor template",
    description: "Complete constructor function template",
    insertText: "#[ink(constructor)]\npub fn new(${1:initial_value}: ${2:bool}) -> Self {\n    Self {\n        ${3:field}: ${1:initial_value},\n    }\n}",
    type: "function",
  },
  {
    text: "ink! message template",
    description: "Complete message function template",
    insertText: "#[ink(message)]\npub fn ${1:function_name}(&${2:self}) ${3:-> bool} {\n    ${4:self.field}\n}",
    type: "function",
  },
  {
    text: "ink! mutable message template",
    description: "Complete mutable message function template",
    insertText: "#[ink(message)]\npub fn ${1:function_name}(&mut self) {\n    ${2:self.field = !self.field;}\n}",
    type: "function",
  },
];

// Memoized completion items creation
const createCompletionItems = (suggestions: InkSuggestion[], range: any, monaco: Monaco): any[] => {
  return suggestions.map((suggestion, index) => ({
    label: suggestion.text,
    kind: getMonacoKind(suggestion.type),
    documentation: {
      value: suggestion.description,
      isTrusted: true,
    },
    insertText: suggestion.insertText,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range: range,
    sortText: `${suggestion.type}_${index.toString().padStart(3, '0')}`,
  }));
};

// Map our types to Monaco completion kinds (using numbers for better performance)
const getMonacoKind = (type: string): number => {
  switch (type) {
    case "macro":
      return 27; // Snippet
    case "keyword":
      return 17; // Keyword
    case "function":
      return 2; // Function
    case "type":
      return 25; // TypeParameter
    default:
      return 18; // Text
  }
};

// Global variables to prevent re-registration
let isThemeDefined = false;
let isCompletionProviderRegistered = false;

export default function MonacoCodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  className,
  style,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Memoize filtered suggestions for better performance
  const memoizedSuggestions = useMemo(() => {
    const macroSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'macro');
    const functionSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'function' || s.type === 'keyword');
    return { macroSuggestions, functionSuggestions, allSuggestions: INK_SUGGESTIONS };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
    
    // Delay showing the editor slightly for a smooth transition
    setTimeout(() => {
      setShowEditor(true);
    }, 100);

    // Register custom completion provider only once
    if (!isCompletionProviderRegistered) {
      monaco.languages.registerCompletionItemProvider('rust', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          // Get text before cursor to provide context-aware suggestions
          const textBeforePointer = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Use memoized suggestions based on context
          let filteredSuggestions;
          if (textBeforePointer.endsWith('#[')) {
            filteredSuggestions = memoizedSuggestions.macroSuggestions;
          } else if (textBeforePointer.includes('impl ') && textBeforePointer.includes('{')) {
            filteredSuggestions = memoizedSuggestions.functionSuggestions;
          } else {
            filteredSuggestions = memoizedSuggestions.allSuggestions;
          }

          return {
            suggestions: createCompletionItems(filteredSuggestions, range, monaco),
          };
        },
      });
      isCompletionProviderRegistered = true;
    }

    // Configure editor for better ink! experience
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      lineHeight: 24,
      minimap: {
        enabled: false, // Disable minimap for cleaner look
      },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      selectionHighlight: false,
      bracketPairColorization: {
        enabled: true,
      },
      suggest: {
        showIcons: true,
        showStatusBar: true,
        preview: true,
        previewMode: 'prefix',
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Custom theme with glass-morphism effect matching the lesson page
  const defineTheme = (monaco: Monaco) => {
    if (!isThemeDefined) {
      monaco.editor.defineTheme('inkverse-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '10b981', fontStyle: 'italic' }, // green comments - visible and nice
          { token: 'keyword', foreground: 'a855f7' }, // purple-500 - matches lesson accent
          { token: 'string', foreground: '06b6d4' }, // cyan-500 - matches lesson accent
          { token: 'number', foreground: 'f59e0b' }, // amber-500
          { token: 'type', foreground: 'ec4899' }, // pink-500
          { token: 'function', foreground: '3b82f6' }, // blue-500
          { token: 'attribute', foreground: 'f97316' }, // orange for ink attributes
        ],
        colors: {
          // Transparent background for glass effect
          'editor.background': '#0f172a00', // completely transparent - let container handle the glass effect
          'editor.foreground': '#f1f5f9',
          
          // Subtle line highlighting
          'editor.lineHighlightBackground': '#1e293b20', // very subtle highlight
          
          // Selection colors using lesson accent colors
          'editor.selectionBackground': '#a855f750',
          'editor.inactiveSelectionBackground': '#a855f730',
          'editor.selectionHighlightBackground': '#a855f730',
          
          // Cursor
          'editorCursor.foreground': '#06b6d4', // cyan-500 - lesson accent
          
          // No gutter background - keep it transparent
          'editorGutter.background': '#00000000', // transparent
          'editorLineNumber.foreground': '#64748b',
          'editorLineNumber.activeForeground': '#a855f7',
          
          // Whitespace
          'editorWhitespace.foreground': '#475569',
          
          // Suggestion widget with glass effect
          'editorSuggestWidget.background': '#1e293b90', // semi-transparent
          'editorSuggestWidget.border': '#475569',
          'editorSuggestWidget.foreground': '#f1f5f9',
          'editorSuggestWidget.selectedBackground': '#a855f750',
          
          // Hover widget with glass effect  
          'editorHoverWidget.background': '#1e293b90', // semi-transparent
          'editorHoverWidget.border': '#475569',
        },
      });
      isThemeDefined = true;
    }
  };

  return (
    <div 
      className={`h-full w-full rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-sm bg-white/5 overflow-hidden relative ${className || ''}`}
      style={style}
    >
      {/* Loading State */}
      <div 
        className={`absolute inset-0 flex items-center justify-center backdrop-blur-md bg-white/10 rounded-xl transition-all duration-500 ease-out ${
          showEditor 
            ? 'opacity-0 translate-y-[-20px] pointer-events-none' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">🧬</div>
          <div className="text-slate-300">Loading code editor...</div>
        </div>
      </div>

      {/* Editor */}
      <div 
        className={`h-full w-full transition-all duration-500 ease-out ${
          showEditor 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-[20px]'
        }`}
      >
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={defineTheme}
          theme="inkverse-theme"
          options={{
            readOnly,
            automaticLayout: true,
            contextmenu: false,
            // Disable all side panels
            minimap: { enabled: false },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            wordBasedSuggestions: 'off',
            parameterHints: {
              enabled: true,
            },
            hover: {
              enabled: true,
              delay: 300,
            },
            // Performance optimizations
            renderValidationDecorations: 'off',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}