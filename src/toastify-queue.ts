import type { ToastifyOptions, ToastifyType } from './index';
import { Toastify } from './toastify';
import { ToastifyContainer } from './toastify-container';
import { ToastifyHandle } from './toastify-handle';

export class ToastifyQueue {
  private activeToasts: number = 0;
  private readonly container: ToastifyContainer;
  private readonly maxToasts: number;
  private readonly newestOnTop: boolean | undefined;
  private readonly queue: Array<{
    create: (onComplete: () => void) => void;
  }> = [];

  constructor(container: ToastifyContainer, maxToasts: number, newestOnTop: boolean | undefined) {
    this.container = container;
    this.maxToasts = maxToasts;
    this.newestOnTop = newestOnTop;
  }

  /**
   * Drops every queued toast, completes the visible ones (clearing their timers and listeners)
   * and removes the container from the DOM.
   * @memberof ToastifyQueue
   */
  public destroy(): void {
    this.queue.length = 0;
    for (const element of Array.from(this.container.element.children)) {
      element.dispatchEvent(new CustomEvent('toastify:evict'));
    }
    this.container.destroy();
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
  ): ToastifyHandle {
    const handle = new ToastifyHandle();
    // If there is space, display the toast immediately
    if (this.activeToasts < this.maxToasts) {
      Toastify.create(
        this.container,
        this.maxToasts,
        this.newestOnTop,
        { title, message, type },
        options,
        () => {
          this.activeToasts--; // Decrement active toasts when the toast is removed
          this.processQueue(); // Check the queue for the next toast
        },
        handle
      );
      this.activeToasts++; // Increment active toasts
    } else {
      // Otherwise, add the toast to the queue
      this.queue.push({
        create: (onComplete) => {
          Toastify.create(
            this.container,
            this.maxToasts,
            this.newestOnTop,
            { title, message, type },
            options,
            onComplete,
            handle
          );
        },
      });
    }
    return handle;
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
