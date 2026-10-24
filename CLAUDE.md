# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

"Precio Cuba": calcula el precio de venta en Cuba (CUP) de mercancía comprada en México (MXN) y organiza las compras en **viajes**. Nació de la hoja `Mercancía Ale.xlsx`; la app replica sus fórmulas exactamente. React 19 + TypeScript + Vite, empaquetada como APK con Capacitor 8 y también como PWA. Sin backend ni cuentas: todo vive en el dispositivo. El código, los comentarios, la UI y los nombres de dominio (`viaje`, `tasaMXN`, `precioRemesa`…) están en español; mantén esa convención. El [README.md](README.md) tiene la tabla completa de fórmulas, el flujo de exportación, el sistema de diseño y la guía de build de Android.

## Comandos

`node_modules` no se versiona: tras clonar, `npm ci`. No hay linter configurado.

```bash
npm run dev            # Vite en http://localhost:5173 (también como "precio-cuba-dev" en .claude/launch.json)
npm test               # vitest run (una vez)
npm run test:watch
npx vitest run src/lib/calculations.test.ts            # un solo archivo
npx vitest run src/lib/calculations.test.ts -t "texto" # un solo test por nombre
npm run build          # tsc --noEmit && vite build → dist/
npm run preview        # sirve dist/ (única forma de probar el service worker de la PWA)
npm run sync           # vite build && cap sync → copia dist/ dentro de android/
npm run android:open   # abre Android Studio
npm run android:assets # regenera íconos/splash nativos desde assets/
```

- **Tras cualquier cambio en `src/` hay que correr `npm run sync` antes de compilar Android**; el proyecto nativo no se entera solo.
- APK debug por consola: `cd android && ./gradlew.bat assembleDebug`. Gradle de Capacitor 8 necesita JDK 21+ y el `JAVA_HOME` por defecto de esta máquina es JDK 17: usa el JBR de Android Studio (`C:\Program Files\Android\Android Studio\jbr`) o falla con `invalid source release: 21`.
- `tsconfig.json` es `strict` con `noUnusedLocals`/`noUnusedParameters`: una variable o import sin usar rompe `npm run build`.
- Vitest corre con `environment: 'node'` y solo incluye `src/**/*.test.ts`. No hay entorno DOM ni pruebas de componentes; solo se prueba lógica pura de `src/lib/`.
- Versión de la app: la única fuente es `"version"` en `package.json`. Lo leen `src/lib/version.ts` y `android/app/build.gradle` (calcula `versionCode = major*10000 + minor*100 + patch`). Nunca edites la versión en otro lado.

## Arquitectura

**Motor de cálculo (`src/lib/calculations.ts`).** Funciones puras, sin UI. Todo monto derivado (costo total, precio en Cuba redondeado a múltiplo de 10 con `Math.ceil`, peso, totales del viaje, ganancia) se calcula aquí a partir de los campos que el usuario edita, y **nunca se guarda**: pantallas (`pages/`) y exportadores (`lib/export/tripExportData.ts`) llaman a `calcularItem` / `calcularTotalesViaje`, así la app y los PDF/Excel siempre coinciden. Los denominadores inválidos (≤ 0, NaN) devuelven 0 en vez de `Infinity`/`NaN`. El peso de un artículo se puede indicar de dos formas (switch `PesoModeSwitch` en `Home` e `ItemEditSheet`): art/kg, o `pesoArticuloKg` (kilogramos por unidad, ej. `0.012`). Si el artículo trae `pesoArticuloKg`, el cálculo lo usa directo y **ignora** `articulosPorKg`, que en ese caso se guarda derivado (`1/kg`) solo para mostrar/exportar. No calcules precios a partir de ese derivado ni multipliques el decimal tal cual: la coma flotante más el `ceil` a 10 sube el precio 10 CUP en ~0.02–0.05% de los casos (ej. 50 × 0.035 × 680 da 1190.0000000000002 → 1200). Por eso `calculations.ts` redondea el peso a 6 decimales (`pesoMicro`) antes de multiplicar; medido contra aritmética exacta: 0 fallos en 6 M de combinaciones. Los formularios convierten con `resolverPesoArticulo`. `calculations.test.ts` reproduce las 19 filas y los totales exactos del Excel original; si tocas una fórmula, esas pruebas deben seguir pasando.

