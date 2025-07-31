"use client";

import React, { useRef, useEffect, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

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

// Enhanced ink! and Rust suggestions with more detail
const INK_SUGGESTIONS: InkSuggestion[] = [
  // ink! macros
  {
    text: "#[ink::contract]",
    description: "Marks a module as an ink! smart contract",
    insertText: "#[ink::contract]",
    type: "macro",
  },
  {
    text: "#[ink(storage)]",
    description: "Marks a struct as contract storage - the contract's persistent data",
    insertText: "#[ink(storage)]",
    type: "macro",
  },
  {
    text: "#[ink(constructor)]",
    description: "Marks a function as a contract constructor - called when deploying",
    insertText: "#[ink(constructor)]",
    type: "macro",
  },
  {
    text: "#[ink(message)]",
    description: "Marks a function as a contract message - callable from outside",
    insertText: "#[ink(message)]",
    type: "macro",
  },
  {
    text: "#[ink(event)]",
    description: "Marks a struct as a contract event - emitted during execution",
    insertText: "#[ink(event)]",
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

// Convert our suggestions to Monaco completion items
const createCompletionItems = (suggestions: InkSuggestion[], range: monaco.Range): monaco.languages.CompletionItem[] => {
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
    sortText: `${suggestion.type}_${index.toString().padStart(3, '0')}`, // Sort by type, then order
  }));
};

// Map our types to Monaco completion kinds
const getMonacoKind = (type: string): monaco.languages.CompletionItemKind => {
  switch (type) {
    case "macro":
      return monaco.languages.CompletionItemKind.Snippet;
    case "keyword":
      return monaco.languages.CompletionItemKind.Keyword;
    case "function":
      return monaco.languages.CompletionItemKind.Function;
    case "type":
      return monaco.languages.CompletionItemKind.TypeParameter;
    default:
      return monaco.languages.CompletionItemKind.Text;
  }
};

export default function MonacoCodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  className,
  style,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Register custom completion provider for ink!
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

        // Filter suggestions based on context
        let filteredSuggestions = INK_SUGGESTIONS;
        
        // If we're typing after #[, prioritize ink! macros
        if (textBeforePointer.endsWith('#[')) {
          filteredSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'macro');
        }
        // If we're in an impl block, prioritize functions
        else if (textBeforePointer.includes('impl ') && textBeforePointer.includes('{')) {
          filteredSuggestions = INK_SUGGESTIONS.filter(s => s.type === 'function' || s.type === 'keyword');
        }

        return {
          suggestions: createCompletionItems(filteredSuggestions, range),
        };
      },
    });

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

  // Custom theme that matches the current design
  const defineTheme = (monaco: Monaco) => {
    monaco.editor.defineTheme('inkverse-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '10b981', fontStyle: 'italic' }, // emerald-400
        { token: 'keyword', foreground: 'a855f7' }, // purple-400
        { token: 'string', foreground: '06b6d4' }, // cyan-500
        { token: 'number', foreground: 'f59e0b' }, // amber-500
        { token: 'type', foreground: 'ec4899' }, // pink-500
        { token: 'function', foreground: '3b82f6' }, // blue-500
        { token: 'attribute', foreground: 'f97316' }, // orange-500
      ],
      colors: {
        'editor.background': '#0f172a', // slate-900
        'editor.foreground': '#f1f5f9', // slate-100
        'editor.lineHighlightBackground': '#1e293b40', // slate-800 with opacity
        'editor.selectionBackground': '#a855f750', // purple-500 with opacity
        'editor.inactiveSelectionBackground': '#a855f730',
        'editorCursor.foreground': '#ffffff',
        'editorWhitespace.foreground': '#475569',
        'editorLineNumber.foreground': '#64748b', // slate-500
        'editorLineNumber.activeForeground': '#a855f7', // purple-400
        'editor.selectionHighlightBackground': '#a855f730',
        'editorSuggestWidget.background': '#1e293b', // slate-800
        'editorSuggestWidget.border': '#475569', // slate-600
        'editorSuggestWidget.foreground': '#f1f5f9', // slate-100
        'editorSuggestWidget.selectedBackground': '#a855f750', // purple-500 with opacity
        'editorHoverWidget.background': '#1e293b',
        'editorHoverWidget.border': '#475569',
      },
    });
  };

  return (
    <div 
      className={`h-full w-full rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-sm overflow-hidden ${className || ''}`}
      style={style}
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
          contextmenu: false, // Disable right-click menu for cleaner experience
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          wordBasedSuggestions: false, // Only show our custom suggestions
          parameterHints: {
            enabled: true,
          },
          hover: {
            enabled: true,
            delay: 300,
          },
        }}
        loading={
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
              <div className="text-4xl mb-4">🧬</div>
              <div className="text-slate-300">Loading code editor...</div>
            </div>
          </div>
        }
      />
    </div>
  );
}