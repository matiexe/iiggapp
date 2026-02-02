
# 🇦🇷 Calculadora de Impuesto a las Ganancias (2025-2026)

Una herramienta moderna y profesional para que los empleados en relación de dependencia en Argentina puedan estimar su retención mensual de Ganancias, ajustada a las proyecciones de las leyes actuales (Ley 27.743).

## 🚀 Características

- **Cálculo Preciso**: Basado en las escalas vigentes y proyectadas para los períodos fiscales 2025 y 2026.
- **Deducciones Familiares**: Configuración fácil para cónyuges, hijos y otras deducciones (educación, servicio doméstico).
- **Asesor Fiscal IA**: Integración con **Google Gemini API** para proporcionar un análisis personalizado y consejos legales para optimizar la carga impositiva.
- **Visualización de Datos**: Gráficos interactivos con Recharts para entender la distribución del sueldo bruto (Neto vs. Impuestos vs. Aportes).
- **Diseño Responsive**: Optimizado para dispositivos móviles y escritorio usando Tailwind CSS.

## 🛠️ Tecnologías

- **React 19**
- **Tailwind CSS** (Estilos)
- **Recharts** (Gráficos)
- **Google Generative AI (Gemini)** (Análisis inteligente)
- **TypeScript** (Tipado seguro)

## 📦 Instalación y Uso

1. Clona este repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el proyecto:
   ```bash
   npm start
   ```

## 🔑 Configuración de API Key

Para utilizar el **Asesor Fiscal IA**, necesitas una clave de API de Google AI Studio. 
El sistema busca automáticamente la variable de entorno `process.env.API_KEY`.

## ⚖️ Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---
*Descargo de responsabilidad: Esta aplicación es una herramienta de estimación. Para presentaciones legales ante AFIP, consulte siempre con un contador matriculado.*
