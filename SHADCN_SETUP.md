# Instalación shadcn/ui Components

El proyecto ya tiene shadcn/ui configurado (`components.json`). 

Para instalar componentes según los necesites:

## Componentes Básicos (Recomendados)

```bash
# Instalación en un solo comando
npx shadcn@latest add button input card form select table dialog dropdown-menu badge avatar separator tabs toast
```

## Componentes Individuales

```bash
# Botones y formularios
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add slider

# Layouts
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add accordion

# Modales y popups
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add alert-dialog

# Navegación
npx shadcn@latest add dropdown-menu
npx shadcn@latest add menubar
npx shadcn@latest add navigation-menu
npx shadcn@latest add command

# Data display
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add calendar
npx shadcn@latest add progress

# Feedback
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add skeleton
```

## Componentes Específicos para ERP

### Para Formularios de Facturas
```bash
npx shadcn@latest add form select input textarea date-picker
```

### Para Tablas de Datos
```bash
npx shadcn@latest add table badge dropdown-menu
```

### Para Dashboard
```bash
npx shadcn@latest add card tabs progress
```

### Para Modales de Confirmación
```bash
npx shadcn@latest add alert-dialog dialog
```

## Uso de Form Component

El componente `form` de shadcn/ui ya integra:
- react-hook-form
- zod validation
- @hookform/resolvers

Ejemplo:
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Dark Mode

Para activar dark mode:

1. Instalar next-themes:
```bash
npm install next-themes
```

2. Wrap app con ThemeProvider en `src/app/layout.tsx`:
```tsx
import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

3. Toggle theme:
```tsx
import { useTheme } from "next-themes"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  )
}
```

## Personalización de Colores

Edita `src/app/globals.css` para cambiar la paleta de colores:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Azul por defecto */
  --secondary: 210 40% 96.1%;
  /* ... más variables */
}
```

## Documentación Completa

https://ui.shadcn.com/docs/components
