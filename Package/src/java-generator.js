// Java Code Generator - Converts AST back to Java source code
class JavaCodeGenerator {
  constructor(options = {}) {
    this.indentSize = options.indentSize || 4;
    this.indentLevel = 0;
    this.useSpaces = options.useSpaces !== false; // Default to spaces
    this.newlineStyle = options.newlineStyle || '\n';
    this.bracketStyle = options.bracketStyle || 'java'; // 'java' or 'allman'
  }

  // Get current indentation string
  indent() {
    const char = this.useSpaces ? ' ' : '\t';
    const size = this.useSpaces ? this.indentSize : 1;
    return char.repeat(this.indentLevel * size);
  }

  // Increase indentation level
  increaseIndent() {
    this.indentLevel++;
  }

  // Decrease indentation level
  decreaseIndent() {
    this.indentLevel--;
  }

  // Generate Java code from AST
  generate(ast) {
    if (!ast) return '';
    
    const methodName = `generate${ast.type}`;
    if (this[methodName]) {
      return this[methodName](ast);
    }
    
    console.warn(`No generator method for ${ast.type}`);
    return '';
  }

  // Generate compilation unit (main entry point)
  generateCompilationUnit(ast) {
    let code = '';
    
    // Generate package declaration
    if (ast.packageDeclaration) {
      code += this.generate(ast.packageDeclaration) + this.newlineStyle + this.newlineStyle;
    }
    
    // Generate imports
    if (ast.imports && ast.imports.length > 0) {
      ast.imports.forEach(imp => {
        code += this.generate(imp) + this.newlineStyle;
      });
      code += this.newlineStyle;
    }
    
    // Generate type declarations
    ast.typeDeclarations.forEach((typeDecl, index) => {
      if (index > 0) {
        code += this.newlineStyle;
      }
      code += this.generate(typeDecl);
    });
    
    return code;
  }

  // Generate package declaration
  generatePackageDeclaration(ast) {
    return `package ${ast.packageName};`;
  }

  // Generate import declaration
  generateImportDeclaration(ast) {
    let code = 'import ';
    if (ast.isStatic) {
      code += 'static ';
    }
    code += ast.packageName;
    if (ast.isWildcard) {
      code += '.*';
    }
    code += ';';
    return code;
  }

  // Generate class declaration
  generateClassDeclaration(ast) {
    let code = '';
    
    // Generate Javadoc comment if needed
    code += this.generateJavadoc(ast);
    
    // Generate annotations
    if (ast.annotations && ast.annotations.length > 0) {
      ast.annotations.forEach(annotation => {
        code += this.indent() + this.generate(annotation) + this.newlineStyle;
      });
    }
    
    // Generate class signature
    code += this.indent();
    
    // Modifiers
    if (ast.modifiers && ast.modifiers.length > 0) {
      code += ast.modifiers.map(m => this.generate(m)).join(' ') + ' ';
    }
    
    code += `class ${ast.name}`;
    
    // Extends clause
    if (ast.superClass) {
      code += ` extends ${this.generate(ast.superClass)}`;
    }
    
    // Implements clause
    if (ast.interfaces && ast.interfaces.length > 0) {
      code += ` implements ${ast.interfaces.map(i => this.generate(i)).join(', ')}`;
    }
    
    // Class body
    if (this.bracketStyle === 'allman') {
      code += this.newlineStyle + this.indent() + '{';
    } else {
      code += ' {';
    }
    
    code += this.newlineStyle;
    
    if (ast.body) {
      this.increaseIndent();
      code += this.generate(ast.body);
      this.decreaseIndent();
    }
    
    code += this.indent() + '}' + this.newlineStyle;
    
    return code;
  }

