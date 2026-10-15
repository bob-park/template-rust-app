import type { ErrorState } from '@/shared/store/error/error.state';
import createErrorSlice from '@/shared/store/error/slice';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Register slices here: spread `createXxxSlice(...a)` and add `XxxState` to BoundState.
export const useStore = create<BoundState>()(
  devtools(
    immer((...a) => ({
      ...createErrorSlice(...a),
    })),
    { name: 'app', enabled: import.meta.env.DEV },
  ),
);

export type BoundState = ErrorState;
