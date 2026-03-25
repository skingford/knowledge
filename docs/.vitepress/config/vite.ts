import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'

const docsViteConfig: UserConfig = {
  optimizeDeps: {
    include: [
      '@braintree/sanitize-url',
      'cytoscape',
      'cytoscape-cose-bilkent',
      'dayjs',
      'debug',
    ],
  },
  resolve: {
    alias: {
      '@docs-components': fileURLToPath(new URL('../theme/components', import.meta.url)),
      '@docs-content': fileURLToPath(new URL('../theme/content-data.ts', import.meta.url)),
      '@docs-vocabulary': fileURLToPath(new URL('../theme/vocabulary.ts', import.meta.url)),
      'cytoscape/dist/cytoscape.umd.js': 'cytoscape/dist/cytoscape.esm.js',
      'dayjs/plugin/advancedFormat.js': 'dayjs/esm/plugin/advancedFormat',
      'dayjs/plugin/customParseFormat.js': 'dayjs/esm/plugin/customParseFormat',
      'dayjs/plugin/isoWeek.js': 'dayjs/esm/plugin/isoWeek',
    },
  },
}

export default docsViteConfig
