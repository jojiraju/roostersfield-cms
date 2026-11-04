import { api, qs } from './api';
import { useQuery } from './query';
import type { Account, BatchSummary, Farm, Settings } from './types';

/** Shared lookups used by forms and filters (cached + refreshed after any change). */
export const useAccounts = (category?: string) =>
  useQuery<Account[]>(['accounts', category ?? ''], () => api(`/accounts${qs({ category })}`));
export const useFarms = () => useQuery<Farm[]>(['farms'], () => api('/farms'));
export const useBatches = (status?: string) =>
  useQuery<BatchSummary[]>(['batches', status ?? ''], () => api(`/batches${qs({ status })}`));
export const useSettings = () => useQuery<Settings>(['settings'], () => api('/settings'));

export const batchLabel = (b: { farm_name: string; batch_no: number }) => `${b.farm_name} #${b.batch_no}`;
