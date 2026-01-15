# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build con verificación explícita
RUN npm run build 2>&1 | tee build.log && \
    echo "=== VERIFICANDO SI VITE COMPLETÓ EL BUILD ===" && \
    if grep -q "✓ built in" build.log; then \
        echo "✅ Vite build completado exitosamente"; \
    else \
        echo "❌ Vite build NO se completó"; \
        cat build.log; \
        exit 1; \
    fi

# Verificar archivos generados
RUN echo "=== VERIFICANDO ARCHIVOS GENERADOS ===" && \
    ls -la dist/ && \
    echo "=== TAMAÑO DE ARCHIVOS JS ===" && \
    find dist -name "*.js" -exec du -h {} \;

# Etapa de producción
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
