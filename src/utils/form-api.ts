/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAxiosInstance } from "./axios-client";

export function getFormData(
  table: string,
  guid: string,
  controller: AbortController
): Promise<any> {
  const axios = getAxiosInstance();
  return axios.get(
    `/api/bskyb/react_form/fd/${table}/${guid}`,
    {
      signal: controller.signal,
      validateStatus: (status) => status >= 200 && status < 300,
    }
  );
}