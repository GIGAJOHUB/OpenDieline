module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["react-hooks", "react-refresh"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
  }
};
