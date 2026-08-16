import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: 'manifest.json',
        rollupOptions: {
            input: {
                'resources/css/app': resolve(__dirname, 'resources/css/app.css'),
                'resources/js/app': resolve(__dirname, 'resources/js/app.js'),
            },
        },
    },
    plugins: [tailwindcss()],
});
