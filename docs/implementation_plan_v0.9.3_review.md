# Devolucion sobre implementation_plan_v0.9.3

> **Para Gemini / Antigravity / Codex:** esta nota revisa el plan adjunto `implementation_plan_v0.9.3.md`. No es una implementacion. Usar como correccion de alcance antes de escribir codigo.

## Opinion general

El plan va en una direccion interesante: **Sitios frecuentes** y **Estadisticas locales de uso** encajan bien con martabs porque agregan utilidad sin depender de servicios externos.

Pero hay cuatro correcciones importantes antes de implementarlo:

1. La version debe ser **0.9.3**, no 0.9.4.
2. Los elementos de **Sitios frecuentes** no deben poder fijarse si eso implica crear un marcador real automaticamente.
3. Las estadisticas locales deben ser opcionales, simples y claramente privadas.
4. Es buen momento para agregar idioma **ruso (`ru`)**. No agregaria otro idioma en esta misma pasada salvo que se acepte una revision visual extra para RTL.

---

## 1. Version correcta: 0.9.3

El plan adjunto dice `v0.9.4`, pero el proyecto esta en `0.9.2`, por lo que esta iteracion debe ser **0.9.3**.

Archivos a tener en cuenta al implementar:

- `package.json`
- `src/manifest.base.json`
- documentacion que mencione la version
- paquetes generados en `release/`, cuando corresponda

---

## 2. Sitios frecuentes: si, pero como carpeta virtual de solo lectura

La idea de `topSites` es buena si queda **desactivada por defecto** y el permiso se pide solo cuando el usuario la activa.

### Si permitir

- Activar/desactivar **Sitios frecuentes** desde Configuracion.
- Pedir permiso opcional `topSites` solo al activar la funcion.
- Quitar el permiso al desactivar la funcion, si el navegador lo permite.
- Mostrar Sitios frecuentes como carpeta virtual.
- Elegir cantidad visible: por ejemplo 4, 8, 12 o 16.
- Cambiar vista de esa carpeta: lista, compacta, iconos, iconos grandes, quicklinks.
- Ordenar visualmente la carpeta dentro del tablero.
- Ocultar sitios individuales mediante una blacklist local de URLs.
- Incluirlos en busqueda si la funcion esta activa.
- Mostrar una etiqueta clara tipo `Frecuente`.

### No permitir en v0.9.3

- No editar titulo.
- No editar URL.
- No editar tags.
- No cambiar favicon custom.
- No revisar enlace caido.
- No capturar preview local automaticamente.
- No exportarlos como marcadores reales.
- No permitir que se suelten marcadores dentro de Sitios frecuentes.
- No permitir arrastrar un sitio frecuente a una carpeta real en esta version.
- No mostrar boton de fijar si el elemento no corresponde a un marcador real.

### Decision sobre fijar topSites

Coincido con la observacion del usuario: si para fijar un sitio frecuente hace falta crear un marcador real en el navegador, entonces **es mejor no permitir fijarlo**.

Crear un marcador real desde una accion aparentemente visual puede sentirse invasivo y sorpresivo. En martabs venimos cuidando mucho la diferencia entre organizacion local y cambios reales en el navegador. Conviene mantener esa linea.

Recomendacion para v0.9.3:

- En elementos de `topSites`, ocultar o deshabilitar el boton de fijar.
- Si se quiere ofrecer una accion futura, que sea explicita: **Crear marcador** o **Guardar como marcador**, con confirmacion clara y seleccion de carpeta. No mezclarlo con "Fijar".

---

## 3. Permisos y API

El permiso `topSites` debe ser opcional.

En `src/manifest.base.json`:

- Agregar `topSites` en `optional_permissions`, no en permisos obligatorios.
- Mantener `bookmarks` y `storage` como permisos base.

En `src/shared/browser-api.js`:

- Agregar wrapper para `topSites.get`.
- No hace falta agregar `bookmarks.create` para v0.9.3 si se elimina la creacion automatica de marcadores desde topSites.

En Configuracion:

- Si el usuario activa Sitios frecuentes, pedir `topSites`.
- Si acepta, guardar `showTopSitesFolder: true`.
- Si rechaza, dejar la opcion apagada y mostrar mensaje claro.
- Si desactiva, guardar `showTopSitesFolder: false` e intentar remover `topSites`.

---

## 4. Estadisticas locales de uso

Me parece una buena funcion, pero debe entrar como **opcion de privacidad**, no como comportamiento automatico.

### Recomendacion de alcance para v0.9.3

Agregar una opcion en Configuracion:

- **Estadisticas de uso locales**
- Desactivada por defecto.
- Texto sugerido: "Registra aperturas hechas desde martabs para mostrar recientes, mas usados y mejorar el orden de busqueda. No usa historial del navegador ni envia datos fuera del dispositivo."

### Que registrar

Solo eventos originados dentro de martabs:

- `bookmarkId`
- `url`
- `title`
- `folderId` o `folderPath`, si esta disponible
- `openedAt`
- tipo de apertura: click normal, click central, teclado, si aplica

### Que no registrar

- No registrar navegacion fuera de martabs.
- No pedir permiso `history`.
- No leer historial global del navegador.
- No registrar texto crudo de busquedas en v0.9.3.
- No registrar topSites como estadistica salvo que el usuario abra un topSite desde martabs y las estadisticas esten activas.

