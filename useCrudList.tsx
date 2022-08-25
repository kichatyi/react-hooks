import { useState, useEffect, useCallback } from "react";
import API from '../api/axios';
import _ from 'lodash';

interface UseCrudListParams<T> {
  data?: T,
  endpointBase?: string;
  endpointFetch?: string;
  prefetch?: boolean;
  onFetch?: Function;
  onUpdate?: Function;
}

export function useCrudList<T = undefined>(params: UseCrudListParams<T>) {
  const [data, setData] = useState(params.data);
  const [errorsFetch, setErrorsFetch] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleSetData= (newData?: T) => {
    // set new item only if value !== newItem
    if (!_.isEqual(newData, data)) {
      setData(_.cloneDeep(newData));
    }

    // call onUpdatedItem only of newItem !== item 
    if (!_.isEqual(newData, params.data)) {
      params.onUpdate?.(_.cloneDeep(newData));
    }
  }

  const onFetch = params.onFetch ?? (async (queryParams: any) => {
    setErrorsFetch([]);
    setIsFetching(true);

    try {
      const endpoint = params.endpointFetch ?? `${params.endpointBase}`;
      const resp = await API.get<T>(endpoint, { params: queryParams });
      handleSetData(resp.data);
    } catch(e: any) {
      handleSetData();
      setErrorsFetch([e.response?.data?.message ?? 'There is an error']);
    }

    setIsFetching(false);
  });


  const onFetchDebounced = useCallback(
    _.debounce((queryParams: any) => onFetch(queryParams), 500),
    [],
  );

  useEffect(() => {
    handleSetData(data);
  }, [data]);

  useEffect(() => {
    if (params.prefetch) {
      onFetch();
    }
  }, []);

  return {
    data,
    errorsFetch,
    isFetching,
    onFetch,
    onFetchDebounced,
  }
}
