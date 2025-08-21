import { ToastifyOptions, ToastifyType } from './index';
import { Toastify } from './toastify';
import { ToastifyContainer } from './toastify-container';

export class ToastifyQueue {
  private activeToasts: number = 0;
  private readonly container: ToastifyContainer;
  private readonly maxToasts: number;
  private readonly newestOnTop: boolean | undefined;
  private readonly queue: Array<{
    title: string;
    message: string;
    type: ToastifyType;
    options: ToastifyOptions;
    create: (onComplete: () => void) => void;
  }> = [];

  constructor(container: ToastifyContainer, maxToasts: number, newestOnTop: boolean | undefined) {
    this.container = container;
    this.maxToasts = maxToasts;
    this.newestOnTop = newestOnTop;
  }

  /**
   * Adds a toast to the queue or displays it immediately if there is space.
   * @param title - The title of the toast.
   * @param message - The message content of the toast.
   * @param type - The type of the toast (e.g., success, error, etc.).
   * @param options - Customization options for the toast (optional).
   * @memberof ToastifyQueue
   * @author Andreas Nicolaou
   */
  public enqueue(
    title: string,
    message: string,
    type: ToastifyType,
    options: ToastifyOptions = Object.create(Object.prototype)
  ): void {
    // If there is space, display the toast immediately
    if (this.activeToasts < this.maxToasts) {
      Toastify.create(this.container, this.maxToasts, this.newestOnTop, { title, message, type }, options, () => {
        this.activeToasts--; // Decrement active toasts when the toast is removed
        this.processQueue(); // Check the queue for the next toast
      });
      this.activeToasts++; // Increment active toasts
    } else {
      // Otherwise, add the toast to the queue
      this.queue.push({
        title,
        message,
        type,
        options,
        create: (onComplete) => {
          Toastify.create(
            this.container,
            this.maxToasts,
            this.newestOnTop,
            { title, message, type },
            options,
            onComplete
          );
        },
      });
    }
  }

  /**
   * Processes the queue to display the next toast when space becomes available.
   * @memberof ToastifyQueue
   * @author Andreas Nicolaou
   */
  private processQueue(): void {
    // If there is space and the queue is not empty, display the next toast
    if (this.activeToasts < this.maxToasts && this.queue.length > 0) {
      const nextToast = this.queue.shift()!;
      nextToast.create(() => {
        this.activeToasts--; // Decrement active toasts when the toast is removed
        this.processQueue(); // Check the queue for the next toast
      });
      this.activeToasts++; // Increment active toasts
    }
  }
}
