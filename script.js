// firebase
// REMINDER: If you are using some random ass function that you haven't created chances are you're going to have to import it from here
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, getAdditionalUserInfo, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, updateProfile } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { query, getFirestore, addDoc, where, doc, collection, getDoc, getDocs, updateDoc, documentId, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// https://firebase.google.com/docs/web/setup#available-libraries
// github stfu, this is already restricted on the server side lmao
const firebaseConfig = {
    "apiKey": "AIzaSyA8bgyoLtWiHQqnziio4if2aSTJ1k-y0qc",
    "authDomain": "bulletinboard-f0479.firebaseapp.com",
    "projectId": "bulletinboard-f0479",
    "storageBucket": "bulletinboard-f0479.firebasestorage.app",
    "messagingSenderId": "614006899593",
    "appId": "1:614006899593:web:04c13c5f3505ebc0d55758"
};

const app = initializeApp(firebaseConfig);
var userId;
var currentUser;
var currentUsername;
const auth = getAuth();
const database = getFirestore();
const elgoog = new GoogleAuthProvider();

function signInWithEmail(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
        })
        .catch ((error) => {
            const errorCode = error.code;
            const message = error.message;
        });
}

function createAccount(email, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
        })
        .catch ((error) => {
            const errorCode = error.code;
            const message = error.message;
        });
}

// start actual code
// todo: sort by date, not ID

configureCursorSettings();

function postIt() {
    const currentUser = auth.currentUser;
    const alert = document.getElementById("alert");
    const date = new Date();

    if (!(currentUser)) {
        alert.innerText = "Please sign in first.";
        document.getElementById("signInOptions").classList.remove("hidden");
        return;
    }
    if (message.value.length < 4 || message.value.length > 5000) {
        alert.innerText = "Invalid message length."
        return;
    }
    addDoc(collection(database, "posts"), {
        message: message.value,
        author: currentUser.uid,
        date: date.getTime(),
    });
    document.getElementById("alert").innerHTML = "Message sent!";
    message.value = "";
    loadPosts();
}

async function isLoggedIn() {
    if (currentUser) {
        userId = await currentUser.uid;
        updateUsernameReference();

        document.getElementById("welcome").innerText = `Welcome ${currentUsername}`
        document.getElementById("accountOptions").classList.remove("hidden");
        document.getElementById("postform").classList.remove("hidden");
        document.getElementById("signInOptions").classList.add("hidden");
        document.getElementById("settings").addEventListener("click", () => { 
            document.getElementById("settingsdialog").showModal();
            document.getElementById("username").value = currentUsername || "";
        });
        document.getElementById("accountsettings").addEventListener("submit", (e) => {
            e.preventDefault();
            accountOptions();
        });
    } else {
        document.getElementById("accountOptions").classList.add("hidden");
        document.getElementById("postform").classList.add("hidden");
        document.getElementById("signInOptions").classList.remove("hidden");
        document.getElementById("signInNormally").addEventListener("click", () => {
            document.getElementById("signindialog").showModal();
        });
        document.getElementById("signin").addEventListener("submit", (e) => {
            e.preventDefault();
            let user = document.getElementById("email").value;
            let pass = document.getElementById("pswd").value;
            signInWithEmail(user, pass);
        });
    }
}

async function updateUsernameReference() {
    const docRef = doc(database, "usernames", userId);
    const usernameDoc = await getDoc(docRef);
    currentUsername = usernameDoc.data().username;
}

