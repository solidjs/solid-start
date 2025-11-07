#!/usr/bin/env node

/**
 * Import Extension Validation Script for SolidStart
 *
 * This script validates that all relative imports in the src/ directory have
 * explicit file extensions, which is mandated by Node.js ESM (ES Modules).
 *
 * Node.js requires explicit file extensions for relative imports when using
 * ES modules to avoid ambiguity and improve performance. This script ensures
 * compliance with this requirement.
 *
 * Features:
 * - Scans all .ts and .tsx files in the src/ directory recursively
 * - Detects relative imports (starting with ./ or ../) without extensions
 * - Prevents .js/.jsx imports in TypeScript files (should use .ts/.tsx)
 * - Ignores commented code, CSS imports, and dynamic imports (handled by bundlers)
 * - Provides detailed error reporting with line numbers and suggestions
 * - Exits with appropriate status codes for CI/CD integration
 *
 * Usage:
 *   npm run validate-imports
 *
 * Exit codes:
 *   0 - All relative imports have valid extensions
 *   1 - Found relative imports without extensions
 *
 * Valid extensions for TypeScript files: .ts, .tsx, .json
 * Invalid extensions for TypeScript files: .js, .jsx (use .ts/.tsx instead)
 *
 * @example
 * // ❌ Invalid - missing extension
 * import { config } from "./config/index";
 *
 * // ❌ Invalid - .js extension in TypeScript file
 * import { config } from "./config/index.js";
 *
 * // ✅ Valid - has .ts extension
 * import { config } from "./config/index.ts";
 *
 * // ✅ Valid - external package import (no extension needed)
 * import { something } from "external-package";
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SRC_DIR = join(__dirname, "..", "src");
const VALID_EXTENSIONS = [".ts", ".tsx", ".json"];
const INVALID_EXTENSIONS = [".js", ".jsx"];
const FILE_EXTENSIONS = [".ts", ".tsx"];

/**
 * Recursively find all files with specified extensions
 */
function findFiles(dir, extensions, files = []) {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findFiles(fullPath, extensions, files);
      } else if (extensions.includes(extname(entry))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }

  return files;
}

/**
 * Check if a path is a relative import (starts with . or ..)
 */
function isRelativeImport(path) {
  return path.startsWith("./") || path.startsWith("../");
}

/**
 * Check if an import path has a valid file extension
 */
function hasValidExtension(path) {
  return VALID_EXTENSIONS.some(ext => path.endsWith(ext));
}

/**
 * Check if an import path has an invalid extension for TypeScript files
 */
function hasInvalidExtension(path) {
  return INVALID_EXTENSIONS.some(ext => path.endsWith(ext));
}

/**
 * Extract import/export statements from file content
 * Matches both import and export statements with from clauses
 */
function extractImportExportStatements(content, filePath) {
  const statements = [];
  const lines = content.split("\n");

  // Regex patterns for different import/export statements
  const patterns = [
    // Standard imports: import { ... } from '...'
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g,
    // Export from: export { ... } from '...'
    /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"`]([^'"`]+)['"`]/g,
    // Export default from: export { default } from '...'
    /export\s+\{\s*default\s*\}\s+from\s+['"`]([^'"`]+)['"`]/g
    // Note: Dynamic imports are excluded as they're handled by bundlers
  ];

  lines.forEach((line, lineNumber) => {
    const trimmedLine = line.trim();

    // Skip commented lines, dynamic imports, and TypeScript type-only imports in d.ts files
    if (
      trimmedLine.startsWith("//") ||
      trimmedLine.startsWith("/*") ||
      trimmedLine.startsWith("*") ||
      (filePath.endsWith(".d.ts") && trimmedLine.includes("import(")) ||
      // Skip CSS imports as they're handled by bundlers
      /import\s+['"`][^'"`]*\.css['"`]/.test(trimmedLine) ||
      // Skip dynamic imports as they're handled by bundlers
      /import\s*\(\s*['"`]/.test(trimmedLine)
    ) {
      return;
    }

    patterns.forEach(pattern => {
      let match;
      // Reset regex lastIndex to avoid issues with global flag
      pattern.lastIndex = 0;
      while ((match = pattern.exec(line)) !== null) {
        const importPath = match[1];
        if (importPath) {
          statements.push({
            path: importPath,
            line: lineNumber + 1,
            fullLine: line.trim(),
            filePath
          });
        }
      }
    });
  });

  return statements;
}

/**
 * Validate a single file for relative imports without extensions
 */
