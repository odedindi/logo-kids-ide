export interface TutorialStep {
  id: string;
  titleKey: string;
  contentKey: string;
  hintKey?: string;
  code?: string;
  validation?: (code: string) => boolean;
}

export interface Tutorial {
  id: string;
  titleKey: string;
  descriptionKey: string;
  steps: TutorialStep[];
}

export interface Challenge {
  id: string;
  titleKey: string;
  descriptionKey: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: string;
  validationCode: string;
  hintKeys: string[];
  conceptId: string;
}

export interface ConceptLesson {
  id: string;
  titleKey: string;
  contentKey: string;
  examples: { code: string; descriptionKey: string }[];
  relatedChallenges: string[];
}

export const tutorials: Tutorial[] = [
  {
    id: 'getting-started',
    titleKey: 'tutorials.gettingStarted.title',
    descriptionKey: 'tutorials.gettingStarted.description',
    steps: [
      {
        id: 'welcome',
        titleKey: 'tutorials.gettingStarted.welcome.title',
        contentKey: 'tutorials.gettingStarted.welcome.content',
        code: 'FD 100',
      },
      {
        id: 'turning',
        titleKey: 'tutorials.gettingStarted.turning.title',
        contentKey: 'tutorials.gettingStarted.turning.content',
        code: 'FD 100\nRT 90\nFD 100',
      },
      {
        id: 'repeat',
        titleKey: 'tutorials.gettingStarted.repeat.title',
        contentKey: 'tutorials.gettingStarted.repeat.content',
        code: 'REPEAT 4 [ FD 100 RT 90 ]',
      },
    ],
  },
  {
    id: 'colors-and-pen',
    titleKey: 'tutorials.colorsAndPen.title',
    descriptionKey: 'tutorials.colorsAndPen.description',
    steps: [
      {
        id: 'pen-up-down',
        titleKey: 'tutorials.colorsAndPen.penUpDown.title',
        contentKey: 'tutorials.colorsAndPen.penUpDown.content',
        code: 'FD 100\nPU\nFD 50\nPD\nFD 100',
      },
      {
        id: 'changing-colors',
        titleKey: 'tutorials.colorsAndPen.changingColors.title',
        contentKey: 'tutorials.colorsAndPen.changingColors.content',
        code: 'SETPC 1\nFD 80\nRT 90\nSETPC 2\nFD 80\nRT 90\nSETPC 3\nFD 80\nRT 90\nSETPC 4\nFD 80',
      },
    ],
  },
  {
    id: 'procedures',
    titleKey: 'tutorials.procedures.title',
    descriptionKey: 'tutorials.procedures.description',
    steps: [
      {
        id: 'define-proc',
        titleKey: 'tutorials.procedures.define.title',
        contentKey: 'tutorials.procedures.define.content',
        code: 'TO SQUARE\n  REPEAT 4 [ FD 100 RT 90 ]\nEND',
      },
      {
        id: 'call-proc',
        titleKey: 'tutorials.procedures.call.title',
        contentKey: 'tutorials.procedures.call.content',
        code: 'TO SQUARE\n  REPEAT 4 [ FD 100 RT 90 ]\nEND\n\nSQUARE',
      },
      {
        id: 'params',
        titleKey: 'tutorials.procedures.params.title',
        contentKey: 'tutorials.procedures.params.content',
        code: 'TO BOX :SIZE\n  REPEAT 4 [ FD :SIZE RT 90 ]\nEND\n\nBOX 50\nBOX 100',
      },
    ],
  },
  {
    id: 'conditionals',
    titleKey: 'tutorials.conditionals.title',
    descriptionKey: 'tutorials.conditionals.description',
    steps: [
      {
        id: 'if-basic',
        titleKey: 'tutorials.conditionals.ifBasic.title',
        contentKey: 'tutorials.conditionals.ifBasic.content',
        code: 'TO CHECK :SIZE\n  IF :SIZE > 50 [ FD :SIZE ]\nEND\n\nCHECK 80',
      },
      {
        id: 'ifelse-basic',
        titleKey: 'tutorials.conditionals.ifElseBasic.title',
        contentKey: 'tutorials.conditionals.ifElseBasic.content',
        code: 'TO CHECK :SIZE\n  IFELSE :SIZE > 50 [ FD 80 ] [ FD 30 ]\nEND\n\nCHECK 100',
      },
    ],
  },
];

