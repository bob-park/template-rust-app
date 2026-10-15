import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Register domain slices here:
//   import createFooSlice from '@/domain/foo/store/slice';
//   immer((...a) => ({ ...createFooSlice(...a) }))
//   export type BoundState = FooState;
export const useStore = create<BoundState>()(
  devtools(
    immer(() => ({})),
    { name: 'app', enabled: import.meta.env.DEV },
  ),
);

export type BoundState = object;
