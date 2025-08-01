/*import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // your current HTML/JS files are (default is project root)
  build: {
    outDir: '../build',  // output folder for production build (relative to root)
    emptyOutDir: true,
  },
  plugins: []
});*/

// This configuration sets up Vite to build the project with multiple entry points.
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Set the base path for the project
  root: 'src', // Set the root directory for the project
  build: {
    emptyOutDir: true,
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        flexion: resolve(__dirname, 'src/pages/flexion.html'),
        adduction: resolve(__dirname, 'src/pages/adduction.html'),
        abduction: resolve(__dirname, 'src/pages/abduction.html'),
        data_dashboard: resolve(__dirname, 'src/pages/data_dashboard.html'),
        //css: resolve(__dirname, 'src/css/style.css'),
        extension: resolve(__dirname, 'src/pages/extension.html'),
        opposition: resolve(__dirname, 'src/pages/opposition.html'),
      }
    }
  },
  
});
