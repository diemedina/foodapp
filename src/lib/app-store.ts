"use client";

import { create } from "zustand";
import type { AppData } from "./app-data";

type Patch = (data: AppData) => AppData;

export const useAppStore = create<{ data: AppData | null; error: boolean }>(() => ({
  data: null,
  error: false,
}));

let confirmed: AppData | null = null;
let pending: Patch[] = [];
let writes = Promise.resolve();
let revision = 0;
let lastSync = 0;
let loading: { revision: number; request: Promise<void> } | undefined;

function publish() {
  useAppStore.setState({ data: confirmed ? pending.reduce((data, patch) => patch(data), confirmed) : null });
}

export function syncAppData(force = false) {
  if (loading?.revision === revision) return loading.request;
  if (!force && Date.now() - lastSync < 60_000) return Promise.resolve();

  const requestedRevision = revision;
  const request = (async () => {
    try {
      const response = await fetch("/api/app-data", { cache: "no-store", redirect: "error" });
      if (!response.ok) throw new Error("No se pudieron cargar los datos.");
      const data: AppData = await response.json();
      if (requestedRevision !== revision) return;
      confirmed = data;
      lastSync = Date.now();
      useAppStore.setState({ error: false });
      publish();
    } catch {
      if (requestedRevision === revision) {
        lastSync = 0;
        useAppStore.setState({ error: true });
      }
    } finally {
      if (loading?.revision === requestedRevision) loading = undefined;
    }
  })();
  loading = { revision: requestedRevision, request };
  return request;
}

export function writeAppData<Result>(
  save: () => Promise<Result>,
  patch?: Patch,
  commit?: (data: AppData, result: Result) => AppData,
): Promise<Result> {
  if (patch) {
    pending.push(patch);
    publish();
  }

  const write = writes.then(async () => {
    let result: Result;
    try {
      result = await save();
    } catch (error) {
      revision++;
      pending = pending.filter((entry) => entry !== patch);
      publish();
      // El servidor pudo haber guardado antes de que se cortara la conexión.
      void syncAppData(true);
      throw error;
    }

    revision++;
    pending = pending.filter((entry) => entry !== patch);
    const apply = commit ?? patch;
    if (confirmed && apply) {
      confirmed = apply(confirmed, result);
      publish();
    } else {
      await syncAppData(true);
    }
    return result;
  });
  writes = write.then(() => undefined, () => undefined);
  return write;
}
