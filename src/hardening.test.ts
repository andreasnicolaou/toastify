import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ToastifyManager } from './index';
import { ToastifyIcons } from './toastify-icons';

const toast = (): HTMLElement => document.querySelector<HTMLElement>('.noap-toastify-toast')!;
const toasts = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.noap-toastify-toast'));

describe('lazy container', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('the manager does not touch the DOM until the first toast', () => {
    const manager = new ToastifyManager('top-right');
    expect(document.querySelector('.noap-toastify-container')).toBeNull();
    manager.info('t', 'm');
    expect(document.querySelectorAll('.noap-toastify-container')).toHaveLength(1);
  });
});

describe('destroy()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  test('removes every container, including the lazily created ones', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    manager.info('a', 'a');
    manager.info('b', 'b', { position: 'bottom-left' });
    expect(document.querySelectorAll('.noap-toastify-container')).toHaveLength(2);
    manager.destroy();
    expect(document.querySelectorAll('.noap-toastify-container')).toHaveLength(0);
  });

  test('is safe to call twice and on an unused manager', () => {
    const manager = new ToastifyManager('top-right');
    expect(() => {
      manager.destroy();
      manager.destroy();
    }).not.toThrow();
  });

  test('clears every timer and interval', () => {
    const manager = new ToastifyManager('top-right', { duration: 5000 });
    manager.info('t', 'm');
    manager.success('t', 'm', { withProgressBar: true, position: 'center' });
    manager.destroy();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('clears the timers of a toast that is already leaving', () => {
    const manager = new ToastifyManager('top-right', { duration: 100 });
    manager.info('t', 'm');
    jest.advanceTimersByTime(100); // exit animation started, removal timer pending
    manager.destroy();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('drops queued toasts instead of showing them', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, maxToasts: 1 });
    manager.info('first', 'm');
    manager.info('queued', 'm');
    manager.destroy();
    jest.advanceTimersByTime(10000);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
    expect(document.querySelector('.noap-toastify-container')).toBeNull();
  });

  test('removes the listeners of the toast, including the action button', () => {
    const onClick = jest.fn();
    const manager = new ToastifyManager('top-right', { duration: 0, closeButton: true, tapToDismiss: true });
    manager.info('t', 'm', { action: { label: 'Go', onClick, dismissOnClick: false } });
    const el = toast();
    const action = el.querySelector<HTMLButtonElement>('.noap-toastify-action')!;
    const close = el.querySelector<HTMLButtonElement>('.noap-toastify-close')!;
    const addClass = jest.spyOn(el.classList, 'add');
    manager.destroy();
    action.click();
    close.click();
    el.click();
    expect(onClick).not.toHaveBeenCalled();
    expect(addClass).not.toHaveBeenCalled();
  });

  test('updating a toast through its handle after destroy is a no-op', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    const handle = manager.info('t', 'm');
    const el = toast();
    manager.destroy();
    expect(() => handle.update({ type: 'error', withProgressBar: true, action: undefined })).not.toThrow();
    expect(el.classList.contains('noap-toastify-error')).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('the manager can be used again afterwards', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    manager.info('a', 'a');
    manager.destroy();
    manager.info('b', 'b');
    expect(document.querySelectorAll('.noap-toastify-container')).toHaveLength(1);
    expect(toasts()).toHaveLength(1);
  });
});

