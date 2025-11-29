# Integration Plan: feat/kmn-ldml-roundtrip-clean → feat/ldml-js-compile-clean

**Team Leader:** Planning systematic integration
**Date:** 2025-11-28
**Strategy:** File-by-file import to avoid conflicts

---

## 📋 File-by-File Action Plan

### ✅ Category 1: IDENTICAL - No Action Needed

These files exist in both branches with identical changes:

| File | Status | Action |
|------|--------|--------|
| `developer/src/kmc-ldml/src/compiler/compiler.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/hardware-layout-registry.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/javascript-builder.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/key-subkey-factory.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/ldml-compiler-messages.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/ldml-keyboard-keymanweb-compiler.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/touch-layout-compiler.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/transform-compiler.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/compiler/variable-expander.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/src/main.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/test/ldml-keyboard-keymanweb-compiler.tests.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc-ldml/test/touch-autogen.tests.ts` | ✅ Identical | **KEEP** current |
| `developer/src/kmc/src/commands/buildClasses/BuildProject.ts` | ✅ Identical | **KEEP** current |
| `docs/specs/LDML_TO_JS_COMPILER_SPEC.md` | ✅ Identical | **KEEP** current |

**Result:** 14 files already in sync ✅

---

### 📦 Category 2: NEW PACKAGE - Import Entire Directory

**Package:** `developer/src/kmc-kmn-to-ldml/` (NEW in roundtrip branch)

| File | Action | Worker | Priority |
|------|--------|--------|----------|
| `package.json` | **IMPORT** | Alpha | P0 |
| `package-lock.json` | **IMPORT** | Alpha | P0 |
| `tsconfig.json` | **IMPORT** | Alpha | P0 |
| `src/kmn-ast.ts` | **IMPORT** | Alpha | P0 |
| `src/kmn-parser.ts` | **IMPORT** | Alpha | P0 |
| `src/ldml-generator.ts` | **IMPORT** | Alpha | P0 |
| `src/kmn-generator.ts` | **IMPORT** | Alpha | P0 |
| `src/touch-layout-converter.ts` | **IMPORT** | Alpha | P0 |
| `src/main.ts` | **IMPORT** | Alpha | P0 |
| `test/round-trip-test.ts` | **IMPORT** | Alpha | P1 |
| `test/compile-compare-test.ts` | **IMPORT** | Alpha | P1 |
| `test/functional-diff-test.ts` | **IMPORT** | Alpha | P1 |
| `test/test-converter.ts` | **IMPORT** | Alpha | P1 |

**Result:** 13 files to import (entire new package) 📦

---

### 🔧 Category 3: KMC CLI - Import Command Files

**Component:** Project conversion CLI commands

| File | Action | Worker | Priority |
|------|--------|--------|----------|
| `developer/src/kmc/src/commands/convertProject.ts` | **IMPORT** | Beta | P0 |
| `developer/src/kmc/src/util/projectConverter.ts` | **IMPORT** | Beta | P0 |
| `developer/src/kmc/src/kmc.ts` | **MERGE** (add convert command) | Beta | P0 |
| `developer/src/kmc/src/messages/infrastructureMessages.ts` | **MERGE** (add 3 messages) | Beta | P0 |

**Merge Details for kmc.ts:**
```typescript
// Current: No convert command
// Add from roundtrip:
import { declareConvertProject } from './commands/convertProject.js';
// ...
declareConvertProject(program);
```

**Merge Details for infrastructureMessages.ts:**
```typescript
// Add from roundtrip:
static INFO_ConvertingProject = SevInfo | 0x0029;
static INFO_ProjectConversionComplete = SevInfo | 0x002A;
static WARN_MultipleProjectFiles = SevInfo | 0x002B;
```

**Result:** 4 files (2 import, 2 merge) 🔧

---

### 🖥️ Category 4: DELPHI UI - Import GUI Components

**Component:** KM Developer (Tike) integration

