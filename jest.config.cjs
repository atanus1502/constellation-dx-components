const packagesToTranspile = [
  '@pega/cosmos-react-condition-builder',
  '@pega/cosmos-react-core',
  '@pega/cosmos-react-social',
  '@pega/cosmos-react-rte',
  '@pega/cosmos-react-work',
  'shortcuts',
  'preact'
];
const packagesToTranspileStr = packagesToTranspile.map(p => `${p}`).join('|');

module.exports = {
  verbose: true,
  // preset: 'ts-jest/presets/default-esm',
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)?$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapper: {
    shortcuts: '<rootDir>/node_modules/shortcuts/dist/index.js'
  },
  moduleDirectories: ['node_modules', 'src'],
  collectCoverage: true,
  testPathIgnorePatterns: ['./dist', '<rootDir>/constellation-ui-gallery/'],
  transformIgnorePatterns: [],
  modulePathIgnorePatterns: ['<rootDir>/constellation-ui-gallery/'],
  coveragePathIgnorePatterns: [],
  setupFiles: ['./jest.polyfills.ts', './setupFiles.ts'],
  setupFilesAfterEnv: ['./setupTests.ts'],
  collectCoverageFrom: [
    './node_modules/@pega/custom-dx-components/src/*.js',
    '!**/*.(test|stories).{ts,tsx,js,jsx}'
  ],
  coverageThreshold: {
    global: {
      statements: 79,
      branches: 74,
      functions: 81,
      lines: 80
    }
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [`node_modules/(?!(${packagesToTranspileStr}))`]
};
