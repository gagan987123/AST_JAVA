// Java Parser focused on Functions, Methods, and Imports
const {  JavaTokenType } = require('./java-lexer');

// AST Node Base Class
class JavaASTNode {
  constructor(type, line = 0, column = 0) {
    this.type = type;
    this.line = line;
    this.column = column;
  }
}

// Import AST Nodes
class ImportDeclaration extends JavaASTNode {
  constructor(packageName, isStatic = false, isWildcard = false, line, column) {
    super('ImportDeclaration', line, column);
    this.packageName = packageName;
    this.isStatic = isStatic;
    this.isWildcard = isWildcard;
  }
}

class PackageDeclaration extends JavaASTNode {
  constructor(packageName, line, column) {
    super('PackageDeclaration', line, column);
    this.packageName = packageName;
  }
}

// Method/Function AST Nodes
class MethodDeclaration extends JavaASTNode {
  constructor(name, returnType, parameters, modifiers, body, annotations, line, column) {
    super('MethodDeclaration', line, column);
    this.name = name;
    this.returnType = returnType;
    this.parameters = parameters;
    this.modifiers = modifiers;
    this.body = body;
    this.annotations = annotations || [];
    this.isConstructor = false;
  }
}

class ConstructorDeclaration extends JavaASTNode {
  constructor(name, parameters, modifiers, body, annotations, line, column) {
    super('ConstructorDeclaration', line, column);
    this.name = name;
    this.parameters = parameters;
    this.modifiers = modifiers;
    this.body = body;
    this.annotations = annotations || [];
    this.isConstructor = true;
  }
}

class Parameter extends JavaASTNode {
  constructor(name, type, isFinal = false, line, column) {
    super('Parameter', line, column);
    this.name = name;
    this.type = type;
    this.isFinal = isFinal;
  }
}

class Modifier extends JavaASTNode {
  constructor(name, line, column) {
    super('Modifier', line, column);
    this.name = name;
  }
}

class Annotation extends JavaASTNode {
  constructor(name, args, line, column) {
    super('Annotation', line, column);
    this.name = name;
    this.arguments = args || [];
  }
}

// Class/Interface AST Nodes
class ClassDeclaration extends JavaASTNode {
  constructor(name, modifiers, superClass, interfaces, body, annotations, line, column) {
    super('ClassDeclaration', line, column);
    this.name = name;
    this.modifiers = modifiers;
    this.superClass = superClass;
    this.interfaces = interfaces || [];
    this.body = body;
    this.annotations = annotations || [];
  }
}

class InterfaceDeclaration extends JavaASTNode {
  constructor(name, modifiers, interfaces, body, annotations, line, column) {
    super('InterfaceDeclaration', line, column);
    this.name = name;
    this.modifiers = modifiers;
    this.interfaces = interfaces || [];
    this.body = body;
    this.annotations = annotations || [];
  }
}

// Type AST Nodes
class Type extends JavaASTNode {
  constructor(name, isArray = false, arrayDimensions = 0, line, column) {
    super('Type', line, column);
    this.name = name;
    this.isArray = isArray;
    this.arrayDimensions = arrayDimensions;
  }
}

class Identifier extends JavaASTNode {
  constructor(name, line, column) {
    super('Identifier', line, column);
    this.name = name;
  }
}

// Block and Statement nodes (simplified)
class Block extends JavaASTNode {
  constructor(statements, line, column) {
    super('Block', line, column);
    this.statements = statements || [];
  }
}

class CompilationUnit extends JavaASTNode {
  constructor(packageDecl, imports, typeDeclarations) {
    super('CompilationUnit');
    this.packageDeclaration = packageDecl;
    this.imports = imports || [];
    this.typeDeclarations = typeDeclarations || [];
  }
}

// Parser Error Class
class JavaParseError extends Error {
  constructor(message, token) {
    super(message);
    this.name = 'JavaParseError';
    this.token = token;
    this.line = token ? token.line : 0;
    this.column = token ? token.column : 0;
  }
}

