import { ToastifyOptions, ToastifyType } from './index';
import { ToastifyIcons } from './toastify-icons';

export class Toastify {
  /**
   * Creates and displays a toastify notification.
   * @memberof Toastify
   */
  public static create(
    htmlContainer: HTMLElement,
    maxToasts: number,
    newestOnTop: boolean | undefined,
    title: string,
    message: string,
    type: ToastifyType,
    options: ToastifyOptions,
    onComplete: () => void
  ): void {
    const toastifyElement: HTMLDivElement = document.createElement('div');
    const animationType = options.animationType || 'fade';
    toastifyElement.className = `noap-toastify-toast noap-toastify-${options.direction} noap-toastify-anim-${animationType}`;
    toastifyElement.classList.add(`noap-toastify-${type}`);
    if (options.tapToDismiss) {
      toastifyElement.style.cursor = 'pointer';
      toastifyElement.addEventListener('click', () => {
        toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out`);
        setTimeout(() => {
          if (toastifyElement.parentElement === htmlContainer) {
            htmlContainer.removeChild(toastifyElement);
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

    if (options.showIcons && ToastifyIcons.getIcon(type)) {
      const iconElement = document.createElement('div');
      iconElement.className = `noap-toastify-icon ${type}`;
      iconElement.innerHTML = ToastifyIcons.getIcon(type);
      toastifyElement.appendChild(iconElement);
    }

    let progressBar: HTMLElement | null = null;
    let progressInterval: number | null = null;
    let progress = 100;
    const progressBarDuration = options.progressBarDuration ? options.progressBarDuration : 100;

    if (options.withProgressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'noap-toastify-progress-bar';
      progressBar.style.width = '100%';
      toastifyElement.appendChild(progressBar);

      progressInterval = window.setInterval(
        () => {
          progress -= 1;
          progressBar!.style.width = `${progress}%`;
          if (progress <= 0) {
            clearInterval(progressInterval!);
            toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out`);
            setTimeout(() => {
              htmlContainer.removeChild(toastifyElement);
              onComplete();
            }, 500);
          }
        },
        progressBarDuration === 0 ? 100 : progressBarDuration
      );

      toastifyElement.addEventListener('mouseenter', () => {
        if (progressInterval) {
          toastifyElement.classList.add('noap-toastify-hovering');
          clearInterval(progressInterval);
          progressInterval = null;
        }
      });

      toastifyElement.addEventListener('mouseleave', () => {
        if (!progressInterval) {
          progressInterval = window.setInterval(
            () => {
              toastifyElement.classList.remove('noap-toastify-hovering');
              progress -= 1;
              progressBar!.style.width = `${progress}%`;
              if (progress <= 0) {
                clearInterval(progressInterval!);
                toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out`);
                setTimeout(() => {
                  htmlContainer.removeChild(toastifyElement);
                  onComplete();
                }, 500);
              }
            },
            progressBarDuration === 0 ? 100 : progressBarDuration
          );
        }
      });
    }

    if (!options.withProgressBar && options.duration! > 0) {
      setTimeout(() => {
        toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out`);
        setTimeout(() => {
          htmlContainer.removeChild(toastifyElement);
          onComplete();
        }, 500);
      }, options.duration);
    }
    if (title) {
      parentElement.appendChild(titleElement);
    }
    parentElement.appendChild(messageElement);
    toastifyElement.appendChild(parentElement);
    if (options.closeButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'noap-toastify-close';
      closeBtn.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"></path>
        </svg>`;
      closeBtn.onclick = (): void => {
        toastifyElement.classList.add(`noap-toastify-anim-${animationType}-out`);
        setTimeout(() => {
          htmlContainer.removeChild(toastifyElement);
          onComplete();
        }, 200);
      };
      toastifyElement.appendChild(closeBtn);
    }
    if (newestOnTop) {
      htmlContainer.insertBefore(toastifyElement, htmlContainer.firstChild);
    } else {
      htmlContainer.appendChild(toastifyElement);
    }
    // Check if the number of toasts exceeds the maximum allowed
    if (htmlContainer.children.length > maxToasts) {
      for (const element of Array.from(htmlContainer.children)) {
        const oldestToast = element as HTMLElement;
        if (!oldestToast.classList.contains('noap-toastify-hovering')) {
          oldestToast.classList.add(`noap-toastify-anim-${animationType}-out`);
          setTimeout(() => {
            htmlContainer.removeChild(oldestToast);
          }, 500);
          break;
        }
      }
    }
  }
}
