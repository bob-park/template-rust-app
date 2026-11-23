import eslintConfig from '@bob-park/eslint-config-bobpark';

import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    extends: [eslintConfig],
    rules: {
      // `void promise;` is how no-floating-promises wants fire-and-forget calls marked
      'no-void': ['error', { allowAsStatement: true }],
    },
  },
]);
