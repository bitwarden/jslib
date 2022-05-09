const { pathsToModuleNameMapper } = require("ts-jest");

const { compilerOptions } = require("./tsconfig");

module.exports = {
  name: "angular",
  displayName: "angular tests",
  preset: "jest-preset-angular",
  testMatch: ["**/+(*.)+(spec).+(ts)"],
  collectCoverage: true,
  coverageReporters: ["html", "lcov"],
  coverageDirectory: "coverage",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions?.paths || {}, {
    prefix: "<rootDir>/",
  }),
};
