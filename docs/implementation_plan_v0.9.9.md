# Plan de Implementación - Pestañas y Optimización de Rendimiento (v0.9.9)

Este documento detalla la propuesta técnica para implementar la organización de marcadores mediante pestañas y la optimización de rendimiento en la carga del dashboard y búsquedas para grandes volúmenes de datos.

---

## Evidencia Empírica de la Prueba de Carga

Para justificar técnicamente el diseño de esta versión, creamos y ejecutamos un benchmark automatizado de rendimiento con Playwright (`e2e/tests/performance-load.spec.mjs`). Este test genera escenarios controlados de marcadores y evalúa tiempos críticos de renderizado y conteo de nodos en el DOM en Chromium.

### Resultados del Benchmark:

| Escenario | Carpetas Monitoreadas | Marcadores por Carpeta | Marcadores Totales | Nodos DOM Creados | Tiempo de Carga (Settle) | Tiempo de Búsqueda (Genérica) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A (Línea Base)** | 10 | 10 | 100 | **1,324** | 185 ms | 58 ms |
| **B (Carpetas Anchas)** | 5 | 100 | 500 | **5,639** | 453 ms | 279 ms |
| **C (Muchas Columnas)** | 250 | 2 | 500 | **9,804** | 339 ms | 257 ms |
| **D (Carga Masiva)** | 50 | 40 | 2000 | **22,904** | 967 ms | 794 ms |

### Conclusiones de los Datos:
1. **La sobrecarga del contenedor (Carpeta/Columna):** 
   El escenario C (500 marcadores en 250 carpetas) genera casi el doble de nodos DOM (**9,804**) que el escenario B (500 marcadores en 5 carpetas - **5,639**). Cada columna en martabs introduce una cabecera con botones, un wrapper de arrastre y contenedores adicionales. Por lo tanto, **el número de carpetas activas en pantalla es el factor más crítico para el rendimiento**.
2. **Lag de Entrada en la Búsqueda:** 
   Al superar los 20,000 nodos DOM (escenario D), la actualización del DOM para filtrar resultados al presionar teclas introduce un retardo de **794 ms**, arruinando la experiencia de búsqueda instantánea.

---

## Decisiones de Arquitectura

Para solucionar estos problemas de forma definitiva, implementaremos dos estrategias:

### 1. Renderizado Selectivo por Pestañas
* En lugar de ocultar las columnas que no correspondan a la pestaña activa mediante estilos CSS (`display: none` o `.is-hidden`), realizaremos un **renderizado selectivo real**.
* Al cambiar de pestaña (o cargar la extensión), limpiaremos el contenedor principal y **solo generaremos los elementos DOM de las carpetas asignadas a la pestaña activa**.
* Si un usuario tiene 250 carpetas pero las divide en 5 pestañas de 50, el DOM de su Dashboard principal solo renderizará 50 carpetas (~2,000 nodos en lugar de ~10,000), garantizando que martabs corra tan rápido como en su estado inicial (escenario A).

### 2. Paginación Interna (Límite y Carga Incremental)
* Limitaremos la carga inicial dentro de cada carpeta a **50 marcadores**.
* Si una carpeta contiene más de 50 marcadores:
  * Renderizaremos inicialmente solo los primeros 50.
  * Añadiremos un botónminimalista al final de la tarjeta: `"Ver más (X restantes)"`.
  * Al hacer clic, se obtendrán los siguientes 50 marcadores de la caché en memoria y se insertarán directamente al final del contenedor DOM mediante `.append()`.
  * Esto incrementa el límite en vivo sin alterar el scroll general de la página ni requerir redibujar el resto de las carpetas del dashboard.
* **Búsqueda global:** La barra de búsqueda superior seguirá buscando instantáneamente sobre el 100% de los marcadores en memoria (sin verse afectada por la paginación visual). La lista de resultados de búsqueda también estará limitada a 50 resultados iniciales con un botón "Ver más resultados" al final.

---

## Cambios Propuestos

### 1. Configuración y Almacenamiento
* Añadir a `defaultSettings`:
  * `tabs`: Array de objetos tab: `[{ id: "tab-uuid-1", name: "Trabajo" }, { id: "tab-uuid-2", name: "Personal" }]`
  * `folderTabs`: Objeto mapa: `folderId -> tabId`.
  * `activeTabId`: ID de la pestaña seleccionada (por defecto `"all"`).

### 2. Panel de Configuración (`setup.html` y `setup.js`)
* **Nueva pestaña "Pestañas" en la barra lateral:**
  * Interfaz interactiva para crear, renombrar, reordenar y eliminar pestañas personalizadas.
  * Asignación sencilla: Lista de carpetas monitoreadas con un menú desplegable `<select>` al lado de cada una para elegir su pestaña de destino (o "Sin pestaña").
* **Estilos y CSS:**
  * Tarjetas de pestañas y botones en [setup.css](file:///c:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/setup/setup.css).

### 3. Dashboard (`newtab.html` y `newtab.js`)
* **Barra de pestañas superior:**
  * Renderizar botones minimalistas tipo "píldora" (`#tabs-bar`) si existen pestañas configuradas.
  * Al clickear, actualizar `activeTabId`, persistirlo en storage y re-renderizar selectivamente.
* **Carga incremental:**
  * Implementar el corte en 50 marcadores por columna y la lógica de `.append()` interactivo en el botón "Ver más".

---

## Plan de Verificación

1. **Pruebas Unitarias (`npm test`):**
   * Validar que la ordenación visual respete los límites de renderizado.
   * Probar que el mapeo de pestañas filtre correctamente la lista de carpetas en el modelo de datos.
2. **Pruebas E2E (`npx playwright test`):**
   * Crear `e2e/tests/tabs-performance.spec.mjs` para cubrir la creación de pestañas, el cambio interactivo de pestañas en el tablero y el comportamiento del botón "Ver más".
   * Re-ejecutar `e2e/tests/performance-load.spec.mjs` al finalizar para documentar la drástica reducción de tiempos y nodos.
