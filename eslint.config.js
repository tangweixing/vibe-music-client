import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueEslintParser from 'vue-eslint-parser'
import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: vueEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
  },
  pluginJs.configs.recommended,
  ...compat.extends('./src/auto-import/eslintrc-auto-import.json'),
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    rules: {
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['index'],
        },
      ],
      '@typescript-eslint/no-explicit-any': ['off'],
    },
  },
  {
    ignores: [
      'README.md',
      '**/dist',
      './src/main.ts',
      '.vscode',
      '.idea',
      '*.sh',
      '**/node_modules',
      '*.md',
      '*.woff',
      '*.woff2',
      '*.ttf',
      'yarn.lock',
      'package-lock.json',
      '/public',
      '/docs',
      '**/output',
      '.husky',
      '.local',
      '/bin',
      'Dockerfile',
    ],
  },
]