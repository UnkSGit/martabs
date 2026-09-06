# Publicacion manual de martabs 1.0.1

## Archivos

Descargar los ZIP de [GitHub Releases](https://github.com/UnkSGit/martabs/releases/tag/v1.0.1):

- Chrome: `martabs-chrome-v1.0.1.zip`.
- Firefox: `martabs-firefox-v1.0.1.zip`.

Subir el ZIP especifico de cada navegador, no el archivo automatico «Source code» de GitHub. La version del manifest es 1.0.1. Chrome ya publico 1.0.0, por eso este lanzamiento usa un numero superior.

## Chrome Web Store

1. Iniciar sesion en el [panel de desarrolladores](https://chrome.google.com/webstore/devconsole) con la cuenta propietaria.
2. Abrir el articulo existente **martabs**, ID `fclhhlmpekebflpnihhkfocpnibmiiph`.
3. En **Package / Paquete**, elegir **Upload new package / Subir nuevo paquete** y seleccionar el ZIP de Chrome.
4. Esperar la validacion y comprobar que aparece la version 1.0.1.
5. En la ficha y en las practicas de privacidad, mantener la URL [de la politica actualizada](https://unksgit.github.io/martabs/privacy_policy.html). Los widgets opcionales consultan Open-Meteo y ESPN; la politica explica tambien las solicitudes de iconos. No reutilizar afirmaciones antiguas como «no usa APIs externas» o «exporta las estadisticas y las imagenes».
6. Enviar para revision. Para publicar cuando Google la apruebe, mantener activada la publicacion automatica; de lo contrario, sera necesario publicarla manualmente despues de la aprobacion.

[Documentacion oficial de actualizaciones de Chrome](https://developer.chrome.com/docs/webstore/update).

## Mozilla Add-ons

1. Iniciar sesion en el [Developer Hub](https://addons.mozilla.org/developers/).
2. Abrir **martabs** en los complementos existentes y elegir la opcion para subir una nueva version.
3. Subir `martabs-firefox-v1.0.1.zip` y esperar la validacion. Mantener la distribucion en addons.mozilla.org si esa es la distribucion del complemento actual.
4. Confirmar la version 1.0.1 y el mismo ID de complemento del articulo existente. El paquete conserva `martabs@example.local`; no crear una ficha nueva ni cambiar ese ID para actualizar.
5. Agregar las novedades de abajo. Para instrucciones privadas al revisor, usar [reviewer_notes.md](reviewer_notes.md). No se requiere cuenta ni credenciales para probar martabs.
6. El paquete contiene JavaScript legible, sin minificacion, transpilacion ni ofuscacion. Si se solicita el proyecto fuente, esta disponible en el tag v1.0.1; `npm ci` y `npm run build:firefox` reproducen la carpeta de la extension.
7. Revisar la ficha y la politica de privacidad, completar el envio y comprobar el estado en el panel. El ZIP de GitHub aun no esta firmado; Mozilla gestiona la firma y la distribucion de la version aprobada.

[Documentacion oficial de empaquetado y envio de Mozilla](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#package-sign-and-publish-your-extension).

## Novedades listas para copiar

```text
Version 1.0.1
- Corregida la perdida de tareas al usar varias pestanas del tablero.
- Las notas se guardan inmediatamente, incluso al cerrar la pestana.
- Mejorada la restauracion de idiomas, pestanas, widgets y fondos desde respaldos.
- Compatibilidad con configuraciones anteriores y validacion de permisos al importar.
- Mejoras de interfaz, traducciones y documentacion de privacidad.
```

Las capturas preparadas estan en `docs/assets/store_screenshots/final/`, separadas para Chrome y Firefox. Para actualizar solo el codigo no hace falta reemplazar las capturas de la ficha.
