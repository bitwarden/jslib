export enum StateVersion {
  One = 1, // Original flat key/value pair store
  Two = 2, // Move to a typed State object
  Three = 3, // Fix migration error in account.hasPremiumPersonally
  Latest = Three,
}
