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
    let actionAbortController = new AbortController();
    let currentOptions: ToastifyOptions = { ...options };
    const lifetime = new AbortController();
    const actionHandle = handle ?? new ToastifyHandle();

    const timeouts = new Set<number>();
    const later = (fn: () => void, ms: number): void => {
      const id = Number(
        globalThis.setTimeout(() => {
          timeouts.delete(id);
          fn();
        }, ms)
      );
      timeouts.add(id);
    };

    // Releases every timer and listener this toast owns. Runs once, when the toast is done.
    const guardedComplete = (): void => {
      if (completed) return;
      completed = true;
      clearInterval(progressInterval ?? undefined);
      clearTimeout(autoCloseTimeout ?? undefined);
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
      dismissAbortController.abort();
      tapDismissAbortController.abort();
      actionAbortController.abort();
      lifetime.abort();
      onComplete();
    };

    const setProgress = (value: number): void => {
      progressBar?.style.setProperty('--noap-toastify-progress', `${value}%`);
    };

    const syncRole = (): void => {
      const urgent = currentType === 'error' || currentType === 'warning';
      toastifyElement.setAttribute('role', urgent ? 'alert' : 'status');
      toastifyElement.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
      toastifyElement.setAttribute('aria-atomic', 'true');
    };

    const getAnimationClass = (out = false): string => {
      const animationType = currentOptions.animationType || 'fade';
      const suffix = Toastify.getAnimationSuffix(animationType, positionContainer);
      return `noap-toastify-anim-${animationType}${out ? '-out' : ''}${suffix}`;
    };

    // Plays the exit animation and closes the space the toast occupied so its neighbours slide into the gap
    const exit = (element: HTMLElement): void => {
      element.style.setProperty('--noap-toastify-height', `${element.offsetHeight}px`);
      element.classList.add(getAnimationClass(true), 'noap-toastify-collapse');
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
      exit(toastifyElement);
      later(() => {
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
        toastifyElement.appendChild(progressBar);
        setProgress(pbDirection === 'increase' ? 0 : 100);

        progressInterval = Number(
          globalThis.setInterval(
            () => {
              if (pbDirection === 'increase') {
                progress += 1;
              } else {
                progress -= 1;
              }
              setProgress(progress);
              if ((pbDirection === 'increase' && progress >= 100) || (pbDirection === 'decrease' && progress <= 0)) {
                clearInterval(progressInterval!);
                progressInterval = null;
                exit(toastifyElement);
                // Use transitionend for smoother removal
                const handleTransitionEnd = (): void => {
                  if (htmlContainer.contains(toastifyElement)) {
                    toastifyElement.remove();
                    guardedComplete();
                  }
                };
                toastifyElement.addEventListener('transitionend', handleTransitionEnd, { signal });
                toastifyElement.addEventListener('animationend', handleTransitionEnd, { signal });
                // Fallback timeout
                later(handleTransitionEnd, 600);
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
                  setProgress(progress);
                  if (
                    (pbDirection === 'increase' && progress >= 100) ||
                    (pbDirection === 'decrease' && progress <= 0)
                  ) {
                    clearInterval(progressInterval!);
                    progressInterval = null;
                    exit(toastifyElement);
                    later(() => {
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
          iconElement.replaceChildren(icon);
        } else {
          const newIconElement = document.createElement('div');
          newIconElement.className = `noap-toastify-icon ${currentType}`;
          newIconElement.appendChild(icon);
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
        newCloseButton.type = 'button';
        newCloseButton.className = 'noap-toastify-close';
        newCloseButton.setAttribute('aria-label', 'Close');
        newCloseButton.appendChild(ToastifyIcons.getCloseIcon());
        newCloseButton.addEventListener(
          'click',
          (event) => {
            event.stopPropagation();
            dismiss(300);
          },
          { signal: lifetime.signal }
        );
        toastifyElement.appendChild(newCloseButton);
      } else {
        closeButton?.remove();
      }
    };

    const syncAction = (): void => {
      actionAbortController.abort();
      actionAbortController = new AbortController();
      toastifyElement.querySelector('.noap-toastify-action')?.remove();
      const action = currentOptions.action;
      if (!action) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'noap-toastify-action';
      button.textContent = action.label;
      button.addEventListener(
        'click',
        (event) => {
          event.stopPropagation();
          action.onClick(actionHandle);
          if (action.dismissOnClick !== false) dismiss(300);
        },
        { signal: actionAbortController.signal }
      );
      parentElement.appendChild(button);
    };

    const syncTapToDismiss = (): void => {
      tapDismissAbortController.abort();
      tapDismissAbortController = new AbortController();
      toastifyElement.classList.toggle('noap-toastify-tap-hover', Boolean(currentOptions.tapToDismiss));
      if (currentOptions.tapToDismiss) {
        toastifyElement.addEventListener('click', () => dismiss(500), { signal: tapDismissAbortController.signal });
      }
    };

    syncRole();
    syncIcon();
    syncCloseButton();
    syncAction();
    syncTapToDismiss();

    // Dispatched by the queue when this toast is evicted or the manager is destroyed
    toastifyElement.addEventListener('toastify:evict', guardedComplete, { signal: lifetime.signal });

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
          exit(oldestToast);
          // Not tracked by `later`: this removes another toast and must outlive this one
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
      // Ignore updates once the toast is gone or on its way out
      if (completed || toastifyElement.classList.contains('noap-toastify-collapse')) return;

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
        syncRole();
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
        syncAction();
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
