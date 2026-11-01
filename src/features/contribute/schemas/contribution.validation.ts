import type { TFunction } from "i18next";
import { z } from "zod";

import { SOURCE_TYPES } from "../types/contribution";

export function createContributionSchema(t: TFunction) {
  return z
    .object({
      universityId: z.string().min(1, t("contribute.errors.university")),
      courseId: z.string().min(1, t("contribute.errors.course")),
      typeCode: z.string().min(1, t("contribute.errors.type")),
      yearChoice: z.string().min(1, t("contribute.errors.year")),
      examSession: z.string(),
      language: z.string(),
      sourceType: z.enum(SOURCE_TYPES),
      sourceNote: z.string().max(1000),
      title: z
        .string()
        .trim()
        .min(3, t("contribute.errors.title"))
        .max(200, t("contribute.errors.title")),
      rightsDeclared: z
        .boolean()
        .refine((value) => value, { message: t("contribute.errors.rights") }),
    })
    .superRefine((values, ctx) => {
      if (
        values.sourceType !== "community_upload" &&
        values.sourceNote.trim().length < 3
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["sourceNote"],
          message: t("contribute.errors.sourceNote"),
        });
      }
    });
}

export type ContributionValues = z.infer<
  ReturnType<typeof createContributionSchema>
>;
