import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeEditor } from './components/CodeEditor';
import { TurtleCanvas } from './components/TurtleCanvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { ProblemsPanel } from './components/ProblemsPanel';
import { WelcomeModal } from './components/WelcomeModal';
import { Header } from './components/Header';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { EditorToolbar } from './components/EditorToolbar';
import { ResizeHandle } from './components/ResizeHandle';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { TutorialPanel } from './components/education/TutorialPanel';
import { ChallengePanel } from './components/education/ChallengePanel';
import { ConceptBrowser } from './components/education/ConceptBrowser';
import { LogoScheduler } from './lib/logo-core/scheduler';
import { tokenize } from './lib/logo-core/tokenizer';
import { parse } from './lib/logo-core/parser';
import { analyzeProgram } from './lib/logo-core/analyzer';
import { getDir } from './lib/i18n';
import { validateChallenge } from './lib/education/validation';
import type { ExecutionContext, TurtleState, TraceOp, Diagnostic } from './lib/logo-core/types';
import type { Challenge } from './lib/education/content';
import './App.css';

type SidebarTab = 'commands' | 'tutorials' | 'challenges' | 'concepts';

interface CmView {
  cmView?: { view: { state: { doc: { line: (n: number) => { from: number } }; selection: { anchor: number } }; dispatch: (tr: unknown) => void; focus: () => void } };
}

const LOGO_KEYWORDS = ['TO', 'END', 'FD', 'BK', 'LT', 'RT', 'PU', 'PD', 'SETPC', 'REPEAT',
  'HOME', 'SETXY', 'CS', 'IF', 'IFELSE', 'STOP', 'SETHEADING', 'SETH', 'PRINT', 'PR'];

const DEFAULT_SIDEBAR_WIDTH = 220;
const DEFAULT_CANVAS_WIDTH = 420;
const MIN_SIDEBAR = 160;
const MIN_EDITOR = 300;
const MIN_CANVAS = 280;

function loadPaneWidth(key: string, fallback: number): number {
  const stored = localStorage.getItem(key);
  if (stored) {
    const n = parseInt(stored, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return fallback;
}

function formatCode(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      const upper = trimmed.replace(/\b\w+\b/g, (word) => {
        const upper = word.toUpperCase();
        return LOGO_KEYWORDS.includes(upper) ? upper : word;
      });
      return upper;
    })
    .join('\n');
}

