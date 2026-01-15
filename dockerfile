# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build
RUN npm run build

# VERIFICAR que se generaron los archivos
RUN echo "=== ARCHIVOS GENERADOS ===" && \
    ls -la dist/ && \
    echo "=== ARCHIVOS JS EN assets ===" && \
    ls -la dist/assets/*.js

# REEMPLAZAR COMPLETAMENTE el index.html con uno MANUAL
RUN cat > /app/dist/index.html << 'EOF'
<!DOCTYPE html>
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
    
    <!-- CSS generado por Vite -->
    <link rel="stylesheet" href="/assets/index.DtXlcSpb.css">
    
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
    
    <!-- JS principal generado por Vite -->
    <script type="module" crossorigin src="/assets/index.nzfWp_A0.js"></script>
</body>
</html>
EOF

# Verificar que se creó correctamente
RUN echo "=== VERIFICANDO NUEVO index.html ===" && \
    echo "Tamaño:" && du -h /app/dist/index.html && \
    echo "Scripts encontrados:" && grep -o '<script.*>' /app/dist/index.html

# Etapa de producción
FROM nginx:alpine

# Copiar configuración SIMPLE de nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Verificar copia
RUN echo "=== ARCHIVOS EN NGINX ===" && \
    ls -la /usr/share/nginx/html/ && \
    ls -la /usr/share/nginx/html/assets/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
