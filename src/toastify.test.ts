import '@testing-library/jest-dom';
import { ToastifyPosition } from './index';
import { Toastify } from './toastify';
import { ToastifyContainer } from './toastify-container';

describe('Toastify', () => {
  let htmlContainer!: ToastifyContainer;
  const onComplete = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    htmlContainer = new ToastifyContainer('top-right');
    document.body.appendChild(htmlContainer.element);
  });

  afterEach(() => {
    jest.useRealTimers();
    htmlContainer.element.innerHTML = '';
    jest.clearAllMocks();
  });

  test('progress bar resumes after mouseleave and completes', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Resume!', message: 'Progress resumes.', type: 'info' },
      {
        direction: 'ltr',
        progressBarDirection: 'increase',
        isHtml: false,
        showIcons: true,
        withProgressBar: true,
        progressBarDuration: 1,
        duration: 5000,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast') as HTMLElement;
    toastifyElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    jest.advanceTimersByTime(100);
    expect(onComplete).not.toHaveBeenCalled();
    toastifyElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    jest.advanceTimersByTime(150);
    jest.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalled();
    document.body.removeChild(htmlContainer.element);
  });

  test('getAnimationSuffix returns correct suffix for all positions when animationType is slide', () => {
    const positions: ToastifyPosition[] = [
      'top-left',
      'bottom-left',
      'bottom-center',
      'bottom-center-full',
      'top-center',
      'top-center-full',
      'center',
    ];
    const expected = ['-left', '-left', '-bottom', '-bottom', '-top', '-top', '-center', ''];
    expect(Toastify['getAnimationSuffix']('slide', null)).toBe('');
    positions.forEach((pos, i) => {
      expect(Toastify['getAnimationSuffix']('slide', pos)).toBe(expected[i]);
    });
  });

  test('getAnimationSuffix returns empty string for all positions when animationType is not slide', () => {
    const positions: ToastifyPosition[] = [
      'top-left',
      'bottom-left',
      'bottom-center',
      'bottom-center-full',
      'top-center',
      'top-center-full',
      'center',
    ];
    positions.forEach((pos) => {
      expect(Toastify['getAnimationSuffix']('fade', pos)).toBe('');
    });
  });

  test('should insert toast at the top when newestOnTop is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      true,
      { title: 'Top', message: 'Newest', type: 'success' },
      { direction: 'ltr', animationType: 'fade', withProgressBar: false, duration: 1 },
      onComplete
    );
    expect((htmlContainer.element.firstChild as HTMLElement)?.classList.contains('noap-toastify-toast')).toBe(true);
  });

  test('should remove oldest toast when maxToasts exceeded and not hovering', () => {
    Toastify.create(
      htmlContainer,
      2,
      false,
      { title: 'A', message: 'A', type: 'success' },
      {
        direction: 'ltr',
        animationType: 'fade',
        withProgressBar: false,
        duration: 10000,
      },
      jest.fn()
    );
    Toastify.create(
      htmlContainer,
      2,
      false,
      { title: 'B', message: 'B', type: 'success' },
      {
        direction: 'ltr',
        animationType: 'fade',
        withProgressBar: false,
        duration: 10000,
      },
      jest.fn()
    );
    // Now add the third toast, which should trigger removal
    Toastify.create(
      htmlContainer,
      2,
      false,
      { title: 'Remove', message: 'Oldest', type: 'success' },
      {
        direction: 'ltr',
        animationType: 'fade',
        withProgressBar: false,
        duration: 10000,
      },
      onComplete
    );
    jest.advanceTimersByTime(1000);
    expect(htmlContainer.element.childElementCount).toBe(2);
  });

  test('should call onComplete when progress bar finishes', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Progress', message: 'Bar', type: 'success' },
      {
        direction: 'ltr',
        animationType: 'fade',
        withProgressBar: true,
        progressBarDuration: 1,
        duration: 1,
      },
      onComplete
    );
    jest.advanceTimersByTime(150); // progressBarDuration * 100 + buffer
    jest.advanceTimersByTime(500); // for fade out
    expect(onComplete).toHaveBeenCalled();
  });

  test('should call onComplete when close button is clicked', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Close', message: 'Button', type: 'default' },
      {
        direction: 'ltr',
        animationType: 'fade',
        closeButton: true,
        withProgressBar: false,
        duration: 1,
      },
      onComplete
    );
    const closeBtn = htmlContainer.element.querySelector('.noap-toastify-close') as HTMLElement;
    closeBtn.click();
    jest.advanceTimersByTime(300);
    expect(onComplete).toHaveBeenCalled();
  });

  test('creates a toast without progress bar and fades out after duration', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Success!', message: 'Your operation was completed successfully.', type: 'success' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    expect(toastifyElement).toBeInTheDocument();
    expect((toastifyElement?.querySelector('.noap-toastify-title') as HTMLElement)?.innerText).toBe('Success!');
    expect((toastifyElement?.querySelector('.noap-toastify-message') as HTMLElement)?.innerText).toBe(
      'Your operation was completed successfully.'
    );
    jest.advanceTimersByTime(5000);
    expect(toastifyElement?.classList.contains('noap-toastify-anim-fade-out')).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('creates a toast with progress bar and pauses on hover', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Heads Up!', message: 'You have new updates available.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: true,
        progressBarDuration: 50,
        duration: 5000,
        closeButton: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const progressBar = toastifyElement?.querySelector('.noap-toastify-progress-bar');
    expect(progressBar).toBeInTheDocument();
    const toastElement = toastifyElement as HTMLElement;
    toastElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(toastifyElement?.classList.contains('noap-toastify-hovering')).toBe(true);
    toastElement.dispatchEvent(new MouseEvent('mouseleave'));
    expect(!toastifyElement?.classList.contains('noap-toastify-hovering')).toBe(false);
    jest.advanceTimersByTime(10000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('closes a toast when close button is clicked', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Success!', message: 'Your operation was completed successfully.', type: 'success' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const closeButton = toastifyElement?.querySelector('.noap-toastify-close');
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }
    expect(toastifyElement?.classList.contains('noap-toastify-anim-fade-out')).toBe(true);
    jest.advanceTimersByTime(200);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('dismisses toast on tap when tapToDismiss is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Tap!', message: 'Tap to dismiss.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: false,
        tapToDismiss: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    expect(toastifyElement).toBeInTheDocument();
    if (toastifyElement) {
      toastifyElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      jest.advanceTimersByTime(500);
      expect(onComplete).toHaveBeenCalledTimes(1);
    }
  });

  test('renders HTML message when isHtml is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'HTML!', message: '<b>Bold Message</b>', type: 'info' },
      {
        direction: 'ltr',
        isHtml: true,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const message = toastifyElement?.querySelector('.noap-toastify-message');
    expect(message?.innerHTML).toBe('<b>Bold Message</b>');
  });

  test('dismisses toast on tap when tapToDismiss is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Tap!', message: 'Tap to dismiss.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: false,
        tapToDismiss: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    expect(toastifyElement).toBeInTheDocument();
    if (toastifyElement) {
      toastifyElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      jest.advanceTimersByTime(500);
      expect(onComplete).toHaveBeenCalledTimes(1);
    }
  });

  test('progress bar increases from 0 to 100 when direction is increase', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Increasing!', message: 'Progress increases.', type: 'info' },
      {
        direction: 'ltr',
        progressBarDirection: 'increase',
        isHtml: false,
        showIcons: true,
        withProgressBar: true,
        progressBarDuration: 10,
        duration: 500,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const progressBar = toastifyElement?.querySelector('.noap-toastify-progress-bar') as HTMLElement;
    expect(progressBar).toBeInTheDocument();
    // Simulate time passing for progress to reach 100
    for (let i = 0; i <= 100; i++) {
      jest.advanceTimersByTime(10);
    }
    // Advance timers for the async removal (setTimeout 500ms)
    jest.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('progress bar duration 0 uses default interval', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Zero Duration!', message: 'Progress bar duration is 0.', type: 'info' },
      {
        direction: 'ltr',
        progressBarDirection: 'decrease',
        isHtml: false,
        showIcons: true,
        withProgressBar: true,
        progressBarDuration: 0,
        duration: 500,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const progressBar = toastifyElement?.querySelector('.noap-toastify-progress-bar') as HTMLElement;
    expect(progressBar).toBeInTheDocument();
    // Simulate time passing for progress to reach 0
    for (let i = 0; i <= 100; i++) {
      jest.advanceTimersByTime(100);
    }
    // Advance timers for the async removal (setTimeout 500ms)
    jest.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('renders and closes with closeButton enabled', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Close!', message: 'Close button test.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: true,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const closeButton = toastifyElement?.querySelector('.noap-toastify-close');
    expect(closeButton).toBeInTheDocument();
    if (closeButton) {
      (closeButton as HTMLElement).click();
      jest.advanceTimersByTime(200);
      expect(onComplete).toHaveBeenCalledTimes(1);
    }
  });

  test('renders HTML message when isHtml is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'HTML!', message: '<b>Bold Message</b>', type: 'info' },
      {
        direction: 'ltr',
        isHtml: true,
        showIcons: true,
        withProgressBar: false,
        duration: 3000,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    const message = toastifyElement?.querySelector('.noap-toastify-message');
    expect(message?.innerHTML).toBe('<b>Bold Message</b>');
  });

  test('mouseenter and mouseleave pause and resume auto-close', () => {
    const onComplete = jest.fn();
    const htmlContainer = new ToastifyContainer('top-right');
    document.body.appendChild(htmlContainer.element);
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Pause!', message: 'Pausing auto-close.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 1000,
        closeButton: false,
      },
      onComplete
    );
    const toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast') as HTMLElement;
    expect(toastifyElement).toBeInTheDocument();
    toastifyElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    jest.advanceTimersByTime(2000); // should not close
    expect(onComplete).not.toHaveBeenCalled();
    toastifyElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    document.body.removeChild(htmlContainer.element);
  });

  test('auto-closes toast without progress bar after duration', () => {
    const onComplete = jest.fn();
    const htmlContainer = new ToastifyContainer('top-right');
    document.body.appendChild(htmlContainer.element);

    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'AutoClose!', message: 'This toast will auto-close.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 1000,
        closeButton: false,
      },
      onComplete
    );
    let toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    expect(toastifyElement).toBeInTheDocument(); // Should exist right after creation

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(500); // for fade out

    toastifyElement = htmlContainer.element.querySelector('.noap-toastify-toast');
    expect(toastifyElement).not.toBeInTheDocument(); // Should be gone after fade out
    expect(onComplete).toHaveBeenCalledTimes(1);

    document.body.removeChild(htmlContainer.element);
  });

  test('removes oldest toast if maxToasts exceeded and not hovering', () => {
    const htmlContainer = new ToastifyContainer('top-right');
    document.body.appendChild(htmlContainer.element);
    for (let i = 0; i < 5; i++) {
      Toastify.create(
        htmlContainer,
        5,
        false,
        { title: `Toast${i}`, message: `Message${i}`, type: 'info' },
        {
          direction: 'ltr',
          isHtml: false,
          showIcons: true,
          withProgressBar: false,
          duration: 1000,
          closeButton: false,
        },
        jest.fn()
      );
    }
    const firstToast = htmlContainer.element.firstChild as HTMLElement;
    expect(firstToast.classList.contains('noap-toastify-hovering')).toBe(false);
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Overflow!', message: 'This should remove the oldest.', type: 'info' },
      {
        direction: 'ltr',
        isHtml: false,
        showIcons: true,
        withProgressBar: false,
        duration: 1000,
        closeButton: false,
      },
      jest.fn()
    );
    jest.advanceTimersByTime(500);
    expect(htmlContainer.element.childElementCount).toBe(5);
    expect(Array.from(htmlContainer.element.children)).not.toContain(firstToast);
    document.body.removeChild(htmlContainer.element);
  });

  test('should not remove toast if it is being hovered (maxToasts logic)', () => {
    for (let i = 0; i < 3; i++) {
      Toastify.create(
        htmlContainer,
        2,
        false,
        { title: 'Test', message: 'Hover', type: 'default' },
        {
          direction: 'ltr',
          animationType: 'fade',
          withProgressBar: false,
          duration: 1,
        },
        onComplete
      );
      if (i === 0) htmlContainer.element.children[0].classList.add('noap-toastify-hovering');
    }

    Toastify.create(
      htmlContainer,
      2,
      false,
      { title: 'Test', message: 'Hover', type: 'default' },
      {
        direction: 'ltr',
        animationType: 'fade',
        withProgressBar: false,
        duration: 1,
      },
      onComplete
    );
    expect(htmlContainer.element.children[0].classList.contains('noap-toastify-hovering')).toBe(true);
  });

  test('should handle tapToDismiss click event', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Dismiss', message: 'Click me', type: 'default' },
      {
        direction: 'ltr',
        animationType: 'fade',
        tapToDismiss: true,
        withProgressBar: false,
        duration: 1,
      },
      onComplete
    );
    const toastEl = htmlContainer.element.querySelector('.noap-toastify-toast') as HTMLElement;
    toastEl.click();
    setTimeout(() => {
      expect(onComplete).toHaveBeenCalled();
    }, 600);
  });

  test('should handle closeButton click event', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      { title: 'Close', message: 'Button', type: 'default' },
      {
        direction: 'ltr',
        animationType: 'fade',
        closeButton: true,
        withProgressBar: false,
        duration: 1,
      },
      onComplete
    );
    const closeBtn = htmlContainer.element.querySelector('.noap-toastify-close') as HTMLElement;
    closeBtn.click();
    setTimeout(() => {
      expect(onComplete).toHaveBeenCalled();
    }, 300);
  });

  test('should not error if container is empty and remove is called', () => {
    expect(() => {
      Toastify.create(
        htmlContainer,
        1,
        false,
        { title: 'Empty', message: 'No container', type: 'default' },
        {
          direction: 'ltr',
          animationType: 'fade',
          withProgressBar: false,
          duration: 1,
        },
        onComplete
      );
      while (htmlContainer.element.firstChild) htmlContainer.element.removeChild(htmlContainer.element.firstChild);
    }).not.toThrow();
  });
});