describe('lifecycle safety', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('dismissing twice is safe and completes once', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, closeButton: true, maxToasts: 1 });
    manager.info('a', 'a');
    manager.info('b', 'b'); // queued
    const close = toast().querySelector<HTMLButtonElement>('.noap-toastify-close')!;
    close.click();
    close.click();
    jest.advanceTimersByTime(1000);
    // exactly one queued toast replaced it, not two
    expect(toasts()).toHaveLength(1);
    expect(toast().querySelector('.noap-toastify-title')).toHaveProperty('innerText', 'b');
  });

  test('updating a toast that is leaving does not re-arm timers', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, closeButton: true });
    const handle = manager.info('t', 'm');
    toast().querySelector<HTMLButtonElement>('.noap-toastify-close')!.click();
    handle.update({ withProgressBar: true, duration: 5000 });
    expect(toast().querySelector('.noap-toastify-progress-bar')).toBeNull();
    jest.advanceTimersByTime(1000);
    expect(toasts()).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('updating a dismissed toast through its handle is safe', () => {
    const manager = new ToastifyManager('top-right', { duration: 100 });
    const handle = manager.info('t', 'm');
    jest.advanceTimersByTime(1000);
    expect(toasts()).toHaveLength(0);
    expect(() => handle.update({ message: 'late', type: 'error' })).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a queued toast buffers updates and shows them once displayed', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, closeButton: true, maxToasts: 1 });
    manager.info('first', 'm');
    const queued = manager.info('queued', 'm');
    expect(() => queued.update({ type: 'error' })).not.toThrow();
    toast().querySelector<HTMLButtonElement>('.noap-toastify-close')!.click();
    jest.advanceTimersByTime(1000);
    expect(toast()).toHaveClass('noap-toastify-error');
  });

  test('a finished toast leaves no timers behind', () => {
    const manager = new ToastifyManager('top-right', { duration: 100 });
    manager.info('t', 'm', { action: { label: 'Go', onClick: jest.fn() } });
    jest.advanceTimersByTime(2000);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a finished progress bar toast leaves no timers behind', () => {
    const manager = new ToastifyManager('top-right', { withProgressBar: true, progressBarDuration: 1 });
    manager.info('t', 'm');
    jest.advanceTimersByTime(5000);
    expect(toasts()).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('CSP and Trusted Types friendliness', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('no style attribute is written as text and no <style> element is created', () => {
    const setAttribute = jest.spyOn(Element.prototype, 'setAttribute');
    const manager = new ToastifyManager('top-right', { withProgressBar: true, closeButton: true });
    manager.info('t', 'm', { action: { label: 'Go', onClick: jest.fn() } });
    jest.advanceTimersByTime(300);
    expect(setAttribute.mock.calls.some(([name]) => String(name).toLowerCase() === 'style')).toBe(false);
    expect(document.querySelector('style')).toBeNull();
    setAttribute.mockRestore();
  });

  test('the progress bar width is a CSS custom property', () => {
    const manager = new ToastifyManager('top-right', { withProgressBar: true, progressBarDuration: 10 });
    manager.info('t', 'm');
    const bar = toast().querySelector<HTMLElement>('.noap-toastify-progress-bar')!;
    expect(bar.style.getPropertyValue('--noap-toastify-progress')).toBe('100%');
    jest.advanceTimersByTime(100);
    expect(bar.style.getPropertyValue('--noap-toastify-progress')).toBe('90%');
    expect(bar.style.width).toBe('');
  });

  test('the progress bar width uses the custom property in the stylesheet', () => {
    const css = readFileSync(join(__dirname, 'styles.css'), 'utf8');
    expect(css).toMatch(/width:\s*var\(--noap-toastify-progress/);
  });

  test('icons are built as SVG elements, not parsed from strings', () => {
    const innerHTML = jest.spyOn(Element.prototype, 'innerHTML', 'set');
    const manager = new ToastifyManager('top-right', { closeButton: true });
    for (const type of ['default', 'light', 'success', 'error', 'warning', 'info'] as const) {
      manager[type]('t', 'm');
    }
    expect(innerHTML).not.toHaveBeenCalled();
    for (const icon of document.querySelectorAll('.noap-toastify-icon')) {
      expect(icon.firstElementChild?.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(icon.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    }
    innerHTML.mockRestore();
  });

  test('innerHTML is only used for the message, and only with isHtml', () => {
    const innerHTML = jest.spyOn(Element.prototype, 'innerHTML', 'set');
    const manager = new ToastifyManager('top-right');
    manager.info('<b>title</b>', '<img src=x onerror=alert(1)>');
    expect(innerHTML).not.toHaveBeenCalled();
    expect(document.querySelector('img')).toBeNull();
    manager.info('t', '<b>bold</b>', { isHtml: true });
    expect(innerHTML).toHaveBeenCalledTimes(1);
    innerHTML.mockRestore();
  });

  test('the title is always plain text', () => {
    const manager = new ToastifyManager('top-right');
    manager.info('<img src=x onerror=alert(1)>', 'm', { isHtml: true });
    expect(document.querySelector('.noap-toastify-title img')).toBeNull();
  });

  test('icon builders return fresh elements each call', () => {
    expect(ToastifyIcons.getToastIcon('success')).not.toBe(ToastifyIcons.getToastIcon('success'));
    expect(ToastifyIcons.getCloseIcon()).not.toBe(ToastifyIcons.getCloseIcon());
  });
});

describe('accessibility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test.each([
    ['info', 'status', 'polite'],
    ['success', 'status', 'polite'],
    ['default', 'status', 'polite'],
    ['light', 'status', 'polite'],
    ['error', 'alert', 'assertive'],
    ['warning', 'alert', 'assertive'],
  ] as const)('%s toasts use role=%s and aria-live=%s', (type, role, live) => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    manager[type]('t', 'm');
    expect(toast()).toHaveAttribute('role', role);
    expect(toast()).toHaveAttribute('aria-live', live);
    expect(toast()).toHaveAttribute('aria-atomic', 'true');
  });

  test('the role follows the type when it is updated', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    const handle = manager.info('t', 'm');
    handle.update({ type: 'error' });
    expect(toast()).toHaveAttribute('role', 'alert');
    expect(toast()).toHaveAttribute('aria-live', 'assertive');
    handle.update({ type: 'success' });
    expect(toast()).toHaveAttribute('role', 'status');
  });

  test('the close button is a labelled, non-submitting button', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, closeButton: true });
    manager.info('t', 'm');
    const close = toast().querySelector<HTMLButtonElement>('.noap-toastify-close')!;
    expect(close.type).toBe('button');
    expect(close).toHaveAttribute('aria-label', 'Close');
  });

  test('the stylesheet respects prefers-reduced-motion', () => {
    const css = readFileSync(join(__dirname, 'styles.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/animation-duration:\s*0\.01ms !important/);
    expect(css).toMatch(/transition-duration:\s*0\.01ms !important/);
  });
});
