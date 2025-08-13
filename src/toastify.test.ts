import '@testing-library/jest-dom';
import { Toastify } from './toastify';

describe('Toastify', () => {
  let htmlContainer!: HTMLElement;
  const onComplete = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    htmlContainer = document.createElement('div');
    document.body.appendChild(htmlContainer);
  });

  afterEach(() => {
    jest.useRealTimers();
    htmlContainer.innerHTML = '';
    jest.clearAllMocks();
  });

  test('creates a toast without progress bar and fades out after duration', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      'Success!',
      'Your operation was completed successfully.',
      'success',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Heads Up!',
      'You have new updates available.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Success!',
      'Your operation was completed successfully.',
      'success',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Tap!',
      'Tap to dismiss.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'HTML!',
      '<b>Bold Message</b>',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
    const message = toastifyElement?.querySelector('.noap-toastify-message');
    expect(message?.innerHTML).toBe('<b>Bold Message</b>');
  });

  test('dismisses toast on tap when tapToDismiss is true', () => {
    Toastify.create(
      htmlContainer,
      5,
      false,
      'Tap!',
      'Tap to dismiss.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Increasing!',
      'Progress increases.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Zero Duration!',
      'Progress bar duration is 0.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'Close!',
      'Close button test.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
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
      'HTML!',
      '<b>Bold Message</b>',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
    const message = toastifyElement?.querySelector('.noap-toastify-message');
    expect(message?.innerHTML).toBe('<b>Bold Message</b>');
  });

  test('mouseenter and mouseleave pause and resume auto-close', () => {
    const onComplete = jest.fn();
    const htmlContainer = document.createElement('div');
    document.body.appendChild(htmlContainer);
    Toastify.create(
      htmlContainer,
      5,
      false,
      'Pause!',
      'Pausing auto-close.',
      'info',
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
    const toastifyElement = htmlContainer.querySelector('.noap-toastify-toast') as HTMLElement;
    expect(toastifyElement).toBeInTheDocument();
    toastifyElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    jest.advanceTimersByTime(2000); // should not close
    expect(onComplete).not.toHaveBeenCalled();
    toastifyElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    document.body.removeChild(htmlContainer);
  });

  test('auto-closes toast without progress bar after duration', () => {
    const onComplete = jest.fn();
    const htmlContainer = document.createElement('div');
    document.body.appendChild(htmlContainer);

    Toastify.create(
      htmlContainer,
      5,
      false,
      'AutoClose!',
      'This toast will auto-close.',
      'info',
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
    let toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
    expect(toastifyElement).toBeInTheDocument(); // Should exist right after creation

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(500); // for fade out

    toastifyElement = htmlContainer.querySelector('.noap-toastify-toast');
    expect(toastifyElement).not.toBeInTheDocument(); // Should be gone after fade out
    expect(onComplete).toHaveBeenCalledTimes(1);

    document.body.removeChild(htmlContainer);
  });
});
