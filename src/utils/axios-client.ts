import axios, { AxiosStatic } from 'axios';

let axiosInstance = axios;

export function setAxiosInstance(instance: AxiosStatic) {
  axiosInstance = instance;
}

export function getAxiosInstance() {
  return axiosInstance;
}