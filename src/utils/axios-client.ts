import axios from 'axios';

let axiosInstance = axios;

export function setAxiosInstance(instance: any) {
  axiosInstance = instance;
}

export function getAxiosInstance() {
  return axiosInstance;
}