
export const deepFreeze = <T>(obj: T): Readonly<T> => {
  if (!obj || typeof obj !== 'object') return obj as any;

  Object.keys(obj).forEach(prop => {
    if (typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) deepFreeze(obj[prop]);
  });
  return Object.freeze(obj)   as Readonly<T>
};