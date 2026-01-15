import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Arreglando index.html...');

const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

// Verificar que existe la carpeta dist
if (!fs.existsSync(distPath)) {
  console.error('❌ No existe la carpeta dist');
  process.exit(1);
}

// Si no existe assets, buscar archivos directamente en dist
let jsFiles, cssFiles;
if (fs.existsSync(assetsPath)) {
  jsFiles = fs.readdirSync(assetsPath).filter(f => 
    f.endsWith('.js') && f.includes('index') && !f.includes('.map')
  );
  cssFiles = fs.readdirSync(assetsPath).filter(f => 
    f.endsWith('.css') && f.includes('index')
  );
} else {
  // Buscar en dist directamente
  jsFiles = fs.readdirSync(distPath).filter(f => 
    f.endsWith('.js') && f.includes('index') && !f.includes('.map')
  );
  cssFiles = fs.readdirSync(distPath).filter(f => 
    f.endsWith('.css') && f.includes('index')
  );
}

console.log('Archivos encontrados:');
console.log('- JS:', jsFiles);
console.log('- CSS:', cssFiles);

if (jsFiles.length === 0) {
  console.error('❌ No se encontraron archivos JS generados');
  process.exit(1);
}

const jsFile = jsFiles[0];
const cssFile = cssFiles.length > 0 ? cssFiles[0] : '';

console.log(`📦 Usando: JS=${jsFile}, CSS=${cssFile}`);

// Crear HTML MANUALMENTE
let cssLink = '';
if (cssFile) {
  const cssPath = assetsPath ? `/assets/${cssFile}` : `/${cssFile}`;
  cssLink = `<link rel="stylesheet" href="${cssPath}">`;
}

const jsPath = assetsPath ? `/assets/${jsFile}` : `/${jsFile}`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONTROL DE FLOTA</title>
    
    <!-- Polyfills -->
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
        console.log('Polyfills ES2023 cargados correctamente');
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    ${cssLink}
    
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
    <script type="module" crossorigin src="${jsPath}"></script>
</body>
</html>`;

// Escribir el archivo
fs.writeFileSync(path.join(distPath, 'index.html'), html);
console.log('✅ HTML regenerado manualmente');
console.log('📏 Tamaño del nuevo index.html:', fs.statSync(path.join(distPath, 'index.html')).size, 'bytes');
