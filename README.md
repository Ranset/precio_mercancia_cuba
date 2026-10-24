# Precio Cuba

Calcula el precio de venta en Cuba (CUP) de mercancía comprada en México (MXN), y organiza las compras en **viajes** — igual que la hoja de cálculo `Mercancía Ale.xlsx` de la que nació esta app, pero con historial de varios viajes, cálculo instantáneo y sin depender de Excel.

App sin cuentas de usuario: todos los datos (viajes, artículos, configuración) se guardan **solo en el dispositivo**.

## Stack

- **React 19 + TypeScript + Vite** — UI y build.
- **Capacitor 8** — empaqueta la misma app web como APK de Android (y a futuro iOS).
- **vite-plugin-pwa** — la misma app también se puede instalar como PWA en cualquier otro dispositivo (Windows, iPhone, etc.) sin pasar por una tienda de apps.
- **@capacitor/preferences** — persistencia local (SharedPreferences en Android, `localStorage` en la web).
- **jsPDF + jspdf-autotable / xlsx (SheetJS)** — exportar un viaje a PDF o Excel (cargadas solo al exportar, no en cada arranque de la app — ver [Exportar un viaje](#exportar-un-viaje-a-pdf-o-excel)).
- **@capacitor/filesystem + @capacitor/share** — en Android, guardan el archivo exportado y abren la hoja de compartir nativa del sistema.
- **Vitest** — pruebas del motor de cálculo, verificadas línea por línea contra `Mercancía Ale.xlsx`.
- Sin librería de componentes: CSS propio, mobile-first, con tema claro/oscuro automático.

## El modelo de cálculo

Replica exactamente las fórmulas del Excel original:

| Concepto | Fórmula |
|---|---|
| Costo total de un artículo (MXN) | `Cantidad × Costo del artículo` |
| Precio de venta del artículo (CUP), sin redondear | `(Costo ÷ TasaMXN × TasaCUP) + (GananciaKg ÷ ArtículosPorKg × TasaCUP)` |
| Precio en Cuba (corregido) | `redondear hacia arriba al múltiplo de 10` (equivalente a `=CEILING(precio,10)`) |
| Precio total del artículo (CUP) | `Cantidad × Precio en Cuba` |
| Inversión total de un viaje (MXN) | suma del costo total de todos sus artículos |
| Monto total del viaje (CUP) | suma del precio total de todos sus artículos |
| Venta total convertida (MXN) | `Monto total del viaje ÷ Precio de la remesa` |
| Peso de un artículo (kg) | `Cantidad ÷ Artículos por Kg` |
| Peso total del viaje (kg) | suma del peso de todos sus artículos |
| Ganancia del viaje (MXN) | `Venta total convertida − Inversión total` |

El peso no viene del Excel original (se agregó después): si 1 kg trae 2 artículos y se agregan 3 al viaje, esos 3 pesan 3 ÷ 2 = 1.5 kg. Se ve por artículo en la tabla, como total en el resumen del viaje, y en las exportaciones a PDF/Excel.

### Dos formas de indicar el peso

En la Calculadora y en el formulario de artículos de un viaje, un switch deja elegir cómo se indica el peso del artículo: **Artículos por kg** (como en el Excel) o **Peso por artículo** (kilogramos que pesa una unidad, ej. `0.012 kg`). Bajo el campo se ve la equivalencia (`≈ 83.33 art/kg` o `≈ 0.012 kg por artículo`). Cada modo recuerda su propio valor al alternar.

En el segundo modo el artículo guarda `pesoArticuloKg` y los cálculos usan ese peso directamente (ganancia por artículo = `GananciaKg × PesoKg`; peso = `Cantidad × PesoKg`). `articulosPorKg` se guarda igual (`1 ÷ PesoKg`), pero solo para mostrarlo y exportarlo. No se calcula a través de `1 ÷ PesoKg`, y el peso se redondea a 6 decimales (1 mg) antes de multiplicar, porque la coma flotante binaria no representa exacto un decimal como `0.035` y, tras el redondeo a múltiplo de 10, a veces subía el precio 10 CUP de más. Al reabrir un artículo, el formulario vuelve al modo con que se creó.

Ver [`src/lib/calculations.ts`](src/lib/calculations.ts) y sus pruebas en [`src/lib/calculations.test.ts`](src/lib/calculations.test.ts), que reproducen las 19 filas y los totales exactos del Excel original (`npm test`).

### Tasas: por viaje, no globales

**Tasa del peso mexicano**, **Tasa del peso cubano** y **Precio de la remesa** se guardan **dentro de cada viaje** (igual que las celdas de cada hoja del Excel), no como un valor único global. Configuración solo define los valores que se copian:

- a la Calculadora de la pantalla inicial, y
- a un viaje nuevo en el momento de crearlo.

Después de creado, cada viaje conserva sus propias tasas y se pueden editar solo para ese viaje (recalculando todos sus artículos), sin afectar a los demás viajes ya guardados ni a Configuración. Así, un viaje de hace dos meses no cambia de precio si hoy ajustas la tasa de cambio.

## Estructura del proyecto

```
src/
  types.ts                 Tipos de dominio (Settings, Trip, TripItem)
  lib/
    calculations.ts        Motor de cálculo (puro, sin dependencias de UI)
    calculations.test.ts   Pruebas validadas contra el Excel
    storage.ts              Lectura/escritura en @capacitor/preferences
    format.ts               Formato de moneda (MXN/CUP/USD) y fecha
    defaults.ts              Valores por defecto y sugerencia de nombre de viaje
  state/
    AppDataContext.tsx     Estado global (viajes + configuración) y persistencia
  components/               Piezas de UI reutilizables (slider, modales, campos, íconos)
  pages/
    Home.tsx                Calculadora inicial
    Trips.tsx                Lista de viajes
    TripDetail.tsx            Detalle de un viaje (artículos + edición + totales)
    Settings.tsx              Configuración (tasas por defecto)
  App.tsx                   Rutas + navegación inferior
android/                    Proyecto nativo de Android (generado por Capacitor)
assets/                     Ícono y splash fuente (usados por @capacitor/assets)
public/icons/               Íconos de la PWA
```

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Cambios en el código se recargan al instante.

```bash
npm test          # corre las pruebas del motor de cálculo una vez
npm run test:watch  # modo watch
npm run build      # type-check (tsc) + build de producción a dist/
npm run preview    # sirve dist/ para probarlo como quedaría en producción
```

## Generar el APK de Android

Requiere Android Studio / Android SDK y Java ya instalados (en esta máquina ya están).

### Número de versión

El `"version"` de [`package.json`](package.json) es la única fuente de verdad para la versión de la app — no hay que tocarla en más de un lugar:

- La que se ve en la vista **Configuración** ([`src/lib/version.ts`](src/lib/version.ts)) la lee directo de ahí al compilar el web.
- El `versionName`/`versionCode` nativos de Android ([`android/app/build.gradle`](android/app/build.gradle), arriba del todo) se calculan automáticamente a partir del mismo `package.json` en cada build — `versionName` es el mismo texto (`"1.1.0"`), y `versionCode` es ese semver codificado como entero (`major*10000 + minor*100 + patch`, p. ej. `10100`), que es el formato que exige Android/Play Store.

Para sacar una nueva versión: sube el número en `package.json` y corre `npm run sync` — ambos lados quedan al día solos.

### Cada vez que cambies código

El primer paso es siempre el mismo, sin importar cómo vayas a compilar después:

```bash
npm run sync
```

Esto compila el proyecto web (`vite build`) y copia el resultado dentro de `android/` (`cap sync`). **Sin este paso, Android Studio compila con el código viejo** — es el error más fácil de cometer: el proyecto Android no se entera solo de los cambios en `src/`.

**Desde Android Studio** (recomendado — permite usar el emulador, depurar, o generar un **APK/AAB firmado para publicar en Play Store**): si el proyecto ya está abierto, no hace falta reabrirlo, solo repite `npm run sync` y luego **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Si aún no lo tienes abierto:

```bash
npm run android:open
```

La firma de un release (keystore, `Build > Generate Signed Bundle / APK`) es un paso que debes hacer tú mismo desde Android Studio, ya que implica crear y guardar una clave privada propia.

**Todo por línea de comandos**, sin abrir Android Studio:

```bash
npm run sync
cd android
./gradlew.bat assembleDebug
```

El APK de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Se puede instalar directamente en un teléfono (activando "Instalar apps de orígenes desconocidos") o con `adb install app-debug.apk`.

> **Si `gradlew.bat` falla con `invalid source release: 21`**: el Gradle de Capacitor 8 necesita JDK 21+, pero el `JAVA_HOME` por defecto de esta máquina es JDK 17. Usa el JDK que ya trae Android Studio (JBR), que sí sirve:
>
> ```bash
> export JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
> cd android && ./gradlew.bat assembleDebug
> ```
>
> (En PowerShell: `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`.) Ajusta la ruta si Android Studio está instalado en otro lugar. Casi nunca hace falta si compilas desde dentro de Android Studio, porque usa su propio JDK integrado por defecto.

> Si agregas o quitas un plugin de Capacitor (una dependencia nativa, no solo código propio tuyo), Android Studio puede pedir "Sync Now" después del `npm run sync` — acéptalo, es normal.

Si vuelves a cambiar el ícono o el splash (archivos en `assets/`), regenera los recursos nativos con:

```bash
npm run android:assets
```

## Generar la PWA (para otros dispositivos)

```bash
npm run build
npm run preview
```

`dist/` es una PWA completa (manifest + service worker) lista para subir a cualquier hosting estático (Netlify, Vercel, GitHub Pages, un servidor propio, etc.). Una vez publicada, desde Chrome/Safari se puede "Agregar a pantalla de inicio" para instalarla como si fuera una app nativa, en Android, iPhone, Windows o Mac.

## Exportar un viaje a PDF o Excel

Desde el detalle de un viaje, el ícono de compartir (junto al nombre del viaje) abre un modal para elegir formato:

- **Excel (.xlsx)**: una hoja con el nombre del viaje, fecha, tasas usadas, la tabla de artículos (con los mismos 9 campos que se ven en la app, como números reales — no texto — para poder seguir calculando en Excel) y el resumen (inversión, monto total, venta convertida, ganancia).
- **PDF**: lo mismo pero en una tabla formateada lista para imprimir o enviar.

El código vive en `src/lib/export/` (`tripExportData.ts` junta los montos ya calculados; `exportExcel.ts` y `exportPdf.ts` generan cada archivo; `saveOrShare.ts` decide cómo entregarlo):

- **Web**: descarga normal del navegador.
- **Android**: no hay una carpeta de "Descargas" accesible desde la WebView, así que el archivo se escribe en la caché de la app y se abre la hoja de compartir nativa de Android (`@capacitor/share`), desde donde el usuario lo guarda en Archivos, lo manda por WhatsApp, Gmail, Drive, etc.

`jspdf`, `jspdf-autotable` y `xlsx` pesan varios cientos de KB entre los tres, así que se cargan con `import()` dinámico solo la primera vez que se exporta algo — no afectan el arranque normal de la app.

## Copia de seguridad (exportar/restaurar todos los datos)

En Configuración, aparte de exportar un viaje, se puede hacer una copia de seguridad de **toda la app** (configuración + todos los viajes):

- **Exportar todos los datos**: genera un `.json` con todo lo guardado (mismo mecanismo de guardar/compartir que la exportación de un viaje: descarga en web, hoja de compartir en Android).
- **Restaurar desde archivo**: abre el selector de archivos del sistema, valida el `.json` elegido campo por campo (no confía en el archivo — si algo no tiene la forma esperada, muestra un error concreto y no toca los datos actuales) y, si es válido, pide confirmación antes de aplicarlo, porque **reemplaza por completo** los viajes y la configuración actuales (no los combina con lo ya guardado).

Código en `src/lib/backup.ts` (armar/validar el archivo) y `src/components/BackupSection.tsx` (la UI). Sirve para pasar los datos a otro teléfono, o como respaldo antes de desinstalar la app o usar "Borrar todos los datos".

## Sistema de diseño — "Midnight Capital"

Tema oscuro dedicado (sin variante clara), inspirado en aplicaciones de banca/inversión privada: calmado, preciso, con un único color de acento reservado para acciones y ganancias.

- **Paleta**: fondo casi negro (`#101415`) con tarjetas en capas cada vez más claras (elevación por tono, no por sombra). Verde menta (`#4edea3`) es el único color "de acción" — botones primarios, focos, ganancias. Azul medianoche (`#0a192f`) se reserva para las tarjetas destacadas (el resultado de la Calculadora, el resumen del viaje). Rojo suave (`#ffb4ab`, no un rojo saturado) para pérdidas y acciones destructivas, buscando que la app se sienta "en control" en vez de alarmante.
- **Tipografía**: Inter para texto e interfaz; JetBrains Mono para cualquier cifra (tablas, resúmenes, resultados) y para las pequeñas etiquetas en mayúsculas ("ARTÍCULOS (3)"), para que los números nunca "salten" de ancho y se lean como un panel financiero. Ambas están autohospedadas (sin depender de Google Fonts) para que la app funcione igual sin conexión.
- **Formas**: radios de 6–16px según el tamaño del elemento; los botones ya no son "pill" (cápsula completa), a propósito, para verse más estructurados/técnicos.
- **Indicador financiero**: las ganancias/pérdidas (`TrendValue`, en `src/components/TrendValue.tsx`) siempre llevan flecha (↑ verde / ↓ rojo) y signo explícito (+/−), no solo color.

Todo vive en `src/styles/index.css` (tokens + componentes) — cambiar la paleta es, en su mayoría, cambiar los valores de las variables en `:root`.

## Notas de diseño

- **Sin cuentas de usuario ni backend**: todo vive en el dispositivo (`@capacitor/preferences`). Borrar los datos de la app, o "Borrar todos los datos" en Configuración, los elimina de forma permanente.
- **Redondeo fijo a 10**: el "precio en Cuba corregido" siempre redondea hacia arriba al múltiplo de 10, igual que el Excel.
- **Botón atrás de Android**: navega hacia atrás dentro de la app antes de salir de ella.
- **Sugerencias de producto**: el campo "Producto" autocompleta con nombres usados antes, tomados de los propios viajes guardados (no hay un catálogo aparte que mantener).
- **Calculadora dentro del campo**: "Artículos por kilogramo" en la pantalla inicial acepta escribir una cuenta simple (ej. `12*7`) y la resuelve al vuelo — útil para no tener que salir de la app a calcular algo y volver. Evaluador propio en `src/lib/exprEval.ts` (sin `eval()`), componente en `src/components/CalculatorField.tsx`.
- **Tema claro/oscuro**: se elige a mano en Configuración ("Apariencia") y queda guardado en el dispositivo (clave aparte de `settings`/`trips`, para que "Borrar todos los datos" no lo reinicie). Por defecto es oscuro. Las tarjetas destacadas (resultado de la Calculadora, resumen del viaje) se quedan siempre en azul medianoche en los dos temas, como una firma visual constante. Paleta clara en `src/styles/index.css` (`:root[data-theme='light']`), validada contra WCAG 2.1 antes de fijarla; estado en `src/state/ThemeContext.tsx`.
