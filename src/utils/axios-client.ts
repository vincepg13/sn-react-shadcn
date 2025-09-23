import axios, { AxiosInstance } from 'axios';
import type { GlideAjaxConfig } from '../types/client-scripts';

declare global {
  interface Window {
    g_ck?: string
  }
}

let glideAjaxConfig: GlideAjaxConfig = {};
let axiosInstance = axios.create({ withCredentials: true });
if (window.g_ck) {
  axiosInstance.defaults.headers["X-UserToken"] = window.g_ck;
}

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