### Retencion

El plan propone 90 dias. Es razonable.

Recomendacion:

- Mantener eventos de 90 dias.
- Guardar tambien agregados por marcador para no depender solo del log crudo.
- Limpiar datos viejos al registrar un nuevo evento y al abrir Configuracion.

### UI inicial recomendada

Evitaria hacer una seccion demasiado pesada de entrada. Para v0.9.3 alcanza con:

- Total de aperturas registradas.
- Marcadores mas usados.
- Marcadores recientes.
- Boton para borrar estadisticas.
- Boton para exportar JSON.
- Pequeno resumen de almacenamiento local usado.

El grafico de barras CSS esta bien, pero no deberia convertirse en el centro del cambio. Primero que los datos sean correctos, livianos y privados.

---

## 5. Carpetas virtuales derivadas de estadisticas

Si se habilitan estadisticas locales, se abre la puerta a dos carpetas virtuales utiles:

- **Recientes**
- **Mas usados**

Recomendacion:

- No meterlas obligatoriamente en el primer corte si alarga demasiado v0.9.3.
- Si se agregan, deben ser opcionales y de solo lectura.
- No deben aceptar drops.
- No deben permitir editar URL/tags/favicons si el item no esta renderizado desde el marcador real original.

Una opcion conservadora:

- v0.9.3: registrar estadisticas y mostrar panel.
- v0.9.4: carpetas virtuales Recientes / Mas usados y ranking de busqueda.

---

## 6. Idiomas: agregar ruso

Actualmente existen:

- `de`
- `en`
- `es`
- `fr`
- `it`
- `ja`
- `ko`
- `pt`
- `zh_CN`

Falta un idioma importante: **ruso (`ru`)**.

Recomendacion para v0.9.3:

- Crear `src/_locales/ru/messages.json`.
- Agregar opcion `ru` al selector de idioma en `src/setup/setup.html`.
- Agregar claves `languageRu` en todos los locales.
- Actualizar textos de busqueda de ajustes si corresponde.
- Asegurar paridad con `tests/i18n.test.js`.
- Revisar visualmente Configuracion y tablero con textos rusos, porque algunas etiquetas pueden ser mas largas que en ingles/espanol.

### Otros idiomas posibles

El otro idioma fuerte que falta es **arabe (`ar`)**, pero no lo agregaria automaticamente en esta misma pasada sin una revision RTL. Arabe implica direccion `rtl`, alineaciones, iconos direccionales, truncado y layout. Es mejor hacerlo bien que sumarlo apurado.

Otros candidatos futuros:

- `tr`: turco
- `pl`: polaco
- `nl`: neerlandes

Pero para v0.9.3, mi recomendacion clara es: **agregar ruso ahora y dejar arabe como mejora posterior con soporte RTL probado**.

---

## 7. Cambios al plan adjunto

### Quitar del plan

- Crear marcador real al fijar un topSite.
- Agregar wrapper `bookmarks.create` si solo se usaba para esa accion.
- Drag and drop desde topSites hacia carpetas reales en v0.9.3.
- Pregunta abierta sobre si crear en "Otros marcadores" o carpeta "Favoritos fijados".

### Mantener del plan

- `topSites` como permiso opcional.
- Carpeta virtual `__martabs_topsites__`.
- Blacklist local para ocultar sitios frecuentes.
- Limite configurable.
- Estadisticas locales opcionales.
- Exportar/borrar estadisticas.
- Auditoria simple de almacenamiento local.

### Agregar al plan

- Version `0.9.3`.
- Idioma ruso.
- Garantia explicita: topSites no modifica marcadores reales.
- Tests de que topSites no muestra editar/fijar y no acepta drops.
- Tests de que las estadisticas no registran nada si la opcion esta desactivada.
- Actualizacion de privacidad/documentacion para explicar `topSites` y estadisticas locales.

---

## 8. Tests recomendados

Unitarios:

- Storage default incluye `showTopSitesFolder: false`, `topSitesLimit`, `topSitesBlacklist` y flag de estadisticas.
- i18n mantiene paridad de claves incluyendo `ru`.
- Estadisticas no registran si estan desactivadas.
- Estadisticas registran apertura si estan activadas.
- Limpieza elimina eventos mayores a 90 dias.
- Blacklist de topSites filtra URLs ocultas.

Newtab/static:

- Elementos topSites no tienen boton editar.
- Elementos topSites no tienen boton fijar.
- Carpeta topSites no acepta drops.
- Busqueda incluye topSites solo si la opcion esta activa.

E2E/Manual:

- Activar Sitios frecuentes solicita permiso `topSites`.
- Rechazar permiso deja la opcion apagada.
- Desactivar intenta retirar permiso.
- Ocultar un sitio frecuente lo elimina de la carpeta.
- Activar estadisticas, abrir marcadores y ver datos en Configuracion.
- Borrar estadisticas limpia panel y storage.
- Cambiar idioma a ruso y revisar tablero/configuracion.

---

## Conclusion

El plan es bueno como direccion, pero para v0.9.3 conviene recortarlo y hacerlo mas cuidadoso:

- **TopSites opcional, virtual y de solo lectura.**
- **Nada de crear marcadores reales al fijar.**
- **Estadisticas locales opcionales y simples.**
- **Agregar ruso.**
- **Dejar arabe/RTL para una iteracion posterior.**