export const challenges: Challenge[] = [
  {
    id: 'draw-square',
    titleKey: 'challenges.drawSquare.title',
    descriptionKey: 'challenges.drawSquare.description',
    difficulty: 'easy',
    starterCode: '',
    validationCode: 'REPEAT 4 [ FD 100 RT 90 ]',
    hintKeys: ['challenges.drawSquare.hint1', 'challenges.drawSquare.hint2'],
    conceptId: 'repeat',
  },
  {
    id: 'draw-triangle',
    titleKey: 'challenges.drawTriangle.title',
    descriptionKey: 'challenges.drawTriangle.description',
    difficulty: 'easy',
    starterCode: '',
    validationCode: 'REPEAT 3 [ FD 100 RT 120 ]',
    hintKeys: ['challenges.drawTriangle.hint1', 'challenges.drawTriangle.hint2'],
    conceptId: 'repeat',
  },
  {
    id: 'draw-star',
    titleKey: 'challenges.drawStar.title',
    descriptionKey: 'challenges.drawStar.description',
    difficulty: 'medium',
    starterCode: '',
    validationCode: 'REPEAT 5 [ FD 150 RT 144 ]',
    hintKeys: ['challenges.drawStar.hint1', 'challenges.drawStar.hint2'],
    conceptId: 'repeat',
  },
  {
    id: 'draw-hexagon',
    titleKey: 'challenges.drawHexagon.title',
    descriptionKey: 'challenges.drawHexagon.description',
    difficulty: 'easy',
    starterCode: '',
    validationCode: 'REPEAT 6 [ FD 80 RT 60 ]',
    hintKeys: ['challenges.drawHexagon.hint1', 'challenges.drawHexagon.hint2'],
    conceptId: 'repeat',
  },
  {
    id: 'draw-diamond',
    titleKey: 'challenges.drawDiamond.title',
    descriptionKey: 'challenges.drawDiamond.description',
    difficulty: 'medium',
    starterCode: '',
    validationCode: 'REPEAT 2 [ FD 120 RT 60 FD 120 RT 120 ]',
    hintKeys: ['challenges.drawDiamond.hint1', 'challenges.drawDiamond.hint2'],
    conceptId: 'repeat',
  },
  {
    id: 'colorful-shape',
    titleKey: 'challenges.colorfulShape.title',
    descriptionKey: 'challenges.colorfulShape.description',
    difficulty: 'medium',
    starterCode: '',
    validationCode: 'SETPC',
    hintKeys: ['challenges.colorfulShape.hint1', 'challenges.colorfulShape.hint2'],
    conceptId: 'colors',
  },
  {
    id: 'draw-spiral',
    titleKey: 'challenges.drawSpiral.title',
    descriptionKey: 'challenges.drawSpiral.description',
    difficulty: 'hard',
    starterCode: '',
    validationCode: 'TO SPIRAL :SIZE\n  FD :SIZE\n  RT 91\n  SPIRAL :SIZE + 10\nEND\n\nSPIRAL 10',
    hintKeys: ['challenges.drawSpiral.hint1', 'challenges.drawSpiral.hint2', 'challenges.drawSpiral.hint3'],
    conceptId: 'procedures',
  },
  {
    id: 'draw-tree',
    titleKey: 'challenges.drawTree.title',
    descriptionKey: 'challenges.drawTree.description',
    difficulty: 'hard',
    starterCode: '',
    validationCode: 'TO BRANCH',
    hintKeys: ['challenges.drawTree.hint1', 'challenges.drawTree.hint2', 'challenges.drawTree.hint3'],
    conceptId: 'recursion',
  },
];

export const conceptLessons: ConceptLesson[] = [
  {
    id: 'repeat',
    titleKey: 'concepts.repeat.title',
    contentKey: 'concepts.repeat.content',
    examples: [
      { code: 'REPEAT 4 [ FD 100 RT 90 ]', descriptionKey: 'concepts.repeat.example1' },
      { code: 'REPEAT 6 [ FD 50 RT 60 ]', descriptionKey: 'concepts.repeat.example2' },
    ],
    relatedChallenges: ['draw-square', 'draw-triangle', 'draw-star', 'draw-hexagon'],
  },
  {
    id: 'procedures',
    titleKey: 'concepts.procedures.title',
    contentKey: 'concepts.procedures.content',
    examples: [
      { code: 'TO SQUARE\n  REPEAT 4 [ FD 100 RT 90 ]\nEND\n\nSQUARE', descriptionKey: 'concepts.procedures.example1' },
      { code: 'TO STAR :SIZE\n  REPEAT 5 [ FD :SIZE RT 144 ]\nEND\n\nSTAR 150', descriptionKey: 'concepts.procedures.example2' },
    ],
    relatedChallenges: ['draw-spiral'],
  },
  {
    id: 'colors',
    titleKey: 'concepts.colors.title',
    contentKey: 'concepts.colors.content',
    examples: [
      { code: 'SETPC 1\nFD 80', descriptionKey: 'concepts.colors.example1' },
      { code: 'SETPC 2\nFD 80\nSETPC 3\nFD 80', descriptionKey: 'concepts.colors.example2' },
    ],
    relatedChallenges: ['colorful-shape'],
  },
  {
    id: 'pen',
    titleKey: 'concepts.pen.title',
    contentKey: 'concepts.pen.content',
    examples: [
      { code: 'FD 100\nPU\nFD 50\nPD\nFD 100', descriptionKey: 'concepts.pen.example1' },
      { code: 'FD 80\nPU\nHOME\nPD\nSETHEADING 90\nFD 80', descriptionKey: 'concepts.pen.example2' },
    ],
    relatedChallenges: ['draw-diamond'],
  },
  {
    id: 'coordinates',
    titleKey: 'concepts.coordinates.title',
    contentKey: 'concepts.coordinates.content',
    examples: [
      { code: 'SETXY 100 50', descriptionKey: 'concepts.coordinates.example1' },
      { code: 'HOME', descriptionKey: 'concepts.coordinates.example2' },
    ],
    relatedChallenges: [],
  },
  {
    id: 'recursion',
    titleKey: 'concepts.recursion.title',
    contentKey: 'concepts.recursion.content',
    examples: [
      { code: 'TO SPIRAL :SIZE\n  IF :SIZE > 150 [ STOP ]\n  FD :SIZE\n  RT 91\n  SPIRAL :SIZE + 2\nEND\n\nSPIRAL 5', descriptionKey: 'concepts.recursion.example1' },
      { code: 'TO BRANCH :SIZE\n  IF :SIZE < 10 [ STOP ]\n  FD :SIZE\n  RT 30\n  BRANCH :SIZE - 20\n  LT 60\n  BRANCH :SIZE - 20\n  RT 30\n  BK :SIZE\nEND\n\nBRANCH 60', descriptionKey: 'concepts.recursion.example2' },
    ],
    relatedChallenges: ['draw-spiral', 'draw-tree'],
  },
];
