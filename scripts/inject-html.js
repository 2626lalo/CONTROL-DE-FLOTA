// Script para inyectar variables de entorno en el HTML después del build
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const htmlPath = join(__dirname, '../dist/index.html');

// Para Cloud Run, usa las variables de entorno de Cloud Build
const env = {
  VITE_GOOGLE_AI_API_KEY: process.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc',
  NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log('📝 Inyectando variables de entorno en el HTML...');
console.log('🔑 Google AI API Key configurada:', env.VITE_GOOGLE_AI_API_KEY ? 'Sí' : 'No');
console.log('🔧 Entorno:', env.NODE_ENV);

if (existsSync(htmlPath)) {
  let html = readFileSync(htmlPath, 'utf8');
  
  // Crear script con las variables de entorno
  const envScript = `
    <script>
      // Variables de entorno inyectadas durante el build
      window.__APP_ENV__ = ${JSON.stringify(env)};
      console.log('🚀 Aplicación de Control de Flota cargada');
      console.log('🔧 Entorno:', '${env.NODE_ENV}');
      console.log('🔑 Google AI:', '${env.VITE_GOOGLE_AI_API_KEY ? 'Configurada' : 'No configurada'}');
    </script>
  `;
  
  // Inyectar antes de cerrar el head tag
  html = html.replace('</head>', envScript + '\n</head>');
  
  writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ HTML actualizado exitosamente');
} else {
  console.error('❌ No se encontró el archivo HTML en:', htmlPath);
}
