import '@testing-library/jest-dom';
import { ToastifyManager } from './index';

const containers = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.noap-toastify-container'));
const containerAt = (position: string): HTMLElement =>
  document.querySelector<HTMLElement>(`.noap-toastify-container.noap-toastify-${position}`)!;
const toastsIn = (el: HTMLElement): HTMLElement[] =>
  Array.from(el.querySelectorAll<HTMLElement>('.noap-toastify-toast'));

describe('per-toast position', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('falls back to the manager position', () => {
    const manager = new ToastifyManager('bottom-left', { duration: 0 });
    manager.info('t', 'm');
    expect(containers()).toHaveLength(1);
    expect(toastsIn(containerAt('bottom-left'))).toHaveLength(1);
  });

  test('only creates the extra container on first use and reuses it', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, customClasses: 'custom' });
    expect(containers()).toHaveLength(0);
    manager.info('t', 'm');
    expect(containers()).toHaveLength(1);
    manager.success('t', 'm', { position: 'bottom-left' });
    manager.error('t', 'm', { position: 'bottom-left' });
    expect(containers()).toHaveLength(2);
    expect(containerAt('bottom-left')).toHaveClass('custom');
    expect(toastsIn(containerAt('bottom-left'))).toHaveLength(2);
    expect(toastsIn(containerAt('top-right'))).toHaveLength(1);
  });

  test.each(['default', 'light', 'success', 'error', 'warning', 'info'] as const)('%s accepts a position', (type) => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    manager[type]('t', 'm', { position: 'center' });
    expect(toastsIn(containerAt('center'))).toHaveLength(1);
  });

  test('shows two positions at once', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    manager.info('a', 'a');
    manager.info('b', 'b', { position: 'bottom-center' });
    expect(toastsIn(containerAt('top-right'))).toHaveLength(1);
    expect(toastsIn(containerAt('bottom-center'))).toHaveLength(1);
  });

  test('maxToasts applies per container, not across positions', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, maxToasts: 1 });
    manager.info('a', 'a');
    manager.info('b', 'b', { position: 'bottom-right' });
    expect(toastsIn(containerAt('top-right'))).toHaveLength(1);
    expect(toastsIn(containerAt('bottom-right'))).toHaveLength(1);
    // a second toast in the same container is queued, not shown
    manager.info('c', 'c', { position: 'bottom-right' });
    expect(toastsIn(containerAt('bottom-right'))).toHaveLength(1);
  });

  test('newestOnTop applies per container', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, newestOnTop: true });
    manager.info('first', 'x', { position: 'top-left' });
    manager.info('second', 'x', { position: 'top-left' });
    const titles = toastsIn(containerAt('top-left')).map(
      (t) => (t.querySelector('.noap-toastify-title') as HTMLElement).innerText
    );
    expect(titles).toEqual(['second', 'first']);
  });

  test('animation suffix uses the toast position, not the manager position', () => {
    const manager = new ToastifyManager('top-right', { duration: 0, animationType: 'slide' });
    manager.info('t', 'm', { position: 'bottom-center' });
    manager.info('t', 'm', { position: 'top-left' });
    manager.info('t', 'm');
    expect(toastsIn(containerAt('bottom-center'))[0]).toHaveClass('noap-toastify-anim-slide-bottom');
    expect(toastsIn(containerAt('top-left'))[0]).toHaveClass('noap-toastify-anim-slide-left');
    expect(toastsIn(containerAt('top-right'))[0]).toHaveClass('noap-toastify-anim-slide');
  });

  test('exit animation also uses the toast position', () => {
    const manager = new ToastifyManager('top-right', { duration: 100, animationType: 'slide' });
    manager.info('t', 'm', { position: 'bottom-center' });
    jest.advanceTimersByTime(100);
    expect(toastsIn(containerAt('bottom-center'))[0]).toHaveClass('noap-toastify-anim-slide-out-bottom');
  });

  test('update() ignores position and never moves the toast', () => {
    const manager = new ToastifyManager('top-right', { duration: 0 });
    const handle = manager.info('t', 'm', { position: 'bottom-left' });
    handle.update({ message: 'changed', ...({ position: 'top-left' } as object) });
    expect(toastsIn(containerAt('bottom-left'))).toHaveLength(1);
    expect(containerAt('top-left')).toBeNull();
    expect((containerAt('bottom-left').querySelector('.noap-toastify-message') as HTMLElement).innerText).toBe(
      'changed'
    );
  });
});

