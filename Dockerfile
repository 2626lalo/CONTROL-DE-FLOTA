# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

# Build con inyección de scripts
RUN npm run build

# Verificar que la inyección funcionó
RUN echo "=== VERIFICANDO index.html ===" && \
    echo "📏 Tamaño del archivo:" && du -h /app/dist/index.html && \
    echo "🔍 Contiene script de React:" && (grep -q "\.js" /app/dist/index.html && echo "✅ SÍ" || echo "❌ NO") && \
    echo "🎨 Contiene CSS:" && (grep -q "\.css" /app/dist/index.html && echo "✅ SÍ" || echo "❌ NO")

# Etapa de producción
FROM nginx:alpine

# Configuración simple de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
