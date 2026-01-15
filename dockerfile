# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build
RUN npm run build

# Verificar que el build fue exitoso
RUN echo "=== VERIFICANDO BUILD ===" && \
    echo "Archivos generados:" && \
    ls -la dist/ && \
    ls -la dist/assets/

# Etapa de producción
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
