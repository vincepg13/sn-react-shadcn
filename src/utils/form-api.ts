/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAxiosInstance } from "./axios-client";
import { SnFieldsSchema } from '@kit/types/form-schema';

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

export function postFormAction(table: string, recordID: string, action: string, data: SnFieldsSchema) {
  const axios = getAxiosInstance();
  return axios.post(
    `/api/now/sp/uiaction/${action}`, {
      table, recordID, data 
    }
  )
}