  // Generate interface declaration
  generateInterfaceDeclaration(ast) {
    let code = '';
    
    // Generate Javadoc comment if needed
    code += this.generateJavadoc(ast);
    
    // Generate annotations
    if (ast.annotations && ast.annotations.length > 0) {
      ast.annotations.forEach(annotation => {
        code += this.indent() + this.generate(annotation) + this.newlineStyle;
      });
    }
    
    // Generate interface signature
    code += this.indent();
    
    // Modifiers
    if (ast.modifiers && ast.modifiers.length > 0) {
      code += ast.modifiers.map(m => this.generate(m)).join(' ') + ' ';
    }
    
    code += `interface ${ast.name}`;
    
    // Extends clause
    if (ast.interfaces && ast.interfaces.length > 0) {
      code += ` extends ${ast.interfaces.map(i => this.generate(i)).join(', ')}`;
    }
    
    // Interface body
    if (this.bracketStyle === 'allman') {
      code += this.newlineStyle + this.indent() + '{';
    } else {
      code += ' {';
    }
    
    code += this.newlineStyle;
    
    if (ast.body) {
      this.increaseIndent();
      code += this.generate(ast.body);
      this.decreaseIndent();
    }
    
    code += this.indent() + '}' + this.newlineStyle;
    
    return code;
  }

  // Generate method declaration
  generateMethodDeclaration(ast) {
    let code = '';
    
    // Generate Javadoc comment
    code += this.generateMethodJavadoc(ast);
    
    // Generate annotations
    if (ast.annotations && ast.annotations.length > 0) {
      ast.annotations.forEach(annotation => {
        code += this.indent() + this.generate(annotation) + this.newlineStyle;
      });
    }
    
    // Generate method signature
    code += this.indent();
    
    // Modifiers
    if (ast.modifiers && ast.modifiers.length > 0) {
      code += ast.modifiers.map(m => this.generate(m)).join(' ') + ' ';
    }
    
    // Return type
    code += this.generate(ast.returnType) + ' ';
    
    // Method name
    code += ast.name;
    
    // Parameters
    code += '(';
    if (ast.parameters && ast.parameters.length > 0) {
      code += ast.parameters.map(p => this.generate(p)).join(', ');
    }
    code += ')';
    
    // Method body or semicolon for abstract methods
    if (ast.body) {
      if (this.bracketStyle === 'allman') {
        code += this.newlineStyle + this.indent() + '{';
      } else {
        code += ' {';
      }
      code += this.newlineStyle;
      
      this.increaseIndent();
      code += this.generateMethodBody(ast);
      this.decreaseIndent();
      
      code += this.indent() + '}';
    } else {
      code += ';';
    }
    
    code += this.newlineStyle;
    
    return code;
  }

  // Generate constructor declaration
  generateConstructorDeclaration(ast) {
    let code = '';
    
    // Generate Javadoc comment
    code += this.generateConstructorJavadoc(ast);
    
    // Generate annotations
    if (ast.annotations && ast.annotations.length > 0) {
      ast.annotations.forEach(annotation => {
        code += this.indent() + this.generate(annotation) + this.newlineStyle;
      });
    }
    
    // Generate constructor signature
    code += this.indent();
    
    // Modifiers
    if (ast.modifiers && ast.modifiers.length > 0) {
      code += ast.modifiers.map(m => this.generate(m)).join(' ') + ' ';
    }
    
    // Constructor name
    code += ast.name;
    
    // Parameters
    code += '(';
    if (ast.parameters && ast.parameters.length > 0) {
      code += ast.parameters.map(p => this.generate(p)).join(', ');
    }
    code += ')';
    
    // Constructor body
    if (this.bracketStyle === 'allman') {
      code += this.newlineStyle + this.indent() + '{';
    } else {
      code += ' {';
    }
    code += this.newlineStyle;
    
    this.increaseIndent();
    code += this.generateConstructorBody(ast);
    this.decreaseIndent();
    
    code += this.indent() + '}' + this.newlineStyle;
    
    return code;
  }

  // Generate parameter
  generateParameter(ast) {
    let code = '';
    
    if (ast.isFinal) {
      code += 'final ';
    }
    
    code += this.generate(ast.type) + ' ' + ast.name;
    
    return code;
  }

  // Generate type
  generateType(ast) {
    let code = ast.name;
    
    if (ast.isArray) {
      code += '[]'.repeat(ast.arrayDimensions);
    }
    
    return code;
  }

