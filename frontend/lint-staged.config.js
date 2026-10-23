module.exports = {
  // Check Typescript files
  '**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Windows-safe way to run Type Check on the WHOLE project
    // (We use a function to ignore the specific filenames passed by lint-staged)
    () => 'tsc --noEmit', 
  ],
  // Check other files
  '**/*.{js,jsx,json,md}': [
    'prettier --write'
  ]
};