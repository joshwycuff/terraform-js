module.exports = {
  collectCoverage: true,
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['.ignore'],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
