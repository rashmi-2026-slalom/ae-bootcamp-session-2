# UI Guidelines

## Component Library

- Use **Material UI (MUI)** components exclusively. Do not introduce custom or third-party UI components unless MUI has no equivalent.
- Import components from `@mui/material` and icons from `@mui/icons-material`.

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Indigo | `#3F51B5` |
| Primary Dark | Dark Indigo | `#283593` |
| Secondary | Teal | `#009688` |
| Background | Light Grey | `#F5F5F5` |
| Surface | White | `#FFFFFF` |
| Error | Red | `#D32F2F` |
| Text Primary | Dark Grey | `#212121` |
| Text Secondary | Medium Grey | `#757575` |

Use the MUI `ThemeProvider` to apply these values via a custom theme rather than inline styles.

## Typography

- Font family: **Roboto** (loaded via MUI's default theme).
- Page titles: `variant="h4"`, weight 600.
- Section headings: `variant="h6"`, weight 500.
- Body text: `variant="body1"`.
- Helper/caption text: `variant="caption"`.

## Button Styles

- **Primary actions** (e.g., Save, Add Task): `<Button variant="contained" color="primary">`.
- **Secondary actions** (e.g., Cancel, Filter): `<Button variant="outlined" color="primary">`.
- **Destructive actions** (e.g., Delete): `<Button variant="outlined" color="error">`.
- Buttons must include a descriptive `aria-label` when the label alone is not self-explanatory.
- Minimum touch target size: 44×44 px (use `size="large"` for prominent actions).

## Layout

- Use MUI `Container` with `maxWidth="md"` as the top-level page wrapper.
- Use MUI `Grid` or `Stack` for spacing between elements; avoid arbitrary margins.
- Consistent spacing unit: multiples of `8px` (MUI default spacing scale).

## Forms & Inputs

- Use MUI `TextField` with `variant="outlined"` for all text inputs.
- Required fields must use the `required` prop and display inline validation messages via `helperText`.
- Date inputs must use MUI `DatePicker` from `@mui/x-date-pickers`.

## Accessibility

- All interactive elements must be keyboard-navigable and have visible focus indicators.
- Color must not be the sole means of conveying information (e.g., overdue tasks need both color and an icon).
- All images and icons must have descriptive `alt` text or `aria-label`.
- Maintain a minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text (WCAG AA).
- Use semantic HTML elements (`<main>`, `<nav>`, `<section>`, `<header>`) alongside MUI components.

## Overdue & Status Indicators

- Overdue tasks: red text (`error.main`) + `WarningAmberIcon`.
- Completed tasks: use `text.disabled` color and strikethrough text decoration.
- Due-today tasks: amber text (`warning.main`) + `TodayIcon`.
