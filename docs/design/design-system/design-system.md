# HOPE ERP Design System (v1)

Full design system: [hope-erp-design-system-v1.pdf](hope-erp-design-system-v1.pdf)

## Contents of the PDF
| Page | Section |
|---|---|
| 1 | Colors, with contrast ratios for text pairs |
| 2 | Typography, spacing, shape and layers |
| 3 | Core components |
| 4 | Rules for every screen |

## Colors
| Name | Hex | Use |
|---|---|---|
| Navy | #14213d | Sidebar, headings, dark panels |
| Primary blue | #1f3a7a | Buttons, links, active menu item |
| Soft blue | #e0e7f5 | Role badges (Admin, User) |
| Gold accent | #b08a3e | Logo underline only |
| Page | #eef1f6 | Page background |
| Surface | #ffffff | Cards, tables, dialogs |
| Border | #d5dbe6 | Dividers, card edges |
| Control border | #8d99ad | Input and button edges |
| Ink | #1b2433 | Body text |
| Muted | #4a5568 | Secondary text, hints |
| Success | #14532d on #dcf3e6 | Active badge |
| Danger | #b42318 | Errors, Delete button |
| Danger badge | #8a1c14 on #fde8e6 | Inactive and Blocked badges |
| Pending badge | #6b4a00 on #fdf1d8 | Pending badge |
| Deleted row | #f8edd2 | Soft-deleted rows (Admin only) |
| Focus ring | #2f5fd0 | Keyboard focus outline (3 px) |

## Typography
Fonts: Source Serif 4 for titles, Source Sans 3 for everything else. Fallbacks: Georgia and system-ui. Sizes are in px (size / line height).

| Style | Font | Size | Weight |
|---|---|---|---|
| Heading 1 (page title) | Source Serif 4 | 32 / 40 | 600 |
| Heading 2 (section heading) | Source Serif 4 | 22 / 28 | 600 |
| Heading 3 (card and dialog title) | Source Serif 4 | 18 / 24 | 600 |
| Body | Source Sans 3 | 16 / 24 | 400 |
| Label, table cell, button | Source Sans 3 | 14 / 20 | 600 |
| Secondary text, hint (Muted color) | Source Sans 3 | 14 / 20 | 400 |
| Caption, table header, stamp | Source Sans 3 | 12 / 16 | 400–600 |

## Components
Buttons, badges, form fields, tabs, tables, dialogs, sidebar menu and notices. The PDF shows these states:
- **Buttons:** primary, secondary, danger, small and disabled.
- **Badges:** Active, Inactive, Blocked, Pending, Admin and User.
- **Form fields:** default, focus, error and disabled.
- **Tables:** normal row and deleted row (Admin only).
- **Sidebar menu item:** default, active and no access.
- **Dialog:** the delete confirmation. **Tabs** and **notice** are also shown.