  // Generate modifier
  generateModifier(ast) {
    return ast.name;
  }

  // Generate annotation
  generateAnnotation(ast) {
    let code = '@' + ast.name;
    
    if (ast.arguments && ast.arguments.length > 0) {
      code += '(' + ast.arguments.join(', ') + ')';
    }
    
    return code;
  }

  // Generate identifier
  generateIdentifier(ast) {
    return ast.name;
  }

  // Generate block
  generateBlock(ast) {
    let code = '';
    
    if (ast.statements && ast.statements.length > 0) {
      ast.statements.forEach(stmt => {
        if (stmt) {
          code += this.generate(stmt);
          if (code && !code.endsWith(this.newlineStyle)) {
            code += this.newlineStyle;
          }
        }
      });
    }
    
    return code;
  }

  // Generate method body (placeholder)
  generateMethodBody(ast) {
    let code = this.indent() + '// TODO: Implement method body' + this.newlineStyle;
    
    // Add a simple return statement based on return type
    if (ast.returnType && ast.returnType.name !== 'void') {
      code += this.indent();
      switch (ast.returnType.name) {
        case 'boolean':
          code += 'return false;';
          break;
        case 'int':
        case 'long':
        case 'short':
        case 'byte':
          code += 'return 0;';
          break;
        case 'float':
        case 'double':
          code += 'return 0.0;';
          break;
        case 'char':
          code += "return '\\0';";
          break;
        default:
          code += 'return null;';
      }
      code += this.newlineStyle;
    }
    
    return code;
  }

  // Generate constructor body (placeholder)
  generateConstructorBody(ast) {
    return this.indent() + '// TODO: Implement constructor body' + this.newlineStyle;
  }

  // Generate Javadoc comment for classes/interfaces
  generateJavadoc(ast) {
    return this.indent() + '/**' + this.newlineStyle +
           this.indent() + ` * ${ast.name}` + this.newlineStyle +
           this.indent() + ' */' + this.newlineStyle;
  }

  // Generate Javadoc comment for methods
  generateMethodJavadoc(ast) {
    let code = this.indent() + '/**' + this.newlineStyle;
    code += this.indent() + ` * ${ast.name}` + this.newlineStyle;
    
    // Parameters
    if (ast.parameters && ast.parameters.length > 0) {
      code += this.indent() + ' *' + this.newlineStyle;
      ast.parameters.forEach(param => {
        code += this.indent() + ` * @param ${param.name} the ${param.name}` + this.newlineStyle;
      });
    }
    
    // Return value
    if (ast.returnType && ast.returnType.name !== 'void') {
      code += this.indent() + ' *' + this.newlineStyle;
      code += this.indent() + ` * @return the result` + this.newlineStyle;
    }
    
    code += this.indent() + ' */' + this.newlineStyle;
    
    return code;
  }

  // Generate Javadoc comment for constructors
  generateConstructorJavadoc(ast) {
    let code = this.indent() + '/**' + this.newlineStyle;
    code += this.indent() + ` * Creates a new ${ast.name}` + this.newlineStyle;
    
    // Parameters
    if (ast.parameters && ast.parameters.length > 0) {
      code += this.indent() + ' *' + this.newlineStyle;
      ast.parameters.forEach(param => {
        code += this.indent() + ` * @param ${param.name} the ${param.name}` + this.newlineStyle;
      });
    }
    
    code += this.indent() + ' */' + this.newlineStyle;
    
    return code;
  }
}

// Enhanced generator that works with extracted data
class JavaCodeGeneratorFromExtracted {
  constructor(options = {}) {
    this.generator = new JavaCodeGenerator(options);
  }