function App() {
  const { t, i18n } = useTranslation();
  const dir = getDir(i18n.language);

  const [code, setCode] = useState('FD 100\nRT 90\nFD 100');
  const [turtle, setTurtle] = useState<TurtleState>({
    x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true,
  });
  const [trace, setTrace] = useState<TraceOp[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('logo-kids-welcome-seen');
  });
  const [activeTab, setActiveTab] = useState<SidebarTab>('commands');
  const [celebrate, setCelebrate] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const wasRunningRef = useRef(false);

  const [sidebarWidth, setSidebarWidth] = useState(() =>
    loadPaneWidth('logo-kids-sidebar-width', DEFAULT_SIDEBAR_WIDTH)
  );
  const [canvasWidth, setCanvasWidth] = useState(() =>
    loadPaneWidth('logo-kids-canvas-width', DEFAULT_CANVAS_WIDTH)
  );

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('logo-kids-sidebar-width', String(sidebarWidth));
    }
  }, [sidebarWidth, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('logo-kids-canvas-width', String(canvasWidth));
    }
  }, [canvasWidth, isMobile]);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((w) => {
      const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
      return Math.max(MIN_SIDEBAR, Math.min(window.innerWidth - MIN_EDITOR - MIN_CANVAS - 20, w + delta * dir));
    });
  }, []);

  const handleCanvasResize = useCallback((delta: number) => {
    setCanvasWidth((w) => {
      const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
      return Math.max(MIN_CANVAS, Math.min(window.innerWidth - MIN_SIDEBAR - MIN_EDITOR - 20, w - delta * dir));
    });
  }, []);

  const handleSidebarReset = useCallback(() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH), []);
  const handleCanvasReset = useCallback(() => setCanvasWidth(DEFAULT_CANVAS_WIDTH), []);

  const schedulerRef = useRef<LogoScheduler | null>(null);

  useEffect(() => {
    schedulerRef.current = new LogoScheduler((ctx: ExecutionContext) => {
      setTurtle({ ...ctx.turtle });
      setTrace([...ctx.trace]);
      setCurrentStep(ctx.trace.length);
      if (ctx.status === 'completed' || ctx.status === 'error') {
        if (ctx.status === 'completed' && ctx.trace.length > 0) {
          setCelebrate(true);
        }
        setIsRunning(false);
      }
    });
  }, []);

  useEffect(() => {
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  const runLint = useCallback((sourceCode: string) => {
    try {
      const tokens = tokenize(sourceCode);
      const ast = parse(tokens);
      const procedures = new Map();
      ast.body.forEach((node) => {
        if (node.type === 'ProcedureDefinition') {
          procedures.set(node.name, node);
        }
      });
      const diags = analyzeProgram(ast, procedures);
      setDiagnostics(diags);
      return { ast, procedures, diags };
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'range' in e) {
        const err = e as Diagnostic;
        setDiagnostics([err]);
        return { ast: null, procedures: new Map(), diags: [err] };
      }
      setDiagnostics([]);
      return { ast: null, procedures: new Map(), diags: [] };
    }
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    runLint(newCode);
  }, [runLint]);

  const handleRun = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;

    const { ast, procedures } = runLint(code);
    if (!ast) return;

    scheduler.load(ast, procedures);
    scheduler.setSpeed(speed);
    setIsRunning(true);
    scheduler.run();
  }, [code, speed, runLint]);

  const handleStep = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;

    if (scheduler.getStatus() === 'idle') {
      const { ast, procedures } = runLint(code);
      if (!ast) return;
      scheduler.load(ast, procedures);
    }

    scheduler.step();
  }, [code, runLint]);

  const handlePause = useCallback(() => {
    schedulerRef.current?.pause();
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    schedulerRef.current?.reset();
    setIsRunning(false);
    setTrace([]);
    setCurrentStep(0);
    setTurtle({
      x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true,
    });
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    schedulerRef.current?.setSpeed(newSpeed);
  }, []);

  const handleInsertCode = useCallback((snippet: string) => {
    setCode((prev) => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + snippet);
  }, []);

  const handleLoadExample = useCallback((exampleCode: string) => {
    setCode(exampleCode);
    handleReset();
  }, [handleReset]);

  const handleCloseWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('logo-kids-welcome-seen', 'true');
  }, []);

  const handleValidateCode = useCallback((codeToTest: string, challenge: Challenge) => {
    return validateChallenge(codeToTest, challenge).success;
  }, []);

  const handleJumpToLine = useCallback((line: number) => {
    const editorEl = document.querySelector('.cm-editor') as (Element & CmView) | null;
    if (editorEl?.cmView?.view) {
      const { view } = editorEl.cmView;
      const pos = view.state.doc.line(line).from;
      view.dispatch({ selection: { anchor: pos } });
      view.focus();
    }
  }, []);

  const handleFormat = useCallback(() => {
    setCode((prev) => formatCode(prev));
  }, []);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isRunning) handlePause();
        else handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        handleStep();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        handleReset();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleFormat();
      }
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--editor-font-size')) || 16;
        const next = Math.min(28, current + 1);
        document.documentElement.style.setProperty('--editor-font-size', `${next}px`);
        localStorage.setItem('logo-kids-font-size', String(next));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--editor-font-size')) || 16;
        const next = Math.max(10, current - 1);
        document.documentElement.style.setProperty('--editor-font-size', `${next}px`);
        localStorage.setItem('logo-kids-font-size', String(next));
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isRunning, handleRun, handlePause, handleStep, handleReset, handleFormat]);

  const tabKeys: SidebarTab[] = ['commands', 'tutorials', 'challenges', 'concepts'];

  const sidebarStyle = isMobile ? {} : { width: sidebarWidth, minWidth: sidebarWidth };
  const canvasStyle = isMobile ? {} : { width: canvasWidth, minWidth: canvasWidth };

  return (
    <div className="app" dir={dir}>
      <Header onOpenShortcuts={() => setShowShortcuts(true)} onOpenAccessibility={() => setShowAccessibility(true)} />

      <div className="main-layout">
        <aside className="sidebar" dir={dir} role="complementary" aria-label={t('ariaLabels.sidebar')} style={sidebarStyle}>
          <nav className="sidebar-tabs" role="tablist" aria-label={t('sidebar.title')}>
            {tabKeys.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`sidebar-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </nav>

          <div className="sidebar-content" role="tabpanel">
            {activeTab === 'commands' && <Sidebar onInsertCode={handleInsertCode} embedded />}
            {activeTab === 'tutorials' && <TutorialPanel onLoadCode={handleInsertCode} />}
            {activeTab === 'challenges' && (
              <ChallengePanel
                onLoadCode={handleInsertCode}
                onValidateCode={handleValidateCode}
                code={code}
              />
            )}
            {activeTab === 'concepts' && <ConceptBrowser onLoadCode={handleInsertCode} />}
          </div>
        </aside>

        {!isMobile && (
          <ResizeHandle
            direction="horizontal"
            onResize={handleSidebarResize}
            onDoubleClick={handleSidebarReset}
            min={MIN_SIDEBAR}
            max={window.innerWidth - MIN_EDITOR - MIN_CANVAS}
            current={sidebarWidth}
          />
        )}

        <div className="editor-section">
          <div className="editor-panel" role="region" aria-label={t('ariaLabels.mainEditor')}>
            <EditorToolbar onFormat={handleFormat} />
            <CodeEditor value={code} onChange={handleCodeChange} className="code-editor" />
          </div>

          <ProblemsPanel diagnostics={diagnostics} onJumpToLine={handleJumpToLine} />
        </div>

        {!isMobile && (
          <ResizeHandle
            direction="horizontal"
            onResize={handleCanvasResize}
            onDoubleClick={handleCanvasReset}
            min={MIN_CANVAS}
            max={window.innerWidth - MIN_SIDEBAR - MIN_EDITOR}
            current={canvasWidth}
          />
        )}

        <div className="canvas-section" role="region" aria-label={t('ariaLabels.turtleCanvas')} style={canvasStyle}>
          <Toolbar
            isRunning={isRunning}
            speed={speed}
            onRun={handleRun}
            onStep={handleStep}
            onPause={handlePause}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onLoadExample={handleLoadExample}
          />

          <TurtleCanvas
            trace={trace}
            turtle={turtle}
            currentStep={currentStep}
            isAnimating={isRunning}
            className="turtle-canvas"
          />

          <div className="turtle-readout" aria-live="polite">
            <span>x: {Math.round(turtle.x)}</span>
            <span>y: {Math.round(turtle.y)}</span>
            <span>heading: {Math.round(turtle.heading)}°</span>
            <span>pen: {turtle.penDown ? 'down' : 'up'}</span>
          </div>
        </div>
      </div>

      <CelebrationOverlay show={celebrate} />
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showAccessibility && <AccessibilityModal onClose={() => setShowAccessibility(false)} />}
    </div>
  );
}

export default App;
