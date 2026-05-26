# Problemas de Testing E2E en Firefox (MV3)

Durante la implementacion de la fase de pruebas E2E (End-to-End) utilizando Playwright, nos encontramos con varios bloqueos significativos al intentar ejecutar los tests en Firefox. A continuacion se documentan los problemas principales que llevaron a la decision de excluir temporalmente a Firefox del pipeline de E2E automatizado.

## 1. Soporte Limitado de Playwright para Extensiones en Firefox
Playwright ofrece soporte nativo y robusto para cargar extensiones desempaquetadas en Chromium mediante los argumentos `--disable-extensions-except` y `--load-extension` en `launchPersistentContext`. Sin embargo, **Firefox no soporta estos flags**.

Para Firefox, Playwright requiere el uso de librerias de terceros (como `playwright-webextext`) o configuraciones manuales complejas que intentan inyectar la extension en un perfil temporal.

## 2. Inestabilidad con Manifest V3 (MV3)
La carga dinamica de extensiones MV3 en Firefox a traves de herramientas de automatizacion es altamente inestable. A menudo, el *background script* o *service worker* no se inicializa correctamente, o los permisos declarados en el manifest no se otorgan de forma silenciosa en el entorno de pruebas, requiriendo interaccion manual que rompe la automatizacion.

## 3. Resolucion del `extensionId`
En Chromium, podemos extraer el `extensionId` dinamicamente interceptando el `service worker` (`background`). En Firefox, los UUIDs de las extensiones son dinamicos por defecto por motivos de seguridad. 
Para fijarlo, es necesario:
1. Hardcodear un ID en el `manifest.json` (ej: `browser_specific_settings.gecko.id`).
2. Configurar las preferencias de usuario de Firefox en Playwright (`extensions.webextensions.uuids`) para mapear ese ID a un UUID estatico.
Incluso con este enfoque, la comunicacion entre la pagina de setup y las APIs de la extension fallaba intermitentemente.

## 4. Contexto de Ejecucion y APIs de Extensiones
Al intentar crear datos de prueba (como usar `chrome.bookmarks.create`) dentro de `page.evaluate()` antes de cargar la UI de la extension, el objeto `chrome` o `browser` resultaba estar `undefined` o carecia de los permisos necesarios en Firefox. En Chromium, cargar previamente una pagina de la extension (`setup.html`) permite inyectar el contexto de la extension en el runner, pero en Firefox este workaround demostro ser inconsistente.

## Conclusion y Estrategia Actual
Dada la cantidad de falsos positivos y el tiempo requerido para mantener los workarounds en Firefox, la estrategia adoptada es:

- **E2E Automatizado**: Restringido a `Chromium` para asegurar que el flujo critico (UI, interacciones, import/export) funciona correctamente sin ruido de infraestructura.
- **Unit Testing**: Toda la logica core (remapeo de marcadores, estructura JSON, etc.) se prueba puramente en JS (independiente del navegador).
- **Validacion Firefox**: Se relega a validacion manual (smoke testing) o a una fase futura donde el soporte de Playwright para MV3 en Firefox alcance la paridad con Chromium.
