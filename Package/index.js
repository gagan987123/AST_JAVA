// Java AST Library - Main Entry Point
const { JavaLexer } = require('./src/java-lexer');
const { JavaParser } = require('./src/java-parser');
const { JavaGenerator } = require('./src/java-generator');
// Add static parse method to JavaParser
JavaParser.parse = function(javaCode) {
  try {
    const lexer = new JavaLexer(javaCode);
    const parser = new JavaParser(lexer);
    return parser.parse();
  } catch (error) {
    throw new Error(`Java parsing failed: ${error.message}`);
  }

}

// Add static generate method to JavaGenerator
JavaGenerator.generate = function(ast) {
  try {
    const generator = new JavaGenerator(ast);
    return generator.generate();
  } catch (error) {
    throw new Error(`Java generation failed: ${error.message}`);
  }
};

module.exports = { JavaParser, JavaGenerator };