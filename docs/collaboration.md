# Trabajo compartido entre Codex y Gemini/Antigravity

El proyecto se desarrolla con mas de una herramienta. Cada agente debe dejar contexto corto y util para que el siguiente no tenga que reconstruir todo desde cero.

## Antes de empezar

1. Leer `README.md`.
2. Leer `docs/task.md`.
3. Leer `docs/implementation_plan.md`.
4. Leer `docs/maintenance_notes.md` si el cambio toca UI, permisos, APIs del navegador, storage o flujos ya corregidos.
5. Leer `docs/testing.md` antes de cerrar cambios medianos o grandes.
6. Leer `docs/roadmap.md` si el cambio es de producto o funcionalidad nueva.
7. Revisar `git status --short`.

## Durante el trabajo

- Mantener cambios acotados al objetivo.
- No revertir cambios de otra herramienta sin confirmacion del usuario.
- Si cambia una decision de producto, actualizar `docs/roadmap.md` o `docs/task.md`.
- Si cambia arquitectura o flujo interno, actualizar `docs/implementation_plan.md`.
- Si cambia el uso visible, actualizar `README.md` o `docs/walkthrough.md`.
- Si se corrige un bug que puede repetirse, agregar nota en `docs/maintenance_notes.md`.
- Si se agrega o corrige un flujo importante, agregar o actualizar tests segun `docs/testing.md`.
- No crear planes historicos nuevos si el trabajo ya quedo implementado; integrar el resultado en los docs vivos.

## Al terminar

Registrar:

- que cambio;
- archivos principales tocados;
- pruebas o build ejecutados;
- pendientes reales.

Formato sugerido:

```text
Fecha:
Herramienta:
Resumen:
Archivos tocados:
Verificacion:
Pendientes:
```

## Reglas practicas

- La documentacion describe el estado actual. Las ideas futuras viven en `docs/roadmap.md`.
- `docs/maintenance_notes.md` es lectura obligatoria antes de modificar zonas sensibles.
- `docs/testing.md` define la verificacion minima.
- Los permisos nuevos de extension deben quedar justificados antes de publicarse.
