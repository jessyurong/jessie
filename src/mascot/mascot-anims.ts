/**
 * JESSiE-BOT — Animation state manager
 * Manages CSS class-based animation states on the wrapper element.
 */

export type BotAction =
  | 'idle'
  | 'walk'
  | 'wave'
  | 'stretch'
  | 'thinking'
  | 'talking'
  | 'listening'
  | 'react';

const ALL_STATES: BotAction[] = [
  'idle', 'walk', 'wave', 'stretch', 'thinking', 'talking', 'listening', 'react',
];

// Duration each timed action lasts (ms) before returning to walk.
const ACTION_DURATIONS: Partial<Record<BotAction, number>> = {
  wave: 1900,
  stretch: 1700,
  thinking: 3500,
  react: 550,
};

// Small, characterful pool. Keep the motion readable instead of chaotic.
const RANDOM_ACTIONS: BotAction[] = [
  'wave', 'wave', 'wave',
  'stretch', 'stretch',
  'thinking', 'thinking',
  'react',
];

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
    ALL_STATES.forEach(s => this.wrap.classList.remove(`state-${s}`));
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }

    this.currentState = action;
    this.wrap.classList.add(`state-${action}`);
    this.onActionDone = onDone ?? null;

    const dur = ACTION_DURATIONS[action];
    if (dur) {
      this.actionTimer = setTimeout(() => {
        this.actionTimer = null;
        this.onActionDone?.();
        this.onActionDone = null;
        this.setState('walk');
      }, dur);
    }
  }

  getState(): BotAction { return this.currentState; }

  setFacing(dir: 'left' | 'right'): void {
    this.wrap.classList.toggle('facing-left', dir === 'left');
  }

  startRandomActions(): void {
    this.stopRandomActions();
    this.scheduleNextRandom();
  }

  stopRandomActions(): void {
    if (this.randomTimer) {
      clearTimeout(this.randomTimer);
      this.randomTimer = null;
    }
  }

  private scheduleNextRandom(): void {
    this.randomTimer = setTimeout(() => {
      if (this.currentState === 'walk' || this.currentState === 'idle') {
        this.setState(this.pickRandom(), () => this.scheduleNextRandom());
      } else {
        this.scheduleNextRandom();
      }
    }, 8500 + Math.random() * 8500);
  }

  private pickRandom(): BotAction {
    return RANDOM_ACTIONS[Math.floor(Math.random() * RANDOM_ACTIONS.length)];
  }

  destroy(): void {
    this.stopRandomActions();
    if (this.actionTimer) clearTimeout(this.actionTimer);
    this.actionTimer = null;
    this.onActionDone = null;
  }
}
