export type TimeoutValueType =
    { type: 'numMinute', value: number } |
    { type: 'onIdle', value: -4 } |
    { type: 'onSleep', value: -3 } |
    { type: 'onLocked', value: -2 } |
    { type: 'onRestart', value: -1 } |
    { type: 'never', value: null };

export type TimeoutType =
    'numMinute' |
    TimeoutNonDurationType;

export type TimeoutNonDurationType =
    'onIdle' |
    'onSleep' |
    'onLocked' |
    'onRestart' |
    'never';

export const TIMEOUT_ON_IDLE: TimeoutValueType = {type: 'onIdle', value: -4};
export const TIMEOUT_ON_SLEEP: TimeoutValueType = {type: 'onSleep', value: -3};
export const TIMEOUT_ON_LOCKED: TimeoutValueType = {type: 'onLocked', value: -2};
export const TIMEOUT_ON_RESTART: TimeoutValueType = {type: 'onRestart', value: -1};
export const TIMEOUT_NEVER: TimeoutValueType = {type: 'never', value: null};

export const LOCK_OPTION_SPECIAL_TYPE_VALUES = new Map<TimeoutNonDurationType, TimeoutValueType>(
    [
        ['onIdle', TIMEOUT_ON_IDLE],
        ['onSleep', TIMEOUT_ON_SLEEP],
        ['onLocked', TIMEOUT_ON_LOCKED],
        ['onRestart', TIMEOUT_ON_RESTART],
        ['never', TIMEOUT_NEVER],
    ]);
