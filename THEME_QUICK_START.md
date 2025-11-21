# Quick Start: Using the New Theme

## Adding Dark Mode Toggle to Your App

### 1. Import the ThemeToggle Component

```jsx
import ThemeToggle from './components/ThemeToggle';
```

### 2. Add it to Your Layout/Header

```jsx
// Example: In your Layout component or Header
function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Medical Lab App</h1>
        
        {/* Add the theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
```

### 3. Optional: Add a Label

```jsx
<div className="theme-toggle-wrapper">
  <span className="theme-toggle-label">Theme</span>
  <ThemeToggle />
</div>
```

## Using Theme Colors in Your Components

### Method 1: Use New Theme Variables

```css
.my-card {
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.my-button {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius);
}

.my-button:hover {
  background: var(--primary);
  opacity: 0.9;
}
```

### Method 2: Use Legacy Variables (Still Supported)

```css
.legacy-card {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
```

## Color Reference

### Semantic Colors
- `--primary` - Main brand color (blue)
- `--secondary` - Secondary actions (green)
- `--accent` - Accent elements (orange)
- `--destructive` - Destructive actions (red/orange)
- `--muted` - Muted/disabled states

### Surface Colors
- `--background` - Page background
- `--card` - Card background
- `--popover` - Popover background
- `--input` - Input field background

### Text Colors
- `--foreground` - Primary text
- `--muted-foreground` - Secondary/muted text
- `--primary-foreground` - Text on primary background
- `--secondary-foreground` - Text on secondary background

### Borders & Outlines
- `--border` - Border color
- `--ring` - Focus ring color

## Examples

### Card Component
```jsx
function Card({ children, title }) {
  return (
    <div style={{
      background: 'var(--card)',
      color: 'var(--card-foreground)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      boxShadow: 'var(--shadow-md)'
    }}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}
```

### Button Component
```jsx
function Button({ children, variant = 'primary', ...props }) {
  const getStyles = () => {
    switch(variant) {
      case 'primary':
        return {
          background: 'var(--primary)',
          color: 'var(--primary-foreground)'
        };
      case 'secondary':
        return {
          background: 'var(--secondary)',
          color: 'var(--secondary-foreground)'
        };
      case 'destructive':
        return {
          background: 'var(--destructive)',
          color: 'var(--destructive-foreground)'
        };
      default:
        return {
          background: 'var(--muted)',
          color: 'var(--foreground)'
        };
    }
  };

  return (
    <button
      style={{
        ...getStyles(),
        padding: 'var(--space-3) var(--space-6)',
        borderRadius: 'var(--radius)',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Alert Component
```jsx
function Alert({ children, type = 'info' }) {
  const getColors = () => {
    switch(type) {
      case 'success':
        return { bg: 'var(--success-light)', text: 'var(--success)' };
      case 'warning':
        return { bg: 'var(--warning-light)', text: 'var(--warning)' };
      case 'error':
        return { bg: 'var(--danger-light)', text: 'var(--danger)' };
      default:
        return { bg: 'var(--muted)', text: 'var(--foreground)' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      background: colors.bg,
      color: colors.text,
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius)',
      border: `1px solid ${colors.text}`
    }}>
      {children}
    </div>
  );
}
```

## Testing Dark Mode

1. Add the `<ThemeToggle />` component to your app
2. Click the toggle button to switch between light and dark modes
3. The preference is saved in localStorage
4. On page reload, your preference is remembered

## Tips

1. **Always use theme variables** instead of hard-coded colors
2. **Test both themes** when creating new components
3. **Use semantic names** (primary, secondary) instead of color names (blue, green)
4. **Leverage the shadow scale** (--shadow-sm, --shadow-md, etc.) for consistent depth
5. **Use spacing variables** (--space-1 through --space-16) for consistent spacing

## Need Help?

See `THEME_UPDATE.md` for complete documentation on all available theme variables and features.
