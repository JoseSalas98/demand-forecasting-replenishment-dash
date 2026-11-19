# Research: Versión en inglés

## R1 · Librería de traducción o diccionarios propios
- **Decision**: diccionarios propios en TypeScript, con el inglés tipado contra el español.
- **Rationale**: ~400 textos y dos idiomas; el tipado detecta faltantes sin dependencias (V.4).
- **Alternatives**: react-i18next (dependencia y archivos JSON sin tipado por clave).

## R2 · Dónde vive el idioma
- **Decision**: variable de módulo + aviso a la app; la app se vuelve a montar con `key={lang}`.
- **Rationale**: formato, nombres y glosario se usan fuera de componentes; volver a montar garantiza
  que nada quede en el idioma anterior. Los datos ya cargados vienen de la caché, así que es rápido.
- **Alternatives**: contexto de React en cada componente (más cambios y fácil olvidar uno).

## R3 · Persistencia
- **Decision**: enlace `?lang=` → `localStorage` → español. Al elegir, se guarda y se quita `?lang=`
  de la dirección con `history.replaceState`.

## R4 · Formato en inglés
- **Decision**: separadores `1,234.5`; dinero con prefijo `US$` y sufijos `M`/`K` sin espacio;
  porcentaje sin espacio; fechas `May 25, 2015`.

## R5 · Nombres de grupos en inglés
- **Decision**: adjetivo delante: "Continuous vitals", "Recurring useful items", "Occasional
  complementary items" (confirmado por el usuario).
