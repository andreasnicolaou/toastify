import type { ToastifyOptions, ToastifyPosition, ToastifyType, ToastifyUpdateOptions } from './index';
import { ToastifyContainer } from './toastify-container';
import { ToastifyHandle } from './toastify-handle';
import { ToastifyIcons } from './toastify-icons';

export class Toastify {
  /**
   * Creates and displays a toastify notification.
   * @memberof Toastify
   * @author Andreas Nicolaou
   */
  public static create(
    container: ToastifyContainer,
    maxToasts: number,
    newestOnTop: boolean | undefined,
    toast: {
      title: string;
      message: string;
      type: ToastifyType;
    },
    options: ToastifyOptions,
    onComplete: () => void,
    handle?: ToastifyHandle
  ): void {
    const { title, message, type } = toast;
    const htmlContainer: HTMLElement = container.element;
    const positionContainer: ToastifyPosition = container.containerPosition;
    const toastifyElement: HTMLDivElement = document.createElement('div');
    const animationType = options.animationType || 'fade';
    const from = Toastify.getAnimationSuffix(animationType, positionContainer);

    let progressBar: HTMLElement | null = null;
    let progressInterval: number | null = null;
    let autoCloseTimeout: number | null = null;
    let completed = false;
    let dismissAbortController = new AbortController();
    let tapDismissAbortController = new AbortController();
    let currentType = type;
    let currentOptions: ToastifyOptions = { ...options };

    const guardedComplete = (): void => {
      if (completed) return;
      completed = true;
      onComplete();
    };

    const getAnimationClass = (out = false): string => {
      const animationType = currentOptions.animationType || 'fade';
      const suffix = Toastify.getAnimationSuffix(animationType, positionContainer);
      return `noap-toastify-anim-${animationType}${out ? '-out' : ''}${suffix}`;
    };

    const dismiss = (delay: number): void => {
      if (progressInterval !== null) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (autoCloseTimeout !== null) {
        clearTimeout(autoCloseTimeout);
        autoCloseTimeout = null;
      }
      toastifyElement.classList.add(getAnimationClass(true));
      globalThis.setTimeout(() => {
        if (htmlContainer.contains(toastifyElement)) {
          toastifyElement.remove();
          guardedComplete();
        }
      }, delay);
    };

    const setupDismissLogic = (opts: ToastifyOptions): void => {
      dismissAbortController.abort();
      dismissAbortController = new AbortController();
      const signal = dismissAbortController.signal;

      if (progressInterval !== null) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (autoCloseTimeout !== null) {
        clearTimeout(autoCloseTimeout);
        autoCloseTimeout = null;
      }

      toastifyElement.classList.remove('noap-toastify-hovering');
      const existingBar = toastifyElement.querySelector('.noap-toastify-progress-bar');
      if (existingBar) {
        existingBar.remove();
      }
      progressBar = null;

      const pbDuration = opts.progressBarDuration ? opts.progressBarDuration : 100;
      const pbDirection = opts.progressBarDirection || 'decrease';
      let progress = pbDirection === 'increase' ? 0 : 100;

      if (opts.withProgressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'noap-toastify-progress-bar';
        progressBar.style.width = `${pbDirection === 'increase' ? 0 : 100}%`;
        toastifyElement.appendChild(progressBar);

        progressInterval = Number(
          globalThis.setInterval(
            () => {
              if (pbDirection === 'increase') {
                progress += 1;
              } else {
                progress -= 1;
              }
              progressBar!.style.width = `${progress}%`;
              if ((pbDirection === 'increase' && progress >= 100) || (pbDirection === 'decrease' && progress <= 0)) {
                clearInterval(progressInterval!);
                progressInterval = null;
                toastifyElement.classList.add(getAnimationClass(true));
                // Use transitionend for smoother removal
                let fallbackTimeout: number | null = null;
                const handleTransitionEnd = (): void => {
                  if (fallbackTimeout !== null) {
                    clearTimeout(fallbackTimeout);
                    fallbackTimeout = null;
                  }
                  if (htmlContainer.contains(toastifyElement)) {
                    toastifyElement.remove();
                    guardedComplete();
                  }
                  toastifyElement.removeEventListener('transitionend', handleTransitionEnd);
                  toastifyElement.removeEventListener('animationend', handleTransitionEnd);
                };
                toastifyElement.addEventListener('transitionend', handleTransitionEnd);
                toastifyElement.addEventListener('animationend', handleTransitionEnd);
                // Fallback timeout
                fallbackTimeout = Number(globalThis.setTimeout(handleTransitionEnd, 600));
              }
            },
            pbDuration === 0 ? 100 : pbDuration
          )
        );

        toastifyElement.addEventListener(
          'mouseenter',
          () => {
            if (progressInterval !== null) {
              toastifyElement.classList.add('noap-toastify-hovering');
              clearInterval(progressInterval);
              progressInterval = null;
            }
          },
          { signal }
        );

        toastifyElement.addEventListener(
          'mouseleave',
          () => {
            toastifyElement.classList.remove('noap-toastify-hovering');
            progressInterval ??= Number(
              globalThis.setInterval(
                () => {
                  /* istanbul ignore next */
                  if (pbDirection === 'increase') {
                    progress += 1;
                  } else {
                    progress -= 1;
                  }
                  progressBar!.style.width = `${progress}%`;
                  if (
                    (pbDirection === 'increase' && progress >= 100) ||
                    (pbDirection === 'decrease' && progress <= 0)
                  ) {
                    clearInterval(progressInterval!);
                    progressInterval = null;
                    toastifyElement.classList.add(getAnimationClass(true));
                    globalThis.setTimeout(() => {
                      if (htmlContainer.contains(toastifyElement)) {
                        toastifyElement.remove();
                        guardedComplete();
                      }
                    }, 500);
                  }
                },
                pbDuration === 0 ? 100 : pbDuration
              )
            );
          },
          { signal }
        );
      } else if ((opts.duration ?? 0) > 0) {
        const startAutoClose = (): void => {
          autoCloseTimeout = Number(
            globalThis.setTimeout(() => {
              dismiss(500);
            }, opts.duration)
          );
        };

        const clearAutoClose = (): void => {
          if (autoCloseTimeout !== null) {
            clearTimeout(autoCloseTimeout);
            autoCloseTimeout = null;
          }
        };

        toastifyElement.addEventListener(
          'mouseenter',
          () => {
            clearAutoClose();
          },
          { signal }
        );
        toastifyElement.addEventListener(
          'mouseleave',
          () => {
            startAutoClose();
          },
          { signal }
        );
        startAutoClose();
      }
    };

    toastifyElement.className = `noap-toastify-toast noap-toastify-${options.direction} noap-toastify-anim-${animationType}${from}`;
    toastifyElement.classList.add(`noap-toastify-${type}`);
    const parentElement = document.createElement('div');
    parentElement.className = 'noap-toastify-wrapper';

    const titleElement = document.createElement('div');
    titleElement.className = 'noap-toastify-title';
    titleElement.innerText = title;

    const messageElement = document.createElement('div');
    messageElement.className = 'noap-toastify-message';
    if (options.isHtml) {
      messageElement.innerHTML = message;
    } else {
      messageElement.innerText = message;
    }

    if (title) {
      parentElement.appendChild(titleElement);
    }
    parentElement.appendChild(messageElement);
    toastifyElement.appendChild(parentElement);

    const syncIcon = (): void => {
      const iconElement = toastifyElement.querySelector('.noap-toastify-icon') as HTMLElement | null;
      const icon = ToastifyIcons.getToastIcon(currentType);
      if (currentOptions.showIcons && icon) {
        if (iconElement) {
          iconElement.className = `noap-toastify-icon ${currentType}`;
          iconElement.innerHTML = icon;
        } else {
          const newIconElement = document.createElement('div');
          newIconElement.className = `noap-toastify-icon ${currentType}`;
          newIconElement.innerHTML = icon;
          toastifyElement.insertBefore(newIconElement, parentElement);
        }
      } else {
        iconElement?.remove();
      }
    };

    const syncCloseButton = (): void => {
      const closeButton = toastifyElement.querySelector('.noap-toastify-close') as HTMLButtonElement | null;
      if (currentOptions.closeButton) {
        if (closeButton) return;
        const newCloseButton = document.createElement('button');
        newCloseButton.className = 'noap-toastify-close';
        newCloseButton.innerHTML = ToastifyIcons.getCloseIcon();
        newCloseButton.addEventListener('click', (event) => {
          event.stopPropagation();
          dismiss(200);
        });
        toastifyElement.appendChild(newCloseButton);
      } else {
        closeButton?.remove();
      }
    };

    const syncTapToDismiss = (): void => {
      tapDismissAbortController.abort();
      tapDismissAbortController = new AbortController();
      toastifyElement.classList.toggle('noap-toastify-tap-hover', Boolean(currentOptions.tapToDismiss));
      if (currentOptions.tapToDismiss) {
        toastifyElement.addEventListener('click', () => dismiss(500), { signal: tapDismissAbortController.signal });
      }
    };

    syncIcon();
    syncCloseButton();
    syncTapToDismiss();

    toastifyElement.addEventListener('toastify:evict', () => {
      if (progressInterval !== null) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (autoCloseTimeout !== null) {
        clearTimeout(autoCloseTimeout);
        autoCloseTimeout = null;
      }
      guardedComplete();
    });

    setupDismissLogic(options);

    if (newestOnTop) {
      /* istanbul ignore next */
      htmlContainer.insertBefore(toastifyElement, htmlContainer.firstChild);
    } else {
      htmlContainer.appendChild(toastifyElement);
    }
    // Check if the number of toasts exceeds the maximum allowed
    if (htmlContainer.children.length > maxToasts) {
      for (const element of Array.from(htmlContainer.children)) {
        const oldestToast = element as HTMLElement;
        if (!oldestToast.classList.contains('noap-toastify-hovering')) {
          oldestToast.dispatchEvent(new CustomEvent('toastify:evict'));
          oldestToast.classList.add(getAnimationClass(true));
          globalThis.setTimeout(() => {
            if (htmlContainer.contains(oldestToast)) {
              oldestToast.remove();
            }
          }, 500);
          break;
        }
      }
    }

    const updateToast = (updateOpts: ToastifyUpdateOptions): void => {
      if (completed) return;

      const { title: newTitle, message: newMessage, type: newType, ...optionChanges } = updateOpts;
      const nextOptions = { ...currentOptions, ...optionChanges };

      if (newTitle !== undefined) {
        titleElement.innerText = newTitle;
        if (newTitle && !parentElement.contains(titleElement)) {
          parentElement.insertBefore(titleElement, parentElement.firstChild);
        } else if (!newTitle) {
          titleElement.remove();
        }
      }

      if (newMessage !== undefined) {
        if (nextOptions.isHtml) {
          messageElement.innerHTML = newMessage;
        } else {
          messageElement.innerText = newMessage;
        }
      }

      if (newType !== undefined && newType !== currentType) {
        toastifyElement.classList.remove(`noap-toastify-${currentType}`);
        toastifyElement.classList.add(`noap-toastify-${newType}`);
        currentType = newType;
      }

      if (Object.keys(optionChanges).length > 0) {
        const previousDirection = currentOptions.direction;
        currentOptions = nextOptions;
        if (currentOptions.direction !== previousDirection) {
          toastifyElement.classList.remove(`noap-toastify-${previousDirection}`);
          toastifyElement.classList.add(`noap-toastify-${currentOptions.direction}`);
        }
        syncIcon();
        syncCloseButton();
        syncTapToDismiss();
        setupDismissLogic(currentOptions);
      } else if (newType !== undefined) {
        syncIcon();
      }
    };

    handle?._attach(updateToast);
  }

  private static getAnimationSuffix(animationType: string, position: ToastifyPosition | null): string {
    if (animationType !== 'slide' && animationType !== 'roll' && animationType !== 'lightspeed') return '';
    switch (position) {
      case 'top-left':
      case 'bottom-left':
        return '-left';
      case 'bottom-center':
      case 'bottom-center-full':
        return '-bottom';
      case 'top-center':
      case 'top-center-full':
        return '-top';
      case 'center':
        return '-center';
      default:
        return '';
    }
  }
}
