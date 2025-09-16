# Cómo editar o agregar un país

Este directorio (`src/content/bitacoras`) contiene toda la información para las páginas de cada país.

## Editar un país existente

Para editar la información de un país, simplemente abre el archivo correspondiente (ej. `argentina.ts`) y modifica el contenido. El archivo sigue la interfaz `CountryCopy` definida en `types.ts`.

## Agregar un nuevo país

1.  **Crea un nuevo archivo**: Crea un nuevo archivo con el nombre del país en minúsculas y separado por guiones, por ejemplo, `nuevo-pais.ts`.
2.  **Copia el contenido**: Copia el contenido de un país existente como plantilla.
3.  **Modifica el contenido**: Cambia toda la información para que corresponda al nuevo país. Asegúrate de que el `slug` sea único y comience con `/` (ej. `/nuevo-pais`).
4.  **Actualiza el índice**: Abre `src/content/bitacoras/index.ts`.
    *   Importa tu nuevo archivo: `import nuevoPais from "./nuevo-pais";`
    *   Agrega la variable `nuevoPais` al array `COUNTRIES`.

La página se generará automáticamente con la nueva información.

## Assets (Imágenes y Videos)

-   **Imágenes**: Las imágenes de los héroes y las galerías se definen en cada archivo de país (`heroImage`, `gallery`).
    -   Si la ruta es local (ej. `/images/bitacoras/argentina.jpg`), el archivo debe existir en la carpeta `/public/images/bitacoras/`.
    -   Si el archivo local no se encuentra, el componente `AssetImage` buscará automáticamente una imagen de respaldo en `unsplash.com` usando el nombre del país.
-   **Videos**: Los videos de los héroes (`heroVideo`) deben ser rutas locales (ej. `/videos/argentina.mp4`) y deben estar en la carpeta `/public/videos/`.
    -   Si el video no se encuentra, se mostrará la `heroImage` en su lugar.