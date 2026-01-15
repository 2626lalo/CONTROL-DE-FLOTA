# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia solo package.json (sin package-lock.json)
COPY package.json ./

# Elimina cualquier package-lock.json existente (por si acaso) y instala dependencias
RUN rm -f package-lock.json && npm install --include=dev

# Verificar que Vite esté instalado
RUN echo "=== VERIFICANDO VITE ===" && \
    npx vite --version

# Copia el código fuente
COPY . .

# Verificar estructura
RUN echo "=== ESTRUCTURA FINAL ===" && \
    ls -la src/

# Construye la aplicación
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
