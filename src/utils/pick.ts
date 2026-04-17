// Utility function to pick specific properties from an object.
const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Partial<T> => {
  const result: Partial<T> = {};
  keys.forEach((key) => {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
};

export default pick;