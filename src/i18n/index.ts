import zh from './zh';
import en from './en';

const localStrMap = {
  zh,
  en,
};
export function getLocalStr(
  id: string,
  region: string,
  ...placeholderList: (string | number)[]
) {
  let str = localStrMap[region]?.[id] || '';
  if (placeholderList.length >= 1) {
    placeholderList.forEach((value, index) => {
      str = str.replace(`%${index + 1}%`, value);
    });
  }
  return str;
}

export function getLocalStrData(
  id: string,
  ...placeholderList: (string | number)[]
) {
  const res = {};
  Object.keys(localStrMap).forEach((key) => {
    res[key] = getLocalStr(id, key, ...placeholderList);
  });
  return res;
}
