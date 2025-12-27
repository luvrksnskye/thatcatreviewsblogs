# ✧ Guía para Crear Posts en tu Blog ✧

¡Holi! 💕 Esta guía fue escrita para mi clienta y explica cómo agregar nuevos posts a su blog de forma súper fácil.
**No se necesita saber programación**, solo copiar, pegar y escribir.

---

## Inicio Rápido (3 pasos)

### Paso 1: Abre la terminal
En tu computadora, abre la carpeta de tu blog y ejecuta:
```
npm start
```
Esto inicia tu blog. Déjalo corriendo mientras trabajas. Para abrir la terminal en Windows, usa la barra de búsqueda y escribe "Terminal" o "cmd", o utiliza el atajo de teclado Win + X para acceder al menú de acceso rápido y selecciona "Terminal de Windows". Sin embargo, recomiendo hacerlo desde Visual Studio Code, seleccionando la opción para abrir la terminal desde su menú y asegurándote de estar en el directorio "src".

### Paso 2: Crea tu post
1. Ve a la carpeta `src/blogs/`
2. Crea una nueva carpeta con el nombre de tu post (en minúsculas, sin espacios, usa guiones)
   - Ejemplo: `mi-dia-favorito`
3. Dentro de esa carpeta, crea un archivo `index.html`
4. Copia el contenido de `_TEMPLATE.html` y edítalo

**O usa el comando automático:**
```
npm run new-post
```
¡Esto te guía paso a paso y crea todo automáticamente!

### Paso 3: ¡Listo!
Guarda el archivo y tu blog se actualiza solito.

---

## Nueva Estructura de Carpetas

```
src/blogs/
├── mi-primer-post/
│   └── index.html      ← Tu post
├── aventuras-gaming/
│   └── index.html      ← Otro post
├── arte-digital/
│   └── index.html      ← Otro post
└── manifest.json       ← Se genera automáticamente
```

**Ventajas de esta estructura:**
- URLs más limpias: `/blogs/mi-post/` en vez de `/blogs/mi-post.html`
- Puedes agregar imágenes específicas para cada post en su carpeta
- Mejor organización

---

## Cómo Escribir un Post

Cuando abras el archivo de tu post, verás algo así arriba:

```html
<meta name="blog-title" content="ESCRIBE TU TÍTULO AQUÍ">
<meta name="blog-subtitle" content="Una descripción cortita">
<meta name="blog-category" content="Life">
<meta name="blog-date" content="2024-12-07T14:30:00Z">
```

### ¿Qué significa cada línea?

| Línea | Qué poner | Ejemplo |
|-------|-----------|---------|
| `blog-title` | El título de tu post | `"Mi Viaje"` |
| `blog-subtitle` | Una descripción corta | `"Aventuras"` |
| `blog-category` | La categoría | `"Life"`, `"Gaming"`, `"Art"`, `"Music"` |
| `blog-date` | Fecha y hora | Ve la sección de abajo |

### Cómo Escribir la Fecha

La fecha tiene este formato: `AÑO-MES-DÍATHORA:MINUTOS:SEGUNDOSZ`

**Ejemplos:**
- `2024-12-07T14:30:00Z` = 7 de diciembre 2024, 2:30 PM
- `2024-12-25T10:00:00Z` = 25 de diciembre 2024, 10:00 AM
- `2025-01-01T00:00:00Z` = 1 de enero 2025, medianoche

**💡 Tip:** Si no pones fecha, el sistema usa la fecha de cuando creaste el archivo. Toma eso en cuenta.

---

## Estructura de Carpetas del Proyecto

```
tu-blog/
├── 📄 index.html          ← Tu página principal (no tocar)
├── 📁 src/                ← (Vas a encontrar varios scripts del sistema de módulos aqui)
│   ├── 📁 blogs/          ← ¡TUS POSTS VAN AQUÍ! 
│   │   ├── mi-post/       ← Carpeta de tu post
│   │   │   └── index.html ← El contenido del post
│   │   ├── otro-post/     ← Otra carpeta de post
│   │   │   └── index.html
│   │   └── manifest.json  ← Se genera solito
│   ├── 📁 css/            ← Estilos (no tocar)
│   ├── 📁 bgm/            ← Música del reproductor de música
│   ├── 📁 sound/          ← Efectos de sonido
│   └── 📁 assets/         ← Tus imágenes van aquí
└── 📁 scripts/            ← Scripts (no tocar)
```

