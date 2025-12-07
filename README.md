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
2. Copia el archivo `_TEMPLATE.html`
3. Renómbralo con el nombre de tu post (ejemplo: `mi-dia-favorito.html`)
4. Ábrelo y edítalo

### Paso 3: ¡Listo!
Guarda el archivo y tu blog se actualiza solito.

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


## Estructura de Carpetas

```
tu-blog/
├── 📄 index.html          ← Tu página principal (no tocar)
├── 📁 src/                ← (Vas a encontrar varios scripts del sistema de módulos aqui)
│   ├── 📁 blogs/          ← ¡TUS POSTS VAN AQUÍ! 
│   │   ├── _TEMPLATE.html ← Copia esto para nuevos posts
│   │   ├── mi-post.html   ← Tus posts
│   │   └── manifest.json  ← Se genera solito
│   ├── 📁 css/            ← Estilos (no tocar)
│   ├── 📁 bgm/            ← Música del reproductor de música
│   ├── 📁 sound/          ← Efectos de sonido
│   └── 📁 assets/         ← Tus imágenes van aquí
└── 📁 scripts/            ← Scripts (no tocar)
```

---

## Cómo Agregar Imágenes

1. Pon tu imagen en la carpeta `src/assets/`
2. En tu post, usa:
```html
<img src="/src/assets/nombre-de-tu-imagen.jpg" alt="Descripción de la imagen">
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
- ¿El archivo termina en `.html`?
- ¿El archivo está en `src/blogs/`?
- ¿El servidor está corriendo? (`npm start`)

### "La fecha se ve rara"
- Revisa que la fecha tenga el formato correcto
- La `T` entre la fecha y hora es importante
- La `Z` al final es importante

---

## Sistema de Comentarios por Blog

(PENDIENTE)

¡Happy blogging! Gracias por elegirme para hacer este trabajo. ♡

---
