// ============================================================
// AUTH.JS — Firebase Compat
// ============================================================

let currentUser = null;
let userRole = null;

// ─────────────────────────────────────────────
// GUARDAR USUARIO EN FIRESTORE
// Función separada para reutilizar en register y Google
// ─────────────────────────────────────────────
async function saveUserToFirestore(user, extraData = {}) {
  try {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      // Usuario nuevo: crear documento completo
      await ref.set({
        nombre:    extraData.nombre    || user.displayName || '',
        email:     user.email,
        telefono:  extraData.telefono  || '',
        role:      'client',
        creadoEn:  firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Usuario guardado en Firestore:', user.uid);
    }
    // Si ya existe, no sobreescribir (preserva el role que el admin pudo haber cambiado)
  } catch (e) {
    console.error('Error guardando usuario en Firestore:', e.code, e.message);
    throw e; // re-lanzar para que el llamador lo maneje
  }
}

// ─────────────────────────────────────────────
// AUTH OBSERVER
// ─────────────────────────────────────────────
function init(onAuthChange) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      userRole = await getUserRole(user.uid);
      onAuthChange?.(user, userRole);
      updateNavUI(user, userRole);
    } else {
      currentUser = null;
      userRole = null;
      onAuthChange?.(null, null);
      updateNavUI(null, null);
    }
  });
}

// ─────────────────────────────────────────────
// ROLE
// ─────────────────────────────────────────────
async function getUserRole(uid) {
  try {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data().role : 'client';
  } catch {
    return 'client';
  }
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
async function register({ nombre, email, telefono, password }) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: nombre });

    // Guardar en Firestore — si falla, eliminamos el usuario de Auth
    // para que el usuario pueda intentarlo de nuevo sin el error "email ya registrado"
    try {
      await saveUserToFirestore(cred.user, { nombre, telefono });
    } catch (firestoreError) {
      console.error('Fallo Firestore, revirtiendo Auth:', firestoreError);
      await cred.user.delete(); // revertir la creación en Auth
      Toast.show('Error al guardar tus datos. Revisá las reglas de Firestore.', 'error');
      return { ok: false, error: 'firestore-failed' };
    }

    Toast.show('¡Cuenta creada con éxito!', 'success');
    return { ok: true, user: cred.user };
  } catch (e) {
    console.error('Error en registro:', e.code, e.message);
    const msg = firebaseErrorMsg(e.code);
    Toast.show(msg, 'error');
    return { ok: false, error: msg };
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
async function login(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    Toast.show('¡Bienvenido de vuelta!', 'success');
    return { ok: true, user: cred.user };
  } catch (e) {
    const msg = firebaseErrorMsg(e.code);
    Toast.show(msg, 'error');
    return { ok: false, error: msg };
  }
}

// ─────────────────────────────────────────────
// GOOGLE LOGIN — signInWithRedirect
// ─────────────────────────────────────────────
async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    await auth.signInWithRedirect(provider);
  } catch (e) {
    console.error('Error iniciando redirect de Google:', e);
    Toast.show('Error al iniciar con Google', 'error');
    return { ok: false };
  }
}

// ─────────────────────────────────────────────
// PROCESAR RESULTADO DEL REDIRECT DE GOOGLE
// IMPORTANTE: debe llamarse con await ANTES de Auth.init()
// Retorna true si procesó un redirect, false si no había nada que procesar
// ─────────────────────────────────────────────
async function handleGoogleRedirect() {
  try {
    const result = await auth.getRedirectResult();

    if (!result || !result.user) {
      return false; // No hay redirect pendiente, flujo normal
    }

    const user = result.user;
    console.log('Redirect de Google procesado:', user.email);

    // Guardar en Firestore si es usuario nuevo
    await saveUserToFirestore(user);
    Toast.show('¡Bienvenido, ' + (user.displayName || user.email) + '!', 'success');
    return true;

  } catch (e) {
    console.error('Error procesando redirect de Google:', e.code, e.message);
    if (e.code === 'auth/unauthorized-domain') {
      Toast.show('Error: El dominio no está autorizado en Firebase. Agregalo en Authentication → Dominios autorizados.', 'error');
    } else {
      Toast.show('Error con Google: ' + (e.message || e.code), 'error');
    }
    return false;
  }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
async function logout() {
  await auth.signOut();
  Toast.show('Sesión cerrada', 'info');
}

// ─────────────────────────────────────────────
// NAV UI
// ─────────────────────────────────────────────
function updateNavUI(user, role) {
  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const adminBtn = document.getElementById('nav-admin-btn');
  const userName = document.getElementById('nav-user-name');

  if (!loginBtn) return;

  if (user) {
    loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
    if (adminBtn) adminBtn.style.display = role === 'admin' ? 'flex' : 'none';
  } else {
    loginBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
  }
}

// ─────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────
function firebaseErrorMsg(code) {
  const msgs = {
    'auth/user-not-found':        'No existe una cuenta con ese email',
    'auth/wrong-password':        'Contraseña incorrecta',
    'auth/email-already-in-use':  'Ya existe una cuenta con ese email',
    'auth/weak-password':         'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email':         'Email inválido',
    'auth/too-many-requests':     'Demasiados intentos. Intentá más tarde',
    'auth/network-request-failed':'Error de conexión',
    'auth/invalid-credential':    'Credenciales inválidas',
    'auth/unauthorized-domain':   'Dominio no autorizado en Firebase'
  };
  return msgs[code] || 'Ocurrió un error (' + code + ')';
}

// ─────────────────────────────────────────────
// EXPORT (objeto global)
// ─────────────────────────────────────────────
const Auth = {
  init,
  register,
  login,
  loginWithGoogle,
  handleGoogleRedirect,
  logout,
  getCurrentUser: () => currentUser,
  getRole: () => userRole
};
