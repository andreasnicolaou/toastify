import type { ToastifyUpdateOptions } from './index';

/**
 * A handle returned by every toast method. Holds a reference to the live toast
 * and lets you mutate it in-place while it is still visible.
 *
 * If the toast is queued (maxToasts exceeded) and has not appeared yet, any
 * calls to update() are buffered and replayed the moment the toast is shown.
 *
 * @example
 * const handle = toast.info('Upload', 'Uploading...');
 * handle.update({ message: 'Processing...' });
 * handle.update({ type: 'success', message: 'Done!', withProgressBar: true });
 *
 * @author Andreas Nicolaou
 */
export class ToastifyHandle {
  private readonly _pending: ToastifyUpdateOptions[] = [];
  private _updater: ((opts: ToastifyUpdateOptions) => void) | null = null;

  /**
   * Called by Toastify.create() once the toast element is in the DOM.
   * Immediately applies any buffered updates.
   * @internal
   */
  public _attach(updater: (opts: ToastifyUpdateOptions) => void): void {
    this._updater = updater;
    for (const opts of this._pending) {
      updater(opts);
    }
    this._pending.length = 0;
  }

  /**
   * Updates the visible toast. If the toast is still queued, the update is
   * buffered and applied when the toast becomes visible.
   * @param options - Fields to change. Only supplied keys are mutated.
   */
  public update(options: ToastifyUpdateOptions): void {
    if (this._updater) {
      this._updater(options);
    } else {
      this._pending.push({ ...options });
    }
  }
}
