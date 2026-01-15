// scripts/inject-html.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

console.log('🔍 Buscando archivos generados...');

// Encontrar archivos JS y CSS generados
const jsFiles = fs.readdirSync(assetsPath).filter(f => 
  f.endsWith('.js') && f.startsWith('index-') && !f.includes('.map')
);
const cssFiles = fs.readdirSync(assetsPath).filter(f => 
  f.endsWith('.css') && f.startsWith('index-')
);

console.log('JS files:', jsFiles);
console.log('CSS files:', cssFiles);

if (jsFiles.length === 0 || cssFiles.length === 0) {
  console.error('❌ No se encontraron archivos JS o CSS generados');
  process.exit(1);
}

const jsFile = jsFiles[0];
const cssFile = cssFiles[0];

console.log(`📦 Usando JS: ${jsFile}, CSS: ${cssFile}`);

// Crear el HTML MANUALMENTE con los scripts correctos
const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONTROL DE FLOTA</title>
    
    <!-- Polyfills ES2023 -->
    <script>
        if (!Array.prototype.toSorted) {
            Array.prototype.toSorted = function(compareFn) {
                var arr = this.slice();
                return arr.sort(compareFn);
            };
        }
        if (!Array.prototype.toReversed) {
            Array.prototype.toReversed = function() {
                return this.slice().reverse();
            };
        }
        if (!Array.prototype.toSpliced) {
            Array.prototype.toSpliced = function(start, deleteCount, ...items) {
                var arr = this.slice();
                if (arguments.length > 1) {
                    arr.splice(start, deleteCount, ...items);
                } else {
                    arr.splice(start);
                }
                return arr;
            };
        }
        if (!Array.prototype.with) {
            Array.prototype.with = function(index, value) {
                var arr = this.slice();
                arr[index] = value;
                return arr;
            };
        }
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/assets/${cssFile}">
    
    <style>
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/${jsFile}"></script>
</body>
</html>`;

// Escribir el nuevo index.html
fs.writeFileSync(path.join(distPath, 'index.html'), html);
console.log('✅ HTML regenerado manualmente con scripts inyectados');
