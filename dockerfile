# 1. Etapa: Construcción de la aplicación
FROM node:18-alpine AS build
WORKDIR /app

# Copia los archivos de dependencias y las instala (incluyendo devDependencies)
COPY package*.json ./
RUN npm ci --include=dev

# Copia el código fuente
COPY . .

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
