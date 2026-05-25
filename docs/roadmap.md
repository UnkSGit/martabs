# Roadmap futuro - martabs

Este documento agrupa ideas para las proximas versiones. No representa trabajo en curso: sirve para priorizar y para que Codex y Gemini/Antigravity compartan el mismo contexto.

## Prioridad sugerida

1. Favoritos fijados.
2. Modos de visualizacion por carpeta.
3. Multilenguaje.
4. Orden manual y drag & drop.

(Nota: El Paso 1 "Preview visual por metadata" fue descartado por ser pesado y requerir muchas peticiones de red; el Paso 2 "Captura al visitar" y el Paso 3 "Edicion desde la UI" ya fueron completados).



## 2. Captura al visitar un sitio

Idea: si el usuario abre un marcador, martabs podria guardar una captura reducida para usarla como preview futura.

Estado: implementado y validado manualmente para marcadores abiertos desde martabs.

Esto requiere un diseno cuidadoso:

- La API disponible captura la parte visible de la pestana activa, no una captura completa y silenciosa de cualquier pagina.
- Para hacerlo de forma confiable harian falta permisos sensibles como `activeTab` o permisos de host amplios.
- La captura deberia ser opcional y explicita en configuracion.
- Conviene guardar una imagen pequena, por ejemplo WebP/JPEG de baja resolucion.
- Debe existir limite de cache y limpieza automatica para no inflar `storage.local`.
- Si nunca se visito el sitio, se mantiene el fallback local o metadata.

Version recomendable:

- Agregar opcion `Guardar previews al visitar marcadores`.
- Capturar solo cuando el usuario abre un marcador desde martabs.
- Esperar a que la pagina cargue y capturar la pestana visible si el navegador lo permite.
- Reducir la imagen antes de guardarla.
- Usar esa captura en la vista previa y en modos visuales futuros.

Version actual:

- La opcion existe como `Capturar previews locales al abrir marcadores`.
- Pide permiso opcional desde Configurar.
- Arma una captura pendiente antes de navegar.
- Resuelve la captura cuando la pestana informa carga completa.
- Guarda la imagen en cache local y la usa en la tarjeta de preview.
- Hay test de regresion para proteger este flujo.

Prueba experimental agregada:

- Con una pagina abierta, hacer click en el icono de martabs en la barra del navegador.
- Si la URL coincide con un marcador monitoreado, martabs intenta capturar la pestana visible.
- La captura se guarda localmente y aparece en la tarjeta de preview del marcador.
- El icono muestra `OK` si pudo guardar la captura o `NO` si no hubo coincidencia o fallo el permiso.

Evolucion aprobada:

- Cuando el usuario abre un marcador desde martabs, la extension intenta capturar automaticamente esa pagina despues de cargar. Esto ya esta implementado.
- La captura automatica requiere activar `Capturar previews locales` en configuracion y aceptar el permiso opcional del navegador.
- No debe capturar navegacion general del usuario ni paginas abiertas fuera de martabs.
- Cuando se implemente la edicion de marcadores, agregar una opcion por marcador: `No capturar imagen de este marcador`.
- Si un marcador tiene la captura desactivada, la preview debe mostrar un estado visual distinto al fallback normal y distinto a un error de carga.

Riesgos:

- Puede aumentar el nivel de permisos percibido por Chrome Web Store.
- Puede variar entre Chrome y Firefox.
- Puede fallar si el sitio tarda en cargar, abre otra pestana, redirige o muestra login.

## 3. Edicion desde la UI

Objetivo: que martabs no sea solo un indice, sino tambien una forma rapida de corregir marcadores.

Funciones posibles:

- Renombrar marcador.
- Editar URL.
- Editar tags manuales.
- Eliminar marcador.
- Mas adelante, mover marcador entre carpetas.

Primera version recomendable:

- Menu contextual o boton de editar por marcador.
- Modal simple con nombre, URL y tags.
- Guardar con la API de bookmarks y actualizar el indice.
- Confirmacion visual corta despues de guardar.

## 4. Favoritos fijados

Objetivo: permitir destacar enlaces importantes aunque esten dentro de carpetas grandes.

Funciones posibles:

- Fijar marcador arriba de su carpeta.
- Mostrar una seccion global de favoritos fijados.
- Permitir atajos visuales grandes para favoritos clave.
- Guardar el orden de fijados en configuracion local.

Primera version recomendable:

- Accion `Fijar` en cada marcador.
- Los fijados aparecen al inicio de su carpeta.
- Opcionalmente, se puede agregar un widget superior `Fijados`.

## 5. Modos de visualizacion por carpeta

Inspirado en start.me, cada carpeta podria tener su propio tipo de widget.

Modos posibles:

- Lista compacta.
- Lista con dominio y tags.
- Grilla de iconos.
- Tarjetas con preview.
- Quicklinks con iconos grandes.
- Carpeta colapsada.

Primera version recomendable:

- Guardar un `viewMode` por carpeta.
- Empezar con `lista compacta`, `iconos` y `tarjetas`.
- Mantener la busqueda funcionando igual en todos los modos.

## 6. Multilenguaje

Objetivo: preparar martabs para publicar y compartir con usuarios que no usen espanol.

Forma recomendable:

- Usar el sistema nativo de internacionalizacion de extensiones: carpetas `_locales` y mensajes por idioma.
- Empezar con `es` e `en`.
- Extraer textos visibles de `newtab`, `setup`, manifest y mensajes de estado.
- Mantener una clave por texto para que Codex y Gemini/Antigravity no editen strings sueltos en distintos archivos.
- Documentar como agregar un idioma nuevo.

Ventajas:

- Es compatible con Chrome y Firefox.
- No requiere librerias pesadas.
- Ayuda mucho si la extension se publica o comparte.

Limitaciones:

- Hay que mantener los textos sincronizados.
- Algunos textos dinamicos deben armarse con placeholders.
- Conviene hacerlo cuando la UI este bastante estable para no traducir pantallas que cambian mucho.

## 7. Orden manual y drag & drop

Objetivo: que el usuario organice visualmente sin tener que ir al gestor de marcadores.

Funciones posibles:

- Ordenar por titulo, fecha, dominio, carpeta o estado.
- Fijar un orden manual por carpeta.
- Arrastrar dentro de una carpeta.
- Mas adelante, arrastrar entre carpetas.

Primera version recomendable:

- Agregar selector de orden por carpeta.
- Despues implementar drag & drop solo dentro de la misma carpeta.
