# Fix: Firefox element-node cursor in contentEditable / designIFrame

## Problem

In Firefox, `document.getSelection().anchorNode` frequently returns a **parent element node** (e.g. a `<p>` or `<div>` at child-index N) rather than the text node itself. This is valid per the DOM spec, but differs from Chrome/Safari, which almost always return the text node directly.

Keyman's `ContentEditable` and `DesignIFrame` output-target wrappers both guarded against non-text-node cursors with an early return:

```typescript
// getTextBeforeCaret — original
if(caret.node.nodeType != 3) {
  return ''; // Must be a text node to provide a context.
}

// deleteCharsBeforeCaret — original
if(start.node.nodeType != 3) {
  console.warn("Deletion of characters requested without available context!");
  return;
}
```

Both paths silently bailed out when Firefox reported an element-node cursor, even when text was present before the caret.

### Cascade to visible bug

1. `getTextBeforeCaret()` returns `''`
2. `keyboardProcessor.ts`: `nothingDeletable = selectionEmpty && contextBeforeCaret === ''` → `true`
3. `nothingDeletable` forces `triggerKeyDefault = true`
4. Hardware event handler skips `e.preventDefault()` + `e.stopPropagation()`
5. Browser's native backspace fires

In most editors this is survivable (browser deletes the character natively). In **Google Docs on Firefox**, the editor intercepts `beforeinput` events and routes them through its own pipeline. When Keyman both attempts deletion (partially) and lets native backspace through, the cursor moves without deleting — the symptom reported in #15026.

The same `getTextBeforeCaret()` returning `''` also causes context-sensitive keyboard rules to match incorrectly (treating any position in an element as "start of context"), silently misfire across all Firefox contentEditable usage.

## Fix

Added DOM-walking helpers to resolve an element-node caret position to the last text node before that position. Both the read path (`getTextBeforeCaret`) and the write path (`deleteCharsBeforeCaret`) now call this resolution step.

### Helpers (moved to shared base `outputTarget.ts`)

```typescript
protected resolveCaretToTextNode(node: Node, offset: number): {node: Text, offset: number} | null {
  if(node.nodeType === 3) {
    return {node: node as Text, offset};
  }
  for(let i = offset - 1; i >= 0; i--) {
    const result = this.lastTextNodeInSubtree(node.childNodes[i]);
    if(result) { return result; }
  }
  return null;
}

private lastTextNodeInSubtree(node: Node): {node: Text, offset: number} | null {
  if(node.nodeType === 3) {
    const t = node as Text;
    return t.length > 0 ? {node: t, offset: t.length} : null;
  }
  for(let i = node.childNodes.length - 1; i >= 0; i--) {
    const result = this.lastTextNodeInSubtree(node.childNodes[i]);
    if(result) { return result; }
  }
  return null;
}
```

The traversal walks backward through child nodes depth-first, returning the last non-empty text node before the caret's element-node position. If no text node exists (genuinely empty context), returns `null` and the original `''`/warn behavior is preserved.

### `getTextBeforeCaret` (contentEditable.ts, designIFrame.ts)

```typescript
// Before
if(caret.node.nodeType != 3) {
  return '';
}

// After
if(caret.node.nodeType != 3) {
  const resolved = this.resolveCaretToTextNode(caret.node, caret.offset);
  return resolved ? resolved.node.textContent.substr(0, resolved.offset) : '';
}
```

### `deleteCharsBeforeCaret` (contentEditable.ts, designIFrame.ts)

```typescript
// Before
const start = this.getCarets().start;
if(dn > start.offset) { dn = start.offset; }
if(dn <= 0) { return; }
if(start.node.nodeType != 3) {
  console.warn("Deletion of characters requested without available context!");
  return;
}
const range = doc.createRange();
const dnOffset = start.offset - KMWString.substr(start.node.nodeValue.substr(0, start.offset), -dn).length;
range.setStart(start.node, dnOffset);
range.setEnd(start.node, start.offset);
this.adjustDeadkeys(-dn);
range.deleteContents();
// relied on browser to reposition caret

// After
const start = this.getCarets().start;
const resolved = this.resolveCaretToTextNode(start.node, start.offset);
if(!resolved) {
  console.warn("Deletion of characters requested without available context!");
  return;
}
const { node: textNode, offset: textOffset } = resolved;
if(dn > textOffset) { dn = textOffset; }
if(dn <= 0) { return; }
const range = doc.createRange();
const dnOffset = textOffset - KMWString.substr(textNode.nodeValue.substr(0, textOffset), -dn).length;
range.setStart(textNode, dnOffset);
range.setEnd(textNode, textOffset);
this.adjustDeadkeys(-dn);
range.deleteContents();
if(start.node.nodeType != 3) {
  // Deletion was from a resolved (different) node; browser won't auto-adjust the selection.
  doc.getSelection().collapse(textNode, dnOffset);
}
```

