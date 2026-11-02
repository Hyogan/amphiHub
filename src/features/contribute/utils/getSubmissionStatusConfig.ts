import type { Ionicons } from "@expo/vector-icons";
import type { TFunction } from "i18next";
import type { ComponentProps } from "react";

import type { Colors } from "@/theme/colors";

import type { SubmissionStatus } from "../types/submission";

/** Label, colours and icon for a status. The icon and the text always come together, never colour alone. */
export function getSubmissionStatusConfig(
  status: SubmissionStatus,
  colors: Colors,
  t: TFunction,
) {
  const map: Record<
    SubmissionStatus,
    {
      color: string;
      background: string;
      icon: ComponentProps<typeof Ionicons>["name"];
    }
  > = {
    submitted: {
      color: colors.status.warning,
      background: colors.status.warningSoft,
      icon: "time-outline",
    },
    in_review: {
      color: colors.status.info,
      background: colors.status.infoSoft,
      icon: "eye-outline",
    },
    published: {
      color: colors.status.success,
      background: colors.status.successSoft,
      icon: "checkmark-circle",
    },
    rejected: {
      color: colors.status.error,
      background: colors.status.errorSoft,
      icon: "close-circle",
    },
    restricted: {
      color: colors.status.warning,
      background: colors.status.warningSoft,
      icon: "lock-closed",
    },
    removed: {
      color: colors.status.neutral,
      background: colors.status.neutralSoft,
      icon: "remove-circle",
    },
  };
  return { label: t(`contributions.status.${status}`), ...map[status] };
}