// Java Parser focused on methods, functions, and imports
class JavaParser {
  constructor(lexer) {
    this.lexer = lexer;
    this.tokens = lexer.tokenize();
    this.current = 0;
    this.currentToken = this.tokens[0];
  }

  error(message, token = this.currentToken) {
    throw new JavaParseError(
      `${message} at line ${token.line}, column ${token.column}. Got: ${token.type}`,
      token
    );
  }

  advance() {
    if (this.current < this.tokens.length - 1) {
      this.current++;
      this.currentToken = this.tokens[this.current];
    }
    return this.currentToken;
  }

  peek(offset = 1) {
    const index = this.current + offset;
    if (index >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // Return EOF
    }
    return this.tokens[index];
  }

  match(...types) {
    for (const type of types) {
      if (this.currentToken.type === type) {
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.currentToken.type === type) {
      const token = this.currentToken;
      this.advance();
      return token;
    }
    this.error(message || `Expected ${type}`);
  }

  synchronize() {
    // Error recovery: skip tokens until we find a class/method/import boundary
    this.advance();
    
    while (this.currentToken.type !== JavaTokenType.EOF) {
      if (this.tokens[this.current - 1].type === JavaTokenType.SEMICOLON ||
          this.tokens[this.current - 1].type === JavaTokenType.RBRACE) {
        return;
      }
      
      switch (this.currentToken.type) {
        case JavaTokenType.CLASS:
        case JavaTokenType.INTERFACE:
        case JavaTokenType.IMPORT:
        case JavaTokenType.PACKAGE:
        case JavaTokenType.PUBLIC:
        case JavaTokenType.PRIVATE:
        case JavaTokenType.PROTECTED:
          return;
      }
      
      this.advance();
    }
  }

  // Main parsing method
  parse() {
    try {
      return this.compilationUnit();
    } catch (error) {
      console.error('Parse error:', error.message);
      return null;
    }
  }

  // compilationUnit: packageDeclaration? importDeclaration* typeDeclaration*
  compilationUnit() {
    let packageDecl = null;
    const imports = [];
    const typeDeclarations = [];

    // Parse package declaration
    if (this.match(JavaTokenType.PACKAGE)) {
      packageDecl = this.packageDeclaration();
    }

    // Parse import declarations
    while (this.match(JavaTokenType.IMPORT)) {
      imports.push(this.importDeclaration());
    }

    // Parse type declarations (classes, interfaces)
    while (!this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.CLASS, JavaTokenType.INTERFACE, JavaTokenType.ENUM)) {
        typeDeclarations.push(this.typeDeclaration());
      } else if (this.match(JavaTokenType.PUBLIC, JavaTokenType.PRIVATE, JavaTokenType.PROTECTED,
                           JavaTokenType.STATIC, JavaTokenType.FINAL, JavaTokenType.ABSTRACT)) {
        // Skip modifiers and try to parse type declaration
        const modifiers = this.parseModifiers();
        if (this.match(JavaTokenType.CLASS, JavaTokenType.INTERFACE, JavaTokenType.ENUM)) {
          const typeDecl = this.typeDeclaration();
          typeDecl.modifiers = modifiers.concat(typeDecl.modifiers || []);
          typeDeclarations.push(typeDecl);
        } else {
          this.advance(); // Skip unknown tokens
        }
      } else {
        this.advance(); // Skip unknown tokens
      }
    }

