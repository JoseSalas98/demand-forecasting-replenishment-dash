# Implementation Plan: Versión en inglés y artículo sin preselección

**Branch**: `003-version-ingles` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

## Summary

Textos de la interfaz en dos diccionarios tipados (`src/i18n/es.ts`, `src/i18n/en.ts`); el inglés
tiene el tipo del español, así que una clave faltante rompe el chequeo de tipos. `src/i18n.ts` guarda
el idioma activo (enlace → navegador → español), lo cambia y avisa a la app, que se vuelve a dibujar
entera. `src/format.ts`, `src/naming.ts` y `src/glossary.ts` leen el idioma activo. Artículo deja de
abrir un artículo por defecto y muestra un estado vacío con el buscador destacado.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.1 · **Primary Dependencies**: Recharts 2.15, Vite 6.3
**Storage**: `localStorage` (`ddr-lang`), con respaldo en memoria · **Testing**: Vitest + jsdom
**Target Platform**: GitHub Pages (estático) · **Project Type**: frontend estático
**Constraints**: sin librería de traducción (keep it simple, V.4); sin cambios en `public/data`.

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I · solo lectura | Sin cambios en datos ni cálculos; solo textos y formato. |
| II.4 · dinero | Etiqueta global en los dos idiomas (enmienda 2.1.0). |
| III · nada en silencio | Errores de carga traducidos; dato ausente "not available". |
| IV · estático | `localStorage` y hash; sin servidor. |
| V · estilo | Código en inglés; comentarios y documentación en español. |
| VI.4 · idiomas (nuevo) | Diccionarios completos y tipados; botón ES \| EN; formato de EE. UU. en inglés. |

## Project Structure

```text
src/i18n.ts                 # idioma activo, setLang, useLang, t(), pick()
src/i18n/es.ts, en.ts       # diccionarios
src/components/LangToggle.tsx
src/format.ts               # formato según el idioma
src/naming.ts, glossary.ts  # nombres y glosario bilingües
src/views/*, components/*   # sin texto directo
```

## Complexity Tracking

Sin desviaciones.
