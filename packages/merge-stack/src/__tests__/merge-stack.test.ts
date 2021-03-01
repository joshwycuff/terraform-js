import { JSONObject } from '@joshwycuff/types';
import { MergeStack } from '..';

describe('MergeStack', () => {
  test('push overriding property', () => {
    const stack = new MergeStack({ a: 1 });
    stack.push({ a: 2 });
    expect(stack.peek()).toEqual({ a: 2 });
  });
  test('push new property', () => {
    const stack = new MergeStack<JSONObject>({ a: 1 });
    stack.push({ b: 2 });
    expect(stack.peek()).toEqual({ a: 1, b: 2 });
  });
  test('push and pop', () => {
    const stack = new MergeStack({ a: 1 });
    stack.push({ a: 2 });
    stack.pop();
    expect(stack.peek()).toEqual({ a: 1 });
  });
  test('onChange', () => {
    let state = 0;
    const stack = new MergeStack({ a: 1 });
    stack.onChange(() => {
      state += 1;
    });
    stack.push({ a: 2 });
    expect(state).toEqual(1);
  });
  test('onChanges', () => {
    let state1 = 0;
    let state2 = 0;
    const stack = new MergeStack({ a: 1 });
    stack.onChange(() => {
      state1 += 1;
    });
    stack.onChange(() => {
      state2 += 1;
    });
    stack.push({ a: 2 });
    expect(state1).toEqual(1);
    expect(state2).toEqual(1);
  });
});
