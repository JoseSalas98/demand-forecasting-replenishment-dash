# Data Model: Versión en inglés

Sin cambios en los datos exportados. Entidades de la interfaz:

- **Lang**: `'es' | 'en'`. Origen: `?lang=` del hash, `localStorage['ddr-lang']`, o `'es'`.
- **Dict**: forma de `src/i18n/es.ts`; `en` MUST tener exactamente esa forma.
- **GlossaryEntry**: `id`, `group` (`basics | segments | accuracy | money`) y, por idioma, `term`,
  `definition`, `technical`, `unit?`.
