# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build con inyección manual de scripts
RUN npm run build

# VERIFICACIÓN CRÍTICA: ¿El index.html tiene scripts?
RUN echo "=== VERIFICACIÓN FINAL DEL HTML ===" && \
    echo "=== Tamaño de index.html ===" && \
    du -h /app/dist/index.html && \
    echo "=== ¿Contiene scripts de React? ===" && \
    if grep -q "index\..*\.js" /app/dist/index.html; then \
        echo "✅ SÍ: index.html tiene scripts JS"; \
        grep -o "index\..*\.js" /app/dist/index.html; \
    else \
        echo "❌ NO: index.html NO tiene scripts JS"; \
        echo "=== Mostrando primeras 30 líneas ==="; \
        head -30 /app/dist/index.html; \
        exit 1; \
    fi && \
    echo "=== ¿Contiene CSS? ===" && \
    if grep -q "\.css" /app/dist/index.html; then \
        echo "✅ SÍ: index.html tiene CSS"; \
    else \
        echo "❌ NO: index.html NO tiene CSS"; \
    fi

# Etapa de producción
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