  // Generate Java code from extracted AST data
  generateFromExtracted(extractedData) {
    let code = '';
    
    // Generate package declaration
    if (extractedData.package) {
      code += `package ${extractedData.package.name};` + '\n\n';
    }
    
    // Generate imports
    if (extractedData.imports && extractedData.imports.length > 0) {
      extractedData.imports.forEach(imp => {
        let importLine = 'import ';
        if (imp.isStatic) {
          importLine += 'static ';
        }
        importLine += imp.packageName;
        if (imp.isWildcard) {
          importLine += '.*';
        }
        importLine += ';';
        code += importLine + '\n';
      });
      code += '\n';
    }
    
    // Generate classes
    extractedData.classes.forEach(cls => {
      code += this.generateClassFromExtracted(cls) + '\n';
    });
    
    // Generate interfaces
    extractedData.interfaces.forEach(iface => {
      code += this.generateInterfaceFromExtracted(iface) + '\n';
    });
    
    return code;
  }

  // Generate class from extracted data
  generateClassFromExtracted(cls) {
    let code = '';
    
    // Javadoc
    code += '/**\n';
    code += ` * ${cls.name}\n`;
    code += ' */\n';
    
    // Annotations
    cls.annotations.forEach(annotation => {
      code += `@${annotation}\n`;
    });
    
    // Class declaration
    let classLine = cls.modifiers.join(' ');
    if (classLine) classLine += ' ';
    classLine += `class ${cls.name}`;
    
    if (cls.superClass) {
      classLine += ` extends ${cls.superClass}`;
    }
    
    if (cls.interfaces && cls.interfaces.length > 0) {
      classLine += ` implements ${cls.interfaces.join(', ')}`;
    }
    
    code += classLine + ' {\n\n';
    
    // Constructors
    cls.constructors.forEach(constructor => {
      code += this.generateConstructorFromExtracted(constructor, '    ') + '\n';
    });
    
    // Methods
    cls.methods.forEach(method => {
      code += this.generateMethodFromExtracted(method, '    ') + '\n';
    });
    
    code += '}\n';
    
    return code;
  }

  // Generate interface from extracted data
  generateInterfaceFromExtracted(iface) {
    let code = '';
    
    // Javadoc
    code += '/**\n';
    code += ` * ${iface.name}\n`;
    code += ' */\n';
    
    // Annotations
    iface.annotations.forEach(annotation => {
      code += `@${annotation}\n`;
    });
    
    // Interface declaration
    let interfaceLine = iface.modifiers.join(' ');
    if (interfaceLine) interfaceLine += ' ';
    interfaceLine += `interface ${iface.name}`;
    
    if (iface.extends && iface.extends.length > 0) {
      interfaceLine += ` extends ${iface.extends.join(', ')}`;
    }
    
    code += interfaceLine + ' {\n\n';
    
    // Methods
    iface.methods.forEach(method => {
      code += this.generateMethodFromExtracted(method, '    ', true) + '\n';
    });
    
    code += '}\n';
    
    return code;
  }

  // Generate method from extracted data
  generateMethodFromExtracted(method, indent = '', isInterface = false) {
    let code = '';
    
    // Javadoc
    code += indent + '/**\n';
    code += indent + ` * ${method.name}\n`;
    code += indent + ' *\n';
    
    method.parameters.forEach(param => {
      code += indent + ` * @param ${param.name} the ${param.name}\n`;
    });
    
    if (method.returnType.name !== 'void') {
      code += indent + ' * @return the result\n';
    }
    
    code += indent + ' */\n';
    
    // Annotations
    method.annotations.forEach(annotation => {
      code += indent + `@${annotation}\n`;
    });
    
    // Method signature
    let methodLine = indent;
    if (method.modifiers.length > 0) {
      methodLine += method.modifiers.join(' ') + ' ';
    }
    
    methodLine += method.returnType.name;
    if (method.returnType.isArray) {
      methodLine += '[]'.repeat(method.returnType.arrayDimensions);
    }
    methodLine += ` ${method.name}(`;
    
    // Parameters
    const params = method.parameters.map(param => {
      let paramStr = param.type.name;
      if (param.type.isArray) {
        paramStr += '[]'.repeat(param.type.arrayDimensions);
      }
      paramStr += ` ${param.name}`;
      return paramStr;
    });
    methodLine += params.join(', ');
    methodLine += ')';
    
    // Method body or semicolon
    if (isInterface && !method.modifiers.includes('default') && !method.modifiers.includes('static')) {
      methodLine += ';';
    } else {
      methodLine += ' {\n';
      methodLine += indent + '    // TODO: Implement method body\n';
      
      // Add return statement if needed
      if (method.returnType.name !== 'void') {
        switch (method.returnType.name) {
          case 'boolean':
            methodLine += indent + '    return false;\n';
            break;
          case 'int':
          case 'long':
          case 'short':
          case 'byte':
            methodLine += indent + '    return 0;\n';
            break;
          case 'float':
          case 'double':
            methodLine += indent + '    return 0.0;\n';
            break;
          case 'char':
            methodLine += indent + "    return '\\0';\n";
            break;
          default:
            methodLine += indent + '    return null;\n';
        }
      }
      
      methodLine += indent + '}';
    }
    
    code += methodLine + '\n';
    
    return code;
  }

