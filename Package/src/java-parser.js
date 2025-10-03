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

class EnumDeclaration extends JavaASTNode {
  constructor(name, modifiers, interfaces, constants, body, annotations, line, column) {
    super('EnumDeclaration', line, column);
    this.name = name;
    this.modifiers = modifiers;
    this.interfaces = interfaces || [];
    this.constants = constants || [];
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
    } else if (this.match(JavaTokenType.ENUM)) {
      return this.enumDeclaration(modifiers, annotations);
    } else {
      this.error('Expected class, interface, or enum declaration');
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

  // Parse a single annotation
  annotation() {
    const atToken = this.consume(JavaTokenType.AT);
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
    
    return new Annotation(name, args, atToken.line, atToken.column);
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

  // interfaceDeclaration: 'interface' IDENTIFIER ('<' typeParameters '>')? ('extends' typeList)? interfaceBody
  interfaceDeclaration(modifiers = [], annotations = []) {
    const interfaceToken = this.consume(JavaTokenType.INTERFACE);
    const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected interface name').value;
    
    // Parse generic type parameters if present
    let typeParameters = [];
    if (this.match(JavaTokenType.LESS_THAN)) {
      typeParameters = this.parseTypeParameters();
    }
    
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
    
    const interfaceDecl = new InterfaceDeclaration(name, modifiers, interfaces, body, annotations,
                                   interfaceToken.line, interfaceToken.column);
    interfaceDecl.typeParameters = typeParameters;
    return interfaceDecl;
  }

  // enumDeclaration: 'enum' IDENTIFIER ('implements' typeList)? enumBody
  enumDeclaration(modifiers = [], annotations = []) {
    const enumToken = this.consume(JavaTokenType.ENUM);
    const name = this.consume(JavaTokenType.IDENTIFIER, 'Expected enum name').value;
    
    const interfaces = [];
    if (this.match(JavaTokenType.IMPLEMENTS)) {
      this.advance();
      interfaces.push(this.parseType());
      
      while (this.match(JavaTokenType.COMMA)) {
        this.advance();
        interfaces.push(this.parseType());
      }
    }
    
    // Parse enum body
    this.consume(JavaTokenType.LBRACE, 'Expected "{"');
    
    const constants = [];
    const bodyStatements = [];
    
    // Parse enum constants
    while (!this.match(JavaTokenType.RBRACE) && !this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.IDENTIFIER)) {
        const constantName = this.currentToken.value;
        const startLine = this.currentToken.line;
        const startColumn = this.currentToken.column;
        this.advance();
        
        // Check for constructor parameters
        let parameters = [];
        if (this.match(JavaTokenType.LPAREN)) {
          this.advance(); // consume '('
          
          // Parse parameters (simplified - collect tokens until ')')
          const paramTokens = [];
          let parenCount = 1;
          while (parenCount > 0 && !this.match(JavaTokenType.EOF)) {
            if (this.match(JavaTokenType.LPAREN)) parenCount++;
            if (this.match(JavaTokenType.RPAREN)) parenCount--;
            
            if (parenCount > 0) {
              paramTokens.push(this.currentToken);
            }
            this.advance();
          }
          
          if (paramTokens.length > 0) {
            parameters = paramTokens;
          }
        }
        
        constants.push({
          type: 'EnumConstant',
          name: constantName,
          parameters: parameters,
          line: startLine,
          column: startColumn
        });
        
        if (this.match(JavaTokenType.COMMA)) {
          this.advance();
        } else if (this.match(JavaTokenType.SEMICOLON)) {
          this.advance();
          break; // End of constants, start of methods/fields
        }
      } else {
        break;
      }
    }
    
    // Parse methods and fields (simplified)
    while (!this.match(JavaTokenType.RBRACE) && !this.match(JavaTokenType.EOF)) {
      const member = this.classMember();
      if (member) {
        bodyStatements.push(member);
      }
    }
    
    this.consume(JavaTokenType.RBRACE, 'Expected "}"');
    
    const body = new Block(bodyStatements);
    
    return new EnumDeclaration(name, modifiers, interfaces, constants, body, annotations,
                              enumToken.line, enumToken.column);
  }

