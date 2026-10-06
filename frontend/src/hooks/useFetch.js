import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

// GET helper: returns { data, pagination, extra, loading, error, reload }.
// `data` is the response's `data` field; the full body is in `body`.
export default function useFetch(url, params = {}, enabled = true) {
  const [state, setState] = useState({ body: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const key = JSON.stringify(clean);

  useEffect(() => {
    if (!enabled || !url) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url, { params: JSON.parse(key) })
      .then((r) => !cancelled && setState({ body: r.data, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ body: null, loading: false, error: errMsg(e) }));
    return () => { cancelled = true; };
  }, [url, key, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const { body } = state;
  return {
    data: body ? body.data : null,
    pagination: body?.pagination,
    body,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
