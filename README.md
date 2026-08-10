# UnoPago - Plataforma de Pagos y Gestión Escolar

![UnoPago Banner](https://img.shields.io/badge/UnoPago-Landing%20%26%20Admin-4B51F6?style=for-the-badge)
![Status](https://img.shields.io/badge/Estado-Completado-059669?style=for-the-badge)

UnoPago es una plataforma web moderna diseñada para la gestión de pagos, cobros escolares, matrículas y mensualidades en instituciones educativas. Este repositorio contiene la **Landing Page pública** y el **Panel de Administración** con un completo sistema de personalización de temas (paletas de colores de 5 roles) y tipografías en tiempo real.

---

## 🚀 Características Principales

### 🌐 Landing Page Pública (`landing.html`)
- **Diseño Moderno y Accesible**: Basado en una estricta distribución de 5 roles de color (Jerarquía 60-30-10):
  1. **Color Dominante (60%)**: Fondo principal (`<body>`).
  2. **Color de Superficie (20%)**: Cards, contenedores y header.
  3. **Color de Texto/Lectura**: Tipografía principal contrastada.
  4. **Color Acento / CTA (10%)**: Botones primarios, llamadas a la acción e íconos.
  5. **Neutro de Soporte (10%)**: Bordes, divisores y elementos secundarios.
- **Iconografía Integrada**: Íconos vectoriales SVG en todas las tarjetas de servicios y botones principales.
- **Botón Flotante de Ayuda**: Acceso rápido fijo a soporte en la esquina inferior derecha.
- **Sincronización Dinámica de Tema y Tipografía**: Lee automáticamente las paletas (Modo Claro / Modo Oscuro) y la tipografía activa desde el Panel de Administración.

- **🔑 Módulo de Autenticación y Control de Sesión**:
  - Acceso protegido al panel con formulario de **Iniciar Sesión** y **Registro de Usuarios**.
  - Persistencia de credenciales y sesión activa en `localStorage` (`unopago-users-v1` y `unopago-session-v1`).
  - Usuario administrador predeterminado (`admin@unopago.com` / `admin`).
- **🔍 Barras de Búsqueda Integradas**: Filtrado en tiempo real por nombre para paletas de colores y estilos tipográficos.
- **Módulo 1: Gestión de Colores**
  - **División por Modo Claro y Modo Oscuro**: Alternador dedicado para visualizar y gestionar independientemente las paletas de cada modo.
  - **Creación y Edición de Paletas**: Formulario intuitivo con color pickers e inputs de código HEX para definir los 5 roles de color.
  - **Activación de Paleta**: Al hacer clic en "Activar", la paleta seleccionada se aplica dinámicamente al sitio público y a las vistas previas.
  - **Vista Previa en Tiempo Real**: Tarjeta interactiva dentro del panel para previsualizar el impacto del tema activo o en edición.
- **Módulo 2: Gestión de Tipografía**
  - **Carga de Fuentes Personalizadas (.ttf)**: Soporte para subir archivos de fuentes TrueType (`.ttf`), inyectando automáticamente la regla `@font-face`.
  - **Visualización en Lista de Estilos**: Cada estilo guardado muestra su nombre utilizando la fuente personalizada correspondiente.
  - **Ajuste Numérico de Tamaños (px)**: Control preciso sobre los tamaños de Títulos (`h1`/`h2`), Subtítulos (`h3`/`h4`) y Párrafos (`p`).
  - **Muestra de Tamaños en Tiempo Real**: Recuadro dinámico dentro de los formularios de creación y edición para evaluar visualmente la escala de los textos antes de guardar.

---

## 📂 Estructura del Proyecto

```
unopago-landing-rework/
├── index.html            # Redirección al portafolio (https://portfolio-aqs8.onrender.com)
├── landing.html          # Entrypoint principal de la Landing Page pública
├── admin.html            # Panel de Administración de Colores y Tipografías
├── css/
│   ├── landing.css       # Estilos específicos de la Landing Page
│   └── styles.css        # Estilos generales del Panel de Administración
├── js/
│   ├── app.js            # Lógica y estado React / DC-Runtime del Admin Panel
│   ├── landing.js        # Lógica, sincronización de temas y tipografías de la Landing
│   └── vendor/           # Librerías cliente (React, ReactDOM, DC Runtime)
└── README.md             # Documentación del proyecto
```

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & CSS3 Vanilla**: Arquitectura modular con CSS Custom Properties (`--c-bg`, `--c-surface`, `--c-text`, `--c-cta`, `--c-border`, `--font-main`, etc.).
- **JavaScript ES6+**: Estado reactivo y persistencia local mediante `localStorage`.
- **React & DC-Runtime**: Motor de renderizado liviano para los componentes dinámicos.

---

## 📥 Instalación y Uso Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/nox456/unopago-landing-rework.git
   cd unopago-landing-rework
   ```

2. **Ejecutar el proyecto:**
   - No requiere procesos de compilación o instalación de `node_modules` para su uso en navegador.
   - Abre directamente `landing.html` en tu navegador de preferencia o sírvelo mediante un servidor local (ej. Live Server).
   - Nota: `index.html` ya no contiene la Landing Page; redirige al portafolio desplegado en https://portfolio-aqs8.onrender.com
   - Accede a `admin.html` para personalizar los temas, paletas y fuentes del sitio.

---

## 📜 Licencia

Este proyecto está bajo la licencia MIT.
