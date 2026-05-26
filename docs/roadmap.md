# Roadmap - martabs

Este documento lista lo que falta o podria venir despues. La documentacion del estado actual esta en `docs/task.md`.

## Pendiente principal

### 1. Multilenguaje

Objetivo: preparar martabs para publicar y compartir con usuarios que no usen espanol.

Forma recomendada:

- Usar el sistema nativo de internacionalizacion de extensiones: carpetas `_locales` y archivos `messages.json`.
- Empezar con `es` y `en`.
- Extraer textos visibles de `newtab`, `setup`, manifest y mensajes de estado.
- Mantener una clave por texto para que Codex y Gemini/Antigravity no editen strings sueltos en distintos archivos.
- Documentar como agregar un idioma nuevo.
- Agregar tests que verifiquen que no quedan textos principales hardcodeados fuera del sistema de mensajes.

Ventajas:

- Compatible con Chrome y Firefox.
- No requiere librerias pesadas.
- Ayuda si la extension se publica o comparte.

Limitaciones:

- Hay que mantener textos sincronizados.
- Algunos textos dinamicos necesitan placeholders.
- Conviene hacerlo cuando la UI esta bastante estable.

## Completado y cerrado

- Capturas locales al abrir marcadores desde martabs.
- Edicion de marcadores desde la UI.
- Favoritos fijados.
- Modos visuales por carpeta.
- Orden visual global y por carpeta.
- Orden manual y drag & drop local.
- Movimiento local de marcadores entre carpetas monitoreadas.
- Overhaul de Configuracion.

## Ideas opcionales para mas adelante

- Exportar/importar configuracion en `Avanzado`.
- Aplicar movimientos u orden manual al gestor real de marcadores, solo con confirmacion explicita.
- Tests E2E con navegador real para flujos visuales criticos.
- Mejoras de publicacion: screenshots finales, texto de privacidad y checklist para Chrome Web Store.
