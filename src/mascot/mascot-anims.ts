/**
 * JESSiE-BOT — Animation state manager
 * Manages CSS class-based animation states on the wrapper element
 */

export type BotAction =
  | 'idle'
  | 'walk'
  | 'wave'
  | 'boxing'
  | 'tumbling'
  | 'dance'
  | 'thinking'
  | 'talking'
  | 'listening'
  | 'react';

const ALL_STATES: BotAction[] = [
  'idle', 'walk', 'wave', 'boxing', 'tumbling',
  'dance', 'thinking', 'talking', 'listening', 'react',
];

// Duration each random action lasts (ms) before returning to walk
const ACTION_DURATIONS: Partial<Record<BotAction, number>> = {
  wave: 2200,
  boxing: 3200,
  tumbling: 1800,
  dance: 4200,
  thinking: 3500,
  react: 450,
};

export class MascotAnimator {
  private wrap: HTMLElement;
  private currentState: BotAction = 'idle';
  private actionTimer: ReturnType<typeof setTimeout> | null = null;
  private randomTimer: ReturnType<typeof setTimeout> | null = null;
  private onActionDone: (() => void) | null = null;

  constructor(wrapEl: HTMLElement) {
    this.wrap = wrapEl;
  }

  setState(action: BotAction, onDone?: () => void): void {
    // Clear previous state
    ALL_STATES.forEach(s => this.wrap.classList.remove(`state-${s}`));
    if (this.actionTimer) { clearTimeout(this.actionTimer); this.actionTimer = null; }

    this.currentState = action;
    this.wrap.classList.add(`state-${action}`);
    this.onActionDone = onDone ?? null;

    // Auto-revert timed actions back to walk
    const dur = ACTION_DURATIONS[action];
    if (dur) {
      this.actionTimer = setTimeout(() => {
        this.actionTimer = null;
        this.onActionDone?.();
        this.setState('walk');
      }, dur);
    }
  }

  getState(): BotAction { return this.currentState; }

  setFacing(dir: 'left' | 'right'): void {
    this.wrap.classList.toggle('facing-left', dir === 'left');
  }

  startRandomActions(): void {
    this.scheduleNextRandom();
  }

  stopRandomActions(): void {
    if (this.randomTimer) { clearTimeout(this.randomTimer); this.randomTimer = null; }
  }

  private scheduleNextRandom(): void {
    // Every 12–26 seconds, do a random action
    const delay = 12000 + Math.random() * 14000;
    this.randomTimer = setTimeout(() => {
      // Only fire if currently walking/idle (don't interrupt voice/reactions)
      if (this.currentState === 'walk' || this.currentState === 'idle') {
        const action = this.pickRandom();
        this.setState(action, () => this.scheduleNextRandom());
      } else {
        this.scheduleNextRandom();
      }
    }, delay);
  }

  private pickRandom(): BotAction {
    // Weighted pool
    const pool: BotAction[] = [
      'wave', 'wave', 'wave',           // 20%
      'thinking', 'thinking', 'thinking', // 20%
      'dance', 'dance', 'dance',         // 20%
      'boxing', 'boxing',                // 13%
      'tumbling',                        // 7%
      'wave',                            // extra wave (cute)
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  destroy(): void {
    this.stopRandomActions();
    if (this.actionTimer) clearTimeout(this.actionTimer);
  }
}
