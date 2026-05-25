# Diseno de extension para inicio de marcadores

## Objetivo

Crear una extension liviana para navegadores compatibles con WebExtensions que reemplace la pagina de Nueva pestana con un inicio local de marcadores. La extension debe ayudar a encontrar marcadores rapido mediante un tablero tipo start.me, busqueda instantanea, etiquetas, carpetas, favicons, previews livianas y una revision opcional de enlaces caidos.

La primera version debe sentirse privada, rapida y simple para uso personal, pero con una estructura prolija para poder publicarla mas adelante en Chrome Web Store y, con ajustes menores, en Firefox Add-ons.

## Direccion de producto

La direccion visual elegida es un tablero tipo start.me con detalles inspirados en Raindrop:

- Experiencia principal: bloques de marcadores agrupados por carpeta monitoreada o categoria visible para el usuario.
- Experiencia de busqueda: resultados instantaneos con mas datos de contexto.
- Marcadores: titulo, URL o dominio, favicon, etiquetas, fecha agregada si esta disponible, carpeta de origen y preview liviana.
- Etiquetas: automaticas por carpeta/dominio y manuales guardadas localmente.
- Salud de enlaces: revision opcional en segundo plano que avisa cuando un marcador parece roto durante varios dias.

La pagina de Nueva pestana nunca debe esperar chequeos de red ni generacion de previews para poder usarse.

## Primera configuracion

Al instalar la extension por primera vez, el usuario ve una pantalla de configuracion dentro de la extension.

La configuracion pide elegir que carpetas de marcadores del navegador quiere monitorear. El usuario puede seleccionar una o varias carpetas del arbol de marcadores. Solo se indexan los marcadores que esten dentro de esas carpetas.

La configuracion guarda:

- IDs de carpetas seleccionadas;
- si las etiquetas automaticas estan activadas;
- si las etiquetas manuales estan activadas;
- si la revision de enlaces caidos esta activada.

La revision de enlaces debe ser opcional porque puede requerir permisos mas amplios para consultar URLs externas y podria percibirse como mas invasiva al publicar la extension.

## Experiencia de Nueva pestana

La Nueva pestana carga desde datos locales cacheados por la extension.

Diseno por defecto:

- campo de busqueda superior;
- fila compacta de estado con cantidad de marcadores y carpetas monitoreadas;
- bloques de tablero agrupados por carpeta/categoria;
- filas o tarjetas de marcadores con favicon, titulo, dominio y etiquetas;
- area discreta de "Revisar enlaces" solo cuando existan fallos sostenidos.

Comportamiento de busqueda:

- filtra instantaneamente mientras el usuario escribe;
- busca por titulo, URL, dominio, ruta de carpeta, etiquetas automaticas y etiquetas manuales;
- cuando hay busqueda activa, la vista cambia de tablero a una lista de resultados mas rica;
- los resultados muestran titulo, URL/dominio, favicon, carpeta, etiquetas, fecha agregada y preview si existe.

La pagina debe ser comoda con teclado: foco inicial en busqueda, Enter abre el primer resultado y Escape limpia la busqueda.

## Sincronizacion de marcadores

La extension usa la API WebExtensions de marcadores del navegador como fuente principal.

Construye un indice local que contiene solo marcadores dentro de las carpetas seleccionadas. Escucha cambios del navegador y actualiza el indice cuando se crean, editan, mueven o borran marcadores.

El indice guarda datos normalizados para renderizar rapido:

- ID del marcador;
- ID de carpeta padre y ruta de carpeta;
- titulo;
- URL;
- dominio;
- fecha agregada si el navegador la provee;
- favicon o referencia de icono resuelta;
- etiquetas automaticas;
- etiquetas manuales;
- datos de preview liviana;
- estado de salud del enlace.

## Etiquetas

Las etiquetas automaticas se generan localmente desde:

- nombres de carpetas seleccionadas y carpetas superiores;
- dominios;
- palabras simples de URL o titulo cuando sean utiles y no agreguen ruido.