| File | Action | Worker | Priority |
|------|--------|--------|----------|
| `developer/src/tike/project/UfrmConvertProjectParameters.pas` | **IMPORT** | Beta | P1 |
| `developer/src/tike/project/UfrmConvertProjectParameters.dfm` | **IMPORT** | Beta | P1 |
| `developer/src/tike/compile/Keyman.Developer.System.KmcWrapper.pas` | **MERGE** (add ConvertProject method) | Beta | P1 |
| `developer/src/tike/help/Keyman.Developer.System.HelpTopics.pas` | **MERGE** (add help topic) | Beta | P1 |
| `developer/src/kmconvert/Keyman.Developer.System.KMConvertParameters.pas` | **MERGE** (update usage text) | Beta | P2 |
| `developer/src/kmconvert/Keyman.Developer.System.KeymanConvertMain.pas` | **MERGE** (add handlers) | Beta | P2 |

**Merge Details:**
- KmcWrapper.pas: Add `ConvertProject()` method
- HelpTopics.pas: Add `SHelpTopic_Context_ConvertProject` constant
- KMConvertParameters.pas: Remove "not yet implemented" from usage
- KeymanConvertMain.pas: Add `DoConvertProject()` and case handlers

**Result:** 6 files (2 import, 4 merge) 🖥️

---

### 📚 Category 5: DOCUMENTATION - Import Spec

| File | Action | Worker | Priority |
|------|--------|--------|----------|
| `docs/specs/PROJECT_CONVERSION_UI_SPEC.md` | **IMPORT** | Beta | P2 |

**Result:** 1 file to import 📚

---

## 📊 Summary Statistics

| Category | Files | Import | Merge | Keep |
|----------|-------|--------|-------|------|
| Identical | 14 | 0 | 0 | 14 |
| New Package | 13 | 13 | 0 | 0 |
| KMC CLI | 4 | 2 | 2 | 0 |
| Delphi UI | 6 | 2 | 4 | 0 |
| Documentation | 1 | 1 | 0 | 0 |
| **TOTAL** | **38** | **18** | **6** | **14** |

---

## 🎯 Work Assignments

### Worker Agent Alpha - Priority 0 Tasks
**Focus:** Import kmc-kmn-to-ldml package

