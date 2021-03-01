import { cloneDeep, mergeWith, MergeWithCustomizer } from 'lodash';

/**
 * A stack implementation which merges successive objects of the stack into the previous top of
 * the stack while maintaining previous objects unchanged.
 *
 * This implementation is used to override configurations while being able to remove the top layer
 * of configuration if desired.
 */
export class MergeStack<T> {
  private onChanges: Array<() => void>;

  private stack: Array<T>;

  private customizer?: MergeWithCustomizer;

  /**
   *
   * @template T
   * @param {T} obj
   * @param {MergeWithCustomizer} customizer
   */
  constructor(obj?: T, customizer?: MergeWithCustomizer) {
    this.onChanges = [];
    this.stack = [];
    this.customizer = customizer;
    if (obj !== undefined) {
      this.push(obj);
    }
  }

  /**
   * Get current length or size of stack
   *
   * @returns {number} length of stack
   */
  get length(): number {
    return this.stack.length;
  }

  /**
   * Push a new object onto the top of the stack
   *
   * @template T
   * @param {T} obj - New object to be pushed
   */
  push(obj: T) {
    if (this.length > 0) {
      const top = cloneDeep(this.peek());
      mergeWith(top, obj, this.customizer);
      this.stack.push(top);
    } else {
      this.stack.push(obj);
    }
    this.runOnChanges();
  }

  /**
   * Remove and return the top of the stack
   *
   * @template T
   * @returns {T} Top of the stack
   */
  pop(): T {
    if (this.stack.length === 0) {
      throw new Error('Stack is empty.');
    }
    const popped = this.stack.pop() as T;
    this.runOnChanges();
    return popped;
  }

  /**
   * Peek at the top of the stack
   *
   * @template T
   * @returns {T} top of stack
   */
  peek(): T {
    return this.stack.slice(-1)[0];
  }

  onChange(func: () => void) {
    this.onChanges.push(func);
  }

  private runOnChanges() {
    for (const func of this.onChanges) {
      func();
    }
  }
}
