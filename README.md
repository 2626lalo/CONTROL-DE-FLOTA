
# Gestión de Flota Corporativa Pro

Sistema profesional de gestión de flota empresarial con soporte offline, OCR inteligente via Gemini AI y persistencia dual (LocalStorage para desarrollo y Firebase para producción).

## Estado del Proyecto

Actualmente operando en la rama **`main`** (Producción).

## Tecnologías

- **Frontend**: React 19, Tailwind CSS, Lucide React.
- **Gráficos**: Recharts.
- **IA**: Google Gemini API (@google/genai).
- **Backend/DB**: Firebase Firestore & Auth.
- **Exportación**: jsPDF, XLSX.

## Configuración de Entorno

El sistema detecta automáticamente el entorno:
- Si el hostname incluye `run.app`, utiliza **Firebase**.
- En otros casos (desarrollo local o Google Studio), utiliza **LocalStorage** con datos mock iniciales.
