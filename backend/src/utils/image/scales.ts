/**
 * Represents a single color scale item.
 */
export interface ScaleItem {
  color: string;
  amount: number;
  from: number;
}

/**
 * A template array containing objects with color information, amount, and from value.
 */
export const template: ScaleItem[] = [
  {
    color: 'rgb(244, 67, 54)',
    amount: 0,
    from: 0.15
  },
  {
    color: 'rgb(255, 152, 0)',
    amount: 0,
    from: 0.3
  },
  {
    color: 'rgb(255, 235, 59)',
    amount: 0,
    from: 0.45
  },
  {
    color: 'rgb(76, 175, 80)',
    amount: 0,
    from: 0.6
  }
];
