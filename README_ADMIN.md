# Admin Dashboard - Portfolio Franco Calegari

Panel de administración para gestionar proyectos del portfolio mediante una interfaz web intuitiva.

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
cd /home/gowther/Documentos/Proyectos/PortfolioFrancoCalegari
npm install
```

Esto instalará:

- `express` - Framework web para Node.js
- `cors` - Middleware para permitir requests cross-origin
- `nodemon` - Auto-reload durante desarrollo

## 📦 Uso

### Modo Desarrollo (con auto-reload)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

## 🌐 Acceso

Una vez iniciado el servidor:

- **Admin Dashboard**: http://localhost:3000/admin
- **Portfolio (Frontend)**: http://localhost:3000/index.html
- **API REST**: http://localhost:3000/api/projects

## ✨ Funcionalidades

### Admin Dashboard

- ✅ **Crear** nuevos proyectos
- ✏️ **Editar** proyectos existentes
- 🗑️ **Eliminar** proyectos
- ⭐ **Toggle** estado destacado
- 🖼️ **Preview** de imágenes
- 📊 **Vista de tabla** responsive
- 🔔 **Notificaciones** toast

### API Endpoints

| Método | Endpoint                                | Descripción                    |
| ------ | --------------------------------------- | ------------------------------ |
| GET    | `/api/projects`                         | Lista todos los proyectos      |
| GET    | `/api/projects/:index`                  | Obtiene un proyecto específico |
| POST   | `/api/projects`                         | Crea un nuevo proyecto         |
| PUT    | `/api/projects/:index`                  | Actualiza un proyecto          |
| DELETE | `/api/projects/:index`                  | Elimina un proyecto            |
| PATCH  | `/api/projects/:index/toggle-destacado` | Cambia el estado destacado     |

## 📝 Estructura de Datos

Cada proyecto tiene la siguiente estructura:

```json
{
	"name": "Nombre del Proyecto",
	"description": "Descripción breve del proyecto",
	"image": "https://url-de-la-imagen.jpg",
	"url": "https://url-del-proyecto.com",
	"alt": "Texto alternativo para la imagen",
	"destacado": 1
}
```

**Campos requeridos:**

- `name` - Nombre del proyecto
- `url` - URL del proyecto

**Campos opcionales:**

- `description` - Descripción del proyecto
- `image` - URL de la imagen
- `alt` - Texto alternativo para accesibilidad
- `destacado` - `1` para destacado, `0` para normal

## 🎨 Características del Admin

### Diseño

- **Glassmorphism**: Efectos de vidrio con backdrop-filter
- **Paleta consistente**: Colores dorados (#ffbe00) del portfolio original
- **Responsive**: Se adapta a móviles y tablets
- **Animaciones**: Transiciones suaves en hover y clicks

### Validación

- Campos requeridos marcados con asterisco (\*)
- Validación de URLs
- Preview de imágenes antes de guardar
- Confirmación antes de eliminar

### UX

- Tooltips informativos
- Notificaciones toast de éxito/error
- Modal de confirmación para eliminaciones
- Scroll automático al editar

## ⚠️ Importante

### Backup del JSON

**Antes de usar el admin por primera vez**, se recomienda hacer una copia de seguridad:

```bash
cp json/proyectos.json json/proyectos.backup.json
```

### Restaurar Backup

Si necesitas restaurar:

```bash
cp json/proyectos.backup.json json/proyectos.json
```

## 🔧 Troubleshooting

### El servidor no inicia

**Error:** `Cannot find module 'express'`

**Solución:**

```bash
npm install
```

### Puerto 3000 ocupado

**Error:** `EADDRINUSE: address already in use :::3000`

**Solución 1:** Cambiar el puerto en `server.js`:

```javascript
const PORT = 3001; // O cualquier otro puerto disponible
```

**Solución 2:** Liberar el puerto 3000:

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Los cambios no se reflejan en el frontend

**Solución:**

1. Verifica que el archivo `json/proyectos.json` se está modificando
2. Refresca el navegador (Ctrl+F5 para hard refresh)
3. Verifica que no haya errores en la consola del navegador

### Error de CORS

**Error:** `Access to fetch has been blocked by CORS policy`

**Solución:** Asegúrate de que el servidor esté corriendo y accede al admin desde `http://localhost:3000/admin` y no abriendo el archivo HTML directamente.

## 📂 Archivos Creados

```
PortfolioFrancoCalegari/
├── server.js              # Servidor Express con API
├── package.json           # Configuración de npm
├── .gitignore            # Archivos ignorados por git
└── admin/
    ├── index.html        # Panel de administración
    ├── style.css         # Estilos del admin
    └── script.js         # Lógica del admin
```

## 🔄 Flujo de Trabajo

1. **Iniciar servidor**: `npm run dev`
2. **Acceder al admin**: http://localhost:3000/admin
3. **Gestionar proyectos** mediante la interfaz
4. **Ver cambios** en http://localhost:3000/index.html
5. Los cambios se guardan automáticamente en `json/proyectos.json`
6. El frontend carga los proyectos desde el JSON actualizado

## 📱 Compatibilidad

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Navegadores móviles
- ✅ Tablets

## 🆘 Soporte

Si encuentras algún problema:

1. Revisa la sección de Troubleshooting
2. Verifica la consola del navegador (F12)
3. Revisa los logs del servidor en la terminal
4. Asegúrate de tener las últimas dependencias: `npm install`

---

**Desarrollado para:** Portfolio Franco Calegari  
**Tecnologías:** Node.js, Express, Vanilla JavaScript  
**Versión:** 1.0.0
