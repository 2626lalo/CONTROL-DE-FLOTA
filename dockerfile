# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia package.json y elimina lockfiles viejos
COPY package.json ./
RUN rm -f package-lock.json && rm -rf node_modules

# Instala TODAS las dependencias
RUN npm install --include=dev --legacy-peer-deps

# Verificar instalación
RUN echo "=== VERIFICANDO INSTALACIÓN ===" && \
    echo "Vite versión:" && npx vite --version && \
    echo "React disponible:" && npm list react && \
    echo "Total paquetes:" && npm list --depth=0 | wc -l

# Copia el código fuente
COPY . .

# === DIAGNÓSTICO CRÍTICO ===
RUN echo "=== DIAGNÓSTICO CRÍTICO ===" && \
    echo "1. Verificando main.tsx:" && cat src/main.tsx && \
    echo "" && \
    echo "2. Verificando App.tsx (completo):" && cat src/App.tsx && \
    echo "" && \
    echo "3. Verificando vite.config.ts:" && cat vite.config.ts && \
    echo "" && \
    echo "4. Verificando tsconfig.json:" && cat tsconfig.json && \
    echo "" && \
    echo "5. Estructura del proyecto:" && find . -type f -name "*.tsx" -o -name "*.ts" | head -20 && \
    echo "" && \
    echo "6. Verificando index.html:" && cat index.html

# Limpiar caché de Vite y forzar construcción completa
RUN rm -rf node_modules/.vite && rm -rf dist

# Construye la aplicación
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
