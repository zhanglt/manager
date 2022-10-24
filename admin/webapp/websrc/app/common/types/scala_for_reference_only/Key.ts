// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

import { Array, isArray } from './Array';
import { Char, isChar } from './Char';

export interface Key {
  keyTable: Array;
  keyMap: { [key: Char]: Array };
}

export function isKey(v: any): v is Key {
  return (
    (v['keyTable'] && isArray(v['keyTable'])) &&
    ((typeof v['keyMap']) == 'object' && Object.keys(v['keyMap']).every(key => (key && isChar(key)) && (v['keyMap'][key] && isArray(v['keyMap'][key]))))
  );
}