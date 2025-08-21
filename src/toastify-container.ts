import { ToastifyPosition } from './index';

export class ToastifyContainer {
  private readonly container: HTMLElement;
  private readonly position: ToastifyPosition;

  constructor(position: ToastifyPosition, customClasses?: string) {
    this.container = document.createElement('div');
    const addedClass = customClasses ? `${customClasses} ` : '';
    this.container.className = `${addedClass}noap-toastify-container noap-toastify-${position}`;
    // apply the position as an attribute
    this.position = position;
    document.body.appendChild(this.container);
  }

  /**
   * Get the container element where the toast will be appended.
   * @returns The container HTMLElement.
   * @memberof ToastifyContainer
   * @author Andreas Nicolaou
   */
  get element(): HTMLElement {
    return this.container;
  }

  /**
   * Get the position of the toast container.
   * @returns The position of the toast container.
   * @memberof ToastifyContainer
   * @author Andreas Nicolaou
   */
  get containerPosition(): ToastifyPosition {
    return this.position;
  }
}
