import { conf } from '..';

describe('ConfigStack', () => {
  test('push overriding property', () => {
    const config = conf({ a: 1 }).asStack();
    config.push({ a: 2 });
    expect(config.peek()).toEqual({ a: 2 });
  });
  test('push new property', () => {
    const config = conf({ a: 1 }).asStack();
    config.push({ b: 2 });
    expect(config.peek()).toEqual({ a: 1, b: 2 });
  });
  test('push and pop', () => {
    const config = conf({ a: 1 }).asStack();
    config.push({ a: 2 });
    config.pop();
    expect(config.peek()).toEqual({ a: 1 });
  });
});
