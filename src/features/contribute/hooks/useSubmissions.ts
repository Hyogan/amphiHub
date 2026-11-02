import { useQuery } from "@tanstack/react-query";

import { contributionApi } from "@/services/api/contributionApi";
import { useAppSelector } from "@/store/hooks";

import { toSubmission } from "../types/submission";
import { submissionKeys } from "./useContribute";

export function useMySubmissionsQuery() {
  const userId = useAppSelector((state) => state.session.userId);
  return useQuery({
    queryKey: [...submissionKeys.all, "mine", userId ?? ""],
    queryFn: async () => (await contributionApi.listMine()).map(toSubmission),
    enabled: Boolean(userId),
  });
}

// export function useMySubmissionsQuery() {
//   const userId = useAppSelector((state) => state.session.userId);

//   return useQuery({
//     queryKey: [...submissionKeys.all, "mine", userId ?? ""],
//     queryFn: async () => {
//       try {
//         const result = await contributionApi.listMine();
//         return result.map(toSubmission);
//       } catch (error) {
//         console.error("[useMySubmissionsQuery] Error:", error);
//         throw error; // Important: let React Query know the query failed
//       }
//     },
//     enabled: Boolean(userId),
//   });
// }
