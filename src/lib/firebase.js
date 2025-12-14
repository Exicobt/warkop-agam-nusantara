import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyD7F6dJWgUdYF_EAXqqQWpSnK52YbNEDa4",
    authDomain: "warkop-agam-nsuantara.firebaseapp.com",
    projectId: "warkop-agam-nsuantara",
    storageBucket: "warkop-agam-nsuantara.firebasestorage.app",
    messagingSenderId: "550954545446",
    appId: "1:550954545446:web:07e9b43a8ce080408151e7",
    measurementId: "G-NEFFZRPZ0L"
};

const app = initializeApp(firebaseConfig);
export const  auth = getAuth(app)