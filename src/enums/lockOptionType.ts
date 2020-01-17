export type LockOptionValueType =
    { type: 'numMinute', value: number } |
    { type: 'onIdle', value: -4 } |
    { type: 'onSleep', value: -3 } |
    { type: 'onLocked', value: -2 } |
    { type: 'onRestart', value: -1 } |
    { type: 'never', value: null };

export type LockOptionType =
    'numMinute' |
    LockOptionSpecialType;

export type LockOptionSpecialType =
    'onIdle' |
    'onSleep' |
    'onLocked' |
    'onRestart' |
    'never';

export const LOCK_ON_IDLE: LockOptionValueType = {type: 'onIdle', value: -4};
export const LOCK_ON_SLEEP: LockOptionValueType = {type: 'onSleep', value: -3};
export const LOCK_ON_LOCKED: LockOptionValueType = {type: 'onLocked', value: -2};
export const LOCK_ON_RESTART: LockOptionValueType = {type: 'onRestart', value: -1};
export const LOCK_NEVER: LockOptionValueType = {type: 'never', value: null};

export const LOCK_OPTION_SPECIAL_TYPE_VALUES = new Map<LockOptionSpecialType, LockOptionValueType>(
    [
        ['onIdle', LOCK_ON_IDLE],
        ['onSleep', LOCK_ON_SLEEP],
        ['onLocked', LOCK_ON_LOCKED],
        ['onRestart', LOCK_ON_RESTART],
        ['never', LOCK_NEVER],
    ]);
