// Script para inyectar variables de entorno en el HTML después del build
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../dist/index.html');
const env = {
  VITE_GOOGLE_AI_API_KEY: process.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyCNtMrkX8I2x-5taJn_j9JF3Ax_p9kPYFc',
  NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log('📝 Inyectando variables de entorno en el HTML...');
console.log('🔑 Google AI API Key configurada:', env.VITE_GOOGLE_AI_API_KEY ? 'Sí' : 'No');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Crear script con las variables de entorno
  const envScript = `
    <script>
      window.__APP_ENV__ = ${JSON.stringify(env)};
      console.log('🚀 Aplicación de Control de Flota cargada');
      console.log('🔧 Entorno:', '${env.NODE_ENV}');
      console.log('🔑 Google AI:', '${env.VITE_GOOGLE_AI_API_KEY ? 'Configurada' : 'No configurada'}');
    </script>
  `;
  
  // Inyectar después del opening head tag
  html = html.replace('</head>', envScript + '</head>');
  
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ HTML actualizado exitosamente');
} else {
  console.error('❌ No se encontró el archivo HTML en:', htmlPath);
}
