# Plan de implementacion - Paso 14: preparacion para publicar en stores

Objetivo: dejar martabs listo para publicarse como extension gratuita en Chrome Web Store y Firefox Add-ons, con textos publicos, politica de privacidad, licencia GPL-3.0, paquetes finales y checklist de revision.

## Decisiones confirmadas

- Nombre publico: martabs.
- Idioma principal de ficha: ingles.
- Categoria: Productivity.
- Precio: Free.
- Licencia: GPL-3.0-only.
- Repositorio publico: https://github.com/UnkSGit/martabs.
- Soporte: martabs.extension@gmail.com.
- GitHub Pages: usar `docs/` como fuente.
- Privacy policy publica prevista: https://unksgit.github.io/martabs/privacy_policy.html.

## Entregables

- `LICENSE`.
- `docs/index.html`.
- `docs/privacy_policy.html`.
- `docs/privacy_policy.md`.
- `docs/store_listing.md`.
- `docs/reviewer_notes.md`.
- Script `npm run package`.
- Zips finales en `release/`:
  - `martabs-chrome-v1.0.0.zip`.
  - `martabs-firefox-v1.0.0.zip`.

## Checklist antes de subir a stores

1. Activar GitHub Pages desde GitHub:
   - Repository: `UnkSGit/martabs`.
   - Settings -> Pages.
   - Source: `Deploy from a branch`.
   - Branch: `main`.
   - Folder: `/docs`.
   - Save.
2. Verificar que abra:
   - `https://unksgit.github.io/martabs/`.
   - `https://unksgit.github.io/martabs/privacy_policy.html`.
3. Ejecutar:
   ```powershell
   npm test
   npm run build
   npm run package
   ```
4. Revisar `dist/chrome/manifest.json` y `dist/firefox/manifest.json`.
5. Probar instalacion limpia:
   - Chrome: cargar `dist/chrome`.
   - Firefox: cargar `dist/firefox/manifest.json`.
6. Subir a stores:
   - Chrome: `release/martabs-chrome-v1.0.0.zip`.
   - Firefox: `release/martabs-firefox-v1.0.0.zip`.
7. Usar los textos de `docs/store_listing.md`.
8. Usar la URL publica de la politica de privacidad.

## Notas para revisores

Usar `docs/reviewer_notes.md` como base para explicar el comportamiento de permisos opcionales, privacidad y diferencias entre navegadores.
