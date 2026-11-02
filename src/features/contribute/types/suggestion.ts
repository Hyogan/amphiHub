export interface CourseSuggestionInput {
  universityId: string;
  name: string;
  code: string;
}

export interface RawSuggestionInsert {
  user_id: string;
  university_id: string;
  kind: "course";
  payload: { name: string; code: string | null };
}

/** Status is not sent: the database default is 'pending', and the insert rule requires it. */
export function toRawSuggestionInsert(
  input: CourseSuggestionInput,
  userId: string,
): RawSuggestionInsert {
  return {
    user_id: userId,
    university_id: input.universityId,
    kind: "course",
    payload: {
      name: input.name.trim().slice(0, 200),
      code: input.code.trim().slice(0, 40) || null,
    },
  };
}
