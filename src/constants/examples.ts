export type ExampleId = 'square' | 'star' | 'spiral' | 'flower' | 'hexagon' | 'diamond' | 'rainbow' | 'house' | 'tree' | 'robot'

export interface ExampleProgram {
  id: ExampleId
  nameKey: `examples.${string}`
  code: string
}

export const EXAMPLE_PROGRAMS: readonly ExampleProgram[] = [
  {
    id: 'square',
    nameKey: 'examples.square',
    code: 'REPEAT 4 [ FD 100 RT 90 ]',
  },
  {
    id: 'star',
    nameKey: 'examples.star',
    code: 'REPEAT 5 [ FD 150 RT 144 ]',
  },
  {
    id: 'hexagon',
    nameKey: 'examples.hexagon',
    code: 'REPEAT 6 [ FD 80 RT 60 ]',
  },
  {
    id: 'diamond',
    nameKey: 'examples.diamond',
    code: 'REPEAT 2 [ FD 120 RT 60 FD 120 RT 120 ]',
  },
  {
    id: 'flower',
    nameKey: 'examples.flower',
    code: [
      'TO PETAL',
      '  REPEAT 36 [ FD 4 RT 10 ]',
      '  RT 180',
      '  REPEAT 36 [ FD 4 RT 10 ]',
      '  RT 180',
      'END',
      '',
      'REPEAT 12 [',
      '  PETAL',
      '  RT 30',
      ']',
    ].join('\n'),
  },
  {
    id: 'spiral',
    nameKey: 'examples.spiral',
    code: [
      'TO SPIRAL :SIZE',
      '  IF :SIZE > 150 [ STOP ]',
      '  FD :SIZE',
      '  RT 91',
      '  SPIRAL :SIZE + 2',
      'END',
      '',
      'SPIRAL 5',
    ].join('\n'),
  },
  {
    id: 'rainbow',
    nameKey: 'examples.rainbow',
    code: [
      'TO RAINBOW',
      '  SETPC 1',
      '  REPEAT 6 [ FD 80 RT 60 ]',
      '  PU HOME PD',
      '  SETPC 2',
      '  REPEAT 6 [ FD 60 RT 60 ]',
      '  PU HOME PD',
      '  SETPC 3',
      '  REPEAT 6 [ FD 40 RT 60 ]',
      'END',
      '',
      'RAINBOW',
    ].join('\n'),
  },
  {
    id: 'house',
    nameKey: 'examples.house',
    code: [
      'TO WALL',
      '  FD 80',
      '  RT 90',
      '  FD 100',
      '  RT 90',
      '  FD 80',
      '  RT 90',
      '  FD 100',
      '  RT 90',
      'END',
      '',
      'TO ROOF',
      '  RT 45',
      '  FD 80',
      '  RT 90',
      '  FD 80',
      'END',
      '',
      'WALL',
      'PU HOME PD',
      'SETHEADING 45',
      'FD 50',
      'ROOF',
    ].join('\n'),
  },
  {
    id: 'tree',
    nameKey: 'examples.tree',
    code: [
      'TO BRANCH :SIZE',
      '  IF :SIZE < 10 [ STOP ]',
      '  FD :SIZE',
      '  RT 30',
      '  BRANCH :SIZE - 20',
      '  LT 60',
      '  BRANCH :SIZE - 20',
      '  RT 30',
      '  BK :SIZE',
      'END',
      '',
      'BRANCH 80',
    ].join('\n'),
  },
  {
    id: 'robot',
    nameKey: 'examples.robot',
    code: [
      'SETHEADING 0',
      'SETPC 4',
      'FD 60',
      'RT 90',
      'FD 80',
      'RT 90',
      'FD 60',
      'RT 90',
      'FD 80',
      'RT 90',
      'PU FD 20 PD',
      'SETPC 1',
      'FD 15',
      'PU BK 55 PD',
      'FD 15',
      'PU HOME PD',
      'SETPC 4',
      'SETHEADING 270',
      'FD 40',
      'BK 40',
      'SETHEADING 0',
      'FD 30',
      'RT 90',
      'FD 20',
      'LT 90',
      'FD 20',
      'LT 90',
      'FD 20',
    ].join('\n'),
  },
] as const