1. ✅ Create package directory structure
2. ✅ Import package.json, package-lock.json, tsconfig.json
3. ✅ Import all src/*.ts files (9 files)
4. ✅ Import all test/*.ts files (4 files)
5. ✅ Verify TypeScript compilation
6. ✅ Run tests to ensure functionality

**Estimated Time:** 30 minutes
**Dependencies:** None
**Success Criteria:** Package builds and tests pass

---

### Worker Agent Beta - Priority 0 & 1 Tasks
**Focus:** Import CLI commands and Delphi UI

**Priority 0:**
1. ✅ Import convertProject.ts
2. ✅ Import projectConverter.ts
3. ✅ Merge kmc.ts (add convert command registration)
4. ✅ Merge infrastructureMessages.ts (add 3 new messages)

**Priority 1:**
5. ✅ Import UfrmConvertProjectParameters.pas/.dfm
6. ✅ Merge KmcWrapper.pas (add ConvertProject method)
7. ✅ Merge HelpTopics.pas (add help topic constant)

**Priority 2:**
8. ✅ Import PROJECT_CONVERSION_UI_SPEC.md
9. ✅ Merge KMConvertParameters.pas (update usage)
10. ✅ Merge KeymanConvertMain.pas (add handlers)

**Estimated Time:** 45 minutes
**Dependencies:** Alpha completes P0
**Success Criteria:** CLI commands work, GUI dialogs compile

---

## ✅ Verification Checklist

### Verification Agent Tasks

**Build Verification:**
- [ ] `npm install` in kmc-kmn-to-ldml succeeds
- [ ] `npm run build` in kmc-kmn-to-ldml succeeds
- [ ] `npm run build` in kmc-ldml succeeds
- [ ] `npm run build` in kmc succeeds
- [ ] No TypeScript compilation errors

**Test Verification:**
- [ ] All existing kmc-ldml tests pass
- [ ] All new kmc-kmn-to-ldml tests pass
- [ ] Round-trip tests execute successfully
- [ ] Compile-compare tests execute successfully

**Functional Verification:**
- [ ] `kmc convert project` command exists
- [ ] Can convert KMN → LDML
- [ ] Can convert LDML → KMN
- [ ] Generated files are valid

**Integration Verification:**
- [ ] No circular dependencies
- [ ] All imports resolve correctly
- [ ] No duplicate code
- [ ] Package.json dependencies correct

---

## 🎨 QC Agent Checklist

**Code Quality:**
- [ ] All imported code has JSDoc comments
- [ ] No TODO/FIXME comments left unresolved
- [ ] Error handling is consistent
- [ ] No console.log() in production code
- [ ] Async/await used consistently

**Architecture:**
- [ ] Clear separation of concerns
- [ ] No tight coupling between modules
- [ ] Interfaces properly defined
- [ ] Type safety maintained

**Maintainability:**
- [ ] Code is self-documenting
- [ ] Complex logic has explanatory comments
- [ ] File organization is logical
- [ ] Naming conventions consistent

---

## 👔 Style Agent Checklist

**TypeScript Style:**
- [ ] 2-space indentation
- [ ] Single quotes for strings
- [ ] Trailing commas in multi-line
- [ ] Explicit return types on public methods
- [ ] CamelCase for variables/functions
- [ ] PascalCase for classes/interfaces

**Delphi Style:**
- [ ] Pascal naming conventions
- [ ] Proper indentation
- [ ] Comments use `//` or `{ }`
- [ ] Type declarations before implementation

**Documentation Style:**
- [ ] JSDoc format for TypeScript
- [ ] XML doc comments for Delphi
- [ ] Examples in @example tags
- [ ] @param and @returns tags present

---

## 🔄 Synthesis Agent Tasks

**Integration Steps:**
1. ✅ Verify all imports completed
2. ✅ Verify all merges completed
3. ✅ Run full build
4. ✅ Run full test suite
5. ✅ Check for conflicts
6. ✅ Validate package.json dependencies
7. ✅ Create commit with all changes

**Commit Message Template:**
```
feat(ldml): integrate KMN↔LDML conversion functionality

Integrated complete bidirectional conversion system from
feat/kmn-ldml-roundtrip-clean branch:

New Package (kmc-kmn-to-ldml):
- KMN parser and AST (kmn-parser.ts, kmn-ast.ts)
- LDML generator from KMN (ldml-generator.ts)
- KMN generator from LDML (kmn-generator.ts)
- Touch layout converter (touch-layout-converter.ts)
- Round-trip verification tests
- Compile comparison tests

CLI Integration (kmc):
- Project conversion command (convertProject.ts)
- Project converter utility (projectConverter.ts)
- Infrastructure messages for conversion

GUI Integration (Tike):
- Conversion parameter dialog (UfrmConvertProjectParameters)
- KmcWrapper.ConvertProject() method
- Help topic integration

Delphi CLI (kmconvert):
- Command-line conversion support
- DoConvertProject() implementation

This completes the full KMN↔LDML conversion ecosystem with
verification tests and multi-platform support.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎯 Team Leader Sign-Off Criteria

**Pre-Approval Checks:**
- [ ] All worker tasks completed
- [ ] Verification agent approves
- [ ] QC agent approves (8/10 minimum)
- [ ] Style agent approves (100% compliance)
- [ ] Synthesis agent completes integration
- [ ] No regressions in existing functionality
- [ ] All tests pass
- [ ] Documentation complete

**Final Approval:**
- [ ] Code review complete
- [ ] Architecture validated
- [ ] No technical debt introduced
- [ ] Rebase plan documented
- [ ] Ready for PR

---

**Status:** READY TO EXECUTE
**Next Step:** Deploy Worker Agent Alpha
