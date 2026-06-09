import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

/**
 * 性能优化插件：
 * 1. 移除 Vite 自动注入的 echarts modulepreload（echarts 应该按需懒加载）
 * 2. 添加 DNS 预解析和资源提示
 */
function performanceOptimizePlugin(): Plugin {
  return {
    name: 'performance-optimize',
    enforce: 'post',
    transformIndexHtml(html) {
      // 1. 移除 echarts 和 icons 的 modulepreload（它们应该按需加载，而非首屏阻塞）
      let optimized = html.replace(/<link rel="modulepreload"[^>]*echarts[^>]*>\n?/g, '');
      optimized = optimized.replace(/<link rel="modulepreload"[^>]*icons[^>]*>\n?/g, '');
      
      // 2. 在 <title> 后添加性能优化元标签
      optimized = optimized.replace(
        '<title>宏观经济数据平台</title>',
        `<title>宏观经济数据平台</title>
    <!-- 性能优化：DNS 预解析 -->
    <link rel="dns-prefetch" href="//dntwfhmuqvd6i.ok.kimi.link">`
      );
      
      return optimized;
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    inspectAttr(),
    react(),
    performanceOptimizePlugin(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 禁用 sourcemap，减少输出体积
    sourcemap: false,
    // 使用 esbuild 压缩（比 terser 更快，体积差异很小）
    minify: 'esbuild',
    // 关键：禁用自动 module preload，避免 Vite 自动预加载 echarts
    // 我们只在 HTML 中手动预加载关键资源
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        // 优化 chunk 分割策略
        // 关键原则：避免 chunk 间交叉依赖，确保加载顺序正确
        manualChunks(id) {
          // 只拆分 echarts（最大的库）→ 按需加载
          if (id.includes('node_modules/echarts')) {
            return 'echarts';
          }
          // 其他所有 node_modules → vendor（避免交叉依赖）
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 添加 content hash 用于长期缓存
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (info.endsWith('.css')) return 'assets/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // 代码分割阈值
    chunkSizeWarningLimit: 500,
    // 清空输出目录
    emptyOutDir: true,
  },
});
