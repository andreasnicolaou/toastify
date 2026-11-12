/**
 * @jest-environment node
 */
import { ToastifyManager } from './index';

describe('without a document', () => {
  test('creating and destroying a manager does not throw', () => {
    expect(typeof document).toBe('undefined');
    const manager = new ToastifyManager('top-right', { maxToasts: 2 });
    expect(() => manager.destroy()).not.toThrow();
  });

  test.each(['default', 'light', 'success', 'error', 'warning', 'info'] as const)(
    'showing a %s toast throws the same TypeError',
    (type) => {
      const manager = new ToastifyManager('top-right');
      expect(() => manager[type]('t', 'm')).toThrow(TypeError);
      expect(() => manager[type]('t', 'm')).toThrow('document is not available');
    }
  );
});
