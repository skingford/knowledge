import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'

const docsViteConfig: UserConfig = {
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    // Local search index is emitted as a lazy-loaded chunk and is expected to be larger than
    // regular route assets for this knowledge base.
    chunkSizeWarningLimit: 5000,
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        compact: true,
        generatedCode: 'es2015',
        manualChunks(id) {
          if (id.includes('node_modules') && (id.includes('/vue/') || id.includes('/@vue/'))) {
            return 'framework'
          }
          // Group diagram components by domain subdirectory for better parallelism and caching
          if (id.includes('/theme/components/')) {
            if (id.includes('/components/go/')) return 'diagrams-go'
            if (id.includes('/components/hc/')) return 'diagrams-hc'
            if (id.includes('/components/mysql/')) return 'diagrams-mysql'
            if (id.includes('/components/emqx/')) return 'diagrams-emqx'
            if (id.includes('/components/k8s/') || id.includes('/components/kafka/') || id.includes('/components/infra/') || id.includes('/components/redis/') || id.includes('/components/postgresql/')) return 'diagrams-infra'
          }
        },
      },
    },
  },
  css: {
    transformer: 'lightningcss',
  },
  server: {
    warmup: {
      clientFiles: [
        './docs/.vitepress/theme/index.ts',
        './docs/.vitepress/theme/components/layout/QuickNav.vue',
        './docs/.vitepress/theme/components/layout/ClaudeHome.vue',
        './docs/.vitepress/theme/components/layout/SectionLanding.vue',
        './docs/index.md',
      ],
    },
  },
  optimizeDeps: {
    include: [],
  },
  resolve: {
    alias: {
      '@docs-components': fileURLToPath(new URL('../theme/components', import.meta.url)),
      '@docs-content': fileURLToPath(new URL('../theme/content-data.ts', import.meta.url)),
      '@docs-vocabulary': fileURLToPath(new URL('../theme/vocabulary.ts', import.meta.url)),
      'dayjs/plugin/advancedFormat.js': 'dayjs/esm/plugin/advancedFormat',
      'dayjs/plugin/customParseFormat.js': 'dayjs/esm/plugin/customParseFormat',
      'dayjs/plugin/isoWeek.js': 'dayjs/esm/plugin/isoWeek',
    },
  },
}

export default docsViteConfig
