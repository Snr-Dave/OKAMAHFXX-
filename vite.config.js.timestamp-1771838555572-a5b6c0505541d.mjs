// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  // Ensure proper base path for deployment
  base: "./",
  // Build configuration
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
        signup: "signup.html",
        dashboard: "dashboard.html",
        certificate: "certificate.html",
        invest: "invest.html"
      },
      output: {
        manualChunks: {
          vendor: ["chart.js"],
          auth: ["@supabase/supabase-js"],
          payment: ["@stripe/stripe-js"]
        },
        // Ensure consistent naming for assets
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  // Development server configuration
  server: {
    port: 3e3,
    open: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAvLyBFbnN1cmUgcHJvcGVyIGJhc2UgcGF0aCBmb3IgZGVwbG95bWVudFxuICBiYXNlOiAnLi8nLFxuICBcbiAgLy8gQnVpbGQgY29uZmlndXJhdGlvblxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIG1haW46ICdpbmRleC5odG1sJyxcbiAgICAgICAgbG9naW46ICdsb2dpbi5odG1sJyxcbiAgICAgICAgc2lnbnVwOiAnc2lnbnVwLmh0bWwnLFxuICAgICAgICBkYXNoYm9hcmQ6ICdkYXNoYm9hcmQuaHRtbCcsXG4gICAgICAgIGNlcnRpZmljYXRlOiAnY2VydGlmaWNhdGUuaHRtbCcsXG4gICAgICAgIGludmVzdDogJ2ludmVzdC5odG1sJ1xuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsnY2hhcnQuanMnXSxcbiAgICAgICAgICBhdXRoOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgIHBheW1lbnQ6IFsnQHN0cmlwZS9zdHJpcGUtanMnXVxuICAgICAgICB9LFxuICAgICAgICAvLyBFbnN1cmUgY29uc2lzdGVudCBuYW1pbmcgZm9yIGFzc2V0c1xuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBcbiAgLy8gRGV2ZWxvcG1lbnQgc2VydmVyIGNvbmZpZ3VyYXRpb25cbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBvcGVuOiB0cnVlXG4gIH0sXG4gIFxuICAvLyBQcmV2aWV3IHNlcnZlciBjb25maWd1cmF0aW9uXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA0MTczLFxuICAgIG9wZW46IHRydWVcbiAgfSxcbiAgXG4gIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICBkZWZpbmU6IHtcbiAgICBfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24pXG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUV0UCxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRTFCLE1BQU07QUFBQTtBQUFBLEVBR04sT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsV0FBVztBQUFBLFFBQ1gsYUFBYTtBQUFBLFFBQ2IsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxVQUFVO0FBQUEsVUFDbkIsTUFBTSxDQUFDLHVCQUF1QjtBQUFBLFVBQzlCLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxRQUMvQjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLGlCQUFpQixLQUFLLFVBQVUsUUFBUSxJQUFJLG1CQUFtQjtBQUFBLEVBQ2pFO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
