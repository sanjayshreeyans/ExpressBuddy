---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.ts', '**/components/**/*']
---

# Shadcn/UI Component Guidelines

## Component Discovery & Planning

**Always start with shadcn/ui components before building custom UI:**
- Use `mcp_shadcn_ui_server_list_components` to discover available components
- Use `mcp_shadcn_ui_server_list_blocks` for pre-built component combinations
- Check `mcp_shadcn_ui_server_get_component_docs` for API documentation before implementation
- Prefer complete shadcn blocks over individual components when available

## Installation & Integration

**Required workflow for adding components:**
1. **Document first**: Use `mcp_shadcn_ui_server_get_component_docs` to understand the component API
2. **Install**: Use `mcp_shadcn_ui_server_install_component` to add to project
3. **Import**: Always import from `@/components/ui/[component-name]`
4. **Customize**: Use Tailwind classes and CSS variables for styling

## Code Standards

**Import patterns:**
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
```

**Styling approach:**
- Use Tailwind utility classes for modifications
- Leverage CSS variables for theme consistency
- Follow component's documented prop interface exactly
- Maintain shadcn naming conventions (kebab-case for files, PascalCase for components)

## Architecture Rules

- **Never** create custom components that duplicate shadcn functionality
- **Always** use MCP shadcn server tools for component operations
- **Prefer** composition over customization when building complex UI
- **Map** user requirements to existing shadcn patterns before custom solutions