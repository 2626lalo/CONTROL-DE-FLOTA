# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia package.json y elimina cualquier lockfile viejo
COPY package.json ./
RUN rm -f package-lock.json && rm -rf node_modules

# Instala TODAS las dependencias (producción + desarrollo)
RUN npm install --include=dev --legacy-peer-deps

# Verificar instalación
RUN echo "=== VERIFICANDO INSTALACIÓN ===" && \
    echo "Vite versión:" && npx vite --version && \
    echo "React disponible:" && npm list react && \
    echo "Total paquetes:" && npm list --depth=0 | wc -l

# Copia el código fuente
COPY . .

# Construye la aplicación
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
