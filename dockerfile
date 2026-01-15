# ... después de COPY . .

# === DIAGNÓSTICO MEJORADO ===
RUN echo "=== VERIFICANDO PLUGIN REACT ===" && \
    echo "1. Contenido de vite.config.ts:" && \
    cat vite.config.ts && \
    echo "" && \
    echo "2. Verificando plugin en node_modules:" && \
    ls -la node_modules/@vitejs/plugin-react/ && \
    echo "" && \
    echo "3. Ejecutando TypeScript con verificación estricta:" && \
    npx tsc --noEmit --skipLibCheck 2>&1 | head -10

# Construcción con modo desarrollo forzado
RUN echo "=== CONSTRUYENDO EN MODO DESARROLLO ===" && \
    VITE_USER_NODE_ENV=development npm run build
