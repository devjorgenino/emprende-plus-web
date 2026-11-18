# Emprende+ Web PWA

Aplicación web Progressive Web App (PWA) para gestión de emprendimientos creativos.

## 🚀 Características

- **Calculadora Multimoneda**: Cotiza servicios en USD y VES con tasa de cambio BCV
- **Gestión de Servicios**: CRUD completo de servicios con precios
- **Historial de Ventas**: Registra y consulta ventas con filtros
- **Inventario de Materiales**: Gestiona stock de materiales e implementos
- **Dashboard**: Resumen de ventas e ingresos
- **PWA Installable**: Instala la app en dispositivos móviles y de escritorio

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|------------|
| Framework | React 19 + Vite |
| Routing | React Router DOM 7 |
| Estado | Zustand |
| Persistencia | Dexie.js (IndexedDB) |
| Estilos | Tailwind CSS 4 |
| Formularios | React Hook Form + Zod |
| Fechas | date-fns |
| Iconos | Lucide React |

## 📦 Instalación

```bash
cd emprende-plus-web
npm install
```

## 🚀 Desarrollo

```bash
npm run dev
```

La app se abrirá en `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
npm run preview
```

## 📱 Instalación PWA

La aplicación soporta instalación como PWA:

1. Abre la app en Chrome/Edge/Safari
2. Toca el botón de "Instalar" en la barra inferior o en el menú del navegador
3. La app se instalará en tu dispositivo

### Requisitos para PWA

- HTTPS (o localhost para desarrollo)
- Manifest webmanifest
- Service Worker

## 🔄 Comparando con Emprende+ (React Native)

| Característica | Web PWA | React Native |
|----------------|---------|--------------|
| Instalación | PWA / Web | App nativa |
| Almacenamiento | IndexedDB | SQLite |
| Tasa BCV | Fetch API | Fetch + MMKV |
| Fotos | File API | Camera API |
| Offline | Service Worker | Modo offline |

## 📁 Estructura del Proyecto

```
src/
├── App.tsx                    # Componente principal
├── main.tsx                   # Entry point
├── index.css                  # Estilos globales
├── components/                # Componentes UI reutilizables
│   ├── ui/                   # Botones, inputs, modals
│   ├── layout/               # Layout principal y Navbar
│   └── shared/               # Componentes compartidos
├── features/                  # Lógica de negocio por feature
│   ├── dashboard/            # Dashboard principal
│   ├── services/             # Gestión de servicios
│   ├── calculator/         # Calculadora/cotizador
│   ├── sales/              # Historial de ventas
│   └── inventory/          # Gestión de inventario
├── store/                     # Stores de Zustand
├── services/                  # Servicios API y DB
├── types/                     # Tipos TypeScript
├── utils/                     # Helpers y utilidades
├── constants/                 # Constantes de la app
├── hooks/                     # Custom hooks
├── pwa/                       # PWA handlers
└── assets/                    # Imágenes e iconos
```

## 🎯 Roadmap

- [x] PWA básica con service worker
- [x] Gestión de servicios
- [x] Calculadora multimoneda
- [x] Registro de ventas
- [x] Inventario de materiales
- [ ] Exportar cotización a PDF
- [ ] Compartir cotización vía WhatsApp
- [ ] Modo oscuro
- [ ] Notificaciones push

## 📄 Migración desde Expo

Para migrar datos desde la app Expo:

1. Exporta tus datos desde la app móvil
2. Usa la herramienta de importación de datos (pendiente)
3. Tus datos se migrarán a IndexedDB automáticamente

## 🤝 Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature
3. Haz commit con mensaje convencional
4. Abre un Pull Request

## 📄 Licencia

MIT