# Java AST Parser & Generator

A lightweight, focused Java Abstract Syntax Tree (AST) parser and code generator built in JavaScript. Designed specifically for parsing Java methods, constructors, imports, and class structures, as well as generating Java code from AST.

## Features

- ✅ **Parse Java Methods** - Extracts all method declarations with parameters and return types
- ✅ **Parse Constructors** - Identifies constructor declarations
- ✅ **Parse Imports** - Extracts all import statements (static and wildcard support)
- ✅ **Parse Package Declarations** - Identifies package information
- ✅ **Parse Class Structures** - Extracts class names, modifiers, and annotations
- ✅ **Handle Annotations** - Supports `@Test`, `@Override`, and other annotations
- ✅ **Generate Java Code** - Convert AST back to formatted Java source code
- ✅ **Clean API** - Simple static method interface

## Installation

```bash
npm install java-ast-parser
```

## Quick Start

```javascript
const { JavaParser, JavaGenerator } = require('java-ast-parser');
const fs = require('fs');

// Read Java file
const javaCode = fs.readFileSync('MyClass.java', 'utf8');

// Parse to AST
const ast = JavaParser.parse(javaCode);

// Access parsed data
console.log('Package:', ast.packageDeclaration?.packageName);
console.log('Imports:', ast.imports.length);
console.log('Classes:', ast.typeDeclarations.length);

// Get methods from first class
const firstClass = ast.typeDeclarations[0];
console.log('Class Name:', firstClass.name);
console.log('Methods:', firstClass.body.statements.length);

// List all methods
firstClass.body.statements.forEach((method, index) => {
    if (method.type === 'MethodDeclaration') {
        const params = method.parameters.map(p => `${p.type.name} ${p.name}`).join(', ');
        console.log(`${index + 1}. Method: ${method.returnType.name} ${method.name}(${params})`);
    }
});

// Generate Java code from AST
const generatedCode = JavaGenerator.generate(ast);
console.log('Generated Java Code:');
console.log(generatedCode);
```

## API Reference

### JavaParser.parse(javaCode)

Parses Java source code and returns an Abstract Syntax Tree.

**Parameters:**
- `javaCode` (string) - Java source code to parse

**Returns:**
- `CompilationUnit` - Root AST node containing:
  - `packageDeclaration` - Package information
  - `imports` - Array of import declarations
  - `typeDeclarations` - Array of class/interface declarations

### JavaGenerator.generate(ast)

Generates Java source code from an Abstract Syntax Tree.

**Parameters:**
- `ast` (CompilationUnit) - The AST to convert to Java code

**Returns:**
- `string` - Formatted Java source code

### AST Structure

#### CompilationUnit
```javascript
{
  type: 'CompilationUnit',
  packageDeclaration: PackageDeclaration | null,
  imports: ImportDeclaration[],
  typeDeclarations: ClassDeclaration[]
}
```

#### PackageDeclaration
```javascript
{
  type: 'PackageDeclaration',
  packageName: string,
  line: number,
  column: number
}
```

#### ImportDeclaration
```javascript
{
  type: 'ImportDeclaration',
  packageName: string,
  isStatic: boolean,
  isWildcard: boolean,
  line: number,
  column: number
}
```

#### ClassDeclaration
```javascript
{
  type: 'ClassDeclaration',
  name: string,
  modifiers: Modifier[],
  superClass: string | null,
  interfaces: string[],
  body: Block,
  annotations: Annotation[],
  line: number,
  column: number
}
```

#### MethodDeclaration
```javascript
{
  type: 'MethodDeclaration',
  name: string,
  returnType: Type,
  parameters: Parameter[],
  modifiers: Modifier[],
  body: Block,
  annotations: Annotation[],
  isConstructor: boolean,
  line: number,
  column: number
}
```

## Example Output

For this Java code:
```java
package com.example;

import java.util.List;
import org.junit.jupiter.api.Test;

public class Calculator {
    @Test
    public void testAdd() {
        // method body
    }
    
    public int add(int a, int b) {
        return a + b;
    }
}
```

The parser returns:
```javascript
{
  type: 'CompilationUnit',
  packageDeclaration: {
    type: 'PackageDeclaration',
    packageName: 'com.example'
  },
  imports: [
    {
      type: 'ImportDeclaration',
      packageName: 'java.util.List',
      isStatic: false,
      isWildcard: false
    },
    {
      type: 'ImportDeclaration', 
      packageName: 'org.junit.jupiter.api.Test',
      isStatic: false,
      isWildcard: false
    }
  ],
  typeDeclarations: [
    {
      type: 'ClassDeclaration',
      name: 'Calculator',
      body: {
        statements: [
          {
            type: 'MethodDeclaration',
            name: 'testAdd',
            returnType: { name: 'void' },
            parameters: [],
            annotations: [{ name: 'Test' }]
          },
          {
            type: 'MethodDeclaration', 
            name: 'add',
            returnType: { name: 'int' },
            parameters: [
              { name: 'a', type: { name: 'int' } },
              { name: 'b', type: { name: 'int' } }
            ]
          }
        ]
      }
    }
  ]
}
```

## Supported Java Features

- ✅ Package declarations
- ✅ Import statements (regular, static, wildcard)
- ✅ Class declarations
- ✅ Method declarations (public, private, protected, static, etc.)
- ✅ Constructor declarations
- ✅ Method parameters and return types
- ✅ Annotations (`@Test`, `@Override`, etc.)
- ✅ Access modifiers (public, private, protected, static, final, abstract)
- ✅ Primitive types (int, double, boolean, etc.)
- ✅ Object types and arrays
- ✅ Nested braces in method bodies

## Use Cases

### Parsing
- **Code Analysis** - Analyze Java codebases for metrics and patterns
- **Documentation Generation** - Extract method signatures for API docs
- **Testing Tools** - Identify test methods and their structure
- **IDE Extensions** - Power code navigation and analysis features

### Code Generation
- **Refactoring Tools** - Modify AST and regenerate Java code
- **Code Templates** - Generate Java classes from templates
- **Code Transformation** - Convert between different Java patterns
- **Automated Code Generation** - Generate boilerplate code from specifications

## Requirements

- Node.js 12+
- No external dependencies

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit issues and pull requests.
