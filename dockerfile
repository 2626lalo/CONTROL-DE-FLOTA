# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app
# Copia los archivos de dependencias y las instala
COPY package*.json ./
RUN npm install --omit=dev
# Copia el código fuente y construye la aplicación
COPY . .
RUN npm run build

# 2. Etapa: Servir los archivos estáticos
FROM nginx:alpine
# Copia los archivos construidos desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Copia una configuración personalizada de nginx si es necesario
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expone el puerto 80 (Nginx lo usa por defecto)
EXPOSE 80
# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
