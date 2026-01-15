# ... después de COPY . .

# Verificar la estructura de src/ y los archivos clave
RUN echo "=== DIAGNÓSTICO DETALLADO ===" && \
    echo "1. ¿Existe src/main.tsx?" && test -f src/main.tsx && echo "✅ SÍ" || echo "❌ NO" && \
    echo "2. ¿Existe src/App.tsx?" && test -f src/App.tsx && echo "✅ SÍ" || echo "❌ NO" && \
    echo "3. ¿Existe src/types.ts?" && test -f src/types.ts && echo "✅ SÍ" || echo "❌ NO" && \
    echo "4. ¿Existe src/constants.ts?" && test -f src/constants.ts && echo "✅ SÍ" || echo "❌ NO" && \
    echo "5. ¿Existe src/components/Layout.tsx?" && test -f src/components/Layout.tsx && echo "✅ SÍ" || echo "❌ NO" && \
    echo "" && \
    echo "6. Contenido de src/main.tsx (primeras 10 líneas):" && head -10 src/main.tsx && \
    echo "" && \
    echo "7. Verificando TypeScript (solo errores críticos):" && npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS[0-9]+" | head -5 && \
    echo "" && \
    echo "8. Listando archivos .tsx en src/:" && find src/ -name "*.tsx" | wc -l && \
    echo "9. Listando archivos .ts en src/:" && find src/ -name "*.ts" | wc -l

# Intentar construir con modo debug
RUN echo "=== EJECUTANDO VITE BUILD CON DEBUG ===" && \
    npx vite build --debug 2>&1 | tail -50

# Si lo anterior falla, intentar con force
RUN npm run build || echo "Build falló, intentando diagnóstico adicional..."
