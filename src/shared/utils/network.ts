/** True while a query is waiting for a connection and has nothing to show yet. */
export function isOfflinePending(query: {
  isPending: boolean;
  fetchStatus: string;
}): boolean {
  return query.isPending && query.fetchStatus === "paused";
}
