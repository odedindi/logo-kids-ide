import { StreamParser, StreamLanguage } from '@codemirror/language';

interface LogoState {
  inComment: boolean;
  afterTo: boolean;
}

const LOGO_KEYWORDS = new Set([
  'FD', 'FORWARD', 'BK', 'BACK', 'LT', 'LEFT', 'RT', 'RIGHT',
  'PU', 'PENUP', 'PD', 'PENDOWN',
  'REPEAT', 'TO', 'END', 'IF', 'IFELSE', 'STOP',
  'SETPC', 'SETPENCOLOR', 'SETXY', 'SETHEADING', 'SETH',
  'HOME', 'CS', 'CLEARSCREEN', 'PRINT', 'PR',
]);

const COLOR_NAMES = new Set([
  'RED', 'BLUE', 'GREEN', 'YELLOW', 'BLACK', 'WHITE', 'ORANGE',
  'PURPLE', 'PINK', 'BROWN', 'CYAN', 'MAGENTA', 'GREY', 'GRAY',
]);

const logoStreamParser: StreamParser<LogoState> = {
  startState(): LogoState {
    return { inComment: false, afterTo: false };
  },

  token(stream, state): string | null {
    if (state.inComment) {
      stream.skipToEnd();
      state.inComment = false;
      return 'comment';
    }

    if (stream.match(';')) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match(/\s+/)) {
      return 'whitespace';
    }

    if (stream.match('[')) return 'bracket';
    if (stream.match(']')) return 'bracket';
    if (stream.match('(')) return 'paren';
    if (stream.match(')')) return 'paren';

    if (stream.match(/^"[a-zA-Z_]\w*/)) return 'string';

    if (stream.match(/^[+\-*/]/)) return 'operator';

    if (stream.match(/^-?\d+(\.\d+)?/)) return 'number';

    if (stream.match(/^:[a-zA-Z_]\w*/)) return 'variableName';

    if (stream.match(/^[a-zA-Z_]\w*/)) {
      const word = stream.current().toUpperCase();

      if (state.afterTo) {
        state.afterTo = false;
        return 'function';
      }

      if (word === 'TO') {
        state.afterTo = true;
        return 'keyword';
      }

      if (LOGO_KEYWORDS.has(word)) {
        if (word === 'END') return 'keyword';
        if (word === 'REPEAT') return 'keyword';
        return 'keyword';
      }

      if (COLOR_NAMES.has(word)) return 'string';
    }

    stream.next();
    return null;
  },
};

export const logoLanguage = StreamLanguage.define(logoStreamParser);
