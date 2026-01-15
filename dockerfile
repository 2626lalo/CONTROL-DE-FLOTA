# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia package.json y elimina lockfiles viejos
COPY package.json ./
RUN rm -f package-lock.json && rm -rf node_modules

# Instala TODAS las dependencias
RUN npm install --include=dev --legacy-peer-deps

# Copia el código fuente
COPY . .

# === DIAGNÓSTICO DETALLADO ===
RUN echo "=== DIAGNÓSTICO DETALLADO ===" && \
    echo "1. Verificando errores de TypeScript en TODO el proyecto:" && \
    npx tsc --noEmit --project . 2>&1 | head -50 && \
    echo "" && \
    echo "2. Listando todos los componentes:" && \
    find src -name "*.tsx" -o -name "*.ts" | sort && \
    echo "" && \
    echo "3. Verificando que los componentes importados existan:" && \
    echo "   Layout:" && [ -f src/components/Layout.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   Dashboard:" && [ -f src/components/Dashboard.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   VehicleList:" && [ -f src/components/VehicleList.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   VehicleForm:" && [ -f src/components/VehicleForm.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   Checklist:" && [ -f src/components/Checklist.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   ServiceManager:" && [ -f src/components/ServiceManager.tsx ] && echo "      Existe" || echo "      NO EXISTE" && \
    echo "   AdminUsers:" && [ -f src/components/AdminUsers.tsx ] && echo "      Existe" || echo "      NO EXISTE"

# Construye la aplicación
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
