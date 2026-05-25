# Trabajo compartido entre Codex y Gemini/Antigravity

El proyecto se desarrolla con mas de una herramienta. Para evitar perdida de contexto, cada agente debe dejar rastros cortos y utiles de lo que hizo.

## Antes de empezar

1. Leer `README.md`.
2. Leer `docs/task.md`.
3. Leer `docs/implementation_plan.md`.
4. Leer `docs/maintenance_notes.md` si el cambio toca UI, permisos, APIs del navegador, storage o flujos ya corregidos.
5. Leer `docs/roadmap.md` si el cambio es de producto o funcionalidad nueva.
6. Revisar `git status --short`.

## Durante el trabajo

- Mantener los cambios acotados al objetivo.
- No revertir cambios de otra herramienta sin confirmacion del usuario.
- Si se cambia una decision de producto, actualizar `docs/roadmap.md` o `docs/task.md`.
- Si se cambia arquitectura o flujo interno, actualizar `docs/implementation_plan.md`.
- Si se cambia el uso visible para el usuario, actualizar `README.md` o `docs/walkthrough.md`.
- Si se corrige un bug que puede repetirse, agregar una nota corta en `docs/maintenance_notes.md`.

## Al terminar

Cada agente debe dejar registrado:

- que cambio;
- que archivos principales toco;
- que pruebas o build ejecuto;
- si quedo algun pendiente.

Si el cambio es grande, agregar una seccion corta en `docs/task.md` o crear una nota especifica en `docs/`.

## Formato sugerido para notas de cierre

```text
Fecha:
Herramienta:
Resumen:
Archivos tocados:
Verificacion:
Pendientes:
```

## Reglas practicas

- La documentacion debe describir el estado actual, no aspiraciones mezcladas con comportamiento real.
- `docs/maintenance_notes.md` es lectura obligatoria antes de modificar zonas sensibles ya corregidas.
- Las ideas futuras viven en `docs/roadmap.md`.
- Los documentos historicos o maquetas que ya no aportan se pueden quitar.
- Los permisos nuevos de extension deben quedar justificados en documentacion antes de publicarse.
