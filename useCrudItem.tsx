import { useState, useMemo, useEffect } from "react";
import API from '../api/axios';
import _ from 'lodash';
import { AxiosError } from "axios";

interface UseCrudItemParams<T> {
  pk?: number | string,
  item?: T,
  endpointBase?: string;
  endpointFetch?: string;
  endpointPatch?: string;
  endpointPost?: string;
  prefetch?: boolean;
  onFetch?: Function;
  onPatch?: Function;
  onPost?: Function;
  onSubmit?: Function;
  onUpdate?: Function;
  onSubmitted?: (item: T) => any;
  onSubmitError?: (e: AxiosError) => any;
  onFetchError?: (e: AxiosError) => any;
}

export function useCrudItem<T>(params: UseCrudItemParams<T>) {
  const [item, setItem] = useState(params.item);
  const [errorsFetch, setErrorsFetch] = useState<string[]>([]);
  const [errorsSubmit, setErrorsSubmit] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const isCreated = useMemo(() => !!params.pk, [params.pk]);
  const errors = useMemo(() => [...errorsFetch, ...errorsSubmit], [errorsFetch, errorsSubmit]);

  const handleSetItem = (newItem?: T) => {
    // set new item only if value !== newItem
    if (!_.isEqual(newItem, item)) {
      setItem(_.cloneDeep(newItem));
    }

    // call onUpdate only of newItem !== item 
    if (!_.isEqual(newItem, params.item)) {
      params.onUpdate?.(_.cloneDeep(newItem));
    }
  }

  const onFetch = params.onFetch ?? (async () => {
    setErrorsFetch([]);
    setIsFetching(true);

    try {
      if (isCreated) {
        const endpoint = params.endpointFetch ?? `${params.endpointBase}/${params.pk}`;
        const resp = await API.get<T>(endpoint);
        handleSetItem(resp.data);
      }
    } catch(e: any) {
      params.onFetchError?.(e);
      setErrorsFetch([e.response?.data?.message ?? 'There is an error']);
    }

    setIsFetching(false);
  });

  const onPatch = params.onPatch ?? (async (values: any) => {
    setErrorsSubmit([]);
    const endpoint = params.endpointPatch ?? `${params.endpointBase}/${params.pk}`;
    try {
      const resp = await API.patch<T>(endpoint, values);
      handleSetItem(resp.data);
      params.onSubmitted?.(resp.data);
    } catch(e: any) {
      params.onSubmitError?.(e);
      setErrorsSubmit([e.response?.data?.message ?? 'There is an error']);
    }
  });

  const onPost = params.onPost ?? (async (values: any) => {
    setErrorsSubmit([]);
    const endpoint = params.endpointPost?? `${params.endpointBase}`;
    try {
      const resp = await API.post<T>(endpoint, values);
      handleSetItem(resp.data);
      params.onSubmitted?.(resp.data);
    } catch(e: any) {
      params.onSubmitError?.(e);
      setErrorsSubmit([e.response?.data?.message ?? 'There is an error']);
    }
  });

  const onSubmit = params.onSubmit ?? (async (values: any) => {
    if (isCreated) {
      await onPatch(values);
    } else {
      await onPost(values);
    }
  });

  useEffect(() => {
    handleSetItem?.(params.item);
  }, [params.item])

  useEffect(() => {
    if (params.prefetch ?? true) {
      onFetch();
    }
  }, [params.pk]);

  return {
    item,
    errors,
    errorsFetch,
    errorsSubmit,
    isCreated,
    isFetching,
    onFetch,
    onSubmit,
    onPatch,
    onPost,
  }
}
