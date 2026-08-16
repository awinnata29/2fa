import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                home: resolve(__dirname, 'index.html'),
                checkUid: resolve(__dirname, 'check-live-uid-facebook/index.html'),
            },
        },
    },
    plugins: [
        tailwindcss(),
    ],
});
