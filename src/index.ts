import './styles.css';
import { ToastifyContainer } from './toastify-container';
import { ToastifyQueue } from './toastify-queue';
export type ToastifyAnimationType = 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'none';
export interface ToastifyOptions {
  duration?: number;
  isHtml?: boolean;
  withProgressBar?: boolean;
  progressBarDuration?: number;
  closeButton?: boolean;
  direction?: 'ltr' | 'rtl';
  showIcons?: boolean;
  animationType?: ToastifyAnimationType;
  tapToDismiss?: boolean;
}

export type ToastifyPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'center';

export type ToastifyType = 'success' | 'error' | 'warning' | 'info' | 'default' | 'light';
/**
 * Initializes a new ToastifyManager instance to manage toast notifications.
 * @param position - The position where the toast container should be displayed (e.g., top-right, bottom-left).
 * @param options - Configuration options for the toast manager:
 *   - maxToasts (optional): Maximum number of toasts that can be displayed simultaneously (default is 5).
 *   - customClasses (optional): Custom CSS classes to apply to the toast container.
 *   - duration (optional): Duration (in milliseconds) for the toast notification to remain visible (default is 3000).
 *   - isHtml (optional): Whether the toast message should be interpreted as HTML (default is false).
 *   - withProgressBar (optional): Whether to show a progress bar on the toast (default is false).
 *   - progressBarDuration (optional): Duration for the progress bar animation (default is 100 milliseconds).
 *   - closeButton (optional): Whether to show a close button on the toast (default is false).
 *   - showIcons (optional): Whether to display icons next to the toast message (default is true).
 *   - direction (optional): The direction of the text within the toast (default is 'ltr', left-to-right).
 *   - animationType (optional): The type of animation for the toast (default is 'fade', use 'none' for no animation).
 */
export class ToastifyManager {
  private readonly options!: ToastifyOptions;
  private readonly toastifyQueue!: ToastifyQueue;
  constructor(
    position: ToastifyPosition,
    {
      maxToasts,
      customClasses,
      newestOnTop,
      ...options
    }: ToastifyOptions & { maxToasts?: number; customClasses?: string; newestOnTop?: boolean } = Object.create(
      Object.prototype
    )
  ) {
    if (typeof document === 'undefined') {
      throw new Error('document is not available. Toastify can only be used in a browser environment.');
    }
    this.options = {
      duration: 3000,
      isHtml: false,
      withProgressBar: false,
      progressBarDuration: 100,
      closeButton: false,
      showIcons: true,
      direction: 'ltr',
      animationType: 'fade',
      tapToDismiss: false,
      ...options,
    };
    const toastifyContainer = new ToastifyContainer(position, customClasses);
    this.toastifyQueue = new ToastifyQueue(toastifyContainer.element, maxToasts ?? 5, newestOnTop);
  }

  /**
   * Displays a default toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   */
  public default(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'default', { ...this.options, ...options });
  }

  /**
   * Displays an error toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   */
  public error(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'error', { ...this.options, ...options });
  }

  /**
   * Displays an informational toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   */
  public info(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'info', { ...this.options, ...options });
  }

  /**
   * Displays a light toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   */
  public light(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'light', { ...this.options, ...options });
  }

  /**
   * Displays a success toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually.
   * @memberof ToastifyManager
   */
  public success(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'success', { ...this.options, ...options });
  }

  /**
   * Displays a warning toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually.
   * @memberof ToastifyManager
   */
  public warning(title: string, message: string, options: ToastifyOptions = Object.create(Object.prototype)): void {
    this.toastifyQueue.enqueue(title, message, 'warning', { ...this.options, ...options });
  }
}
