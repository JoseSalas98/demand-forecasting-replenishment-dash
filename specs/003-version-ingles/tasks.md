# Tasks: Versión en inglés y artículo sin preselección

**Input**: `specs/003-version-ingles/`

## Phase 1: Base

- [x] T001 Enmienda de la constitución 2.1.0 (VI.4 idiomas; II.4 etiqueta en dos idiomas)
- [x] T002 `src/i18n.ts` (idioma activo, recuerdo, `?lang=`) y diccionarios `src/i18n/es.ts`, `src/i18n/en.ts`
- [x] T003 `src/format.ts` según el idioma (números, dinero, porcentajes, fechas, ejes)
- [x] T004 [P] `src/naming.ts` y `src/glossary.ts` bilingües

## Phase 2: User Story 2 · Elegir idioma (P1)

- [x] T010 `src/components/LangToggle.tsx`; botón en Inicio y en la barra superior; `App` se vuelve a dibujar al cambiar

## Phase 3: User Story 1 · Todo en inglés (P1)

- [x] T020 [P] Componentes compartidos (barra lateral, ayudas, estados, buscador, contexto de impacto)
- [x] T021 [P] Gráficas (burbujas, radar, embudo, artículo, curva, Recharts)
- [x] T022 Vistas: Segmentos y su detalle, Artículo y su detalle, Impacto, Cómo usar, paso a paso, Origen de los datos

## Phase 4: User Story 3 · Artículo sin preselección (P2)

- [x] T030 Quitar el artículo por defecto; estado vacío con buscador destacado
- [x] T031 Buscador con lupa y flecha de lista en todas sus apariciones

## Phase 5: Cierre

- [x] T040 Pruebas en los dos idiomas (`tests/views.smoke.test.tsx`, `tests/format.test.ts`, `tests/i18n.test.ts`)
- [x] T041 Guía visual y README
- [x] T042 Verificación en el navegador con las cifras de control de `quickstart.md`