    return new CompilationUnit(packageDecl, imports, typeDeclarations);
  }

  // packageDeclaration: 'package' qualifiedName ';'
  packageDeclaration() {
    const packageToken = this.consume(JavaTokenType.PACKAGE);
    const packageName = this.qualifiedName();
    this.consume(JavaTokenType.SEMICOLON, 'Expected ";" after package declaration');
    
    return new PackageDeclaration(packageName, packageToken.line, packageToken.column);
  }

  // importDeclaration: 'import' 'static'? qualifiedName ('.' '*')? ';'
  importDeclaration() {
    const importToken = this.consume(JavaTokenType.IMPORT);
    
    let isStatic = false;
    if (this.match(JavaTokenType.STATIC)) {
      isStatic = true;
      this.advance();
    }

    const packageName = this.qualifiedName();
    
    let isWildcard = false;
    if (this.match(JavaTokenType.DOT)) {
      this.advance();
      if (this.match(JavaTokenType.MULTIPLY)) {
        isWildcard = true;
        this.advance();
      }
    }

    this.consume(JavaTokenType.SEMICOLON, 'Expected ";" after import declaration');
    
    return new ImportDeclaration(packageName, isStatic, isWildcard, importToken.line, importToken.column);
  }

  // Parse qualified name (e.g., java.util.List)
  qualifiedName() {
    let name = this.consume(JavaTokenType.IDENTIFIER, 'Expected identifier').value;
    
    while (this.match(JavaTokenType.DOT) && this.peek().type === JavaTokenType.IDENTIFIER) {
      this.advance(); // consume '.'
      name += '.' + this.consume(JavaTokenType.IDENTIFIER).value;
    }
    
    return name;
  }

  // typeDeclaration: classDeclaration | interfaceDeclaration
  typeDeclaration() {
    const annotations = this.parseAnnotations();
    const modifiers = this.parseModifiers();
    
    if (this.match(JavaTokenType.CLASS)) {
      return this.classDeclaration(modifiers, annotations);
    } else if (this.match(JavaTokenType.INTERFACE)) {
      return this.interfaceDeclaration(modifiers, annotations);
    } else {
      this.error('Expected class or interface declaration');
    }
  }

  // Parse annotations (@Override, @Deprecated, etc.)
  parseAnnotations() {
    const annotations = [];
    
    while (this.match(JavaTokenType.AT)) {
      const atToken = this.currentToken;
      this.advance();
      
      const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected annotation name').value;
      const args = [];
      
      // Simple annotation parsing (not handling complex arguments)
      if (this.match(JavaTokenType.LPAREN)) {
        this.advance();
        // Skip annotation arguments for simplicity
        let parenCount = 1;
        while (parenCount > 0 && !this.match(JavaTokenType.EOF)) {
          if (this.match(JavaTokenType.LPAREN)) parenCount++;
          if (this.match(JavaTokenType.RPAREN)) parenCount--;
          this.advance();
        }
      }
      
      annotations.push(new Annotation(name, args, atToken.line, atToken.column));
    }
    
    return annotations;
  }

  // Parse modifiers (public, private, static, etc.)
  parseModifiers() {
    const modifiers = [];
    
    while (this.match(JavaTokenType.PUBLIC, JavaTokenType.PRIVATE, JavaTokenType.PROTECTED,
                     JavaTokenType.STATIC, JavaTokenType.FINAL, JavaTokenType.ABSTRACT,
                     JavaTokenType.SYNCHRONIZED, JavaTokenType.NATIVE, JavaTokenType.VOLATILE,
                     JavaTokenType.TRANSIENT)) {
      const token = this.currentToken;
      modifiers.push(new Modifier(token.value, token.line, token.column));
      this.advance();
    }
    
    return modifiers;
  }

  // classDeclaration: 'class' IDENTIFIER ('extends' type)? ('implements' typeList)? classBody
  classDeclaration(modifiers = [], annotations = []) {
    const classToken = this.consume(JavaTokenType.CLASS);
    const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected class name').value;
    
    let superClass = null;
    if (this.match(JavaTokenType.EXTENDS)) {
      this.advance();
      superClass = this.parseType();
    }
    
    const interfaces = [];
    if (this.match(JavaTokenType.IMPLEMENTS)) {
      this.advance();
      interfaces.push(this.parseType());
      
      while (this.match(JavaTokenType.COMMA)) {
        this.advance();
        interfaces.push(this.parseType());
      }
    }
    
    const body = this.classBody();
    
    return new ClassDeclaration(name, modifiers, superClass, interfaces, body, annotations, 
                               classToken.line, classToken.column);
  }

  // interfaceDeclaration: 'interface' IDENTIFIER ('extends' typeList)? interfaceBody
  interfaceDeclaration(modifiers = [], annotations = []) {
    const interfaceToken = this.consume(JavaTokenType.INTERFACE);
    const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected interface name').value;
    
    const interfaces = [];
    if (this.match(JavaTokenType.EXTENDS)) {
      this.advance();
      interfaces.push(this.parseType());
      
      while (this.match(JavaTokenType.COMMA)) {
        this.advance();
        interfaces.push(this.parseType());
      }
    }
    
    const body = this.classBody(); // Interface body is similar to class body
    
    return new InterfaceDeclaration(name, modifiers, interfaces, body, annotations,
                                   interfaceToken.line, interfaceToken.column);
  }

  // classBody: '{' classMember* '}'
  classBody() {
    this.consume(JavaTokenType.LBRACE, 'Expected "{"');
    
    const members = [];
    
    while (!this.match(JavaTokenType.RBRACE) && !this.match(JavaTokenType.EOF)) {
      const member = this.classMember();
      if (member) {
        members.push(member);
      }
    }
    
    this.consume(JavaTokenType.RBRACE, 'Expected "}"');
    
    return new Block(members);
  }

  // classMember: methodDeclaration | constructorDeclaration | fieldDeclaration
  classMember() {
    // Safety check to prevent infinite loops
    const startPos = this.current;
    
    const annotations = this.parseAnnotations();
    const modifiers = this.parseModifiers();
    
    // Check if we have a method or constructor
    if (this.match(JavaTokenType.VOID, JavaTokenType.INT, JavaTokenType.DOUBLE,
                  JavaTokenType.BOOLEAN_TYPE, JavaTokenType.FLOAT, JavaTokenType.LONG,
                  JavaTokenType.SHORT, JavaTokenType.BYTE, JavaTokenType.CHAR_TYPE)) {
      // This is definitely a method (has return type)
      return this.methodDeclaration(modifiers, annotations);
    }
    
    if (this.match(JavaTokenType.IDENTIFIER)) {
      // Could be either a method with object return type or a constructor
      const name = this.currentToken.value;
      const nextToken = this.peek();
      
      if (nextToken.type === JavaTokenType.LPAREN) {
        // identifier followed by ( - this is a constructor
        return this.constructorDeclaration(modifiers, annotations);
      } else if (nextToken.type === JavaTokenType.IDENTIFIER) {
        // Check if this is actually a method by looking ahead for (
        const secondNext = this.peek(2);
        if (secondNext && secondNext.type === JavaTokenType.LPAREN) {
          // identifier followed by identifier followed by ( - this is a method with object return type
          return this.methodDeclaration(modifiers, annotations);
        } else {
          // This is likely a field declaration - skip it
          this.skipToNextMember();
          return null;
        }
      } else if (nextToken.type === JavaTokenType.LBRACKET) {
        // identifier followed by [ - this is a method with array return type
        return this.methodDeclaration(modifiers, annotations);
      } else {
        // Probably a field or something else - skip it
        this.skipToNextMember();
        return null;
      }
    }
    
    // If we get here, it might be a field declaration or something we don't handle
    this.skipToNextMember();
    
    // Safety check: ensure we made progress
    if (this.current === startPos) {
      this.advance(); // Force progress to prevent infinite loop
    }
    
    return null;
  }

  // Check if current position is a method declaration
  isMethodDeclaration() {
    // Check if we have a return type (void, primitive, or identifier)
    if (this.match(JavaTokenType.VOID, JavaTokenType.INT, JavaTokenType.DOUBLE,
                  JavaTokenType.BOOLEAN_TYPE, JavaTokenType.FLOAT, JavaTokenType.LONG,
                  JavaTokenType.SHORT, JavaTokenType.BYTE, JavaTokenType.CHAR_TYPE,
                  JavaTokenType.IDENTIFIER)) {
      
      let lookahead = 0;
      
      // Skip the return type (including arrays and qualified names)
      while (this.peek(lookahead) && (
        this.peek(lookahead).type === JavaTokenType.IDENTIFIER ||
        this.peek(lookahead).type === JavaTokenType.VOID ||
        this.peek(lookahead).type === JavaTokenType.INT ||
        this.peek(lookahead).type === JavaTokenType.BOOLEAN_TYPE ||
        this.peek(lookahead).type === JavaTokenType.DOUBLE ||
        this.peek(lookahead).type === JavaTokenType.FLOAT ||
        this.peek(lookahead).type === JavaTokenType.LONG ||
        this.peek(lookahead).type === JavaTokenType.SHORT ||
        this.peek(lookahead).type === JavaTokenType.BYTE ||
        this.peek(lookahead).type === JavaTokenType.CHAR_TYPE ||
        this.peek(lookahead).type === JavaTokenType.LBRACKET ||
        this.peek(lookahead).type === JavaTokenType.RBRACKET ||
        this.peek(lookahead).type === JavaTokenType.DOT
      )) {
        lookahead++;
      }
      
      // Check if we have method name followed by (
      return this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.IDENTIFIER &&
             this.peek(lookahead + 1) && this.peek(lookahead + 1).type === JavaTokenType.LPAREN;
    }
    
    return false;
  }

  // methodDeclaration: type IDENTIFIER '(' parameterList? ')' ('throws' exceptionList)? (block | ';')
  methodDeclaration(modifiers = [], annotations = []) {
    const returnType = this.parseType();
    const nameToken = this.consume(JavaTokenType.IDENTIFIER, 'Expected method name');
    
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after method name');
    const parameters = this.parameterList();
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after parameters');
    
    // Skip throws clause for simplicity
    if (this.match(JavaTokenType.THROWS)) {
      this.advance();
      // Skip exception types
      while (this.match(JavaTokenType.IDENTIFIER)) {
        this.advance();
        if (this.match(JavaTokenType.COMMA)) {
          this.advance();
        } else {
          break;
        }
      }
    }
    
    let body = null;
    if (this.match(JavaTokenType.LBRACE)) {
      body = this.methodBody();
    } else {
      this.consume(JavaTokenType.SEMICOLON, 'Expected ";" or method body');
    }
    
    return new MethodDeclaration(nameToken.value, returnType, parameters, modifiers, body, annotations,
                                nameToken.line, nameToken.column);
  }

  // constructorDeclaration: IDENTIFIER '(' parameterList? ')' ('throws' exceptionList)? block
  constructorDeclaration(modifiers = [], annotations = []) {
    const nameToken = this.consume(JavaTokenType.IDENTIFIER, 'Expected constructor name');
    
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after constructor name');
    const parameters = this.parameterList();
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after parameters');
    
    // Skip throws clause for simplicity
    if (this.match(JavaTokenType.THROWS)) {
      this.advance();
      while (this.match(JavaTokenType.IDENTIFIER)) {
        this.advance();
        if (this.match(JavaTokenType.COMMA)) {
          this.advance();
        } else {
          break;
        }
      }
    }
    
    const body = this.methodBody();
    
    return new ConstructorDeclaration(nameToken.value, parameters, modifiers, body, annotations,
                                     nameToken.line, nameToken.column);
  }

  // parameterList: parameter (',' parameter)*
  parameterList() {
    const parameters = [];
    
    if (!this.match(JavaTokenType.RPAREN)) {
      parameters.push(this.parameter());
      
      while (this.match(JavaTokenType.COMMA)) {
        this.advance();
        parameters.push(this.parameter());
      }
    }
    
    return parameters;
  }

  // parameter: ('final')? type IDENTIFIER
  parameter() {
    let isFinal = false;
    if (this.match(JavaTokenType.FINAL)) {
      isFinal = true;
      this.advance();
    }
    
    const type = this.parseType();
    const nameToken = this.consume(JavaTokenType.IDENTIFIER, 'Expected parameter name');
    
    return new Parameter(nameToken.value, type, isFinal, nameToken.line, nameToken.column);
  }

  // Parse type (including arrays)
  parseType() {
    let typeName;
    const startToken = this.currentToken;
    
    if (this.match(JavaTokenType.VOID, JavaTokenType.BOOLEAN_TYPE, JavaTokenType.BYTE,
                  JavaTokenType.SHORT, JavaTokenType.INT, JavaTokenType.LONG,
                  JavaTokenType.FLOAT, JavaTokenType.DOUBLE, JavaTokenType.CHAR_TYPE)) {
      typeName = this.currentToken.value;
      this.advance();
    } else if (this.match(JavaTokenType.IDENTIFIER)) {
      typeName = this.qualifiedName();
    } else {
      this.error('Expected type');
    }
    
    // Handle array dimensions
    let arrayDimensions = 0;
    while (this.match(JavaTokenType.LBRACKET)) {
      this.advance();
      this.consume(JavaTokenType.RBRACKET, 'Expected "]"');
      arrayDimensions++;
    }
    
    return new Type(typeName, arrayDimensions > 0, arrayDimensions, startToken.line, startToken.column);
  }

  // methodBody: block
  methodBody() {
    return this.block();
  }

  // block: '{' statement* '}'
  block() {
    const lbrace = this.consume(JavaTokenType.LBRACE);
    const statements = [];
    let statementCount = 0;
    const maxStatements = 100; // Safety limit
    
    // Parse statements inside the block
    while (!this.match(JavaTokenType.RBRACE) && !this.match(JavaTokenType.EOF) && 
           statementCount < maxStatements) {
      try {
        const stmt = this.statement();
        if (stmt) {
          statements.push(stmt);
        }
        statementCount++;
      } catch (error) {
        // Skip to next statement boundary on error
        this.skipToStatementBoundary();
        statementCount++;
      }
    }
    
    this.consume(JavaTokenType.RBRACE, 'Expected "}"');
    
    return new Block(statements, lbrace.line, lbrace.column);
  }

  // Parse individual statements
  statement() {
    // Safety check to prevent infinite loops
    const startPos = this.current;
    
    // Skip empty statements (just semicolons)
    if (this.match(JavaTokenType.SEMICOLON)) {
      this.advance();
      return null;
    }
    
    // For now, let's simplify and just parse basic statements
    // Return statement
    if (this.match(JavaTokenType.RETURN)) {
      return this.returnStatement();
    }
    
    // Simple variable declaration or expression statement
    const result = this.variableDeclarationOrExpression();
    
    // Safety check: ensure we made progress
    if (this.current === startPos) {
      this.advance(); // Force progress to prevent infinite loop
    }
    
    return result;
  }

  // Parse return statement
  returnStatement() {
    const returnToken = this.consume(JavaTokenType.RETURN);
    let expression = null;
    
    // Check if there's an expression after return
    if (!this.match(JavaTokenType.SEMICOLON)) {
      expression = this.expression();
    }
    
    this.consume(JavaTokenType.SEMICOLON, 'Expected ";" after return statement');
    
    return {
      type: 'ReturnStatement',
      expression: expression,
      line: returnToken.line,
      column: returnToken.column
    };
  }

  // Parse if statement
  ifStatement() {
    const ifToken = this.consume(JavaTokenType.IF);
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after if');
    const condition = this.expression();
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after if condition');
    const thenStatement = this.statement();
    let elseStatement = null;
    
    if (this.match(JavaTokenType.ELSE)) {
      this.advance();
      elseStatement = this.statement();
    }
    
    return {
      type: 'IfStatement',
      condition: condition,
      thenStatement: thenStatement,
      elseStatement: elseStatement,
      line: ifToken.line,
      column: ifToken.column
    };
  }

  // Parse for statement (simplified)
  forStatement() {
    const forToken = this.consume(JavaTokenType.FOR);
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after for');
    
    // Skip for loop contents for now
    let parenCount = 1;
    while (parenCount > 0 && !this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.LPAREN)) parenCount++;
      else if (this.match(JavaTokenType.RPAREN)) parenCount--;
      this.advance();
    }
    
    const body = this.statement();
    
    return {
      type: 'ForStatement',
      body: body,
      line: forToken.line,
      column: forToken.column
    };
  }

  // Parse while statement
  whileStatement() {
    const whileToken = this.consume(JavaTokenType.WHILE);
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after while');
    const condition = this.expression();
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after while condition');
    const body = this.statement();
    
    return {
      type: 'WhileStatement',
      condition: condition,
      body: body,
      line: whileToken.line,
      column: whileToken.column
    };
  }

  // Parse try statement (simplified)
  tryStatement() {
    const tryToken = this.consume(JavaTokenType.TRY);
    const tryBlock = this.block();
    
    // Skip catch and finally blocks for now
    while (this.match(JavaTokenType.CATCH) || this.match(JavaTokenType.FINALLY)) {
      this.advance();
      if (this.match(JavaTokenType.LPAREN)) {
        let parenCount = 1;
        this.advance();
        while (parenCount > 0 && !this.match(JavaTokenType.EOF)) {
          if (this.match(JavaTokenType.LPAREN)) parenCount++;
          else if (this.match(JavaTokenType.RPAREN)) parenCount--;
          this.advance();
        }
      }
      if (this.match(JavaTokenType.LBRACE)) {
        this.block();
      }
    }
    
    return {
      type: 'TryStatement',
      tryBlock: tryBlock,
      line: tryToken.line,
      column: tryToken.column
    };
  }

  // Parse variable declaration or expression
  variableDeclarationOrExpression() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;
    
    // Check if this looks like a variable declaration
    if (this.isVariableDeclaration()) {
      return this.variableDeclaration();
    }
    
    // Skip if we're at a closing brace or semicolon
    if (this.match(JavaTokenType.RBRACE) || this.match(JavaTokenType.SEMICOLON)) {
      if (this.match(JavaTokenType.SEMICOLON)) {
        this.advance();
      }
      return null;
    }
    
    // Otherwise, parse as expression statement
    const expression = this.expression();
    
    // Only create expression statement if we actually have tokens
    if (expression.tokens && expression.tokens.length === 0) {
      if (this.match(JavaTokenType.SEMICOLON)) {
        this.advance();
      }
      return null;
    }
    
    if (this.match(JavaTokenType.SEMICOLON)) {
      this.advance();
    }
    
    return {
      type: 'ExpressionStatement',
      expression: expression,
      line: startLine,
      column: startColumn
    };
  }

  // Check if current position is a variable declaration
  isVariableDeclaration() {
    // Look for type followed by identifier
    if (this.match(JavaTokenType.INT, JavaTokenType.DOUBLE, JavaTokenType.BOOLEAN_TYPE,
                  JavaTokenType.FLOAT, JavaTokenType.LONG, JavaTokenType.SHORT,
                  JavaTokenType.BYTE, JavaTokenType.CHAR_TYPE)) {
      return true;
    }
    
    // Check for object type (identifier followed by identifier)
    if (this.match(JavaTokenType.IDENTIFIER)) {
      const nextToken = this.peek();
      return nextToken && nextToken.type === JavaTokenType.IDENTIFIER;
    }
    
    return false;
  }

  // Parse variable declaration
  variableDeclaration() {
    const type = this.parseType();
    const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected variable name').value;
    let initializer = null;
    
    if (this.match(JavaTokenType.ASSIGN)) {
      this.advance();
      initializer = this.expression();
    }
    
    if (this.match(JavaTokenType.SEMICOLON)) {
      this.advance();
    }
    
    return {
      type: 'VariableDeclaration',
      variableType: type,
      name: name,
      initializer: initializer,
      line: type.line,
      column: type.column
    };
  }

  // Parse expression statement
  expressionStatement() {
    return this.variableDeclarationOrExpression();
  }

  // Parse expression (simplified for safety)
  expression() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;
    const tokens = [];
    let tokenCount = 0;
    const maxTokens = 50; // Safety limit
    let parenCount = 0;
    
    // Parse tokens until we hit a statement boundary
    while (!this.match(JavaTokenType.SEMICOLON) && !this.match(JavaTokenType.EOF) && 
           !this.match(JavaTokenType.RBRACE) && tokenCount < maxTokens) {
      
      // Handle parentheses properly
      if (this.match(JavaTokenType.LPAREN)) {
        parenCount++;
      } else if (this.match(JavaTokenType.RPAREN)) {
        parenCount--;
        // Include the closing paren in the expression
        tokens.push({
          type: this.currentToken.type,
          value: this.currentToken.value,
          line: this.currentToken.line,
          column: this.currentToken.column
        });
        this.advance();
        tokenCount++;
        // If we've closed all parens, we're done with this expression
        if (parenCount <= 0) {
          break;
        }
        continue;
      }
      
      tokens.push({
        type: this.currentToken.type,
        value: this.currentToken.value,
        line: this.currentToken.line,
        column: this.currentToken.column
      });
      this.advance();
      tokenCount++;
    }
    
    return {
      type: 'Expression',
      tokens: tokens,
      line: startLine,
      column: startColumn
    };
  }

  // Parse method call: methodName(args)
  parseMethodCall(methodName, line, column) {
    this.consume(JavaTokenType.LPAREN);
    const args = [];
    
    while (!this.match(JavaTokenType.RPAREN) && !this.match(JavaTokenType.EOF)) {
      args.push(this.expression());
      if (this.match(JavaTokenType.COMMA)) {
        this.advance();
      }
    }
    
    this.consume(JavaTokenType.RPAREN);
    
    return {
      type: 'MethodCall',
      methodName: methodName,
      arguments: args,
      line: line,
      column: column
    };
  }

  // Parse method chain: obj.method1().method2()
  parseMethodChain(startIdentifier, line, column) {
    let current = {
      type: 'Identifier',
      name: startIdentifier,
      line: line,
      column: column
    };
    
    while (this.match(JavaTokenType.DOT)) {
      this.advance(); // consume dot
      const methodName = this.consume(JavaTokenType.IDENTIFIER).value;
      
      if (this.match(JavaTokenType.LPAREN)) {
        // Method call
        const methodCall = this.parseMethodCall(methodName, this.currentToken.line, this.currentToken.column);
        current = {
          type: 'MemberExpression',
          object: current,
          property: methodCall,
          line: line,
          column: column
        };
      } else {
        // Property access
        current = {
          type: 'MemberExpression',
          object: current,
          property: {
            type: 'Identifier',
            name: methodName,
            line: this.currentToken.line,
            column: this.currentToken.column
          },
          line: line,
          column: column
        };
      }
    }
    
    return current;
  }

  // Skip to next statement boundary for error recovery
  skipToStatementBoundary() {
    while (!this.match(JavaTokenType.EOF) && 
           !this.match(JavaTokenType.SEMICOLON) &&
           !this.match(JavaTokenType.RBRACE)) {
      this.advance();
    }
    
    if (this.match(JavaTokenType.SEMICOLON)) {
      this.advance();
    }
  }

  // Skip to next class member
  skipToNextMember() {
    // Skip until we find a semicolon (end of field) or next member
    while (!this.match(JavaTokenType.EOF) && 
           !this.match(JavaTokenType.RBRACE)) {
      
      if (this.match(JavaTokenType.SEMICOLON)) {
        this.advance(); // consume semicolon
        break;
      }
      
      // Check if we've reached the next member (annotation or modifier)
      if (this.match(JavaTokenType.AT) ||
          this.match(JavaTokenType.PUBLIC, JavaTokenType.PRIVATE, JavaTokenType.PROTECTED) ||
          this.match(JavaTokenType.STATIC, JavaTokenType.FINAL, JavaTokenType.ABSTRACT)) {
        break;
      }
      
      this.advance();
    }
  }
}



module.exports = {
  JavaParser,
  JavaASTNode,
  ImportDeclaration,
  PackageDeclaration,
  MethodDeclaration,
  ConstructorDeclaration,
  Parameter,
  Modifier,
  Annotation,
  ClassDeclaration,
  InterfaceDeclaration,
  Type,
  Identifier,
  Block,
  CompilationUnit,
  JavaParseError
};
