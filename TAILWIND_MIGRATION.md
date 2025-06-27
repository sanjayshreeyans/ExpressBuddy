# Tailwind CSS + shadcn/ui Setup Guide

This guide shows how to use Tailwind CSS and shadcn/ui components alongside your existing SCSS components without conflicts.

## ✅ Setup Complete

The following has been configured:

### 1. Tailwind CSS Configuration
- ✅ `tailwind.config.js` - Configured with shadcn/ui defaults
- ✅ `src/index.css` - Added Tailwind directives and CSS variables
- ✅ PostCSS configuration for processing

### 2. shadcn/ui Components
- ✅ `src/lib/utils.ts` - Utility function for className merging
- ✅ `src/components/ui/button.tsx` - Button component
- ✅ `src/components/ui/card.tsx` - Card components
- ✅ `src/components/ui/textarea.tsx` - Textarea component

### 3. CSS Variable System
Both systems coexist using different CSS variable namespaces:

**Existing SCSS variables:**
```scss
--Neutral-15, --Neutral-20, --gray-300, --accent-blue, etc.
```

**New Tailwind/shadcn variables:**
```css
--background, --foreground, --primary, --secondary, etc.
```

## 🔧 Required Dependencies

To complete the setup, you'll need to install these packages:

```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

Optional for full shadcn/ui support:
```bash
npm install @radix-ui/react-slot @radix-ui/react-icons
```

## 🚀 How to Use Both Systems

### Existing Components (Keep Using SCSS)
Your existing components continue to work unchanged:

```tsx
// These continue to use SCSS
import MainInterface from "./components/main-interface/MainInterface";
import ControlTray from "./components/control-tray/ControlTray";
import Logger from "./components/logger/Logger";
```

### New Components (Use Tailwind + shadcn)
For new features, use Tailwind classes and shadcn components:

```tsx
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";

function NewFeature() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea placeholder="Type your message..." />
        <Button className="w-full">Send Message</Button>
      </CardContent>
    </Card>
  );
}
```

## 🎨 Styling Guidelines

### For Existing Components
- Continue using SCSS files (`.scss`)
- Use existing CSS variables (`var(--Neutral-15)`)
- Keep existing class naming conventions

### For New Components
- Use Tailwind utility classes
- Use shadcn/ui components
- Use Tailwind CSS variables (`bg-background`, `text-foreground`)

### Mixing Both (If Needed)
You can combine both in the same component:

```tsx
function HybridComponent() {
  return (
    <div className="existing-scss-class flex items-center gap-4">
      {/* Existing component */}
      <ControlTray {...props} />
      
      {/* New Tailwind component */}
      <Button variant="outline" size="sm">
        New Action
      </Button>
    </div>
  );
}
```

## 📁 File Organization

```
src/
├── components/
│   ├── ui/                    # 🆕 shadcn/ui components (Tailwind)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── textarea.tsx
│   ├── main-interface/        # 📦 Existing (SCSS)
│   ├── control-tray/          # 📦 Existing (SCSS)
│   └── logger/                # 📦 Existing (SCSS)
├── lib/
│   └── utils.ts               # 🆕 Tailwind utility functions
└── index.css                  # 🔄 Updated with Tailwind directives
```

## 🌈 Theme Integration

The dark theme support works for both systems:

### Existing Components
Use your current theme switching logic with SCSS variables.

### New Components
Tailwind automatically respects the `dark` class:

```tsx
// Add this to your app root for dark mode
<div className="dark">
  <YourApp />
</div>
```

## 🔍 Best Practices

1. **Keep existing components unchanged** - Don't refactor working SCSS components
2. **Use Tailwind for new features** - Build new functionality with Tailwind + shadcn
3. **Consistent naming** - Use descriptive names for new components
4. **Performance** - Both systems are optimized and won't conflict

## 📝 Example: Adding a New Feature

Here's how to add a new feature using Tailwind + shadcn:

```tsx
// src/components/chat/ChatPanel.tsx
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";

export function ChatPanel() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Chat Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto bg-muted/10 rounded-md p-4">
          {/* Chat messages */}
        </div>
        <div className="flex gap-2">
          <Textarea 
            placeholder="Type a message..." 
            className="flex-1"
          />
          <Button size="icon">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

This setup gives you the best of both worlds - keeping your existing functionality intact while enabling modern Tailwind + shadcn development for new features!