
const firebaseConfig = {
    apiKey: "AIzaSyAT3jbz9BLtb7nqlElRZU4t0AW0YsvuKDI",
    authDomain: "studyhub-8b87a.firebaseapp.com",
    projectId: "studyhub-8b87a",
    storageBucket: "studyhub-8b87a.firebasestorage.app",
    messagingSenderId: "95190210602",
    appId: "1:95190210602:web:a67e49f80849c1bcc50b53a"
};

firebase.initializeApp(firebaseConfig);

window.firebaseAuth = firebase.auth();
window.firestoreDb = firebase.firestore();
