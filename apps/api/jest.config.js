/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  preset: 'ts-jest',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    // isolatedModules: true -> per-file transpile only (no program-wide type
    // check), which avoids a TS6059 "not under rootDir" diagnostic when a
    // spec transitively imports packages/shared/src/*.ts (outside apps/api's
    // rootDir: "./src"). Type errors are still caught by `pnpm typecheck`.
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@kartwerkz/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
};