  // Parse generic type parameters: '<' typeParameter (',' typeParameter)* '>'
  parseTypeParameters() {
    this.consume(JavaTokenType.LESS_THAN, 'Expected "<"');
    
    const typeParameters = [];
    
    // Parse first type parameter
    if (this.match(JavaTokenType.IDENTIFIER)) {
      typeParameters.push(this.currentToken.value);
      this.advance();
    }
    
    // Parse additional type parameters
    while (this.match(JavaTokenType.COMMA)) {
      this.advance();
      if (this.match(JavaTokenType.IDENTIFIER)) {
        typeParameters.push(this.currentToken.value);
        this.advance();
      }
    }
    
    this.consume(JavaTokenType.GREATER_THAN, 'Expected ">"');
    
    return typeParameters;
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
    
    // Check if we have a method, constructor, or field
    if (this.match(JavaTokenType.VOID)) {
      // void can only be a method return type
      return this.methodDeclaration(modifiers, annotations);
    } else if (this.match(JavaTokenType.INT, JavaTokenType.DOUBLE,
                         JavaTokenType.BOOLEAN_TYPE, JavaTokenType.FLOAT, JavaTokenType.LONG,
                         JavaTokenType.SHORT, JavaTokenType.BYTE, JavaTokenType.CHAR_TYPE)) {
      // Primitive type - could be method or field
      const typeToken = this.currentToken;
      const nextToken = this.peek();
      
      // Look ahead past array brackets to find the identifier
      let lookahead = 1;
      
      // Skip array brackets if present (e.g., int[], char[][])
      while (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.LBRACKET) {
        lookahead++; // skip [
        if (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.RBRACKET) {
          lookahead++; // skip ]
        }
      }
      
      const identifierToken = this.peek(lookahead);
      
      if (identifierToken && identifierToken.type === JavaTokenType.IDENTIFIER) {
        const afterIdentifier = this.peek(lookahead + 1);
        
        if (afterIdentifier && afterIdentifier.type === JavaTokenType.LPAREN) {
          // primitive type (possibly with arrays) + identifier + ( = method
          return this.methodDeclaration(modifiers, annotations);
        } else {
          // primitive type (possibly with arrays) + identifier + something else = field
          return this.fieldDeclaration(modifiers, annotations);
        }
      } else {
        // No identifier found - this is unusual, but assume method for safety
        return this.methodDeclaration(modifiers, annotations);
      }
    }
    
    if (this.match(JavaTokenType.IDENTIFIER)) {
      // Could be either a method with object return type or a constructor
      const name = this.currentToken.value;
      
      // Look ahead to find method name, handling generic types like List<String>
      let lookahead = 1;
      let foundMethodName = false;
      
      // Skip generic type parameters if present (e.g., List<String>)
      if (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.LESS_THAN) {
        lookahead++; // skip <
        let genericDepth = 1;
        
        while (genericDepth > 0 && this.peek(lookahead)) {
          const token = this.peek(lookahead);
          if (token.type === JavaTokenType.LESS_THAN) {
            genericDepth++;
          } else if (token.type === JavaTokenType.GREATER_THAN) {
            genericDepth--;
          }
          lookahead++;
        }
      }
      
      // Skip array brackets if present
      while (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.LBRACKET) {
        lookahead++; // skip [
        if (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.RBRACKET) {
          lookahead++; // skip ]
        }
      }
      
      // Now check what we have
      const nextToken = this.peek(lookahead);
      
      if (nextToken && nextToken.type === JavaTokenType.LPAREN) {
        // identifier (possibly with generics/arrays) followed by ( - this is a constructor
        return this.constructorDeclaration(modifiers, annotations);
      } else if (nextToken && nextToken.type === JavaTokenType.IDENTIFIER) {
        // Check if the identifier after return type is followed by (
        const methodNameToken = nextToken;
        const afterMethodName = this.peek(lookahead + 1);
        
        if (afterMethodName && afterMethodName.type === JavaTokenType.LPAREN) {
          // This is a method: ReturnType methodName(
          return this.methodDeclaration(modifiers, annotations);
        } else {
          // This is likely a field declaration
          return this.fieldDeclaration(modifiers, annotations);
        }
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

  // parameter: annotation* ('final')? type IDENTIFIER
  parameter() {
    // Parse annotations (e.g., @ProbeClassName, @ProbeMethodName)
    const annotations = [];
    while (this.match(JavaTokenType.AT)) {
      annotations.push(this.annotation());
    }
    
    let isFinal = false;
    if (this.match(JavaTokenType.FINAL)) {
      isFinal = true;
      this.advance();
    }
    
    const type = this.parseType();
    const nameToken = this.consume(JavaTokenType.IDENTIFIER, 'Expected parameter name');
    
    return new Parameter(nameToken.value, type, isFinal, nameToken.line, nameToken.column);
  }

  // Parse type (including arrays and generics)
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
      
      // Handle generic type parameters (e.g., List<String>, Map<String, Integer>)
      if (this.match(JavaTokenType.LESS_THAN)) {
        this.advance(); // consume <
        let genericDepth = 1;
        const genericTokens = ['<'];
        
        // Collect all tokens until we close the generic declaration
        while (genericDepth > 0 && !this.match(JavaTokenType.EOF)) {
          const token = this.currentToken;
          genericTokens.push(token.value);
          
          if (token.type === JavaTokenType.LESS_THAN) {
            genericDepth++;
          } else if (token.type === JavaTokenType.GREATER_THAN) {
            genericDepth--;
          }
          
          this.advance();
        }
        
        // Append the generic part to the type name
        typeName += genericTokens.join('');
      }
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
    const maxStatements = 1000; // Further increased limit for very complex methods
    
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
        console.warn(`Statement parsing error at line ${this.currentToken.line}: ${error.message}`);
        // Skip to next statement boundary on error
        this.skipToStatementBoundary();
        statementCount++;
      }
    }
    
    if (statementCount >= maxStatements) {
      console.warn('Block parsing hit statement limit, some statements may be missing');
    }
    
    if (this.match(JavaTokenType.EOF)) {
      console.warn(`Unexpected EOF while parsing block started at line ${lbrace.line}, parsed ${statementCount} statements`);
      return new Block(statements, lbrace.line, lbrace.column);
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
    
    // For statement
    if (this.match(JavaTokenType.FOR)) {
      return this.forStatement();
    }
    
    // If statement
    if (this.match(JavaTokenType.IF)) {
      return this.ifStatement();
    }
    
    // While statement
    if (this.match(JavaTokenType.WHILE)) {
      return this.whileStatement();
    }
    
    // Do-while statement
    if (this.match(JavaTokenType.DO)) {
      return this.doWhileStatement();
    }
    
    // Try statement
    if (this.match(JavaTokenType.TRY)) {
      return this.tryStatement();
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
    
    // Collect condition tokens with proper nesting handling
    const conditionTokens = [];
    let parenCount = 0;
    
    while (!this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.LPAREN)) {
        parenCount++;
      } else if (this.match(JavaTokenType.RPAREN)) {
        if (parenCount === 0) {
          break; // This is the closing paren for the if condition
        }
        parenCount--;
      }
      
      conditionTokens.push({
        type: this.currentToken.type,
        value: this.currentToken.value,
        line: this.currentToken.line,
        column: this.currentToken.column,
        position: this.currentToken.position || 0
      });
      this.advance();
    }
    
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after if condition');
    
    // Check if the then statement is a block or a single statement
    let thenStatement;
    if (this.match(JavaTokenType.LBRACE)) {
      thenStatement = this.block();
    } else {
      thenStatement = this.statement();
    }
    
    let elseStatement = null;
    if (this.match(JavaTokenType.ELSE)) {
      this.advance();
      // Check if the else statement is a block or a single statement
      if (this.match(JavaTokenType.LBRACE)) {
        elseStatement = this.block();
      } else {
        elseStatement = this.statement();
      }
    }
    
    return {
      type: 'IfStatement',
      condition: {
        type: 'Expression',
        tokens: conditionTokens,
        line: ifToken.line,
        column: ifToken.column
      },
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
    
    // Collect all tokens within the for loop parentheses
    const tokens = [forToken, { type: 'LPAREN', value: '(', line: forToken.line, column: forToken.column }];
    let parenCount = 1;
    
    while (parenCount > 0 && !this.match(JavaTokenType.EOF)) {
      const token = this.currentToken;
      tokens.push(token);
      
      if (this.match(JavaTokenType.LPAREN)) parenCount++;
      if (this.match(JavaTokenType.RPAREN)) parenCount--;
      this.advance();
    }
    
    // Check if the body is a block or a single statement
    let body;
    if (this.match(JavaTokenType.LBRACE)) {
      body = this.block();
    } else {
      body = this.statement();
    }
    
    return {
      type: 'ForStatement',
      body: body,
      tokens: tokens,
      line: forToken.line,
      column: forToken.column
    };
  }
  // Parse while statement
  whileStatement() {
    const whileToken = this.consume(JavaTokenType.WHILE);
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after while');
    
    // Collect condition tokens
    const conditionTokens = [];
    while (!this.match(JavaTokenType.RPAREN) && !this.match(JavaTokenType.EOF)) {
      conditionTokens.push(this.currentToken);
      this.advance();
    }
    
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after while condition');
    
    // Check if the body is a block or a single statement
    let body;
    if (this.match(JavaTokenType.LBRACE)) {
      body = this.block();
    } else {
      body = this.statement();
    }
    
    return {
      type: 'WhileStatement',
      condition: {
        type: 'Expression',
        tokens: conditionTokens,
        line: whileToken.line,
        column: whileToken.column
      },
      body: body,
      line: whileToken.line,
      column: whileToken.column
    };
  }

  // Parse do-while statement
  doWhileStatement() {
    const doToken = this.consume(JavaTokenType.DO);
    
    // Parse the body (can be a block or single statement)
    let body;
    if (this.match(JavaTokenType.LBRACE)) {
      body = this.block();
    } else {
      body = this.statement();
    }
    
    // Expect 'while' keyword
    this.consume(JavaTokenType.WHILE, 'Expected "while" after do body');
    this.consume(JavaTokenType.LPAREN, 'Expected "(" after while');
    
    // Collect condition tokens
    const conditionTokens = [];
    let parenCount = 0;
    
    while (!this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.LPAREN)) {
        parenCount++;
      } else if (this.match(JavaTokenType.RPAREN)) {
        if (parenCount === 0) {
          break; // This is the closing paren for the while condition
        }
        parenCount--;
      }
      
      conditionTokens.push({
        type: this.currentToken.type,
        value: this.currentToken.value,
        line: this.currentToken.line,
        column: this.currentToken.column,
        position: this.currentToken.position || 0
      });
      this.advance();
    }
    
