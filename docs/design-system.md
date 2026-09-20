# Design System — SWASTHYA-SANKET

## Source

Design tokens adapted from the **Stitch "Zuno Fintech" export** (dark glassmorphism).
Healthcare-domain semantic colors added. Original Stitch reference: `stitch_zuno_fintech_dashboard/`.

## Visual Language

**Dark Fintech Glassmorphism** adapted for healthcare.
- Authority and trust through deep navy
- Semantic greens for safe/healthy stock
- Semantic reds for alerts/danger/stockout
- Glassmorphic cards for depth hierarchy

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-start` | `#081225` | Background gradient top |
| `--bg-end` | `#0F1B3D` | Background gradient bottom |
| `--primary` | `#3B82F6` | Primary actions, navigation active |
| `--secondary` | `#22C55E` | Success, safe stock, healthy state |
| `--danger` | `#EF4444` | Stockout alert, critical |
| `--warning` | `#FBBF24` | Low stock, pending |
| `--on-surface` | `#e0e3e5` | Primary text |
| `--on-surface-variant` | `#c2c6d6` | Secondary text, labels |
| `--outline` | `#8c909f` | Borders, tertiary text |
| `--input-bg` | `#0C162D` | Input background |

## Glassmorphism Surfaces

| Class | Opacity | Blur | Use |
|-------|---------|------|-----|
| `.glass` | 5% white | 20px | Standard cards |
| `.glass-sm` | 4% white | 12px | Subtle surfaces |
| `.glass-strong` | 8% white | 40px | Modals, overlays |
| `.glass-danger` | 8% red | 20px | Alert cards (low stock) |
| `.glass-success` | 8% green | 20px | Positive state cards |
| `.glass-warning` | 8% yellow | 20px | Warning state cards |

## Typography (Inter)

| Style | Size | Weight | Line-Height |
|-------|------|--------|------------|
| display-lg | 32px | 700 | 40px |
| headline-md | 24px | 600 | 32px |
| headline-sm | 20px | 600 | 28px |
| body-lg | 18px | 400 | 26px |
| body-md | 16px | 400 | 24px |
| label-md | 14px | 500 | 20px |
| label-sm | 12px | 600 | 16px |

## Spacing

| Token | Value |
|-------|-------|
| `--margin-page` | 20px |
| `--gutter-card` | 16px |
| `--stack-sm` | 8px |
| `--stack-md` | 16px |
| `--stack-lg` | 24px |
| `--nav-height` | 72px |

## Border Radii

| Token | Value | Used for |
|-------|-------|---------|
| `--radius-sm` | 4px | Small badges |
| `--radius-md` | 12px | Inputs |
| `--radius-lg` | 16px | Buttons |
| `--radius-xl` | 20px | Cards |
| `--radius-full` | 9999px | Pills, chips |

## Components

### Button
- Height: 56px (standard) / 36px (sm)
- Variants: primary (blue), danger (red), success (green), ghost (glass)

### Card
- Radius: 20px
- Padding: 24px
- Variants: default, danger, success, warning

### Input
- Height: 52px
- Background: `#0C162D`
- Focus: 1px `#3B82F6` border + glow

### Badge
- Shape: pill
- Height: 24px
- Variants: primary, success, danger, warning, neutral

### Bottom Nav
- Height: 72px
- Background: `rgba(16,20,21,0.9)` + blur(25px)
- Active: blue icon + text
- Inactive: 50% white

## Stock Status Color Guide

| Status | Color | Badge Variant | Days |
|--------|-------|--------------|------|
| Healthy | Green | success | >30 |
| Monitor | Yellow | warning | 15–30 |
| Low | Orange | warning | 7–14 |
| Critical | Red | danger | <7 |
| Stockout | Red (pulsing) | danger | 0 |