Las etiquetas manuales las crea el usuario y se guardan localmente por ID de marcador. Deben mantenerse separadas de las automaticas para que la extension pueda regenerar etiquetas automaticas sin pisar decisiones del usuario.

La interfaz debe permitir agregar y quitar etiquetas manuales desde un detalle del marcador o desde una fila expandida de resultado.

## Previews

La primera version usa previews livianas:

- favicon;
- dominio;
- titulo;
- URL;
- ruta de carpeta;
- fecha agregada;
- etiquetas.

La primera version no incluye capturas de pantalla ni extraccion pesada de metadatos remotos. Esas funciones pueden evaluarse despues si no comprometen velocidad ni permisos.

## Revision de enlaces caidos

La revision de enlaces es opcional y corre en segundo plano, nunca durante la carga de Nueva pestana.

Cuando esta activada:

- una tarea programada revisa pequenos lotes de marcadores periodicamente;
- los chequeos se distribuyen en el tiempo para evitar picos;
- un solo fallo no marca un marcador como roto;
- la extension guarda ultimo chequeo, cantidad de fallos consecutivos, fecha del primer fallo, ultimo estado y ultima fecha exitosa;
- un marcador aparece en "Revisar enlaces" solo despues de fallar durante al menos 10 dias.

Tipos de fallo esperados:

- HTTP 404 o 410;
- error DNS o red;
- timeout;
- respuesta inaccesible donde la extension no puede verificar la pagina con confianza.

Los fallos ambiguos deben tratarse de forma conservadora y no generar avisos fuertes.

El usuario puede:

- abrir el marcador;
- descartar el aviso;
- reiniciar el estado de salud;
- desactivar la revision de enlaces.

## Compatibilidad multinavegador

La base debe quedar preparada para Chrome y Firefox usando APIs WebExtensions siempre que sea posible.

La funcionalidad principal es viable en ambos navegadores:

- reemplazo de Nueva pestana mediante `chrome_url_overrides.newtab`;
- lectura del arbol de marcadores con permiso `bookmarks`;
- almacenamiento local;
- UI HTML/CSS/JavaScript empaquetada con la extension.

Para evitar acoplar la app a Chrome:

- el codigo de dominio no debe llamar directamente a `chrome.*` ni `browser.*`;
- debe existir un adaptador pequeno de APIs del navegador;
- la app principal debe consumir funciones propias como `bookmarks.getTree()`, `storage.get()`, `storage.set()` y `runtime.openOptions()`;
- el build puede generar manifiestos separados para Chrome y Firefox cuando haga falta.

Firefox requiere campos especificos para publicacion, como `browser_specific_settings.gecko.id` en Manifest V3. Chrome ignora ese campo, pero se prefiere manejar manifiestos por destino para evitar sorpresas de tienda.

La revision opcional de enlaces debe ser la parte mas cuidada para multinavegador, porque los permisos de host y su solicitud pueden comportarse distinto entre Chrome y Firefox. La primera version debe poder funcionar en ambos navegadores aunque esa funcion quede desactivada o limitada si no se conceden permisos.

## Arquitectura

La extension debe usar Manifest V3 y organizarse como WebExtension compatible con Chrome y Firefox.

Partes principales:

- manifiestos por navegador: declaran reemplazo de Nueva pestana, permisos de marcadores, permisos de almacenamiento, tarea programada y permisos opcionales para revisar URLs externas.
- UI de Nueva pestana: renderiza tablero y busqueda desde datos locales.
- UI de configuracion: permite elegir carpetas monitoreadas y preferencias.
- Service worker de fondo: escucha cambios de marcadores, actualiza el indice y ejecuta revision opcional de enlaces.
- Adaptador de navegador: encapsula diferencias entre Chrome y Firefox.
- Capa de almacenamiento: envuelve el acceso al almacenamiento de la extension para configuracion, indice, etiquetas manuales, previews y salud de enlaces.
- Modulo de busqueda/indice: normaliza marcadores y hace matching local rapido.
- Modulo de etiquetas: genera etiquetas automaticas y las combina con manuales.
- Modulo de salud de enlaces: agrupa, ejecuta y evalua chequeos opcionales.