---

## Cómo Agregar Imágenes

### Opción 1: Imágenes generales
Pon tu imagen en la carpeta `src/assets/` y usa:
```html
<img src="/src/assets/nombre-de-tu-imagen.jpg" alt="Descripción de la imagen">
```

### Opción 2: Imágenes específicas del post (NUEVO)
Ahora puedes poner imágenes dentro de la carpeta de tu post:
```
src/blogs/mi-post/
├── index.html
├── foto1.jpg
└── foto2.png
```

Y en tu HTML:
```html
<img src="foto1.jpg" alt="Mi foto">
```

**💡 Tips para imágenes:**
- Usa nombres sin espacios: `mi-gato.jpg` ✓ | `mi gato.jpg` ✗
- Formatos recomendados: `.jpg`, `.png`, `.gif`, `.webp`

---

## El Status Tab

Tu página principal tiene un "Status Tab" que muestra automáticamente tus 4 posts más recientes. ¡No tienes que hacer nada especial, se actualiza solito!

## Problemas Comunes

### "Mi post no aparece"
- ¿Guardaste el archivo?
- ¿El archivo se llama `index.html`?
- ¿Está dentro de una carpeta en `src/blogs/`?
- ¿El servidor está corriendo? (`npm start`)

### "La fecha se ve rara"
- Revisa que la fecha tenga el formato correcto
- La `T` entre la fecha y hora es importante
- La `Z` al final es importante

### "La carpeta no funciona"
- El nombre de la carpeta debe ser en minúsculas
- No uses espacios, usa guiones: `mi-post` ✓ | `mi post` ✗
- No uses caracteres especiales: `aventuras` ✓ | `aventuras!` ✗

---

# Sistema de Comentarios por Blog

(PENDIENTE)

# Site Pet - Horarios de Sprites

## Horario Normal

| Horario | Sprite | Descripción |
|---------|--------|-------------|
| 11 PM - 2 AM | `lookingAtSky` | Mirando las estrellas |
| 2 AM - 6 AM | `sleeping` | Durmiendo |
| 6 AM - 8 AM | `idle` | Despierto, moviendo cola |
| 8 AM - 10 AM | `idleSit` | Sentado relajado |
| 10 AM - 12 PM | `reading` | Leyendo un libro |
| 12 PM - 2 PM | `silly` | Modo zoomies/juguetón |
| 2 PM - 4 PM | `playing` | Jugando |
| 4 PM - 6 PM | `idleSit` | Sentado relajado |
| 6 PM - 8 PM | `reading` | Leyendo un libro |
| 8 PM - 11 PM | `idle` | Despierto, moviendo cola |

---

## Sprites de Temporada

### Halloween (Octubre)
| Horario | Sprite |
|---------|--------|
| 6 PM - 11 PM | `halloween` |

### Navidad (Diciembre)
| Horario | Sprite |
|---------|--------|
| 6 AM - 10 PM | `christmas` |

---

## Comandos de Consola

```javascript
pet.help()          // Ver todos los comandos
pet.list()          // Ver sprites disponibles
pet.state()         // Ver estado actual

// Cambiar sprite manualmente
pet.set("nombre")   // Por nombre
pet.idle()          // Atajos directos
pet.sleeping()
pet.lookingAtSky()
pet.idleSit()
pet.reading()
pet.silly()
pet.playing()
pet.halloween()
pet.christmas()

// Control de animación
pet.pause()         // Pausar
pet.resume()        // Reanudar
pet.speed(100)      // Más rápido
pet.speed(200)      // Más lento

// Pensamientos
pet.think()         // Pensamiento random
pet.think("Hola!")  // Pensamiento custom
```

---

¡Happy blogging! Gracias por elegirme para hacer este trabajo. ♡

---
# thatcatreviewsblogs
# thatcatreviewsblogs
