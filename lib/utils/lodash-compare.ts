import lodash from "lodash";

export function lodashCompare(a: any, b: any) {
  const result = {
    different: [],
    missing_from_first: [],
    missing_from_second: []
  } as {
    different: string[],
    missing_from_first: string[],
    missing_from_second: string[]
  }

  lodash.reduce(a, function (result, value, key) {
    if (b?.hasOwnProperty(key)) {
      if (lodash.isEqual(value, b[key])) {
        return result;
      } else {
        if (typeof (a[key]) != typeof ({}) || typeof (b[key]) != typeof ({})) {
          //dead end.
          result.different.push(key);
          return result;
        } else {
          var deeper = lodashCompare(a[key], b[key]);
          result.different = result.different.concat(lodash.map(deeper.different, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_second = result.missing_from_second.concat(lodash.map(deeper.missing_from_second, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_first = result.missing_from_first.concat(lodash.map(deeper.missing_from_first, (sub_path) => {
            return key + "." + sub_path;
          }));
          return result;
        }
      }
    } else {
      result.missing_from_second.push(key);
      return result;
    }
  }, result);

  lodash.reduce(b, function (result, _, key) {
    if (a.hasOwnProperty(key)) {
      return result;
    } else {
      result.missing_from_first.push(key);
      return result;
    }
  }, result);

  return result;
}