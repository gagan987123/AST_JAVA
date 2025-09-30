# Java AST Parser

A comprehensive Java Abstract Syntax Tree (AST) parser and generator for Node.js. This library provides tools to parse Java source code, extract meaningful information, and generate code from AST structures.

## Features

- **🔍 Java Lexical Analysis**: Tokenize Java source code
- **🌳 AST Parsing**: Generate Abstract Syntax Trees from Java code
- **📊 Information Extraction**: Extract classes, methods, imports, and more
- **🔧 Code Generation**: Generate Java code from AST structures
- **⚡ Fast & Lightweight**: Efficient parsing with minimal dependencies

## Installation

```bash
npm install java-ast-parser
```

## Quick Start

```javascript
const { JavaParser, JavaGenerator } = require('java-ast-parser');

const javaCode = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`;

// Parse Java code to AST
const ast = JavaParser.parse(javaCode);
console.log('Package:', ast.packageDeclaration?.packageName);
console.log('Classes:', ast.typeDeclarations?.length);

// Generate Java code from AST
const generatedCode = JavaGenerator.generate(ast);
console.log('Generated code:', generatedCode);
```

## API Reference

### Core Classes

#### `JavaParser`
**Primary parser class** - Parses Java source code and returns an Abstract Syntax Tree.

##### `JavaParser.parse(javaCode)`
Static method to parse Java source code.

- **Parameters**: `javaCode` (string) - Java source code
- **Returns**: Object - AST representation
- **Throws**: Error if parsing fails

```javascript
const { JavaParser } = require('java-ast-parser');
const ast = JavaParser.parse('public class Test {}');
```

#### `JavaGenerator`
**Code generator class** - Generates Java source code from AST structures.

##### `JavaGenerator.generate(ast)`
Static method to generate Java code from AST.

- **Parameters**: `ast` (Object) - Abstract Syntax Tree or AST node
- **Returns**: string - Generated Java code
- **Throws**: Error if generation fails

```javascript
const { JavaGenerator } = require('java-ast-parser');
const code = JavaGenerator.generate(ast);

// Generate from specific AST nodes
const methodCode = JavaGenerator.generate(ast.typeDeclarations[0].body.statements[0]);
const classCode = JavaGenerator.generate(ast.typeDeclarations[0]);
```

## Examples

### Basic Parsing and Generation

```javascript
const { JavaParser, JavaGenerator } = require('java-ast-parser');

const javaCode = `
package com.example;

public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}
`;

// Parse Java code
const ast = JavaParser.parse(javaCode);
console.log('Package:', ast.packageDeclaration.packageName);
console.log('Classes:', ast.typeDeclarations.length);

// Generate code back from AST
const generatedCode = JavaGenerator.generate(ast);
console.log('Generated code:', generatedCode);
```

### Partial Code Generation

```javascript
const { JavaParser, JavaGenerator } = require('java-ast-parser');

const ast = JavaParser.parse(javaCode);

// Generate entire class
const classCode = JavaGenerator.generate(ast.typeDeclarations[0]);

// Generate single method
const methodCode = JavaGenerator.generate(ast.typeDeclarations[0].body.statements[0]);

// Generate method body only
const bodyCode = JavaGenerator.generate(ast.typeDeclarations[0].body.statements[0].body);

console.log('Method code:', methodCode);
```

### Advanced Usage with Direct Lexer

```javascript
const { JavaLexer, JavaParser, JavaGenerator } = require('java-ast-parser');

// Direct lexer usage for tokenization
const lexer = new JavaLexer(javaCode);
const tokens = lexer.tokenize();
console.log('Tokens:', tokens.length);

// Direct parser usage
const parser = new JavaParser(lexer);
const ast = parser.parse();

// Generate code
const code = JavaGenerator.generate(ast);
```

## Supported Java Features

### Parsing ✅
- ✅ Package declarations
- ✅ Import statements (static and regular)
- ✅ Class declarations with modifiers
- ✅ Method definitions with parameters
- ✅ Constructor definitions
- ✅ Field declarations with initializers
- ✅ Access modifiers (public, private, protected, static, final)
- ✅ Method parameters and return types
- ✅ Basic expressions and statements
- ✅ Variable declarations with initializers
- ✅ Method calls and expressions

### Code Generation ✅
- ✅ Full compilation unit generation
- ✅ Individual class generation
- ✅ Single method generation
- ✅ Method body generation
- ✅ Variable declaration generation
- ✅ Expression statement generation
- ✅ Proper indentation and formatting

## Error Handling

The library provides comprehensive error handling:

```javascript
const { JavaParser, JavaGenerator } = require('java-ast-parser');

try {
    const ast = JavaParser.parse(invalidJavaCode);
    const code = JavaGenerator.generate(ast);
} catch (error) {
    console.error('Operation failed:', error.message);
    // Handle parsing/generation errors gracefully
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

**Gagandeep Singh**
- GitHub: [@gagan987123](https://github.com/gagan987123)
- Email: gaganarora987123@gmail.com

## Changelog

### v1.0.0
- Initial release
- Basic Java parsing functionality
- AST generation and information extraction
- Code generation capabilities
