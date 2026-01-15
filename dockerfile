# ÚLTIMA VERSIÓN - SIN HEREDOCS COMPLEJOS
FROM node:18-alpine

WORKDIR /app
COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# CREAR HTML CON echo SIMPLE
RUN echo '<!DOCTYPE html>' > dist/index.html
RUN echo '<html lang="es">' >> dist/index.html
RUN echo '<head>' >> dist/index.html
RUN echo '    <meta charset="UTF-8">' >> dist/index.html
RUN echo '    <meta name="viewport" content="width=device-width, initial-scale=1.0">' >> dist/index.html
RUN echo '    <title>CONTROL DE FLOTA</title>' >> dist/index.html
RUN echo '    <script>/* polyfills */</script>' >> dist/index.html
RUN echo '    <script src="https://cdn.tailwindcss.com"></script>' >> dist/index.html
RUN echo '    <link rel="stylesheet" href="/assets/index.DtXlcSpb.css">' >> dist/index.html
RUN echo '    <style>::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}::-webkit-scrollbar-thumb:hover{background:#94a3b8}</style>' >> dist/index.html
RUN echo '</head>' >> dist/index.html
RUN echo '<body class="bg-slate-50 text-slate-900 antialiased">' >> dist/index.html
RUN echo '    <div id="root"></div>' >> dist/index.html
RUN echo '    <script type="module" crossorigin src="/assets/index.nzfWp_A0.js"></script>' >> dist/index.html
RUN echo '</body>' >> dist/index.html
RUN echo '</html>' >> dist/index.html

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
