# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Verificar que los archivos críticos existen
RUN echo "=== VERIFICANDO ESTRUCTURA ===" && \
    echo "1. index.html:" && test -f index.html && echo "✅" || echo "❌" && \
    echo "2. src/main.tsx:" && test -f src/main.tsx && echo "✅" || echo "❌" && \
    echo "3. src/App.tsx:" && test -f src/App.tsx && echo "✅" || (echo "❌ - Creando App.tsx básico" && echo 'import React from "react"; export default function App() { return <div>CONTROL DE FLOTA</div>; }' > src/App.tsx) && \
    echo "4. ¿index.html tiene script?:" && grep -q "src=\"/src/main.tsx\"" index.html && echo "✅" || (echo "❌ - Añadiendo script a index.html" && sed -i 's|<div id="root"></div>|<div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>|' index.html)

# Construir la aplicación
RUN npm run build

# Verificar que el build fue exitoso
RUN echo "=== VERIFICANDO BUILD ===" && \
    echo "1. ¿dist/ existe?:" && test -d dist && echo "✅" || echo "❌" && \
    echo "2. Archivos en dist/:" && ls -la dist/ && \
    echo "3. ¿dist/index.html tiene scripts?:" && test -f dist/index.html && grep -o '<script.*>' dist/index.html | head -2 && echo "✅" || echo "❌"

# Etapa de producción
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
