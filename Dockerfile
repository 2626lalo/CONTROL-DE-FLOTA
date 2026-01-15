
# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build
RUN npm run build

# Verificar que los archivos se generaron
RUN echo "=== VERIFICANDO BUILD ===" && \
    ls -la dist/ && \
    ls -la dist/assets/

# Etapa de producción
FROM nginx:alpine

# Configuración SIMPLE de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