  // Generate constructor from extracted data
  generateConstructorFromExtracted(constructor, indent = '') {
    let code = '';
    
    // Javadoc
    code += indent + '/**\n';
    code += indent + ` * Creates a new ${constructor.name}\n`;
    code += indent + ' *\n';
    
    constructor.parameters.forEach(param => {
      code += indent + ` * @param ${param.name} the ${param.name}\n`;
    });
    
    code += indent + ' */\n';
    
    // Annotations
    constructor.annotations.forEach(annotation => {
      code += indent + `@${annotation}\n`;
    });
    
    // Constructor signature
    let constructorLine = indent;
    if (constructor.modifiers.length > 0) {
      constructorLine += constructor.modifiers.join(' ') + ' ';
    }
    
    constructorLine += `${constructor.name}(`;
    
    // Parameters
    const params = constructor.parameters.map(param => {
      let paramStr = param.type.name;
      if (param.type.isArray) {
        paramStr += '[]'.repeat(param.type.arrayDimensions);
      }
      paramStr += ` ${param.name}`;
      return paramStr;
    });
    constructorLine += params.join(', ');
    constructorLine += ') {\n';
    constructorLine += indent + '    // TODO: Implement constructor body\n';
    constructorLine += indent + '}';
    
    code += constructorLine + '\n';
    
    return code;
  }
}


// Simple JavaGenerator class that works with your AST structure
class JavaGenerator {
  constructor(ast) {
    this.ast = ast;
    this.indentLevel = 0;
    this.indentSize = 4;
  }

  // Get current indentation
  indent() {
    return ' '.repeat(this.indentLevel * this.indentSize);
  }

  // Generate Java code from AST
  generate() {
    if (!this.ast) return '';
    
    // Handle different AST node types
    switch (this.ast.type) {
      case 'CompilationUnit':
        return this.generateCompilationUnit(this.ast);
      case 'ClassDeclaration':
        return this.generateClass(this.ast);
      case 'MethodDeclaration':
        return this.generateMethod(this.ast);
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(this.ast);
      case 'ExpressionStatement':
        return this.generateExpressionStatement(this.ast);
      case 'ReturnStatement':
        return this.generateReturnStatement(this.ast);
      case 'Block':
        return this.generateBlock(this.ast);
      default:
        return `// Unknown AST node type: ${this.ast.type}\n`;
    }
  }

  // Generate compilation unit
  generateCompilationUnit(ast) {
    let code = '';
    
    // Package declaration
    if (ast.packageDeclaration) {
      code += `package ${ast.packageDeclaration.packageName};\n\n`;
    }
    
    // Imports
    if (ast.imports && ast.imports.length > 0) {
      ast.imports.forEach(imp => {
        code += this.generateImport(imp) + '\n';
      });
      code += '\n';
    }
    
    // Type declarations (classes)
    if (ast.typeDeclarations && ast.typeDeclarations.length > 0) {
      ast.typeDeclarations.forEach(typeDecl => {
        code += this.generateClass(typeDecl);
      });
    }
    
    return code;
  }