**Tasas por viaje, no globales.** `Trip extends Rates` (`tasaMXN`, `tasaCUP`, `precioRemesa`): cada viaje lleva sus propias tasas y los cálculos de un viaje usan siempre las del viaje (`calcularItem(item, trip)`). `Settings` solo siembra los valores iniciales de la Calculadora (`Home`) y de los viajes nuevos al crearlos; cambiarlas no debe alterar viajes ya guardados.

**Estado y persistencia.** `src/state/AppDataContext.tsx` es el único dueño de los datos: un `useReducer` sobre `AppData` (`{version: 1, settings, trips}`), expuesto vía `useAppData()`. Los componentes mutan solo a través de las funciones del contexto (`addItem`, `updateTripRates`, `restoreAllData`…), nunca el estado directamente. Flujo: `HYDRATE` al montar (lee con `loadAppData`) → cualquier cambio se guarda con debounce de 300 ms (`saveAppData`), y **solo después de `hydrated`** para no pisar lo guardado con el estado inicial. Todo `AppData` se serializa como un único JSON en `@capacitor/preferences` bajo la clave `precio_cuba_data_v1` (SharedPreferences en Android, `localStorage` en web). El tema se guarda aparte (`precio_cuba_theme_v1`, `ThemeContext.tsx`) a propósito, para que "Borrar todos los datos" no lo reinicie; usa el mismo patrón de flag `hydrated`.

**Al agregar un campo a `Settings`, `Trip` o `TripItem`** hay que tocar varios sitios que no se avisan entre sí: `types.ts`, `defaults.ts`, el reducer/`createTrip`/`addItem` del contexto, y sobre todo `src/lib/backup.ts`. `parseBackup` valida campo por campo y reconstruye cada objeto con una lista explícita de campos, así que un campo nuevo se **descarta en silencio al restaurar una copia de seguridad** hasta que lo agregues en `parseSettings`/`parseTrip`/`parseItem`. Además `loadAppData` solo mezcla `settings` con los defaults y no valida ni migra `trips`, por lo que datos viejos ya guardados llegan sin el campo nuevo (trátalo como opcional o migra). `pesoArticuloKg` es el ejemplo: opcional, y `backup.test.ts` verifica que sobreviva a exportar/restaurar. Al editar un artículo hay que pasar la clave aunque sea `undefined` (como hace `resolverPesoArticulo`) para que `UPDATE_ITEM` borre un valor anterior.

**Web vs. Android.** El mismo bundle corre en navegador y en la WebView de Capacitor (`base: './'` en Vite, `HashRouter` en `App.tsx`; no cambies a `BrowserRouter` ni a una base absoluta o se rompen los assets en Android/hosting estático). El código específico de plataforma se ramifica con `Capacitor.isNativePlatform()`: botón atrás y barra de estado en `App.tsx`, y `saveOrShareFile` (`lib/export/saveOrShare.ts`) que en web descarga el blob y en Android lo escribe en la caché y abre la hoja de compartir (una descarga normal no funciona de forma fiable en la WebView). Exportar viajes (PDF/Excel) y la copia de seguridad `.json` usan ese mismo helper.

**Dependencias pesadas con import dinámico.** `jspdf`, `jspdf-autotable` y `xlsx` solo se cargan con `await import(...)` al exportar (`ExportTripModal.tsx`, `BackupSection.tsx`). No los importes estáticamente: engordarían el arranque de la app.

**Estilos.** Un único `src/styles/index.css` (~1200 líneas, sin librería de componentes) con tokens de diseño en `:root`; el tema claro está en `:root[data-theme='light']` y `ThemeContext` fija `data-theme` en `<html>` y actualiza `meta[name=theme-color]`. El README dice en una sección que el tema es solo oscuro; está desactualizado: hay conmutador claro/oscuro en Configuración (por defecto oscuro).

**Android.** `android/` está versionado (solo se ignoran `build/`, `.gradle`, `local.properties`, etc.); `appId` es `com.preciocuba.app` y `webDir` es `dist`. La firma del release (keystore) la hace el usuario a mano desde Android Studio; no la automatices.
