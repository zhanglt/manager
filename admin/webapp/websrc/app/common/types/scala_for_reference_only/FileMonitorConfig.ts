// Generated by ScalaTS 0.5.9: https://scala-ts.github.io/scala-ts/

import { Array, isArray } from './Array';

export interface FileMonitorConfig {
  add_filters?: Array;
  delete_filters?: Array;
  update_filters?: Array;
}

export function isFileMonitorConfig(v: any): v is FileMonitorConfig {
  return (
    (!v['add_filters'] || (v['add_filters'] && isArray(v['add_filters']))) &&
    (!v['delete_filters'] || (v['delete_filters'] && isArray(v['delete_filters']))) &&
    (!v['update_filters'] || (v['update_filters'] && isArray(v['update_filters'])))
  );
}