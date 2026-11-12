import { ToastifyType } from './index';

const NS = 'http://www.w3.org/2000/svg';
type SvgNode = [tag: string, attrs: Record<string, string>];

const STROKE = { stroke: '#fff', 'stroke-width': '2.5', 'stroke-linecap': 'round' };
const BELL =
  'M16 8a6 6 0 0 1 6 6v3.764c0 .414.168.812.468 1.104l1.064 1.03A2 2 0 0 1 23 23H9a2 2 0 0 1-1.532-3.102l1.064-1.03A1.5 1.5 0 0 0 9 17.764V14a6 6 0 0 1 6-6Zm0 18a3 3 0 0 0 3-3h-6a3 3 0 0 0 3 3Z';
const dot = (cy: string): SvgNode => ['circle', { cx: '16', cy, r: '1.5', fill: '#fff' }];

const ICONS: Record<ToastifyType, [string, ...SvgNode[]]> = {
  success: ['#22c55e', ['path', { d: 'M10 17l4 4 8-8', ...STROKE, 'stroke-linejoin': 'round' }]],
  error: ['#ef4444', ['path', { d: 'M20 12L12 20M12 12l8 8', ...STROKE, 'stroke-linejoin': 'round' }]],
  info: ['#3b82f6', ['path', { d: 'M16 10v2m0 4v6', ...STROKE }], dot('8')],
  warning: ['#f59e42', ['path', { d: 'M16 10v8', ...STROKE }], dot('22')],
  default: ['#a3a3a3', ['path', { d: BELL, fill: '#fff' }]],
  light: ['#fff', ['path', { d: BELL, fill: '#222' }]],
};

/**
 * Builds the icons with createElementNS (no innerHTML), so they also work under Trusted Types.
 */
export class ToastifyIcons {
  public static getCloseIcon(): SVGElement {
    return ToastifyIcons.svg('0 0 14 14', [
      [
        'path',
        {
          stroke: 'currentColor',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'm1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6',
        },
      ],
    ]);
  }

  public static getToastIcon(type: ToastifyType): SVGElement | null {
    const icon = ICONS[type];
    /* istanbul ignore next */
    if (!icon) return null;
    const [color, ...nodes] = icon;
    return ToastifyIcons.svg('0 0 32 32', [['circle', { cx: '16', cy: '16', r: '16', fill: color }], ...nodes], '32');
  }

  private static svg(viewBox: string, nodes: SvgNode[], size?: string): SVGElement {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    if (size) {
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
    }
    for (const [tag, attrs] of nodes) {
      const child = document.createElementNS(NS, tag);
      for (const [name, value] of Object.entries(attrs)) child.setAttribute(name, value);
      svg.appendChild(child);
    }
    return svg;
  }
}