async function loadPosts() {
    const posts = await getDocs(collection(database, "posts"));
    const usernameQuery = query(collection(database, "usernames"));
    const usernameRef = await getDocs(usernameQuery);
    const board = document.getElementById("postboard");
    board.innerHTML = "";
    
    for (const doc of posts.docs) {
        // TODO: "owner" tag for me
        const newPost = document.createElement("div");
        newPost.classList.add("bg-sky-500", "border", "rounded-md", "p-3");

        const name = document.createElement("p");
        name.innerText = await getUsernameById(doc.data().author);
        name.classList.add("text-sm");

        const date = document.createElement("p");
        var dateText = new Date(doc.data().date);
        date.innerText = `${dateText.getMonth() + 1}/${dateText.getDate()}/${dateText.getFullYear()}`;
        date.classList.add("text-sm");

        const message = document.createElement("p");
        message.innerText = doc.data().message;

        newPost.appendChild(name);
        newPost.appendChild(date);
        newPost.appendChild(message);
        board.appendChild(newPost);
    }
    
    async function getUsernameById(author) {
        for (const doc of usernameRef.docs) {
            if (doc.id === author) {
                return doc.data().username;
            }
        }
    }
}

async function accountOptions() {
    updateUsernameReference();

    const userName = document.getElementById("username").value;
    if (currentUsername === userName || userName === "Touhou Engie") {
        return;
    }
    if (await checkForUsernameMatch(userName)) {
        console.log("duplicate username");
        return; 
    };
    const docRef = doc(database, "usernames", userId);
    await updateDoc(docRef, {
        username: userName
    });
    window.location.replace("/");
}

async function checkForUsernameMatch(name) {
    const usernames = await getDocs(collection(database, "usernames"));
    usernames.forEach((doc) => {
        if (doc.data().username === name) {
            return true;
        }
    });
    return false;
}

document.getElementById("signInWithElgoog").addEventListener("click", () => { signInWithPopup(auth, elgoog).then((result) => { 
    if (getAdditionalUserInfo(result).isNewUser) {
        document.getElementById("newusernamedialog").showModal();
        document.getElementById("firstusername").value = auth.currentUser.displayName || "";
        document.getElementById("newusername").addEventListener("submit", async (e) => {
            e.preventDefault();
            await setDoc(doc(database, "usernames", userId), {
                username: document.getElementById("firstusername").value
            });
            window.location.replace("/"); 
        });
    }
}); });
document.getElementById("signOut").addEventListener("click", () => { signOut(auth).then(() => { window.location.replace("/") }); });
// todo: error handling


const form = document.getElementById("postform");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    postIt();
});
const message = document.getElementById("message");
loadPosts();
auth.onAuthStateChanged((user) => {
    currentUser = user;
    isLoggedIn();
});


// imported from the mainline

function getCookie() {
  const cname = "cursor";
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let cookiearray = decodedCookie.split(';');
  for(let i = 0; i < cookiearray.length; i++) {
    let c = cookiearray[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function configureCursorSettings() {
  // check cookie
  let cursor = getCookie();
  if (cursor != "") {
    configureCursor(cursor);
  } else {   
    setCookie("cursor", "1", 365);
  }
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";domain=.touhouengie.com;samesite=lax" + expires + ";path=/";
    configureCursorSettings();
}

function configureCursor(num) {
    num = num || 1
    const cursorPointer = document.querySelectorAll(".pointer");
    const cursorDefault = document.querySelectorAll(".normal");
    const cursorText = document.querySelectorAll(".text");
    var param = ["cursor-", "0", "-", "~"];
    var a = getCookie("cursor");
    param[1] = num.toString();
    routeCursorStyle(cursorPointer, param, "pointer");
    routeCursorStyle(cursorDefault, param, "normal");
    routeCursorStyle(cursorText, param, "text");

    function routeCursorStyle(cursor, arr, style) {
      arr[3] = style;
      var text = arr.join('');
      if (cursor.length < 1) {
        arr[1] = a;
        cursor = document.querySelectorAll(arr.join(''));
        style = arr.join('');
      }
      setCursors(cursor, style, text);
    }

    function setCursors(list, target, replacer) {
      for (var i = 0; i < list.length; i++) {
        // if it ain't broke don't fix this
        list[i].classList.replace(target, replacer);
      }
    }
}