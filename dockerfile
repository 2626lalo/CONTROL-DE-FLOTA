# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia los archivos de dependencias y las instala
COPY package*.json ./
RUN npm install

# Copia el código fuente
COPY . .

# === DIAGNÓSTICO (opcional, pero útil) ===
RUN echo "=== VERIFICANDO ESTRUCTURA ===" && \
    echo "1. Archivos en raíz:" && ls -la && \
    echo "2. Archivos en src/:" && ls -la src/ && \
    echo "3. Archivos en src/components/:" && ls -la src/components/ && \
    echo "4. Verificando TypeScript..." && \
    npx tsc --noEmit --skipLibCheck 2>&1 | head -5 || true

# Construye la aplicación
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine

# Copia los archivos construidos desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