describe('action button', () => {
  let manager!: ToastifyManager;
  const button = (): HTMLButtonElement | null => document.querySelector('.noap-toastify-action');
  const toast = (): HTMLElement => document.querySelector<HTMLElement>('.noap-toastify-toast')!;

  beforeEach(() => {
    jest.useFakeTimers();
    manager = new ToastifyManager('top-right', { duration: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('renders a real button with the label as text after the message', () => {
    manager.info('t', 'm', { action: { label: 'Reload', onClick: jest.fn() } });
    const el = button()!;
    expect(el.tagName).toBe('BUTTON');
    expect(el.type).toBe('button');
    expect(el).toHaveTextContent('Reload');
    expect(el.previousElementSibling).toHaveClass('noap-toastify-message');
  });

  test('label is never parsed as HTML, even with isHtml', () => {
    const label = '<img src=x onerror=alert(1)>';
    manager.info('t', '<b>msg</b>', { isHtml: true, action: { label, onClick: jest.fn() } });
    expect(button()!.querySelector('img')).toBeNull();
    expect(button()!.textContent).toBe(label);
    expect(toast().querySelector('.noap-toastify-message b')).not.toBeNull();
  });

  test('no button without an action', () => {
    manager.info('t', 'm');
    expect(button()).toBeNull();
  });

  test('click calls onClick with the handle and dismisses by default', () => {
    const onClick = jest.fn();
    const handle = manager.info('t', 'm', { action: { label: 'Go', onClick } });
    button()!.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(handle);
    jest.advanceTimersByTime(300);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
  });

  test('dismissOnClick: false keeps the toast', () => {
    const onClick = jest.fn();
    manager.info('t', 'm', { action: { label: 'Go', onClick, dismissOnClick: false } });
    button()!.click();
    jest.advanceTimersByTime(1000);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toast()).toBeInTheDocument();
  });

  test('handle passed to onClick can update the toast', () => {
    manager.info('t', 'm', {
      action: { label: 'Go', dismissOnClick: false, onClick: (h) => h.update({ message: 'done' }) },
    });
    button()!.click();
    expect((document.querySelector('.noap-toastify-message') as HTMLElement).innerText).toBe('done');
  });

  test('with tapToDismiss the click does not bubble to the toast tap handler', () => {
    const outer = jest.fn();
    document.body.addEventListener('click', outer);
    manager.info('t', 'm', { tapToDismiss: true, action: { label: 'Go', onClick: jest.fn(), dismissOnClick: false } });
    button()!.click();
    jest.advanceTimersByTime(1000);
    expect(toast()).toBeInTheDocument();
    expect(outer).not.toHaveBeenCalled();
    document.body.removeEventListener('click', outer);
  });

  test('with tapToDismiss and dismissOnClick the toast is dismissed exactly once', () => {
    manager.info('t', 'm', { tapToDismiss: true, action: { label: 'Go', onClick: jest.fn() } });
    const addClass = jest.spyOn(toast().classList, 'add');
    button()!.click();
    const outClasses = addClass.mock.calls.filter(([c]) => String(c).includes('-out'));
    expect(outClasses).toHaveLength(1);
    jest.advanceTimersByTime(500);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
  });

  test('clicking the toast body (not the button) still taps to dismiss', () => {
    manager.info('t', 'm', { tapToDismiss: true, action: { label: 'Go', onClick: jest.fn() } });
    toast().click();
    jest.advanceTimersByTime(500);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
  });

  test('persistent toast (duration 0) stays until the action is clicked', () => {
    manager.info('New version', 'Reload?', { duration: 0, action: { label: 'Reload', onClick: jest.fn() } });
    jest.advanceTimersByTime(60000);
    expect(toast()).toBeInTheDocument();
    button()!.click();
    jest.advanceTimersByTime(300);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
  });

  test('works with the progress bar on', () => {
    manager.info('t', 'm', { withProgressBar: true, duration: 3000, action: { label: 'Go', onClick: jest.fn() } });
    expect(toast().querySelector('.noap-toastify-progress-bar')).not.toBeNull();
    expect(button()).not.toBeNull();
    button()!.click();
    jest.advanceTimersByTime(300);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
  });

  test('works in RTL', () => {
    const onClick = jest.fn();
    manager.info('t', 'm', { direction: 'rtl', action: { label: 'Go', onClick } });
    expect(toast()).toHaveClass('noap-toastify-rtl');
    button()!.click();
    expect(onClick).toHaveBeenCalled();
  });

  test.each(['default', 'light', 'success', 'error', 'warning', 'info'] as const)('renders for type %s', (type) => {
    manager[type]('t', 'm', { action: { label: 'Go', onClick: jest.fn() } });
    expect(button()).not.toBeNull();
    expect(toast()).toHaveClass(`noap-toastify-${type}`);
  });

  test('update() can change and remove the action', () => {
    const first = jest.fn();
    const second = jest.fn();
    const handle = manager.info('t', 'm', { action: { label: 'One', onClick: first, dismissOnClick: false } });
    handle.update({ action: { label: 'Two', onClick: second, dismissOnClick: false } });
    expect(document.querySelectorAll('.noap-toastify-action')).toHaveLength(1);
    expect(button()).toHaveTextContent('Two');
    button()!.click();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    handle.update({ action: undefined });
    expect(button()).toBeNull();
  });

  test('update() of other options keeps a single working action', () => {
    const onClick = jest.fn();
    const handle = manager.info('t', 'm', { action: { label: 'Go', onClick, dismissOnClick: false } });
    handle.update({ closeButton: true });
    handle.update({ withProgressBar: true });
    expect(document.querySelectorAll('.noap-toastify-action')).toHaveLength(1);
    button()!.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('update() can add an action to a toast that had none', () => {
    const handle = manager.info('t', 'm');
    handle.update({ action: { label: 'Late', onClick: jest.fn() } });
    expect(button()).toHaveTextContent('Late');
  });

  test('listener is removed when the toast is removed', () => {
    const onClick = jest.fn();
    manager.info('t', 'm', { duration: 100, action: { label: 'Go', onClick, dismissOnClick: false } });
    const el = button()!;
    jest.advanceTimersByTime(700);
    expect(document.querySelector('.noap-toastify-toast')).toBeNull();
    el.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('listener is removed when the toast is evicted', () => {
    const onClick = jest.fn();
    manager.info('t', 'm', { action: { label: 'Go', onClick, dismissOnClick: false } });
    const el = button()!;
    toast().dispatchEvent(new CustomEvent('toastify:evict'));
    el.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('removing an action detaches its old listener', () => {
    const onClick = jest.fn();
    const handle = manager.info('t', 'm', { action: { label: 'Go', onClick, dismissOnClick: false } });
    const el = button()!;
    handle.update({ action: undefined });
    el.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('exit collapse', () => {
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('a dismissed toast collapses so its neighbours close the gap', () => {
    jest.useFakeTimers();
    const manager = new ToastifyManager('top-right', { duration: 100 });
    manager.info('t', 'm');
    const el = document.querySelector<HTMLElement>('.noap-toastify-toast')!;
    jest.advanceTimersByTime(100);
    expect(el).toHaveClass('noap-toastify-collapse');
    expect(el.style.getPropertyValue('--noap-toastify-height')).toMatch(/px$/);
  });
});
