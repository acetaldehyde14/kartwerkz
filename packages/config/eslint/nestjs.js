import { baseConfig } from './base.js';

export const nestjsConfig = [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // NestJS's constructor-injection relies on emitDecoratorMetadata reading
      // the REAL (value) import of a dependency's class at runtime. Auto-fixing
      // these to `import type` type-checks fine but silently breaks DI
      // ("Nest can't resolve dependencies... argument Function at index [0]")
      // since the type-only import erases the value needed for reflection.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

export default nestjsConfig;
