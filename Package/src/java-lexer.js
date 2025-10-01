// Java-specific Lexer for parsing functions, methods, and imports

class Token {
  constructor(type, value, line = 1, column = 1, position = 0) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.position = position;
  }

  toString() {
    return `Token(${this.type}, ${this.value}, ${this.line}:${this.column})`;
  }
}

// Java-specific token types
const JavaTokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  CHAR: 'CHAR',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  
  // Identifiers and Keywords
  IDENTIFIER: 'IDENTIFIER',
  
  // Java Keywords
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  PROTECTED: 'PROTECTED',
  STATIC: 'STATIC',
  FINAL: 'FINAL',
  ABSTRACT: 'ABSTRACT',
  SYNCHRONIZED: 'SYNCHRONIZED',
  NATIVE: 'NATIVE',
  VOLATILE: 'VOLATILE',
  TRANSIENT: 'TRANSIENT',
  
  CLASS: 'CLASS',
  INTERFACE: 'INTERFACE',
  ENUM: 'ENUM',
  EXTENDS: 'EXTENDS',
  IMPLEMENTS: 'IMPLEMENTS',
  IMPORT: 'IMPORT',
  PACKAGE: 'PACKAGE',
  
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  WHILE: 'WHILE',
  DO: 'DO',
  SWITCH: 'SWITCH',
  CASE: 'CASE',
  DEFAULT: 'DEFAULT',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  RETURN: 'RETURN',
  TRY: 'TRY',
  CATCH: 'CATCH',
  FINALLY: 'FINALLY',
  THROW: 'THROW',
  THROWS: 'THROWS',
  
  NEW: 'NEW',
  THIS: 'THIS',
  SUPER: 'SUPER',
  INSTANCEOF: 'INSTANCEOF',
  
  // Primitive types
  VOID: 'VOID',
  BOOLEAN_TYPE: 'BOOLEAN_TYPE',
  BYTE: 'BYTE',
  SHORT: 'SHORT',
  INT: 'INT',
  LONG: 'LONG',
  FLOAT: 'FLOAT',
  DOUBLE: 'DOUBLE',
  CHAR_TYPE: 'CHAR_TYPE',
  
  // Operators
  PLUS: 'PLUS',           // +
  MINUS: 'MINUS',         // -
  MULTIPLY: 'MULTIPLY',   // *
  DIVIDE: 'DIVIDE',       // /
  MODULO: 'MODULO',       // %
  
  INCREMENT: 'INCREMENT', // ++
  DECREMENT: 'DECREMENT', // --
  
  // Assignment
  ASSIGN: 'ASSIGN',       // =
  PLUS_ASSIGN: 'PLUS_ASSIGN',     // +=
  MINUS_ASSIGN: 'MINUS_ASSIGN',   // -=
  MULTIPLY_ASSIGN: 'MULTIPLY_ASSIGN', // *=
  DIVIDE_ASSIGN: 'DIVIDE_ASSIGN',     // /=
  MODULO_ASSIGN: 'MODULO_ASSIGN',     // %=
  
  // Comparison
  EQUAL: 'EQUAL',         // ==
  NOT_EQUAL: 'NOT_EQUAL', // !=
  LESS_THAN: 'LESS_THAN', // <
  GREATER_THAN: 'GREATER_THAN', // >
  LESS_EQUAL: 'LESS_EQUAL',     // <=
  GREATER_EQUAL: 'GREATER_EQUAL', // >=
  
  // Logical
  AND: 'AND',             // &&
  OR: 'OR',               // ||
  NOT: 'NOT',             // !
  
  // Bitwise
  BITWISE_AND: 'BITWISE_AND',     // &
  BITWISE_OR: 'BITWISE_OR',       // |
  BITWISE_XOR: 'BITWISE_XOR',     // ^
  BITWISE_NOT: 'BITWISE_NOT',     // ~
  LEFT_SHIFT: 'LEFT_SHIFT',       // <<
  RIGHT_SHIFT: 'RIGHT_SHIFT',     // >>
  UNSIGNED_RIGHT_SHIFT: 'UNSIGNED_RIGHT_SHIFT', // >>>
  
  // Delimiters
  LPAREN: 'LPAREN',       // (
  RPAREN: 'RPAREN',       // )
  LBRACE: 'LBRACE',       // {
  RBRACE: 'RBRACE',       // }
  LBRACKET: 'LBRACKET',   // [
  RBRACKET: 'RBRACKET',   // ]
  
  // Punctuation
  SEMICOLON: 'SEMICOLON', // ;
  COMMA: 'COMMA',         // ,
  DOT: 'DOT',             // .
  COLON: 'COLON',         // :
  QUESTION: 'QUESTION',   // ?
  AT: 'AT',               // @
  
  // Special
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
  INVALID: 'INVALID'
};

