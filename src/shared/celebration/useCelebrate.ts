import { useAppDispatch } from '@/store/hooks';

import { celebrate } from './celebrationSlice';

/** Only for real achievements: a finished download, a sent document, a completed profile. */
export function useCelebrate() {
  const dispatch = useAppDispatch();
  return (label: string) => dispatch(celebrate(label));
}
