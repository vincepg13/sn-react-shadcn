import axios, { AxiosInstance } from 'axios';
import type { GlideAjaxConfig } from '../types/client-scripts';

let axiosInstance: AxiosInstance = axios;
let glideAjaxConfig: GlideAjaxConfig = {};

export function setAxiosInstance(instance: AxiosInstance, options?: { glideAjax?: GlideAjaxConfig }) {
  axiosInstance = instance;
  if (options?.glideAjax) {
    glideAjaxConfig = { ...glideAjaxConfig, ...options.glideAjax };
  }
}

export function getAxiosInstance() {
  return axiosInstance;
}

export function getGlideAjaxConfig(): GlideAjaxConfig {
  return glideAjaxConfig;
}
