module.exports = {
  root: true,
  extends: ['expo'],
  overrides: [
    {
      files: ['lib/session.ts'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
  ],
};
