dockerfile
# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Verificar estructura
RUN echo "=== VERIFICANDO ESTRUCTURA ===" && \
    echo "1. index.html:" && test -f index.html && echo "✅" || echo "❌" && \
    echo "2. src/main.tsx:" && test -f src/main.tsx && echo "✅" || echo "❌" && \
    echo "3. src/App.tsx:" && test -f src/App.tsx && echo "✅" || echo "❌"

# Build
RUN npm run build

# INYECTAR SCRIPT MANUALMENTE SI ES NECESARIO
RUN echo "=== INYECTANDO SCRIPTS MANUALMENTE ===" && \
    JS_FILE=$(find /app/dist/assets -name "index.*.js" ! -name "*.map" | head -1) && \
    CSS_FILE=$(find /app/dist/assets -name "index.*.css" ! -name "*.map" | head -1) && \
    echo "JS: $JS_FILE" && \
    echo "CSS: $CSS_FILE" && \
    JS_BASENAME=$(basename "$JS_FILE") && \
    CSS_BASENAME=$(basename "$CSS_FILE") && \
    cat > /app/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONTROL DE FLOTA</title>
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
    <link rel="stylesheet" href="/assets/'"${CSS_BASENAME}"'">
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
    <script type="module" crossorigin src="/assets/'"${JS_BASENAME}"'"></script>
</body>
</html>
EOF

# Verificar el resultado
RUN echo "=== RESULTADO FINAL ===" && \
    echo "=== SCRIPTS EN index.html ===" && \
    grep -o '<script.*>' /app/dist/index.html && \
    echo "=== ARCHIVOS EN dist/ ===" && \
    ls -la /app/dist/assets/

# Etapa de producción
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
