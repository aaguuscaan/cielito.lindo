// api/firebase-config.js — Vercel Serverless Function
// Sirve firebase-config.js con las claves desde variables de entorno de Vercel
// Configurá estas vars en: Vercel Dashboard → Project → Settings → Environment Variables

export default function handler(req, res) {
  const config = {
    apiKey:            process.env.FIREBASE_API_KEY,
    // authDomain SIEMPRE debe ser el dominio de Firebase, nunca el de Vercel
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID
  };

  if (!config.apiKey) {
    res.status(500).send('// ERROR: Variables de entorno de Firebase no configuradas en Vercel.\n// Agregá FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc. en Vercel → Settings → Environment Variables');
    return;
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(`
// firebase-config.js — generado por Vercel (claves desde variables de entorno)
const firebaseConfig = ${JSON.stringify(config, null, 2)};

firebase.initializeApp(firebaseConfig);

const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();
`);
}