# Plan de Implementación

Este documento sirve para alinear la arquitectura y diseño técnico entre los agentes y el usuario.

## Tareas en curso

### Favoritos Fijados (Completado ✅)

**Objetivo:** Permitir destacar enlaces importantes para un acceso rápido.

**Arquitectura:**
- **Estado Local:** Se usará `chrome.storage.local` con una nueva clave `martabs_pinned` para almacenar un arreglo de `id`s de los marcadores fijados. Además, se añade `showPinnedFolder` en los settings globales.
- **Renderizado Virtual:** Al iniciar la vista de la Nueva Pestaña, se cruzará el listado global de marcadores con los IDs fijados y se creará un grupo virtual (carpeta) al principio llamado "📌 Fijados" (si `showPinnedFolder` no es falso).
- **Visibilidad Dual y Ordenamiento:** Los marcadores fijados se renderizan tanto en el grupo "Fijados" como en su carpeta original. Las carpetas originales reciben un ordenamiento (`.sort()`) interno para mostrar los marcadores fijados al tope de su lista.
- **UI de Interacción:** 
  - Botón flotante al hacer hover sobre un marcador (ícono de Pin/Chincheta), posicionado junto al botón de "Editar".
  - El botón cambiará de estado (Pin lleno vs Pin vacío) dependiendo de si el marcador ya está fijado.
  - Al hacer clic, se actualiza el storage local y se re-renderiza la grilla/lista.

**Impacto:**
No afecta la estructura original de marcadores del navegador (`chrome.bookmarks`), solo la vista interna de martabs.
