import { ToastifyContainer } from './toastify-container';

describe('ToastifyContainer', () => {
  let toastifyContainer!: ToastifyContainer;

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create and append a container to the body', () => {
    toastifyContainer = new ToastifyContainer('top-right');
    const containerElement = document.querySelector('.noap-toastify-container');
    expect(containerElement).not.toBeNull();
    expect(containerElement).toBeInstanceOf(HTMLElement);
    expect(document.body.contains(containerElement)).toBe(true);
  });

  it('should apply the correct class name based on the position bottom-left', () => {
    toastifyContainer = new ToastifyContainer('bottom-left');
    const containerElement = document.querySelector('.noap-toastify-container');
    expect(containerElement?.classList.contains('noap-toastify-bottom-left')).toBe(true);
  });

  it('should apply the correct class name based on the position center', () => {
    toastifyContainer = new ToastifyContainer('center');
    const containerElement = document.querySelector('.noap-toastify-container');
    expect(containerElement?.classList.contains('noap-toastify-center')).toBe(true);
  });

  it('should apply custom classes when provided', () => {
    toastifyContainer = new ToastifyContainer('top-center', 'custom-class another-class');
    const containerElement = document.querySelector('.noap-toastify-container');
    expect(containerElement?.classList.contains('custom-class')).toBe(true);
    expect(containerElement?.classList.contains('another-class')).toBe(true);
  });

  it('should return the correct HTMLElement via the element getter', () => {
    toastifyContainer = new ToastifyContainer('top-right');
    expect(toastifyContainer.element).toBeInstanceOf(HTMLElement);
    expect(toastifyContainer.element.classList.contains('noap-toastify-container')).toBe(true);
  });
});
