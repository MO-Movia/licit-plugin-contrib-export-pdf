import { StoredStyle } from './table-of-contents-utils';

export function getStyleLevel(styleName: string, styles: StoredStyle[]): number | null {
  const style = styles.find(style => style.name === styleName);

  if (!style?.level) return null;

  const level = Number(style.level);
  return isNaN(level) ? 1 : level;
}
