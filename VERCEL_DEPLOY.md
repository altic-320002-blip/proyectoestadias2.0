# Despliegue en Vercel

## Requisitos previos
1. Cuenta en Supabase y proyecto creado.
2. Ejecutar la migración SQL en Supabase:
   ```bash
   # En SQL Editor de Supabase
   supabase_migration.sql
   ```
3. Obtener `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde Settings > API.

## Pasos
1. Sube el repo a GitHub.
2. En Vercel, importa el proyecto.
3. En Settings > Environment Variables añade:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Vercel servirá los archivos estáticos y las funciones en `/api`.
5. El frontend usa ruta relativa `/api` gracias a `js/config.js`.

## Notas
- El backend Express original (`server.js`) queda para desarrollo local con MySQL/XAMPP.
- En producción se usa Supabase PostgreSQL con funciones serverless.
- Para desarrollo local con Vercel Functions: `vercel dev`.

