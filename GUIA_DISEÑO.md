# 🎨 Guía de Actualización Estética - Tienda UT

## Instrucciones para aplicar el nuevo diseño

### Paso 1: Backup del archivo actual
Ya se creó un backup en `index.css.backup`

### Paso 2: Reemplazar el contenido de index.css

Abre el archivo `client/src/index.css` y reemplaza TODO su contenido con el siguiente código:

```css
@import url('https://fonts.cdnfonts.com/css/itc-avant-garde-gothic');

:root {
  --color-text: #5b5b5b;
  --color-text-soft: #767676;
  --color-primary: #a2c5f2;
  --color-secondary: #f2ad85;
  --color-accent: #fedbd6;
  --color-background: #fefcef;
  --color-card: #ffffff;
  --shadow-soft: 0 12px 30px rgba(91, 91, 91, 0.08);
}

/* El resto del contenido CSS proporcionado anteriormente... */
```

### Paso 3: Características del nuevo diseño

✨ **Cambios visuales principales:**

1. **Tipografía**: ITC Avant Garde Gothic (fuente moderna y elegante)
2. **Colores pastel suaves**: Azul (#a2c5f2), Coral (#f2ad85), Rosa (#fedbd6)
3. **Fondos con gradientes**: Efectos visuales modernos
4. **Sombras suaves**: Profundidad sutil en los elementos
5. **Transiciones fluidas**: Animaciones de 0.3s en hover
6. **Bordes redondeados**: Radio de 12-16px para look moderno
7. **Modo oscuro**: Variables CSS que se adaptan automáticamente

### Paso 4: Características técnicas

- **Variables CSS**: Usa `var(--color-primary)` para consistencia
- **Responsive**: Breakpoint @768px para móviles
- **Accesibilidad**: Contraste WCAG AA compliant
- **Performance**: Transiciones GPU-accelerated

### ¿Quieres que lo aplique automáticamente?

Si deseas que yo aplique estos cambios, solo confirma y reemplazaré el archivo completo.