  // Generate import statement
  generateImport(imp) {
    let code = 'import ';
    if (imp.isStatic) {
      code += 'static ';
    }
    code += imp.packageName;
    if (imp.isWildcard) {
      code += '.*';
    }
    code += ';';
    return code;
  }

  // Generate class declaration
  generateClass(cls) {
    let code = '';
    
    // Class signature
    code += this.indent();
    
    // Modifiers
    if (cls.modifiers && cls.modifiers.length > 0) {
      cls.modifiers.forEach(mod => {
        code += mod.name + ' ';
      });
    }
    
    code += `class ${cls.name}`;
    
    // Extends
    if (cls.superClass) {
      code += ` extends ${cls.superClass}`;
    }
    
    // Implements
    if (cls.interfaces && cls.interfaces.length > 0) {
      code += ` implements ${cls.interfaces.join(', ')}`;
    }
    
    code += ' {\n';
    
    // Class body
    if (cls.body && cls.body.statements) {
      this.indentLevel++;
      cls.body.statements.forEach(stmt => {
        if (stmt && stmt.type === 'MethodDeclaration') {
          code += this.generateMethod(stmt);
        }
      });
      this.indentLevel--;
    }
    
    code += '}\n';
    
    return code;
  }

  // Generate method declaration
  generateMethod(method) {
    let code = '';
    
    // Method signature
    code += this.indent();
    
    // Modifiers
    if (method.modifiers && method.modifiers.length > 0) {
      method.modifiers.forEach(mod => {
        code += mod.name + ' ';
      });
    }
    
    // Return type
    if (method.returnType) {
      code += method.returnType.name;
      if (method.returnType.isArray) {
        code += '[]'.repeat(method.returnType.arrayDimensions || 1);
      }
      code += ' ';
    }
    
    // Method name
    code += method.name + '(';
    
    // Parameters
    if (method.parameters && method.parameters.length > 0) {
      const params = method.parameters.map(param => {
        let paramStr = param.type.name;
        if (param.type.isArray) {
          paramStr += '[]'.repeat(param.type.arrayDimensions || 1);
        }
        paramStr += ' ' + param.name;
        return paramStr;
      });
      code += params.join(', ');
    }
    
    code += ') {\n';
    
    // Method body
    if (method.body && method.body.statements) {
      this.indentLevel++;
      method.body.statements.forEach(stmt => {
        code += this.generateStatement(stmt);
      });
      this.indentLevel--;
    }
    
    code += this.indent() + '}\n\n';
    
    return code;
  }

  // Generate statement
  generateStatement(stmt) {
    if (!stmt) return '';
    
    switch (stmt.type) {
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(stmt);
      case 'ExpressionStatement':
        return this.generateExpressionStatement(stmt);
      case 'ReturnStatement':
        return this.generateReturnStatement(stmt);
      default:
        return this.indent() + '// Unknown statement type: ' + stmt.type + '\n';
    }
  }

  // Generate variable declaration
  generateVariableDeclaration(stmt) {
    let code = this.indent();
    
    if (stmt.variableType) {
      code += stmt.variableType.name;
      if (stmt.variableType.isArray) {
        code += '[]'.repeat(stmt.variableType.arrayDimensions || 1);
      }
    }
    
    code += ' ' + stmt.name;
    
    if (stmt.initializer) {
      code += ' = ' + this.generateExpression(stmt.initializer);
    }
    
    code += ';\n';
    return code;
  }

  // Generate expression statement
  generateExpressionStatement(stmt) {
    let code = this.indent();
    code += this.generateExpression(stmt.expression);
    code += ';\n';
    return code;
  }

  // Generate return statement
  generateReturnStatement(stmt) {
    let code = this.indent() + 'return';
    if (stmt.expression) {
      code += ' ' + this.generateExpression(stmt.expression);
    }
    code += ';\n';
    return code;
  }

  // Generate expression
  generateExpression(expr) {
    if (!expr) return '';
    
    if (expr.tokens && expr.tokens.length > 0) {
      return expr.tokens.map(token => token.value).join('');
    }
    
    return '/* expression */';
  }
}

module.exports = { JavaCodeGenerator, JavaGenerator };
