import './styles.css';
import { ToastifyContainer } from './toastify-container';
import { ToastifyHandle } from './toastify-handle';
import { ToastifyQueue } from './toastify-queue';
export { ToastifyHandle } from './toastify-handle';
export type ToastifyAnimationType =
  'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'roll' | 'lightspeed' | 'jackinthebox' | 'none';
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
  progressBarDirection?: 'decrease' | 'increase';
  position?: ToastifyPosition;
  action?: ToastifyAction;
}

export interface ToastifyAction {
  label: string;
  onClick: (handle: ToastifyHandle) => void;
  dismissOnClick?: boolean;
}

export type ToastifyPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-center-full'
  | 'bottom-center'
  | 'bottom-center-full'
  | 'center';

export type ToastifyType = 'success' | 'error' | 'warning' | 'info' | 'default' | 'light';

/** `position` is not updatable: a visible toast never moves between containers. */
export type ToastifyUpdateOptions = Partial<Omit<ToastifyOptions, 'position'>> & {
  title?: string;
  message?: string;
  type?: ToastifyType;
};
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
 *   - progressBarDirection (optional): The direction of the progress bar animation (default is 'decrease').
 *   - action (optional): A button rendered inside the toast ({ label, onClick, dismissOnClick }).
 * Any toast method also accepts a per-toast `position`; containers for other positions are created lazily.
 * Nothing touches the DOM until the first toast is shown, so the manager can be created without a `document`.
 * @throws TypeError when a toast is shown without a `document` (non-browser environment).
 * @returns A new instance of ToastifyManager.
 * @memberof ToastifyManager
 * @author Andreas Nicolaou
 */
export class ToastifyManager {
  private readonly customClasses: string | undefined;
  private readonly defaultPosition: ToastifyPosition;
  private readonly maxToasts: number;
  private readonly newestOnTop: boolean | undefined;
  private readonly options!: ToastifyOptions;
  private readonly toastifyQueues = new Map<ToastifyPosition, ToastifyQueue>();
  constructor(
    position: ToastifyPosition,
    /* istanbul ignore next */ {
      maxToasts,
      customClasses,
      newestOnTop,
      ...options
    }: ToastifyOptions & { maxToasts?: number; customClasses?: string; newestOnTop?: boolean } = Object.create(
      Object.prototype
    )
  ) {
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
      progressBarDirection: 'decrease',
      ...options,
    };
    this.defaultPosition = position;
    this.customClasses = customClasses;
    /* istanbul ignore next */
    this.maxToasts = maxToasts ?? 5;
    this.newestOnTop = newestOnTop;
  }

  /**
   * Displays a default toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   * @author Andreas Nicolaou
   */
  public default(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'default', options);
  }

  /**
   * Removes every container this manager created and releases all toasts, timers and listeners.
   * Queued toasts are dropped. The manager can still be used afterwards: containers are created again on demand.
   * @memberof ToastifyManager
   */
  public destroy(): void {
    for (const queue of this.toastifyQueues.values()) {
      queue.destroy();
    }
    this.toastifyQueues.clear();
  }

  /**
   * Displays an error toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   * @author Andreas Nicolaou
   */
  public error(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'error', options);
  }

  /**
   * Displays an informational toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   * @author Andreas Nicolaou
   */
  public info(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'info', options);
  }

  /**
   * Displays a light toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually
   * @memberof ToastifyManager
   * @author Andreas Nicolaou
   */
  public light(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'light', options);
  }

  /**
   * Displays a success toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually.
   * @memberof ToastifyManager
   * @author Andreas Nicolaou
   */
  public success(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'success', options);
  }

  /**
   * Displays a warning toast notification.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param options - Customization for this individual toast. These options are merged with the defaults
   *                  set on ToastifyManager, and can be overriden individually.
   * @memberof ToastifyManager
   */
  public warning(
    title: string,
    message: string,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): ToastifyHandle {
    return this.show(title, message, 'warning', options);
  }

  /**
   * Returns the queue for a position, creating its container and queue on first use.
   * Each position has its own queue so maxToasts and newestOnTop apply per container.
   */
  private getQueue(position: ToastifyPosition): ToastifyQueue {
    let queue = this.toastifyQueues.get(position);
    if (!queue) {
      queue = new ToastifyQueue(new ToastifyContainer(position, this.customClasses), this.maxToasts, this.newestOnTop);
      this.toastifyQueues.set(position, queue);
    }
    return queue;
  }

  private show(title: string, message: string, type: ToastifyType, options: ToastifyOptions): ToastifyHandle {
    if (typeof document === 'undefined') {
      throw new TypeError('document is not available. Toastify can only be used in a browser environment.');
    }
    const merged = { ...this.options, ...options };
    return this.getQueue(merged.position ?? this.defaultPosition).enqueue(title, message, type, merged);
  }
}
