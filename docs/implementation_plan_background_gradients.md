# Plan de Implementacion - Fondos con degradados

## Objetivo

Agregar fondos con degradados a martabs como una alternativa liviana a los fondos con imagen. La funcion debe mantener la carga rapida de la nueva pestana, cuidar la legibilidad y evitar sumar permisos o almacenamiento pesado.

Esta etapa incluye degradados estaticos, presets, editor basico y animacion Aurora. La animacion Aurora se implementara despues de que el resto de la funcionalidad este estable, pero forma parte del alcance de esta version.

## Criterios de producto

- Debe sentirse como una mejora visual simple, no como un editor de temas complejo.
- No debe pedir permisos nuevos.
- Debe funcionar en Chrome y Firefox.
- Debe respetar modo claro, oscuro, automatico y RTL.
- Debe mantener buen contraste sobre tarjetas, texto, buscador y botones.
- Debe tener fallbacks seguros si falta configuracion o hay datos antiguos.

## Alcance recomendado

1. Agregar tipo de fondo: imagen, degradado y sin fondo si la estructura actual lo permite.
2. Agregar una galeria de presets de degradados sobrios.
3. Agregar editor personalizado simple.
4. Compartir controles de legibilidad con los fondos de imagen.
5. Guardar la configuracion de forma estructurada.
6. Agregar animacion Aurora como parte final de la etapa.

## Modelo de datos

No se recomienda guardar el CSS final del degradado como fuente principal. Es preferible guardar una configuracion estructurada y generar el CSS al renderizar.

Ejemplo:

```js
{
  type: "linear",
  colorA: "#1f2937",
  colorB: "#0f766e",
  angle: 135,
  presetId: "deep-teal",
  animated: false
}
```

Ventajas:

- Es mas facil validar.
- Es mas facil migrar en versiones futuras.
- Evita persistir strings CSS invalidos.
- Facilita tests unitarios.
- Permite modificar la generacion visual sin romper datos guardados.

## Interfaz

En Configuracion > Apariencia, el control de fondo deberia ser progresivo:

1. Selector de tipo de fondo.
2. Si el usuario elige Degradado, mostrar presets.
3. Mostrar una opcion de Personalizar para abrir controles avanzados.
4. Dentro de Personalizar:
   - color inicial
   - color final
   - tipo lineal/radial
   - angulo solo si el tipo es lineal

Evitar mostrar todos los controles a la vez. La seccion Apariencia ya tiene varias opciones y debe seguir sintiendose limpia.

## Presets

Los presets deberian ser usables como fondo real de una pagina de inicio, no parecer fondos decorativos de landing page. Conviene evitar combinaciones demasiado saturadas o de bajo contraste.

Propuesta de direccion visual:

- oscuro neutro
- azul grisaceo
- verde profundo
- amanecer suave
- arena calida
- alto contraste oscuro

Cada preset deberia tener un `presetId` estable, no depender del nombre visible traducido.

## Legibilidad

Los degradados deben compartir la misma logica de legibilidad que los fondos con imagen:

- esquema de interfaz: automatico, claro u oscuro
- ajuste de legibilidad/intensidad si ya existe para fondos
- tarjetas algo mas solidas cuando hay fondo personalizado activo
- bordes y sombras suficientemente definidos

La legibilidad debe priorizarse sobre la pureza visual del degradado.

## Animacion Aurora

La animacion Aurora se hara en esta etapa, pero despues de terminar y verificar:

1. degradados estaticos
2. presets
3. editor personalizado
4. persistencia
5. legibilidad
6. tests base

Notas de implementacion:

- Debe estar desactivada por defecto.
- Debe respetar `prefers-reduced-motion: reduce`.
- Debe poder desactivarse desde Configuracion.
- Debe evitar elementos decorativos pesados si afectan rendimiento.
- Debe priorizar animaciones baratas, preferentemente `transform` o cambios suaves de `background-position`.
- Evitar blur excesivo permanente sobre areas grandes, especialmente en Firefox.
- Si se usan capas Aurora, deben estar contenidas en el fondo y no interferir con clicks, foco ni lectura.

La animacion debe sentirse sutil. Si compite visualmente con los marcadores, esta mal calibrada.

## Riesgos

- Apariencia demasiado cargada si se muestran muchos controles.
- Presets demasiado saturados que bajan legibilidad.
- Animacion con costo alto de GPU en equipos modestos.
- Diferencias de rendimiento entre Chrome y Firefox.
- Configuracion incompleta en usuarios que actualizan desde versiones anteriores.

## Fallbacks

- Si falta la configuracion del degradado, usar el fondo normal del tema.
- Si el tipo de fondo no es reconocido, volver a sin fondo personalizado.
- Si falta un color, usar el preset por defecto.
- Si `animated` esta activo pero el sistema pide reducir movimiento, renderizar degradado estatico.

## Pruebas recomendadas

Unitarias:

- defaults y migracion cuando no existe configuracion de degradado
- generacion de CSS valido desde configuracion estructurada
- fallback ante configuracion incompleta
- persistencia de preset y custom gradient
- animacion desactivada con reduced motion
- claves i18n nuevas presentes en todos los idiomas

Interfaz:

- alternar entre imagen y degradado
- aplicar preset y ver reflejo en preview/tablero
- modificar colores y angulo
- guardar cambios y recargar
- quitar fondo o volver a tipo anterior
- activar/desactivar Aurora

Manual:

- Chrome y Firefox
- modo claro, oscuro y automatico
- idioma RTL
- equipos o perfiles de bajo rendimiento
- nueva pestana abierta repetidamente para detectar demoras

## Recomendacion final

Avanzar con degradados en esta version. Primero construir la base estatica y confiable; luego sumar Aurora como mejora final, con controles conservadores y rendimiento verificado.

