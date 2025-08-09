import { ToastifyType } from './index';

export class ToastifyIcons {
  static getIcon(type: ToastifyType): string {
    const icons: Record<string, string> = {
      success: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#22c55e"/><path d="M10 17l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      error: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#ef4444"/><path d="M20 12L12 20M12 12l8 8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      info: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#3b82f6"/><path d="M16 10v2m0 4v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="8" r="1.5" fill="#fff"/></svg>`,
      warning: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#f59e42"/><path d="M16 10v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="22" r="1.5" fill="#fff"/></svg>`,
      default: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#a3a3a3"/><path d="M16 8a6 6 0 0 1 6 6v3.764c0 .414.168.812.468 1.104l1.064 1.03A2 2 0 0 1 23 23H9a2 2 0 0 1-1.532-3.102l1.064-1.03A1.5 1.5 0 0 0 9 17.764V14a6 6 0 0 1 6-6Zm0 18a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3Z" fill="#fff"/></svg>`,
      light: `<svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M16 8a6 6 0 0 1 6 6v3.764c0 .414.168.812.468 1.104l1.064 1.03A2 2 0 0 1 23 23H9a2 2 0 0 1-1.532-3.102l1.064-1.03A1.5 1.5 0 0 0 9 17.764V14a6 6 0 0 1 6-6Zm0 18a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3Z" fill="#222"/></svg>`,
    };
    return icons[type] ?? '';
  }
}
