import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Inyectando scripts en index.html...');

const distPath = path.join(__dirname, '../dist');
const assetsPath = path.join(distPath, 'assets');

// Verificar que existe la carpeta dist
if (!fs.existsSync(distPath)) {
  console.error('❌ No existe la carpeta dist');
  process.exit(1);
}

// Buscar archivos generados por Vite
let jsFiles = [];
let cssFiles = [];

// Buscar en assets si existe
if (fs.existsSync(assetsPath)) {
  const allFiles = fs.readdirSync(assetsPath);
  jsFiles = allFiles.filter(f => 
    f.endsWith('.js') && !f.includes('.map')
  );
  cssFiles = allFiles.filter(f => 
    f.endsWith('.css')
  );
} else {
  // Buscar directamente en dist
  const allFiles = fs.readdirSync(distPath);
  jsFiles = allFiles.filter(f => 
    f.endsWith('.js') && !f.includes('.map')
  );
  cssFiles = allFiles.filter(f => 
    f.endsWith('.css')
  );
}

console.log('📁 Archivos encontrados:');
console.log('  JS:', jsFiles);
console.log('  CSS:', cssFiles);

if (jsFiles.length === 0) {
  console.error('❌ No se encontraron archivos JS generados por Vite');
  process.exit(1);
}

// BUSCAR EL ARCHIVO JS CORRECTO (el más grande o que contenga "index" sin prefijo)
let mainJsFile = null;

// Opción 1: Buscar el más grande (normalmente el bundle principal)
const jsFilesWithSize = jsFiles.map(file => {
  const filePath = path.join(assetsPath || distPath, file);
  return { file, size: fs.statSync(filePath).size };
});

jsFilesWithSize.sort((a, b) => b.size - a.size);
console.log('📊 Archivos JS ordenados por tamaño:');
jsFilesWithSize.forEach((f, i) => {
  console.log(`  ${i+1}. ${f.file} - ${(f.size / 1024).toFixed(2)} kB`);
});

// Seleccionar el más grande
mainJsFile = jsFilesWithSize[0].file;

// Buscar archivo CSS principal (el que empiece con "index" o el primero)
let mainCssFile = null;
if (cssFiles.length > 0) {
  // Buscar CSS que empiece con "index"
  const indexCss = cssFiles.find(f => f.startsWith('index-') || f.startsWith('index.'));
  mainCssFile = indexCss || cssFiles[0];
}

console.log(`📦 Archivos seleccionados:`);
console.log(`  JS: ${mainJsFile} (${(jsFilesWithSize[0].size / 1024).toFixed(2)} kB)`);
console.log(`  CSS: ${mainCssFile || 'ninguno'}`);

// Determinar rutas correctas
const jsPath = (assetsPath && fs.existsSync(assetsPath)) ? `/assets/${mainJsFile}` : `/${mainJsFile}`;
const cssPath = mainCssFile ? ((assetsPath && fs.existsSync(assetsPath)) ? `/assets/${mainCssFile}` : `/${mainCssFile}`) : '';

// Leer el HTML original para mantener polyfills
const originalHtmlPath = path.join(__dirname, '../index.html');
let originalHtml = '';
try {
  originalHtml = fs.readFileSync(originalHtmlPath, 'utf-8');
  console.log('✅ HTML original leído correctamente');
} catch (error) {
  console.error('❌ Error leyendo index.html original:', error.message);
  process.exit(1);
}

// Extraer los polyfills del original
let polyfills = '';
const polyfillMatch = originalHtml.match(/<script>[\s\S]*?Polyfills ES2023[\s\S]*?<\/script>/);
if (polyfillMatch) {
  polyfills = polyfillMatch[0];
  console.log('✅ Polyfills extraídos del original');
} else {
  // Polyfills por defecto
  polyfills = `    <script>
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
    </script>`;
  console.log('⚠️  Polyfills no encontrados, usando versión por defecto');
}

// Crear nuevo HTML
const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONTROL DE FLOTA</title>
    
    <!-- Polyfills ES2023 -->
${polyfills}
    
    <script src="https://cdn.tailwindcss.com"></script>
    ${cssPath ? `<link rel="stylesheet" href="${cssPath}">` : ''}
    
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
        
        /* Estilos de carga */
        #root {
            min-height: 100vh;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 20px; color: #3b82f6;">Cargando CONTROL DE FLOTA...</div>
                <div style="width: 50px; height: 50px; border: 5px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
            </div>
        </div>
    </div>
    <script type="module" crossorigin src="${jsPath}"></script>
    
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    
    <script>
        // Script para manejar errores de carga
        window.addEventListener('error', function(e) {
            console.error('Error global:', e.error);
            document.getElementById('root').innerHTML = 
                '<div style="padding: 40px; text-align: center; color: #ef4444;">' +
                '<h2 style="font-size: 24px; margin-bottom: 20px;">❌ Error al cargar la aplicación</h2>' +
                '<p style="margin-bottom: 10px;">Detalles: ' + (e.error?.message || 'Error desconocido') + '</p>' +
                '<button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Reintentar</button>' +
                '</div>';
        });
    </script>
</body>
</html>`;

// Escribir el archivo
fs.writeFileSync(path.join(distPath, 'index.html'), html);

// Verificar resultado
const stats = fs.statSync(path.join(distPath, 'index.html'));
console.log('✅ HTML regenerado manualmente');
console.log(`📏 Tamaño del nuevo index.html: ${stats.size} bytes`);

// Mostrar preview
console.log('\n🔍 Preview del index.html generado:');
console.log('='.repeat(50));
const generatedHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
const lines = generatedHtml.split('\n');
lines.forEach((line, index) => {
  if (line.includes('<script') || line.includes('<link') || line.includes('Polyfills')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
console.log('='.repeat(50));
