import { ToastifyManager } from '.';
import { ToastifyContainer } from './toastify-container';
import { ToastifyQueue } from './toastify-queue';

jest.mock('./toastify-container');
jest.mock('./toastify-queue');

describe('ToastifyManager', () => {
  let toastifyManager!: ToastifyManager;
  let mockToastifyQueue!: jest.Mocked<ToastifyQueue>;

  beforeEach(() => {
    jest.clearAllMocks();
    (ToastifyContainer as jest.Mock).mockImplementation(() => {
      return {
        element: document.createElement('div'),
      };
    });

    mockToastifyQueue = {
      enqueue: jest.fn(),
    } as unknown as jest.Mocked<ToastifyQueue>;
    (ToastifyQueue as jest.Mock).mockImplementation(() => mockToastifyQueue);

    toastifyManager = new ToastifyManager('top-right', {
      maxToasts: 5,
      duration: 3000,
      withProgressBar: true,
    });
  });

  test('should initialize with default options', () => {
    const defaultOptions = {
      duration: 3000,
      isHtml: false,
      progressBarDirection: 'decrease',
      withProgressBar: true,
      progressBarDuration: 100,
      closeButton: false,
      showIcons: true,
      direction: 'ltr',
      animationType: 'fade',
      tapToDismiss: false,
    };
    expect(toastifyManager).toBeDefined();
    expect(ToastifyContainer).toHaveBeenCalledWith('top-right', undefined);
    expect(ToastifyQueue).toHaveBeenCalledWith(expect.any(HTMLElement), 5, undefined);
    expect(toastifyManager).toMatchObject({ options: defaultOptions });
  });

  test('should call enqueue with correct arguments for default toast', () => {
    toastifyManager.default('Default!', 'I am a default toast.', { duration: 2000 });
    expect(mockToastifyQueue.enqueue).toHaveBeenCalledWith('Default!', 'I am a default toast.', 'default', {
      duration: 2000,
      isHtml: false,
      progressBarDirection: 'decrease',
      withProgressBar: true,
      progressBarDuration: 100,
      closeButton: false,
      showIcons: true,
      direction: 'ltr',
      animationType: 'fade',
      tapToDismiss: false,
    });
  });

  test('should call enqueue with correct arguments for error toast', () => {
    toastifyManager.error('Error!', 'Something went wrong, please try again.', { duration: 2000 });
    expect(mockToastifyQueue.enqueue).toHaveBeenCalledWith(
      'Error!',
      'Something went wrong, please try again.',
      'error',
      {
        duration: 2000,
        isHtml: false,
        progressBarDirection: 'decrease',
        withProgressBar: true,
        progressBarDuration: 100,
        closeButton: false,
        showIcons: true,
        direction: 'ltr',
        animationType: 'fade',
        tapToDismiss: false,
      }
    );
  });

  test('should call enqueue with correct arguments for info toast', () => {
    toastifyManager.info('Heads Up!', 'You have new updates available.');
    expect(mockToastifyQueue.enqueue).toHaveBeenCalledWith('Heads Up!', 'You have new updates available.', 'info', {
      duration: 3000,
      isHtml: false,
      progressBarDirection: 'decrease',
      withProgressBar: true,
      progressBarDuration: 100,
      closeButton: false,
      showIcons: true,
      direction: 'ltr',
      animationType: 'fade',
      tapToDismiss: false,
    });
  });

  test('should call enqueue with correct arguments for success toast', () => {
    toastifyManager.success('Success!', 'Your operation was completed successfully.', { closeButton: true });
    expect(mockToastifyQueue.enqueue).toHaveBeenCalledWith(
      'Success!',
      'Your operation was completed successfully.',
      'success',
      {
        duration: 3000,
        isHtml: false,
        progressBarDirection: 'decrease',
        withProgressBar: true,
        progressBarDuration: 100,
        closeButton: true,
        showIcons: true,
        direction: 'ltr',
        animationType: 'fade',
        tapToDismiss: false,
      }
    );
  });

  test('should call enqueue with correct arguments for warning toast', () => {
    toastifyManager.warning('Warning!', 'This action might have unintended consequences.', { isHtml: true });
    expect(mockToastifyQueue.enqueue).toHaveBeenCalledWith(
      'Warning!',
      'This action might have unintended consequences.',
      'warning',
      {
        duration: 3000,
        isHtml: true,
        progressBarDirection: 'decrease',
        withProgressBar: true,
        progressBarDuration: 100,
        closeButton: false,
        showIcons: true,
        direction: 'ltr',
        animationType: 'fade',
        tapToDismiss: false,
      }
    );
  });
});