The explicit `collapse()` after deletion is necessary because when `start.node` is an element node and the actual deletion happened in a resolved text node, the browser doesn't update the selection automatically.

## Files changed

| File | Change |
|------|--------|
| `web/src/engine/element-wrappers/src/outputTarget.ts` | Added `resolveCaretToTextNode` (protected) and `lastTextNodeInSubtree` (private) |
| `web/src/engine/element-wrappers/src/contentEditable.ts` | Fixed `getTextBeforeCaret`, `deleteCharsBeforeCaret`; removed local duplicate helpers |
| `web/src/engine/element-wrappers/src/designIFrame.ts` | Same fixes as contentEditable; removed local duplicate helpers |

## Knock-on effects

### Positive

- **Context-sensitive rules now fire correctly in Firefox** for any contentEditable element. Previously a rule like `'a' + 'b' > 'c'` would never match in Firefox if the cursor happened to land at an element node after the `a` was inserted, because `getTextBeforeCaret()` returned `''`.
- **SMP (surrogate pair) deletion is now correct** in Firefox contentEditable. Keyman's `deleteCharsBeforeCaret` uses `KMWString.substr` to count Unicode code points (not UTF-16 code units), correctly deleting both surrogates of a supplementary character. With the old bail-out, Firefox contentEditable fell through to native backspace, which could leave a dangling surrogate.
- Fix applies equally to **designIFrame** (old-style design-mode rich text editors).

### No regression risk

- The `resolveCaretToTextNode` helper returns `null` when no text precedes the caret (truly empty context), so the existing `''` return / `console.warn` + return behavior is unchanged for genuinely empty contexts.
- Chrome/Safari almost never report element-node cursors in contentEditable, so they take the `nodeType === 3` fast-path as before.
- The explicit `sel.collapse()` after deletion is only called when `start.node.nodeType != 3` (i.e., when resolution was needed), so normal same-node deletion is unaffected.

## Related issues

### Directly fixed

- **#15026** — "backspace problems in Google Docs using Firefox" (Tchad QWERTY): primary motivating bug. Backspace moved cursor without deleting. Root cause: Firefox element-node cursor → `nothingDeletable` → native backspace → Google Docs `beforeinput` pipeline handled it differently.

### Likely fixed as a side-effect

- Any report of **keyboard rules not matching context in Firefox contentEditable** — rules that rely on `getTextBeforeCaret()` returning accurate text (e.g. context-sensitive substitutions, deadkey sequencing) would have silently misfired whenever Firefox placed the cursor at an element node.
- Any report of **backspace failing silently in Firefox contentEditable** in editors other than Google Docs (where the native fallback happened to work but Keyman's SMP handling was bypassed).

### Related but NOT fixed by this PR

- **#15522** — "backspace in an empty cell in Firefox inserts a paragraph break": same downstream path (`nothingDeletable → native backspace`), but the cell is genuinely empty so `getTextBeforeCaret()` correctly returns `''`. The fix here would need to live in `keyboardProcessor.ts` or the hardware event handler: swallow the backspace when `nothingDeletable` and the caret is at the start of a block-level element (table cell, paragraph, etc.), preventing Firefox's destructive native behavior. This is a separate, riskier change.

## Historical context

The `nodeType != 3` guard was written in from the first modularization commit (January 2023, `fc84af4`) as defensive code with the comment "Must be a text node to provide a context." It was never treated as a bug to fix. The only related prior fix (May 2023, `a5a4a40`, "fix(web): content-editable issues re: CKEditor") addressed a different manifestation — no caret position set at all — using nullish coalescing rather than DOM tree walking. No developer had previously recognized that Firefox legitimately and correctly places cursors at element nodes, or attempted to resolve such positions to their underlying text nodes.
