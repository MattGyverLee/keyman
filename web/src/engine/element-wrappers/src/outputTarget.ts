import { OutputTarget as OutputTargetBase } from "keyman/engine/js-processor";
import { EventEmitter } from 'eventemitter3';

export default abstract class OutputTarget<EventMap extends EventEmitter.ValidEventTypes> extends OutputTargetBase {
  // JS/TS can't do true multiple inheritance, so we maintain class events on a readonly field.
  public readonly events: EventEmitter<EventMap, this> = new EventEmitter<EventMap, this>();

  /**
   * A field that may be used to track whether or not the represented context has changed over an
   * arbitrary period of time.
   */
  public changed = false;

  /**
   * Returns the underlying element / document modeled by the wrapper.
   */
  abstract getElement(): HTMLElement;

  public focus(): void {
    const ele = this.getElement();
    if(ele.focus) {
      ele.focus();
    }
  }

  /**
   * Denotes when the represented element is forcing a text scroll via focus manipulation.
   * As the intent is not to change the focused element, but just to have the browser update
   * the scroll location, standard focus handlers (for updating the active context) should
   * not deactivate the element while this state is active.
   */
  isForcingScroll(): boolean {
    return false;
  }

  /**
   * Resolves a caret at an element node to the last text node before that position.
   * Firefox may report `anchorNode` as a parent element ("after the N-th child") rather than
   * as a text node.  Returns null if no text content exists before the given position.
   */
  protected resolveCaretToTextNode(node: Node, offset: number): {node: Text, offset: number} | null {
    if(node.nodeType === 3) {
      return {node: node as Text, offset};
    }
    for(let i = offset - 1; i >= 0; i--) {
      const result = this.lastTextNodeInSubtree(node.childNodes[i]);
      if(result) {
        return result;
      }
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
      if(result) {
        return result;
      }
    }
    return null;
  }

  /**
   * A helper method for doInputEvent; creates a simple common event and default dispatching.
   * @param elem
   */
  protected dispatchInputEventOn(elem: HTMLElement) {
    let event: InputEvent;

    // `undefined` in pre-Chrome Edge and Chrome for Android before version 60.
    if(window['InputEvent']) { // can't condition on the type directly; TS optimizes that out.
      event = new InputEvent('input', {"bubbles": true, "cancelable": false});
    }

    if(elem && event) {
      elem.dispatchEvent(event);
    }
  }
}