export type SidebarCommandCategory =
  | 'movement'
  | 'pen'
  | 'drawing'
  | 'colors'
  | 'controlFlow'
  | 'advanced'

export interface SidebarCommand {
  label: string
  code: string
  description: string
}

export interface SidebarCommandGroup {
  category: SidebarCommandCategory
  categoryKey: `sidebar.categories.${SidebarCommandCategory}`
  commands: readonly SidebarCommand[]
}

export const SIDEBAR_COMMANDS: readonly SidebarCommandGroup[] = [
  {
    category: 'movement',
    categoryKey: 'sidebar.categories.movement',
    commands: [
      { label: 'FD 50', code: 'FD 50', description: 'Move forward 50 steps' },
      { label: 'BK 50', code: 'BK 50', description: 'Move backward 50 steps' },
      { label: 'LT 90', code: 'LT 90', description: 'Turn left 90 degrees' },
      { label: 'RT 90', code: 'RT 90', description: 'Turn right 90 degrees' },
      { label: 'HOME', code: 'HOME', description: 'Return to center' },
      { label: 'SETH 0', code: 'SETH 0', description: 'Set heading to 0 (up)' },
    ],
  },
  {
    category: 'pen',
    categoryKey: 'sidebar.categories.pen',
    commands: [
      { label: 'PU', code: 'PU', description: 'Pen up — stop drawing' },
      { label: 'PD', code: 'PD', description: 'Pen down — start drawing' },
    ],
  },
  {
    category: 'drawing',
    categoryKey: 'sidebar.categories.drawing',
    commands: [
      {
        label: 'REPEAT 4 [...]',
        code: 'REPEAT 4 [ FD 50 RT 90 ]',
        description: 'Draw a square',
      },
      {
        label: 'REPEAT 3 [...]',
        code: 'REPEAT 3 [ FD 80 RT 120 ]',
        description: 'Draw a triangle',
      },
      {
        label: 'REPEAT 6 [...]',
        code: 'REPEAT 6 [ FD 60 RT 60 ]',
        description: 'Draw a hexagon',
      },
    ],
  },
  {
    category: 'colors',
    categoryKey: 'sidebar.categories.colors',
    commands: [
      { label: 'SETPC 1', code: 'SETPC 1', description: 'Set pen to red' },
      { label: 'SETPC 2', code: 'SETPC 2', description: 'Set pen to blue' },
      { label: 'SETPC 3', code: 'SETPC 3', description: 'Set pen to green' },
      { label: 'SETPC 4', code: 'SETPC 4', description: 'Set pen to yellow' },
      { label: 'SETPC 5', code: 'SETPC 5', description: 'Set pen to purple' },
    ],
  },
  {
    category: 'controlFlow',
    categoryKey: 'sidebar.categories.controlFlow',
    commands: [
      {
        label: 'IF :X > 10 [...]',
        code: 'IF :X > 10 [ FD 50 ]',
        description: 'Conditional execution',
      },
      {
        label: 'IFELSE [...][...]',
        code: 'IFELSE :X > 10 [ FD 50 ] [ BK 50 ]',
        description: 'If-else conditional',
      },
      {
        label: 'TO name ... END',
        code: 'TO MY_PROC\n  FD 50\nEND',
        description: 'Define a procedure',
      },
    ],
  },
  {
    category: 'advanced',
    categoryKey: 'sidebar.categories.advanced',
    commands: [
      { label: 'CS', code: 'CS', description: 'Clear screen' },
      { label: 'SETXY 50 50', code: 'SETXY 50 50', description: 'Move to position' },
      { label: 'PRINT "hello', code: 'PRINT "hello', description: 'Print a message' },
    ],
  },
] as const
