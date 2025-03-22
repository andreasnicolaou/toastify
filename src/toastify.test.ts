import { Toastify } from './toastify';
import '@testing-library/jest-dom';

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
    expect(toastifyElement?.classList.contains('noap-toastify-fade-out')).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('creates a toast with progress bar and pauses on hover', () => {
    Toastify.create(
      htmlContainer,
      5,
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
    expect(toastifyElement?.classList.contains('noap-toastify-fade-out')).toBe(true);
    jest.advanceTimersByTime(200);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
