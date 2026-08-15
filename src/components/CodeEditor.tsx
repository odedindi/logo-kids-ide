import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, rectangularSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { logoLanguage } from '../lib/editor/logo-language';
import { logoLinter } from '../lib/editor/logo-lint';
import { lintGutter } from '@codemirror/lint';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const theme = EditorView.theme({
  '&': {
    fontSize: 'var(--editor-font-size, 16px)',
    fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
    height: '100%',
    backgroundColor: 'var(--bg-panel)',
  },
  '.cm-content': {
    padding: '12px 0',
    lineHeight: '1.6',
    caretColor: 'var(--primary-dark)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '2px solid var(--border)',
    color: 'var(--text-muted)',
    fontFamily: '"Fira Code", monospace',
    fontSize: '13px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--border)',
    color: 'var(--primary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--primary-dark)',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent) !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
    outline: '2px solid var(--warning)',
    borderRadius: '2px',
  },
  '.cm-foldGutter': {
    width: '14px',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '14px',
    boxShadow: 'var(--shadow-md)',
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    borderBottom: '2px wavy var(--error)',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    borderBottom: '2px wavy var(--warning)',
  },
  '.cm-lint-marker-error': {
    color: 'var(--error)',
  },
  '.cm-lint-marker-warning': {
    color: 'var(--warning)',
  },
});

const logoHighlighting = syntaxHighlighting(defaultHighlightStyle, { fallback: true });

export function CodeEditor({ value, onChange, className }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const createView = useCallback(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        foldGutter(),
        logoLanguage,
        logoLinter,
        lintGutter(),
        logoHighlighting,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        theme,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
  }, []);

  useEffect(() => {
    createView();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [createView]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return <div ref={containerRef} className={className} />;
}
