# Logo Kids IDE

Learn to code by drawing with the turtle! A kid-friendly web IDE where children write Logo programs and watch a turtle draw shapes, patterns, and pictures on a canvas.

## Features

**Logo language engine** — a complete interpreter built from scratch: tokenizer, recursive-descent parser, step-by-step executor with turtle state, and a scheduler that supports run, step, pause, speed control, and reset. Supports movement (FD, BK, LT, RT, HOME, SETHEADING), pen control (PU, PD), colors (SETPC), loops (REPEAT), procedures (TO...END with parameters), conditionals (IF, IFELSE), and more.

**Code editor** — CodeMirror 6 with syntax highlighting, live linting, line numbers, bracket matching, code folding, undo history, and a custom dark theme.

**Turtle canvas** — real-time rendering of turtle graphics. Watch your code come to life as the turtle draws on screen.

**Learning content** — built-in tutorials, challenges, and concept lessons:
- 4 guided tutorials: Getting Started, Colors & Pen, Procedures, Conditionals
- 8 challenges with difficulty badges (easy/medium/hard), starter code, and hints
- 7 concept lessons covering repeat loops, procedures, colors, pen control, coordinates, and recursion
- 10 example programs ready to load and run (square, star, spiral, flower, hexagon, diamond, rainbow, house, tree, robot)

**Command sidebar** — clickable command reference organized by category: Movement, Pen, Drawing, Colors, Control Flow, and Advanced.

**Kid-friendly diagnostics** — error messages written in plain language so young learners understand what went wrong and how to fix it.

**Internationalization** — English and Hebrew, with full right-to-left (RTL) support.

**UI touches** — toolbar with run/step/reset/speed controls, a problems panel for diagnostics, a welcome modal, a celebration overlay, keyboard shortcuts modal, and an accessibility modal.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | ~6 |
| Bundler | Vite | 8 |
| Editor | CodeMirror | 6 |
| i18n | i18next + react-i18next | 26 / 17 |
| Linter | oxlint | 1.71 |
| Unit tests | Vitest | 4 |
| E2E tests | Playwright | 1.61 |
| Package manager | Yarn | 4.17 |

## Getting Started

```bash
# Install dependencies
yarn install

# Start the dev server
yarn dev

# Build for production
yarn build

# Lint
yarn lint

# Run unit tests (vitest)
npx vitest

# Run end-to-end tests (Playwright)
npx playwright test
```

## Project Structure

```
src/
  components/           # React UI components
    education/          # Tutorial, Challenge, and Concept panels
    CodeEditor.tsx      # CodeMirror 6 editor wrapper
    TurtleCanvas.tsx    # Turtle graphics canvas
    Toolbar.tsx         # Run/step/reset controls
    Sidebar.tsx         # Command reference sidebar
    ProblemsPanel.tsx   # Diagnostic messages
    WelcomeModal.tsx    # First-run welcome guide
    CelebrationOverlay.tsx
    ...
  lib/
    logo-core/          # Logo language engine
      tokenizer.ts      # Lexer / token stream
      parser.ts         # Recursive-descent parser
      executor.ts       # Step-by-step interpreter
      scheduler.ts      # Run/step/pause/speed/reset controller
      analyzer.ts       # Semantic analysis + kid-friendly errors
      types.ts          # AST and turtle state types
    editor/             # CodeMirror integration
      logo-language.ts  # Logo syntax highlighting
      logo-lint.ts      # Live lint rules
    education/          # Tutorial, challenge, and lesson data
      content.ts
    canvas/             # Canvas rendering utilities
    i18n.ts             # i18next configuration
  constants/
    examples.ts         # 10 built-in example programs
  locales/
    en.json             # English translations
    he.json             # Hebrew translations (RTL)
  tests/
    logo-core/          # Unit tests for tokenizer, parser, executor, scheduler, analyzer
e2e/                    # Playwright end-to-end tests
```

## Status / Roadmap

This project is in active development. Here's what works and what's still being built:

**Working:**
- Full Logo language engine (tokenize, parse, execute)
- Code editor with syntax highlighting and live linting
- Turtle canvas rendering
- All 4 tutorials, 8 challenges, and 7 concept lessons with content
- 10 loadable example programs
- English and Hebrew locales with RTL
- Unit tests for all logo-core modules
- E2E tests for core app flow

**Known gaps:**
- Challenge validation is not yet functional. The validate handler is a placeholder that always returns true. Challenges can be browsed and their starter code loaded, but there is no automated grading.
- Syntax correction is limited to uppercasing keywords. There is no broader auto-fix or suggestion system.
- No deployment pipeline or hosted version yet.
