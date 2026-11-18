# Emprende+ 🚀

**Gestiona tu negocio de papelería y servicios desde el navegador.** Cotizador multimoneda (USD/VES), control de ventas, inventario y clientes con almacenamiento local.

### ✨ Características

- 💰 **Cotizador inteligente**: Calcula precios en dólares y bolívares con tasa BCV actualizada
- 📋 **Carrito de servicios**: Agrega servicios personalizados y genera cotizaciones profesionales en PNG
- 📊 **Dashboard completo**: Visualiza ingresos, egresos y balances en tiempo real
- 🗂️ **Gestión de inventario**: Controla productos, stock bajo y registros de compras
- 👥 **Clientes**: Administra tu base de clientes y su historial
- 💳 **Ventas y pagos**: Registra transacciones, soporta pago móvil con datos automáticos
- 🌙 **Modo oscuro/claro**: Temas persistentes entre sesiones
- 📱 **PWA lista**: Instalable y funciona offline
- 🐳 **Docker integrado**: Despliegue simplificado con `docker compose`

### 🛠️ Tecnologías

React + TypeScript · Tailwind CSS · Zustand · Dexie (IndexedDB) · html2canvas · Docker

### 🚀 Uso rápido

```bash
make up           # Iniciar contenedor en puerto 3010
make logs         # Ver logs en tiempo real
make down         # Detener contenedor
```

Accede en: http://localhost:3010

---
*Hecho para emprendedores venezolanos que necesitan simplicidad y eficiencia.*

## 🚀 Desplegar en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. Sube tu código a un repositorio en GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión
3. Haz clic en **"Add New..."** → **"Project"**
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente la configuración (`vercel.json`)
6. Haz clic en **"Deploy"**

### Opción 2: Desde la terminal

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel --prod
```

### Configuración automática

El archivo `vercel.json` está configurado para:
- Construir con Vite
- Servir desde la carpeta `dist`
- Redireccionar todas las rutas a `index.html` (SPA routing)

---