function validateFile(filePath) {
  const errors = [];

  try {
    const content = readFileSync(filePath, "utf8");
    const statements = extractImportExportStatements(content, filePath);

    statements.forEach(statement => {
      if (isRelativeImport(statement.path)) {
        if (hasInvalidExtension(statement.path)) {
          errors.push({
            file: filePath,
            line: statement.line,
            importPath: statement.path,
            fullLine: statement.fullLine,
            type: "invalid-extension"
          });
        } else if (!hasValidExtension(statement.path)) {
          errors.push({
            file: filePath,
            line: statement.line,
            importPath: statement.path,
            fullLine: statement.fullLine,
            type: "missing-extension"
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
  }

  return errors;
}

/**
 * Main validation function
 */
function validateImports() {
  console.log("🔍 Validating relative imports in src/ directory...\n");

  // Find all TypeScript/TSX files in src directory
  const files = findFiles(SRC_DIR, FILE_EXTENSIONS);

  if (files.length === 0) {
    console.log("⚠️  No TypeScript files found in src/ directory");
    process.exit(0);
  }

  console.log(`📁 Scanning ${files.length} files...\n`);

  let totalErrors = 0;
  const errorsByFile = new Map();

  // Validate each file
  files.forEach(file => {
    const errors = validateFile(file);
    if (errors.length > 0) {
      errorsByFile.set(file, errors);
      totalErrors += errors.length;
    }
  });

  // Report results
  if (totalErrors === 0) {
    console.log("✅ All relative imports have valid extensions!");
    process.exit(0);
  } else {
    const missingExtensionErrors = [];
    const invalidExtensionErrors = [];

    errorsByFile.forEach(errors => {
      errors.forEach(error => {
        if (error.type === "missing-extension") {
          missingExtensionErrors.push(error);
        } else if (error.type === "invalid-extension") {
          invalidExtensionErrors.push(error);
        }
      });
    });

    if (missingExtensionErrors.length > 0) {
      console.log(
        `❌ Found ${missingExtensionErrors.length} relative import(s) without extensions:\n`
      );

      const missingByFile = new Map();
      missingExtensionErrors.forEach(error => {
        if (!missingByFile.has(error.file)) {
          missingByFile.set(error.file, []);
        }
        missingByFile.get(error.file).push(error);
      });

      missingByFile.forEach((errors, file) => {
        const relativePath = file.replace(process.cwd(), "").replace(/^\//, "");
        console.log(`📄 ${relativePath}:`);

        errors.forEach(error => {
          console.log(`  Line ${error.line}: ${error.importPath}`);
          console.log(`    ${error.fullLine}`);
          console.log(
            `    ${"".padStart(error.fullLine.indexOf(error.importPath), " ")}${"".padStart(error.importPath.length, "^")}`
          );
        });
        console.log("");
      });
    }

    if (invalidExtensionErrors.length > 0) {
      console.log(
        `❌ Found ${invalidExtensionErrors.length} relative import(s) with invalid extensions:\n`
      );

      const invalidByFile = new Map();
      invalidExtensionErrors.forEach(error => {
        if (!invalidByFile.has(error.file)) {
          invalidByFile.set(error.file, []);
        }
        invalidByFile.get(error.file).push(error);
      });

      invalidByFile.forEach((errors, file) => {
        const relativePath = file.replace(process.cwd(), "").replace(/^\//, "");
        console.log(`📄 ${relativePath}:`);

        errors.forEach(error => {
          console.log(`  Line ${error.line}: ${error.importPath}`);
          console.log(`    ${error.fullLine}`);
          console.log(
            `    ${"".padStart(error.fullLine.indexOf(error.importPath), " ")}${"".padStart(error.importPath.length, "^")}`
          );
        });
        console.log("");
      });
    }

    console.log("💡 Tips:");
    if (missingExtensionErrors.length > 0) {
      console.log('  - Add file extensions to relative imports (e.g., "./file" → "./file.ts")');
    }
    if (invalidExtensionErrors.length > 0) {
      console.log("  - Replace .js/.jsx with .ts/.tsx in TypeScript files");
    }
    console.log("  - This is required by Node.js ESM modules");
    console.log("  - Valid extensions for TypeScript files: " + VALID_EXTENSIONS.join(", "));
    console.log("  - Invalid extensions for TypeScript files: " + INVALID_EXTENSIONS.join(", "));

    process.exit(1);
  }
}

// Run the validation
validateImports();
