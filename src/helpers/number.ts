export const roundNumberToDecimalPlaces = (
  number: number,
  places: number = 3
): number => {
  const h = Math.pow(10, places);
  return Math.round(number * h) / h;
};

export const safeParseInt = (
  value: string | undefined,
  defaultTo: number = -1
): number => {
  if (!value) {
    return defaultTo;
  }
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultTo : parsed;
};

export const safeParseFloat = (
  value: string,
  defaultTo: number = 0
): number => {
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultTo : parsed;
};

export const integerToString = (value: number = 0) =>
  Math.round(value).toString();

export const isNumber = (value: any): value is number =>
  typeof value === 'number' && !isNaN(value);

type NumbersToDeltasOptions = {
  roundDeltas?: number;
};

export const numbersToDeltas = (
  array: number[] | undefined,
  options: NumbersToDeltasOptions = {}
) => {
  if (!array || array.length === 0) {
    return [];
  }

  const roundDeltas = options.roundDeltas;

  const result = [array[0]];

  for (let i = 1; i < array.length; i++) {
    const delta = array[i] - array[i - 1];
    const roundedDelta =
      roundDeltas !== undefined
        ? roundNumberToDecimalPlaces(delta, roundDeltas)
        : delta;
    result.push(roundedDelta);
  }

  return result;
};

export const deltasToNumbers = (deltas: number[] | undefined) => {
  if (!deltas || deltas.length === 0) {
    return [];
  }

  const result = [deltas[0]];

  for (let i = 1; i < deltas.length; i++) {
    result.push(result[i - 1] + deltas[i]);
  }

  return result;
};
