import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC8qeTBv9vgVlCMOQjFXPAGMkd7wHbKVe8",
    authDomain: "team-waffles-sys.firebaseapp.com",
    projectId: "team-waffles-sys",
    storageBucket: "team-waffles-sys.firebasestorage.app",
    messagingSenderId: "824743077785",
    appId: "1:824743077785:web:31f5c51d26b2088b71d508",
    measurementId: "G-D2G5DV44ZC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth).catch(error => console.error("Auth Error:", error));

// Handle form submission
document.getElementById("adForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const title = document.getElementById("adTitle").value;
    const text = document.getElementById("adText").value;
    const imageFile = document.getElementById("adImage").files[0];
    const status = document.getElementById("status");
    
    let imageUrl = null;
    if (imageFile) {
        const imageRef = storageRef(storage, 'ads/' + imageFile.name);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
    }
    
    const adRef = push(ref(database, 'ads'));
    await update(adRef, { title, text, imageUrl });
    
    status.innerText = "Ad uploaded successfully!";
    document.getElementById("adForm").reset();
});

//
//rules_version = '2';
//service firebase.storage {
 // match /b/{bucket}/o {
 ////   match /files/{allPaths=**} {
 //     allow read, write: if request.auth != null; // Allow access to authenticated users
////    }
//  }
//}
