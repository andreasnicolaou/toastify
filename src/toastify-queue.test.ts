import { Toastify } from './toastify';
import { ToastifyQueue } from './toastify-queue';

describe('ToastifyQueue', () => {
  let htmlContainer!: HTMLElement;
  let toastifyQueue!: ToastifyQueue;
  let mockToastifyCreate!: jest.Mock;

  beforeEach(() => {
    htmlContainer = document.createElement('div');
    document.body.appendChild(htmlContainer);
    toastifyQueue = new ToastifyQueue(htmlContainer, 3);
    mockToastifyCreate = jest.fn();
    Toastify.create = mockToastifyCreate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should add a toast and increase active toasts', () => {
    toastifyQueue.enqueue('Success!', 'Your operation was completed successfully.', 'success');
    expect(mockToastifyCreate).toHaveBeenCalledTimes(1);
    expect(toastifyQueue['activeToasts']).toBe(1);
  });

  test('should add a toast to the queue if max toasts are reached', () => {
    toastifyQueue.enqueue('Success!', 'Your operation was completed successfully.', 'success');
    toastifyQueue.enqueue('Error!', 'Something went wrong, please try again.', 'error');
    toastifyQueue.enqueue('Warning!', 'This action might have unintended consequences.', 'warning');
    toastifyQueue.enqueue('Heads Up!', 'You have new updates available.', 'info');

    expect(mockToastifyCreate).toHaveBeenCalledTimes(3);
    expect(toastifyQueue['queue'].length).toBe(1);
  });

  test('should process queue and show the next toast when space becomes available', () => {
    toastifyQueue.enqueue('Success!', 'Your operation was completed successfully.', 'success');
    toastifyQueue.enqueue('Error!', 'Something went wrong, please try again.', 'error');
    toastifyQueue.enqueue('Warning!', 'This action might have unintended consequences.', 'warning');
    toastifyQueue.enqueue('Heads Up!', 'You have new updates available.', 'info');

    expect(mockToastifyCreate).toHaveBeenCalledTimes(3);
    expect(toastifyQueue['queue'].length).toBe(1);

    const callback1 = mockToastifyCreate.mock.calls[0][6];
    const callback2 = mockToastifyCreate.mock.calls[1][6];
    const callback3 = mockToastifyCreate.mock.calls[2][6];

    callback1();
    expect(toastifyQueue['activeToasts']).toBe(3);
    callback2();
    expect(toastifyQueue['activeToasts']).toBe(2);
    callback3();
    expect(toastifyQueue['activeToasts']).toBe(1);
    expect(toastifyQueue['queue'].length).toBe(0);
  });

  test('should handle multiple toasts being processed in sequence', () => {
    toastifyQueue.enqueue('Success!', 'Your operation was completed successfully.', 'success');
    toastifyQueue.enqueue('Error!', 'Something went wrong, please try again.', 'error');
    toastifyQueue.enqueue('Warning!', 'This action might have unintended consequences.', 'warning');

    const callback1 = mockToastifyCreate.mock.calls[0][6];
    const callback2 = mockToastifyCreate.mock.calls[1][6];
    const callback3 = mockToastifyCreate.mock.calls[2][6];

    callback1();
    callback2();
    callback3();

    expect(mockToastifyCreate).toHaveBeenCalledTimes(3);
    expect(toastifyQueue['queue'].length).toBe(0);
    expect(toastifyQueue['activeToasts']).toBe(0);
  });

  test('should handle no active toasts and empty queue correctly', () => {
    expect(toastifyQueue['activeToasts']).toBe(0);
    expect(toastifyQueue['queue'].length).toBe(0);
    toastifyQueue.enqueue('Success!', 'Your operation was completed successfully.', 'success');
    expect(toastifyQueue['activeToasts']).toBe(1);
    expect(toastifyQueue['queue'].length).toBe(0);
  });
});
