import { ToastifyOptions, ToastifyPosition, ToastifyType } from './index';
import { ToastifyContainer } from './toastify-container';
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
    onComplete: () => void
  ): void {
    const { title, message, type } = toast;
    const htmlContainer: HTMLElement = container.element;
    const positionContainer: ToastifyPosition = container.containerPosition;
    const toastifyElement: HTMLDivElement = document.createElement('div');
    const animationType = options.animationType || 'fade';
    const from = Toastify.getAnimationSuffix(animationType, positionContainer);

    toastifyElement.className = `noap-toastify-toast noap-toastify-${options.direction} noap-toastify-anim-${animationType}${from}`;
    toastifyElement.classList.add(`noap-toastify-${type}`);
    if (options.tapToDismiss) {
      toastifyElement.classList.add('noap-toastify-tap-hover');
      toastifyElement.addEventListener('click', () => {
        toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
        globalThis.setTimeout(() => {
          if (htmlContainer.contains(toastifyElement)) {
            toastifyElement.remove();
            onComplete();
          }
        }, 500);
      });
    }

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

    const icon = ToastifyIcons.getToastIcon(type);
    if (options.showIcons && icon) {
      const iconElement = document.createElement('div');
      iconElement.className = `noap-toastify-icon ${type}`;
      iconElement.innerHTML = icon;
      toastifyElement.appendChild(iconElement);
    }

    let progressBar: HTMLElement | null = null;
    let progressInterval: number | null = null;
    let autoCloseTimeout: number | null = null;
    const progressBarDuration = options.progressBarDuration ? options.progressBarDuration : 100;
    const direction = options.progressBarDirection || 'decrease';
    let progress = direction === 'increase' ? 0 : 100;

    if (options.withProgressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'noap-toastify-progress-bar';
      progressBar.style.width = `${direction === 'increase' ? 0 : 100}%`;
      toastifyElement.appendChild(progressBar);

      progressInterval = Number(
        globalThis.setInterval(
          () => {
            if (direction === 'increase') {
              progress += 1;
            } else {
              progress -= 1;
            }
            progressBar!.style.width = `${progress}%`;
            if ((direction === 'increase' && progress >= 100) || (direction === 'decrease' && progress <= 0)) {
              clearInterval(progressInterval!);
              toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
              // Use transitionend for smoother removal
              const handleTransitionEnd = (): void => {
                if (htmlContainer.contains(toastifyElement)) {
                  toastifyElement.remove();
                  onComplete();
                }
                toastifyElement.removeEventListener('transitionend', handleTransitionEnd);
                toastifyElement.removeEventListener('animationend', handleTransitionEnd);
              };
              toastifyElement.addEventListener('transitionend', handleTransitionEnd);
              toastifyElement.addEventListener('animationend', handleTransitionEnd);
              // Fallback timeout
              globalThis.setTimeout(handleTransitionEnd, 600);
            }
          },
          progressBarDuration === 0 ? 100 : progressBarDuration
        )
      );

      toastifyElement.addEventListener('mouseenter', () => {
        if (progressInterval !== null) {
          toastifyElement.classList.add('noap-toastify-hovering');
          clearInterval(progressInterval);
          progressInterval = null;
        }
      });

      toastifyElement.addEventListener('mouseleave', () => {
        toastifyElement.classList.remove('noap-toastify-hovering');
        progressInterval ??= Number(
          globalThis.setInterval(
            () => {
              /* istanbul ignore next */
              if (direction === 'increase') {
                progress += 1;
              } else {
                progress -= 1;
              }
              progressBar!.style.width = `${progress}%`;
              if ((direction === 'increase' && progress >= 100) || (direction === 'decrease' && progress <= 0)) {
                clearInterval(progressInterval!);
                toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
                globalThis.setTimeout(() => {
                  if (htmlContainer.contains(toastifyElement)) {
                    toastifyElement.remove();
                    onComplete();
                  }
                }, 500);
              }
            },
            progressBarDuration === 0 ? 100 : progressBarDuration
          )
        );
      });
    }

    if (!options.withProgressBar && options.duration! > 0) {
      const startAutoClose = (): void => {
        autoCloseTimeout = Number(
          globalThis.setTimeout(() => {
            toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
            globalThis.setTimeout(() => {
              if (htmlContainer.contains(toastifyElement)) {
                toastifyElement.remove();
                onComplete();
              }
            }, 500);
          }, options.duration)
        );
      };

      const clearAutoClose = (): void => {
        if (autoCloseTimeout !== null) {
          clearTimeout(autoCloseTimeout);
          autoCloseTimeout = null;
        }
      };

      toastifyElement.addEventListener('mouseenter', () => {
        clearAutoClose();
      });

      toastifyElement.addEventListener('mouseleave', () => {
        startAutoClose();
      });

      startAutoClose();
    }
    if (title) {
      parentElement.appendChild(titleElement);
    }
    parentElement.appendChild(messageElement);
    toastifyElement.appendChild(parentElement);
    if (options.closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'noap-toastify-close';
      closeBtn.innerHTML = ToastifyIcons.getCloseIcon();
      closeBtn.onclick = (): void => {
        toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
        globalThis.setTimeout(() => {
          if (htmlContainer.contains(toastifyElement)) {
            toastifyElement.remove();
            onComplete();
          }
        }, 200);
      };
      toastifyElement.appendChild(closeBtn);
    }
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
          oldestToast.classList.add(`noap-toastify-anim-${animationType}-out${from}`);
          globalThis.setTimeout(() => {
            if (htmlContainer.contains(oldestToast)) {
              oldestToast.remove();
            }
          }, 500);
          break;
        }
      }
    }
  }

  private static getAnimationSuffix(animationType: string, position: ToastifyPosition | null): string {
    if (animationType !== 'slide') return '';
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
