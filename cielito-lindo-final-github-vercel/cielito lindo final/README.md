# Cielito Lindo — Cabaña

## Variables de entorno requeridas en Vercel

En el panel de Vercel → Settings → Environment Variables, agregar:

| Variable | Descripción |
|---|---|
| `FIREBASE_API_KEY` | apiKey de Firebase |
| `FIREBASE_AUTH_DOMAIN` | authDomain de Firebase |
| `FIREBASE_PROJECT_ID` | projectId de Firebase |
| `FIREBASE_STORAGE_BUCKET` | storageBucket de Firebase |
| `FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId de Firebase |
| `FIREBASE_APP_ID` | appId de Firebase |

## Dominio autorizado en Firebase

En Firebase Console → Authentication → Settings → Authorized domains,
agregar el dominio de Vercel (ej: `cielitolindo-sigma.vercel.app`).

## Seguridad

- `js/firebase-config.js` está en `.gitignore` y **nunca se sube a GitHub**
- Las claves se sirven en runtime desde Vercel Environment Variables via `/api/firebase-config`
- El archivo `js/firebase-config.example.js` muestra la estructura sin claves reales
