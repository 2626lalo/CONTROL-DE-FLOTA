# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# === DIAGNÓSTICO COMPLETO ===
RUN echo "=== INICIO DIAGNÓSTICO ===" && \
    echo "1. Verificando estructura..." && \
    echo "Raíz:" && ls -la && \
    echo "src/:" && ls -la src/ && \
    echo "src/components/:" && ls -la src/components/ && \
    echo "" && \
    echo "2. Verificando archivos críticos..." && \
    test -f src/App.tsx && echo "✅ App.tsx existe" || echo "❌ App.tsx NO existe" && \
    test -f src/main.tsx && echo "✅ main.tsx existe" || echo "❌ main.tsx NO existe" && \
    test -f src/types.ts && echo "✅ types.ts existe" || echo "❌ types.ts NO existe" && \
    echo "" && \
    echo "3. Verificando TypeScript..." && \
    npx tsc --noEmit 2>&1 | head -30

# Construcción con verboso
RUN echo "=== EJECUTANDO VITE BUILD ===" && \
    npm run build -- --debug

# 2. Etapa: Servir archivos
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