    this.consume(JavaTokenType.RPAREN, 'Expected ")" after while condition');
    this.consume(JavaTokenType.SEMICOLON, 'Expected ";" after do-while statement');
    
    return {
      type: 'DoWhileStatement',
      body: body,
      condition: {
        type: 'Expression',
        tokens: conditionTokens,
        line: doToken.line,
        column: doToken.column
      },
      line: doToken.line,
      column: doToken.column
    };
  }

  // Parse try statement
  tryStatement() {
    const tryToken = this.consume(JavaTokenType.TRY);
    const tryBlock = this.block();
    
    const catchBlocks = [];
    let finallyBlock = null;
    
    // Parse catch blocks
    while (this.match(JavaTokenType.CATCH)) {
      const catchToken = this.consume(JavaTokenType.CATCH);
      this.consume(JavaTokenType.LPAREN, 'Expected "(" after catch');
      
      // Collect exception parameter tokens
      const parameterTokens = [];
      while (!this.match(JavaTokenType.RPAREN) && !this.match(JavaTokenType.EOF)) {
        parameterTokens.push(this.currentToken);
        this.advance();
      }
      
      this.consume(JavaTokenType.RPAREN, 'Expected ")" after catch parameter');
      const catchBlockBody = this.block();
      
      catchBlocks.push({
        type: 'CatchBlock',
        parameter: {
          type: 'Expression',
          tokens: parameterTokens,
          line: catchToken.line,
          column: catchToken.column
        },
        body: catchBlockBody,
        line: catchToken.line,
        column: catchToken.column
      });
    }
    
    // Parse finally block
    if (this.match(JavaTokenType.FINALLY)) {
      this.advance();
      finallyBlock = this.block();
    }
    
    return {
      type: 'TryStatement',
      tryBlock: tryBlock,
      catchBlocks: catchBlocks,
      finallyBlock: finallyBlock,
      line: tryToken.line,
      column: tryToken.column
    };
  }

  // Parse field declaration
  fieldDeclaration(modifiers = [], annotations = []) {
    const fieldType = this.parseType();
    const fieldName = this.consume(JavaTokenType.IDENTIFIER, 'Expected field name').value;
    
    let initializer = null;
    if (this.match(JavaTokenType.ASSIGN)) {
      this.advance();
      initializer = this.expression();
    }
    
    this.consume(JavaTokenType.SEMICOLON, 'Expected ";" after field declaration');
    
    return {
      type: 'FieldDeclaration',
      modifiers: modifiers,
      annotations: annotations,
      fieldType: fieldType,
      name: fieldName,
      initializer: initializer,
      line: fieldType.line,
      column: fieldType.column
    };
  }

  // Parse variable declaration or expression
  variableDeclarationOrExpression() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;
    
    // First check if this is a variable declaration
    if (this.isVariableDeclaration()) {
      return this.variableDeclaration();
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
    // Look for primitive type followed by identifier
    if (this.match(JavaTokenType.INT, JavaTokenType.DOUBLE, JavaTokenType.BOOLEAN_TYPE,
                  JavaTokenType.FLOAT, JavaTokenType.LONG, JavaTokenType.SHORT,
                  JavaTokenType.BYTE, JavaTokenType.CHAR_TYPE)) {
      return true;
    }
    
    // Check for object type (identifier, possibly with generics, followed by identifier)
    if (this.match(JavaTokenType.IDENTIFIER)) {
      let lookahead = 1;
      
      // Skip generic type parameters if present (e.g., List<String>, Map<K,V>)
      if (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.LESS_THAN) {
        lookahead++; // skip <
        let genericDepth = 1;
        
        while (genericDepth > 0 && this.peek(lookahead)) {
          const token = this.peek(lookahead);
          if (token.type === JavaTokenType.LESS_THAN) {
            genericDepth++;
          } else if (token.type === JavaTokenType.GREATER_THAN) {
            genericDepth--;
          }
          lookahead++;
        }
      }
      
      // Skip array brackets if present
      while (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.LBRACKET) {
        lookahead++; // skip [
        if (this.peek(lookahead) && this.peek(lookahead).type === JavaTokenType.RBRACKET) {
          lookahead++; // skip ]
        }
      }
      
      // Now check if we have an identifier (variable name)
      const nextToken = this.peek(lookahead);
      return nextToken && nextToken.type === JavaTokenType.IDENTIFIER;
    }
    
    return false;
  }

  // Parse variable declaration (handles multiple variables: Type var1, var2, var3;)
  variableDeclaration() {
    const type = this.parseType();
    const variables = [];
    
    // Parse first variable
    const firstName = this.consume(JavaTokenType.IDENTIFIER, 'Expected variable name').value;
    let firstInitializer = null;
    
    if (this.match(JavaTokenType.ASSIGN)) {
      this.advance();
      firstInitializer = this.expression();
    }
    
    variables.push({
      name: firstName,
      initializer: firstInitializer
    });
    
    // Parse additional variables if comma-separated
    while (this.match(JavaTokenType.COMMA)) {
      this.advance(); // consume comma
      const varName = this.consume(JavaTokenType.IDENTIFIER, 'Expected variable name').value;
      let varInitializer = null;
      
      if (this.match(JavaTokenType.ASSIGN)) {
        this.advance();
        varInitializer = this.expression();
      }
      
      variables.push({
        name: varName,
        initializer: varInitializer
      });
    }
    
    if (this.match(JavaTokenType.SEMICOLON)) {
      this.advance();
    }
    
    return {
      type: 'VariableDeclaration',
      variableType: type,
      variables: variables, // Array of variables instead of single name/initializer
      line: type.line,
      column: type.column
    };
  }

  // Parse expression statement
  expressionStatement() {
    return this.variableDeclarationOrExpression();
  }

  // Parse expression (improved for complex expressions)
  expression() {
    const startLine = this.currentToken.line;
    const startColumn = this.currentToken.column;
    const tokens = [];
    let tokenCount = 0;
    const maxTokens = 5000; // Reduced limit to prevent runaway expressions
    let parenCount = 0;
    let braceCount = 0;
    let bracketCount = 0;
    let angleCount = 0; // Track generic type parameters < >
    
    // Parse tokens until we hit a statement boundary
    while (!this.match(JavaTokenType.EOF) && tokenCount < maxTokens) {
      
      // Include the current token first
      tokens.push({
        type: this.currentToken.type,
        value: this.currentToken.value,
        line: this.currentToken.line,
        column: this.currentToken.column,
        position: this.currentToken.position || 0
      });
      
      // Track nested structures
      if (this.match(JavaTokenType.LPAREN)) {
        parenCount++;
      } else if (this.match(JavaTokenType.RPAREN)) {
        parenCount--;
      } else if (this.match(JavaTokenType.LBRACE)) {
        braceCount++;
      } else if (this.match(JavaTokenType.RBRACE)) {
        braceCount--;
      } else if (this.match(JavaTokenType.LBRACKET)) {
        bracketCount++;
      } else if (this.match(JavaTokenType.RBRACKET)) {
        bracketCount--;
      } else if (this.match(JavaTokenType.LESS_THAN)) {
        angleCount++;
      } else if (this.match(JavaTokenType.GREATER_THAN)) {
        angleCount--;
      }
      
      this.advance();
      
      // Stop at statement boundaries only if we're not inside nested structures
      if (parenCount === 0 && braceCount === 0 && bracketCount === 0 && angleCount === 0) {
        if (this.match(JavaTokenType.SEMICOLON) || 
            this.match(JavaTokenType.RBRACE) ||
            this.match(JavaTokenType.COMMA)) {
          break;
        }
      }
      tokenCount++;
      
      // Safety check for runaway expressions
      if (tokenCount >= maxTokens) {
        console.warn('Expression parsing hit token limit, stopping');
        break;
      }
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
    let braceCount = 0;
    let parenCount = 0;
    
    while (!this.match(JavaTokenType.EOF)) {
      if (this.match(JavaTokenType.LBRACE)) {
        braceCount++;
      } else if (this.match(JavaTokenType.RBRACE)) {
        braceCount--;
        if (braceCount < 0) {
          break; // Don't consume the closing brace of the containing block
        }
      } else if (this.match(JavaTokenType.LPAREN)) {
        parenCount++;
      } else if (this.match(JavaTokenType.RPAREN)) {
        parenCount--;
      } else if (this.match(JavaTokenType.SEMICOLON) && braceCount === 0 && parenCount === 0) {
        this.advance(); // consume the semicolon
        break;
      }
      
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
