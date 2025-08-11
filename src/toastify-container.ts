import { ToastifyPosition } from './index';

export class ToastifyContainer {
  private readonly container: HTMLElement;

  constructor(position: ToastifyPosition, customClasses?: string) {
    this.container = document.createElement('div');
    const addedClass = customClasses ? `${customClasses} ` : '';
    this.container.className = `${addedClass}noap-toastify-container noap-toastify-${position}`;
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
}
