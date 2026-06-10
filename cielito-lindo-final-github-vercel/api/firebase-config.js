// api/firebase-config.js — Vercel Serverless Function
// Sirve el archivo firebase-config.js con las claves desde variables de entorno
// Así firebase-config.js puede estar en .gitignore y las claves nunca se suben a GitHub

export default function handler(req, res) {
  // Validar que las variables existen
  const config = {
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID
  };

  // Si faltan vars, devolver error claro
  if (!config.apiKey) {
    res.status(500).send('// ERROR: Variables de entorno de Firebase no configuradas en Vercel');
    return;
  }

  // Servir como JavaScript
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(`
// firebase-config.js — generado por Vercel (las claves vienen de variables de entorno)
const firebaseConfig = ${JSON.stringify(config, null, 2)};

firebase.initializeApp(firebaseConfig);

const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();
`);
}