## Flujo de datos

1. Primera instalacion abre configuracion.
2. El usuario selecciona carpetas monitoreadas.
3. El service worker lee el arbol de marcadores del navegador y crea el indice local.
4. La Nueva pestana carga configuracion e indice desde almacenamiento local.
5. El usuario busca o abre marcadores sin depender de la red.
6. Los cambios en marcadores del navegador actualizan el indice local.
7. Los chequeos opcionales de enlaces corren segun agenda y actualizan el estado de salud.
8. La Nueva pestana muestra un aviso discreto solo cuando hay fallos sostenidos.

## Manejo de errores

Si falla el acceso a marcadores, la Nueva pestana muestra un estado de configuracion/reintento en lugar de quedar en blanco.

Si no hay carpetas seleccionadas, el usuario vuelve a configuracion.

Si no hay favicon o preview, la UI usa una inicial del dominio o un icono generico.

Si la revision de enlaces falla por falta de permisos, la funcion se desactiva y muestra un mensaje claro en configuracion.

Si el almacenamiento de la extension contiene datos obsoletos, la extension puede reconstruir el indice desde el arbol de marcadores.

## Requisitos de rendimiento

La Nueva pestana debe cargar desde datos locales y no hacer trabajo de red en el render inicial.

Para unos 60 marcadores, la busqueda debe sentirse instantanea. El diseno tambien debe funcionar bien con algunos cientos de marcadores.

La implementacion inicial puede usar JavaScript, HTML y CSS sin framework para mantener bajo el tiempo de carga y la complejidad de publicacion.

## Consideraciones para publicacion

La extension debe pedir los permisos minimos para la experiencia base.

Permisos base:

- bookmarks;
- storage.

Permisos vinculados a funciones opcionales:

- tarea programada para revision de enlaces;
- permisos de host para consultar URLs externas.

La ficha de Chrome Web Store y la ficha de Firefox Add-ons deben explicar claramente que los marcadores se indexan localmente y que la revision opcional de enlaces necesita consultar URLs guardadas en segundo plano.

Para Firefox se debe considerar `browser_specific_settings.gecko` y las declaraciones de datos requeridas por AMO al momento de publicar.

## Fuera de alcance para primera version

- sincronizacion en la nube;
- cuentas;
- servicios pagos;
- capturas de pantalla de sitios;
- resumenes con IA;
- edicion completa o reorganizacion avanzada de marcadores;
- importacion desde servicios como Raindrop o start.me;
- soporte para navegadores que no implementen las APIs WebExtensions necesarias.

## Criterios de aceptacion

- La extension reemplaza la pagina de Nueva pestana en Chrome y queda preparada para hacerlo tambien en Firefox.
- La primera configuracion permite elegir carpetas de marcadores a monitorear.
- La Nueva pestana muestra marcadores monitoreados agrupados en un tablero tipo start.me.
- La busqueda filtra instantaneamente por titulo, URL, carpeta, dominio y etiquetas.
- Los marcadores muestran titulo, URL/dominio, favicon con fallback, etiquetas y fecha agregada cuando este disponible.
- Las etiquetas automaticas y manuales funcionan.
- La extension actualiza su indice cuando cambian los marcadores monitoreados.
- La revision de enlaces es opcional y no corre durante la carga de Nueva pestana.
- Los enlaces rotos sostenidos aparecen solo despues de un umbral de 10 dias.
- La extension puede ejecutarse localmente durante desarrollo y queda preparada para empaquetarse mas adelante para Chrome Web Store y Firefox Add-ons.
- La arquitectura evita dependencias directas de Chrome en la logica principal y deja una base razonable para empaquetar una variante Firefox.