class JavaLexerError extends Error {
  constructor(message, line, column, position) {
    super(message);
    this.name = 'JavaLexerError';
    this.line = line;
    this.column = column;
    this.position = position;
  }
}

class JavaLexer {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.currentChar = this.text[this.pos];
    
    // Java keywords mapping
    this.keywords = Object.create(null); // Create object without prototype
    Object.assign(this.keywords, {
      // Access modifiers
      'public': JavaTokenType.PUBLIC,
      'private': JavaTokenType.PRIVATE,
      'protected': JavaTokenType.PROTECTED,
      'static': JavaTokenType.STATIC,
      'final': JavaTokenType.FINAL,
      'abstract': JavaTokenType.ABSTRACT,
      'synchronized': JavaTokenType.SYNCHRONIZED,
      'native': JavaTokenType.NATIVE,
      'volatile': JavaTokenType.VOLATILE,
      'transient': JavaTokenType.TRANSIENT,
      
      // Class/Interface
      'class': JavaTokenType.CLASS,
      'interface': JavaTokenType.INTERFACE,
      'enum': JavaTokenType.ENUM,
      'extends': JavaTokenType.EXTENDS,
      'implements': JavaTokenType.IMPLEMENTS,
      
      // Package/Import
      'import': JavaTokenType.IMPORT,
      'package': JavaTokenType.PACKAGE,
      
      // Control flow
      'if': JavaTokenType.IF,
      'else': JavaTokenType.ELSE,
      'while': JavaTokenType.WHILE,
      'for': JavaTokenType.FOR,
      'do': JavaTokenType.DO,
      'switch': JavaTokenType.SWITCH,
      'case': JavaTokenType.CASE,
      'default': JavaTokenType.DEFAULT,
      'break': JavaTokenType.BREAK,
      'continue': JavaTokenType.CONTINUE,
      'return': JavaTokenType.RETURN,
      'try': JavaTokenType.TRY,
      'catch': JavaTokenType.CATCH,
      'finally': JavaTokenType.FINALLY,
      'throw': JavaTokenType.THROW,
      'throws': JavaTokenType.THROWS,
      
      // Object-oriented
      'new': JavaTokenType.NEW,
      'this': JavaTokenType.THIS,
      'super': JavaTokenType.SUPER,
      'instanceof': JavaTokenType.INSTANCEOF,
      
      // Primitive types
      'void': JavaTokenType.VOID,
      'boolean': JavaTokenType.BOOLEAN_TYPE,
      'byte': JavaTokenType.BYTE,
      'short': JavaTokenType.SHORT,
      'int': JavaTokenType.INT,
      'long': JavaTokenType.LONG,
      'float': JavaTokenType.FLOAT,
      'double': JavaTokenType.DOUBLE,
      'char': JavaTokenType.CHAR_TYPE,
      
      // Literals
      'true': JavaTokenType.BOOLEAN,
      'false': JavaTokenType.BOOLEAN,
      'null': JavaTokenType.NULL
    });
  }

  error(message) {
    throw new JavaLexerError(
      `${message} at line ${this.line}, column ${this.column}`,
      this.line,
      this.column,
      this.pos
    );
  }

  advance() {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    
    this.pos++;
    if (this.pos >= this.text.length) {
      this.currentChar = null;
    } else {
      this.currentChar = this.text[this.pos];
    }
  }

  peek(offset = 1) {
    const peekPos = this.pos + offset;
    if (peekPos >= this.text.length) {
      return null;
    }
    return this.text[peekPos];
  }

  skipWhitespace() {
    while (this.currentChar !== null && /[ \t\r]/.test(this.currentChar)) {
      this.advance();
    }
  }

  skipComment() {
    // Single line comment: //
    if (this.currentChar === '/' && this.peek() === '/') {
      while (this.currentChar !== null && this.currentChar !== '\n') {
        this.advance();
      }
    }
    // Multi-line comment: /* */
    else if (this.currentChar === '/' && this.peek() === '*') {
      this.advance(); // skip '/'
      this.advance(); // skip '*'
      
      while (this.currentChar !== null) {
        if (this.currentChar === '*' && this.peek() === '/') {
          this.advance(); // skip '*'
          this.advance(); // skip '/'
          break;
        }
        this.advance();
      }
    }
    // Javadoc comment: /** */
    else if (this.currentChar === '/' && this.peek() === '*' && this.peek(2) === '*') {
      this.advance(); // skip '/'
      this.advance(); // skip first '*'
      this.advance(); // skip second '*'
      
      while (this.currentChar !== null) {
        if (this.currentChar === '*' && this.peek() === '/') {
          this.advance(); // skip '*'
          this.advance(); // skip '/'
          break;
        }
        this.advance();
      }
    }
  }

  readNumber() {
    let result = '';
    let hasDecimal = false;
    let isFloat = false;
    let isLong = false;
    const startLine = this.line;
    const startColumn = this.column;
    const startPos = this.pos;

    // Handle hex numbers (0x...)
    if (this.currentChar === '0' && this.peek() && /[xX]/.test(this.peek())) {
      result += this.currentChar;
      this.advance();
      result += this.currentChar;
      this.advance();
      
      while (this.currentChar !== null && /[0-9a-fA-F]/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
    }
    // Handle octal numbers (0...)
    else if (this.currentChar === '0' && this.peek() && /[0-7]/.test(this.peek())) {
      while (this.currentChar !== null && /[0-7]/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
    }
    // Handle decimal numbers
    else {
      while (this.currentChar !== null && /\d/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }

      // Handle decimal part
      if (this.currentChar === '.' && /\d/.test(this.peek())) {
        hasDecimal = true;
        result += this.currentChar;
        this.advance();
        
        while (this.currentChar !== null && /\d/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
      }

      // Handle scientific notation (e.g., 1e10, 2.5e-3)
      if (this.currentChar && /[eE]/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
        
        if (this.currentChar && /[+-]/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
        
        if (!this.currentChar || !/\d/.test(this.currentChar)) {
          this.error('Invalid number format: expected digits after exponent');
        }
        
        while (this.currentChar !== null && /\d/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
      }
    }

    // Handle suffixes (L for long, F for float, D for double)
    if (this.currentChar && /[lLfFdD]/.test(this.currentChar)) {
      if (/[lL]/.test(this.currentChar)) {
        isLong = true;
      } else if (/[fF]/.test(this.currentChar)) {
        isFloat = true;
      }
      result += this.currentChar;
      this.advance();
    }

    const value = hasDecimal || isFloat ? parseFloat(result) : parseInt(result, 10);
    return new Token(JavaTokenType.NUMBER, value, startLine, startColumn, startPos);
  }

  readString(quote) {
    let result = '';
    const startLine = this.line;
    const startColumn = this.column;
    const startPos = this.pos;
    
    this.advance(); // skip opening quote

    while (this.currentChar !== null && this.currentChar !== quote) {
      if (this.currentChar === '\\') {
        this.advance();
        if (this.currentChar === null) {
          this.error('Unterminated string literal');
        }
        
        // Handle escape sequences
        switch (this.currentChar) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case 'b': result += '\b'; break;
          case 'f': result += '\f'; break;
          case '\\': result += '\\'; break;
          case '\'': result += '\''; break;
          case '"': result += '"'; break;
          case '0': result += '\0'; break;
          default:
            // Unicode escape sequences (\uXXXX)
            if (this.currentChar === 'u') {
              this.advance();
              let unicode = '';
              for (let i = 0; i < 4; i++) {
                if (this.currentChar && /[0-9a-fA-F]/.test(this.currentChar)) {
                  unicode += this.currentChar;
                  this.advance();
                } else {
                  this.error('Invalid unicode escape sequence');
                }
              }
              result += String.fromCharCode(parseInt(unicode, 16));
              continue;
            } else {
              result += this.currentChar;
            }
        }
      } else {
        result += this.currentChar;
      }
      this.advance();
    }

    if (this.currentChar !== quote) {
      this.error('Unterminated string literal');
    }
    
    this.advance(); // skip closing quote
    const tokenType = quote === '"' ? JavaTokenType.STRING : JavaTokenType.CHAR;
    return new Token(tokenType, result, startLine, startColumn, startPos);
  }

  readIdentifier() {
    let result = '';
    const startLine = this.line;
    const startColumn = this.column;
    const startPos = this.pos;

    // First character must be letter, underscore, or dollar sign
    if (!/[a-zA-Z_$]/.test(this.currentChar)) {
      this.error('Invalid identifier start character');
    }

    while (this.currentChar !== null && /[a-zA-Z0-9_$]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    // Check if it's a keyword
    const tokenType = this.keywords[result] || JavaTokenType.IDENTIFIER;
    const value = tokenType === JavaTokenType.BOOLEAN ? (result === 'true') : result;
    
    return new Token(tokenType, value, startLine, startColumn, startPos);
  }

  getNextToken() {
    while (this.currentChar !== null) {
      const startLine = this.line;
      const startColumn = this.column;
      const startPos = this.pos;

      // Skip whitespace
      if (/[ \t\r]/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Handle newlines
      if (this.currentChar === '\n') {
        this.advance();
        return new Token(JavaTokenType.NEWLINE, '\n', startLine, startColumn, startPos);
      }

      // Handle comments
      if (this.currentChar === '/' && (this.peek() === '/' || this.peek() === '*')) {
        this.skipComment();
        continue;
      }

      // Numbers
      if (/\d/.test(this.currentChar)) {
        return this.readNumber();
      }

      // Strings and characters
      if (this.currentChar === '"' || this.currentChar === "'") {
        return this.readString(this.currentChar);
      }

      // Identifiers and keywords
      if (/[a-zA-Z_$]/.test(this.currentChar)) {
        return this.readIdentifier();
      }

      // Three-character operators
      const threeChar = this.currentChar + (this.peek() || '') + (this.peek(2) || '');
      if (threeChar === '>>>') {
        this.advance(); this.advance(); this.advance();
        return new Token(JavaTokenType.UNSIGNED_RIGHT_SHIFT, '>>>', startLine, startColumn, startPos);
      }

      // Two-character operators
      const twoChar = this.currentChar + (this.peek() || '');
      switch (twoChar) {
        case '++':
          this.advance(); this.advance();
          return new Token(JavaTokenType.INCREMENT, '++', startLine, startColumn, startPos);
        case '--':
          this.advance(); this.advance();
          return new Token(JavaTokenType.DECREMENT, '--', startLine, startColumn, startPos);
        case '+=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.PLUS_ASSIGN, '+=', startLine, startColumn, startPos);
        case '-=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.MINUS_ASSIGN, '-=', startLine, startColumn, startPos);
        case '*=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.MULTIPLY_ASSIGN, '*=', startLine, startColumn, startPos);
        case '/=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.DIVIDE_ASSIGN, '/=', startLine, startColumn, startPos);
        case '%=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.MODULO_ASSIGN, '%=', startLine, startColumn, startPos);
        case '==':
          this.advance(); this.advance();
          return new Token(JavaTokenType.EQUAL, '==', startLine, startColumn, startPos);
        case '!=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.NOT_EQUAL, '!=', startLine, startColumn, startPos);
        case '<=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.LESS_EQUAL, '<=', startLine, startColumn, startPos);
        case '>=':
          this.advance(); this.advance();
          return new Token(JavaTokenType.GREATER_EQUAL, '>=', startLine, startColumn, startPos);
        case '&&':
          this.advance(); this.advance();
          return new Token(JavaTokenType.AND, '&&', startLine, startColumn, startPos);
        case '||':
          this.advance(); this.advance();
          return new Token(JavaTokenType.OR, '||', startLine, startColumn, startPos);
        case '<<':
          this.advance(); this.advance();
          return new Token(JavaTokenType.LEFT_SHIFT, '<<', startLine, startColumn, startPos);
        case '>>':
          this.advance(); this.advance();
          return new Token(JavaTokenType.RIGHT_SHIFT, '>>', startLine, startColumn, startPos);
      }

      // Single-character tokens
      switch (this.currentChar) {
        case '+':
          this.advance();
          return new Token(JavaTokenType.PLUS, '+', startLine, startColumn, startPos);
        case '-':
          this.advance();
          return new Token(JavaTokenType.MINUS, '-', startLine, startColumn, startPos);
        case '*':
          this.advance();
          return new Token(JavaTokenType.MULTIPLY, '*', startLine, startColumn, startPos);
        case '/':
          this.advance();
          return new Token(JavaTokenType.DIVIDE, '/', startLine, startColumn, startPos);
        case '%':
          this.advance();
          return new Token(JavaTokenType.MODULO, '%', startLine, startColumn, startPos);
        case '=':
          this.advance();
          return new Token(JavaTokenType.ASSIGN, '=', startLine, startColumn, startPos);
        case '<':
          this.advance();
          return new Token(JavaTokenType.LESS_THAN, '<', startLine, startColumn, startPos);
        case '>':
          this.advance();
          return new Token(JavaTokenType.GREATER_THAN, '>', startLine, startColumn, startPos);
        case '!':
          this.advance();
          return new Token(JavaTokenType.NOT, '!', startLine, startColumn, startPos);
        case '&':
          this.advance();
          return new Token(JavaTokenType.BITWISE_AND, '&', startLine, startColumn, startPos);
        case '|':
          this.advance();
          return new Token(JavaTokenType.BITWISE_OR, '|', startLine, startColumn, startPos);
        case '^':
          this.advance();
          return new Token(JavaTokenType.BITWISE_XOR, '^', startLine, startColumn, startPos);
        case '~':
          this.advance();
          return new Token(JavaTokenType.BITWISE_NOT, '~', startLine, startColumn, startPos);
        case '(':
          this.advance();
          return new Token(JavaTokenType.LPAREN, '(', startLine, startColumn, startPos);
        case ')':
          this.advance();
          return new Token(JavaTokenType.RPAREN, ')', startLine, startColumn, startPos);
        case '{':
          this.advance();
          return new Token(JavaTokenType.LBRACE, '{', startLine, startColumn, startPos);
        case '}':
          this.advance();
          return new Token(JavaTokenType.RBRACE, '}', startLine, startColumn, startPos);
        case '[':
          this.advance();
          return new Token(JavaTokenType.LBRACKET, '[', startLine, startColumn, startPos);
        case ']':
          this.advance();
          return new Token(JavaTokenType.RBRACKET, ']', startLine, startColumn, startPos);
        case ';':
          this.advance();
          return new Token(JavaTokenType.SEMICOLON, ';', startLine, startColumn, startPos);
        case ',':
          this.advance();
          return new Token(JavaTokenType.COMMA, ',', startLine, startColumn, startPos);
        case '.':
          this.advance();
          return new Token(JavaTokenType.DOT, '.', startLine, startColumn, startPos);
        case ':':
          this.advance();
          return new Token(JavaTokenType.COLON, ':', startLine, startColumn, startPos);
        case '?':
          this.advance();
          return new Token(JavaTokenType.QUESTION, '?', startLine, startColumn, startPos);
        case '@':
          this.advance();
          return new Token(JavaTokenType.AT, '@', startLine, startColumn, startPos);
        default:
          this.error(`Unexpected character '${this.currentChar}'`);
      }
    }

    return new Token(JavaTokenType.EOF, null, this.line, this.column, this.pos);
  }

  tokenize() {
    const tokens = [];
    let token = this.getNextToken();
    
    while (token.type !== JavaTokenType.EOF) {
      if (token.type !== JavaTokenType.NEWLINE) { // Skip newlines for simplicity
        tokens.push(token);
      }
      token = this.getNextToken();
    }
    
    tokens.push(token); // Add EOF token
    return tokens;
  }
}


module.exports = {
  JavaLexer,
  Token,
  JavaTokenType,
  JavaLexerError
};
