# Roadmap futuro - martabs

Este documento agrupa ideas para las proximas versiones. No representa trabajo en curso: sirve para priorizar y para que Codex y Gemini/Antigravity compartan el mismo contexto.

## Prioridad sugerida

1. Preview visual por metadata con cache local.
2. Edicion de nombre, URL y tags desde la UI.
3. Favoritos fijados.
4. Modos de visualizacion por carpeta.
5. Orden manual y drag & drop.

## 1. Preview visual por metadata con cache local

Objetivo: mejorar la vista previa sin depender de servicios pagos ni servidores externos.

Primera version propuesta:

- Mantener el fallback actual cuando no haya datos.
- Intentar obtener metadata del sitio: `og:image`, `twitter:image`, titulo y descripcion.
- Guardar el resultado en cache local por marcador.
- Permitir refrescar la preview manualmente.
- Evitar cargar previews durante el arranque de la Nueva pestana.

Ventajas:

- Sigue siendo liviano.
- No requiere infraestructura propia.
- Mejora mucho los marcadores de sitios que ya publican imagen social.

Limitaciones:

- No todos los sitios exponen metadata util.
- Algunos sitios bloquean lecturas por CORS o seguridad.
- La imagen no siempre representa exactamente la pagina guardada.

## 2. Captura al visitar un sitio

Idea: si el usuario abre un marcador, martabs podria guardar una captura reducida para usarla como preview futura.

Esto parece viable, pero requiere un diseno cuidadoso:

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

## 6. Orden manual y drag & drop

Objetivo: que el usuario organice visualmente sin tener que ir al gestor de marcadores.

Funciones posibles:

- Ordenar por titulo, fecha, dominio, carpeta o estado.
- Fijar un orden manual por carpeta.
- Arrastrar dentro de una carpeta.
- Mas adelante, arrastrar entre carpetas.

Primera version recomendable:

- Agregar selector de orden por carpeta.
- Despues implementar drag & drop solo dentro de la misma carpeta.
