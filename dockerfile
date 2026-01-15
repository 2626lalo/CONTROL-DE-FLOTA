# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Verificar estructura
RUN echo "=== VERIFICANDO ESTRUCTURA ===" && \
    test -f index.html && echo "✅ index.html" || echo "❌ index.html" && \
    test -f src/main.tsx && echo "✅ main.tsx" || echo "❌ main.tsx" && \
    test -f src/App.tsx && echo "✅ App.tsx" || echo "❌ App.tsx"

# Build
RUN npm run build

# === INYECTAR SCRIPTS MANUALMENTE (SOLUCIÓN DEFINITIVA) ===
RUN echo "=== BUSCANDO ARCHIVOS GENERADOS ===" && \
    JS_FILE=$(find /app/dist/assets -name "index.*.js" ! -name "*.map" | head -1) && \
    CSS_FILE=$(find /app/dist/assets -name "index.*.css" ! -name "*.map" | head -1) && \
    echo "Archivo JS: $JS_FILE" && \
    echo "Archivo CSS: $CSS_FILE" && \
    JS_BASENAME=$(basename "$JS_FILE") && \
    CSS_BASENAME=$(basename "$CSS_FILE") && \
    echo "JS basename: $JS_BASENAME" && \
    echo "CSS basename: $CSS_BASENAME"

# Crear nuevo index.html con todo inyectado
RUN JS_FILE=$(find /app/dist/assets -name "index.*.js" ! -name "*.map" | head -1) && \
    CSS_FILE=$(find /app/dist/assets -name "index.*.css" ! -name "*.map" | head -1) && \
    JS_BASENAME=$(basename "$JS_FILE") && \
    CSS_BASENAME=$(basename "$CSS_FILE") && \
    cat > /app/dist/index.html << EOF
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONTROL DE FLOTA</title>
    
    <!-- Polyfill CRÍTICO para toSorted() -->
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
    <link rel="stylesheet" href="/assets/${CSS_BASENAME}">
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
    <script type="module" crossorigin src="/assets/${JS_BASENAME}"></script>
</body>
</html>
EOF

# Verificar resultado
RUN echo "=== VERIFICANDO RESULTADO ===" && \
    echo "=== CONTENIDO DE index.html (scripts) ===" && \
    grep -o '<script.*>' /app/dist/index.html && \
    echo "=== ¿TIENE LINK CSS? ===" && \
    grep -o '<link.*\.css.*>' /app/dist/index.html && \
    echo "=== TAMAÑO DEL ARCHIVO ===" && \
    wc -l /app/dist/index.html

# Etapa de producción
FROM nginx:alpine

# Configuración simple de nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
