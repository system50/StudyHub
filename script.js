 
/* =========================================
   STUDYHUB - FIREBASE VERSION
========================================= */

/* =========================================
   FIREBASE INITIALIZATION
========================================= */

const auth = window.firebaseAuth;
const db = window.firestoreDb;

let currentUser = null;
let resources = [];
let currentFilter = "all";
let showingFavorites = false;
let loadedUserId = null;


/* =========================================
   SELECT HTML ELEMENTS
========================================= */

const addResourceForm = document.querySelector("#add-resource form");
const resourceNameInput = document.querySelector("#resourceName");
const subjectInput = document.querySelector("#subject");
const resourceTypeInput = document.querySelector("#resourceType");
const resourceLinkInput = document.querySelector("#resourceLink");
const descriptionInput = document.querySelector("#description");

const resourceContainer = document.querySelector(".resource-container");
const searchInput = document.querySelector("#searchBox");
const searchForm = document.querySelector("#search form");
const filterSubject = document.querySelector("#filterSubject");

const showAllButton = document.querySelector("#showAll");
const showFavoritesButton = document.querySelector("#showFavorites");

const totalResources = document.querySelector("#totalResources");
const favoriteResources = document.querySelector("#favoriteResources");
const totalSubjects = document.querySelector("#totalSubjects");


/* =========================================
   AUTHENTICATION ELEMENTS
========================================= */

const authScreen = document.querySelector("#authScreen");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authConfirmPassword = document.querySelector("#authConfirmPassword");

const confirmPasswordLabel = document.querySelector("#confirmPasswordLabel");
const authSubmit = document.querySelector("#authSubmit");
const authHeading = document.querySelector("#authHeading");
const authSubheading = document.querySelector("#authSubheading");
const authSwitch = document.querySelector("#authSwitch");
const authSwitchText = document.querySelector("#authSwitchText");
const authMessage = document.querySelector("#authMessage");

const logoutButton = document.querySelector("#logoutButton");
const signedInEmail = document.querySelector("#signedInEmail");

let authMode = "login";


/* =========================================
   AUTHENTICATION MESSAGES
========================================= */

function showAuthMessage(message, success = false) {

    authMessage.textContent = message || "";

    authMessage.classList.toggle("success", success);

}


/* =========================================
   LOGIN / SIGNUP MODE
========================================= */

function setAuthMode(mode) {

    authMode = mode;

    const signup = mode === "signup";

    authHeading.textContent = signup
        ? "Create your account"
        : "Welcome back!";

    authSubheading.textContent = signup
        ? "Sign up with your email and create a password."
        : "Log in to access your personal study resources.";

    authSubmit.textContent = signup
        ? "Create Account"
        : "Login";

    authSwitchText.textContent = signup
        ? "Already have an account?"
        : "New to StudyHub?";

    authSwitch.textContent = signup
        ? "Login"
        : "Create account";

    authConfirmPassword.hidden = !signup;
    confirmPasswordLabel.hidden = !signup;

    authConfirmPassword.required = signup;

    authPassword.value = "";
    authConfirmPassword.value = "";

    authPassword.autocomplete = signup
        ? "new-password"
        : "current-password";

    showAuthMessage("");

}


authSwitch.addEventListener("click", function () {

    setAuthMode(
        authMode === "login" ? "signup" : "login"
    );

});


/* =========================================
   LOGIN / SIGNUP
========================================= */

authForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    showAuthMessage("");

    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (password.length < 6) {

        showAuthMessage("Password must be at least 6 characters.");

        return;

    }

    if (
        authMode === "signup" &&
        password !== authConfirmPassword.value
    ) {

        showAuthMessage("Passwords do not match.");

        return;

    }

    authSubmit.disabled = true;

    authSubmit.textContent = authMode === "signup"
        ? "Creating account..."
        : "Logging in...";

    try {

        if (authMode === "signup") {

            await auth.createUserWithEmailAndPassword(
                email,
                password
            );

            showAuthMessage(
                "Account created successfully!",
                true
            );

        } else {

            await auth.signInWithEmailAndPassword(
                email,
                password
            );

        }

    } catch (error) {

        showAuthMessage(
            error.message || "Authentication failed."
        );

    } finally {

        authSubmit.disabled = false;

        authSubmit.textContent = authMode === "signup"
            ? "Create Account"
            : "Login";

    }

});


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener("click", async function () {

    try {

        await auth.signOut();

    } catch (error) {

        alert(error.message);

    }

});


/* =========================================
   AUTHENTICATION STATE
========================================= */

auth.onAuthStateChanged(async function (user) {

    if (user) {

        currentUser = user;

        document.body.classList.add("authenticated");

        signedInEmail.textContent = user.email || "Signed in";

        if (loadedUserId === user.uid) return;

        loadedUserId = user.uid;

        resources = [];

        try {

            await loadOnlineResources();

            refreshResources();

        } catch (error) {

            console.error(error);

            alert("Could not load resources. Please check Firestore rules.");

            refreshResources();

        }

    } else {

        currentUser = null;

        loadedUserId = null;

        resources = [];

        document.body.classList.remove("authenticated");

        signedInEmail.textContent = "";

        setAuthMode("login");

        refreshResources();

    }

});


/* =========================================
   FIRESTORE COLLECTION
========================================= */

function getResourceCollection() {

    if (!currentUser) {

        throw new Error("Please login first.");

    }

    return db
        .collection("users")
        .doc(currentUser.uid)
        .collection("study_resources");

}


/* =========================================
   LOAD ONLINE RESOURCES
========================================= */

async function loadOnlineResources() {

    const snapshot = await getResourceCollection().get();

    resources = snapshot.docs.map(function (document) {

        return {
            id: document.id,
            ...document.data()
        };

    });

}


/* =========================================
   SAVE RESOURCE
========================================= */

async function saveResource(resource) {

    try {

        await getResourceCollection()
            .doc(String(resource.id))
            .set(resource);

        return true;

    } catch (error) {

        console.error("Save failed:", error);

        alert("Could not save resource: " + error.message);

        return false;

    }

}


/* =========================================
   DELETE ONLINE RESOURCE
========================================= */

async function deleteOnlineResource(id) {

    try {

        await getResourceCollection()
            .doc(String(id))
            .delete();

        return true;

    } catch (error) {

        console.error(error);

        alert("Could not delete resource: " + error.message);

        return false;

    }

}


/* =========================================
   UPDATE DASHBOARD
========================================= */

function updateDashboard() {

    totalResources.textContent = resources.length;

    const favorites = resources.filter(function (resource) {

        return resource.favorite === true;

    });

    favoriteResources.textContent = favorites.length;

    const subjects = new Set(
        resources.map(function (resource) {

            return resource.subject;

        })
    );

    totalSubjects.textContent = subjects.size;

}


/* =========================================
   DISPLAY RESOURCES
========================================= */

function displayResources(resourceList) {

    resourceContainer.innerHTML = "";

    if (resourceList.length === 0) {

        const message = document.createElement("p");

        message.className = "no-resource";

        message.textContent = "No study resources found.";

        resourceContainer.appendChild(message);

        return;

    }

    resourceList.forEach(function (resource) {

        const card = document.createElement("article");

        card.className = "resource-card";

        const favorite = document.createElement("button");

        favorite.className = "favorite-btn";
        favorite.dataset.id = resource.id;
        favorite.textContent = resource.favorite ? "⭐" : "☆";
        favorite.title = "Add to favorites";

        const heading = document.createElement("h3");

        heading.textContent = resource.name;

        const description = document.createElement("p");

        description.textContent = resource.description;

        const type = document.createElement("p");

        type.textContent = "Type: " + resource.type;

        const subject = document.createElement("p");

        subject.textContent = "Subject: " + resource.subject;

        const actions = document.createElement("div");

        actions.className = "resource-actions";

        const link = document.createElement("a");

        link.href = resource.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open Resource";

        const edit = document.createElement("button");

        edit.className = "edit-btn";
        edit.dataset.id = resource.id;
        edit.textContent = "Edit";

        const remove = document.createElement("button");

        remove.className = "delete-btn";
        remove.dataset.id = resource.id;
        remove.textContent = "Delete";

        actions.append(link, edit, remove);

        card.append(
            favorite,
            heading,
            description,
            type,
            subject,
            actions
        );

        resourceContainer.appendChild(card);

    });

}


/* =========================================
   FILTER RESOURCES
========================================= */

function getFilteredResources() {

    let result = [...resources];

    if (currentFilter !== "all") {

        result = result.filter(function (resource) {

            return resource.subject === currentFilter;

        });

    }

    if (showingFavorites) {

        result = result.filter(function (resource) {

            return resource.favorite === true;

        });

    }

    const searchText = searchInput.value.trim().toLowerCase();

    if (searchText !== "") {

        result = result.filter(function (resource) {

            return (
                resource.name.toLowerCase().includes(searchText) ||
                resource.subject.toLowerCase().includes(searchText) ||
                resource.type.toLowerCase().includes(searchText) ||
                resource.description.toLowerCase().includes(searchText)
            );

        });

    }

    return result;

}


/* =========================================
   REFRESH
========================================= */

function refreshResources() {

    displayResources(getFilteredResources());

    updateDashboard();

}


/* =========================================
   ADD RESOURCE
========================================= */

addResourceForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!currentUser) {

        alert("Please login first.");

        return;

    }

    const name = resourceNameInput.value.trim();
    const subject = subjectInput.value;
    const type = resourceTypeInput.value;
    const link = resourceLinkInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!name || !subject || !type || !link || !description) {

        alert("Please fill all fields.");

        return;

    }

    let parsedURL;

    try {

        parsedURL = new URL(link);

        if (!["http:", "https:"].includes(parsedURL.protocol)) {
            throw new Error("Invalid URL");
        }

    } catch {

        alert("Please enter a valid HTTP or HTTPS resource URL.");

        return;

    }

    const newResource = {

        id: String(Date.now()),

        name: name,

        subject: subject,

        type: type,

        link: link,

        description: description,

        favorite: false,

        createdAt: Date.now()

    };

    const saved = await saveResource(newResource);

    if (!saved) return;

    resources.push(newResource);

    refreshResources();

    addResourceForm.reset();

    alert("Resource added successfully!");

});


/* =========================================
   SEARCH
========================================= */

searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    refreshResources();

});

searchInput.addEventListener("input", function () {

    refreshResources();

});


/* =========================================
   SUBJECT FILTER
========================================= */

filterSubject.addEventListener("change", function () {

    currentFilter = filterSubject.value;

    showingFavorites = false;

    refreshResources();

});


/* =========================================
   SHOW ALL
========================================= */

showAllButton.addEventListener("click", function () {

    currentFilter = "all";

    showingFavorites = false;

    filterSubject.value = "all";

    refreshResources();

});


/* =========================================
   SHOW FAVORITES
========================================= */

showFavoritesButton.addEventListener("click", function () {

    currentFilter = "all";

    showingFavorites = true;

    filterSubject.value = "all";

    refreshResources();

});


/* =========================================
   SUBJECT BUTTONS
========================================= */

document.querySelectorAll(".subject-filter").forEach(function (button) {

    button.addEventListener("click", function () {

        currentFilter = button.dataset.subject;

        showingFavorites = false;

        filterSubject.value = currentFilter;

        document.querySelector("#resources").scrollIntoView({
            behavior: "smooth"
        });

        refreshResources();

    });

});


/* =========================================
   RESOURCE ACTIONS
========================================= */

resourceContainer.addEventListener("click", async function (event) {

    const target = event.target;

    const id = target.dataset.id;

    if (!id) return;

    const resource = resources.find(function (item) {

        return String(item.id) === String(id);

    });

    if (!resource) return;


    /* FAVORITE */

    if (target.classList.contains("favorite-btn")) {

        const updatedResource = {
            ...resource,
            favorite: !resource.favorite
        };

        const saved = await saveResource(updatedResource);

        if (!saved) return;

        Object.assign(resource, updatedResource);

        refreshResources();

    }


    /* DELETE */

    if (target.classList.contains("delete-btn")) {

        const confirmation = confirm(
            "Are you sure you want to delete this resource?"
        );

        if (!confirmation) return;

        const deleted = await deleteOnlineResource(id);

        if (!deleted) return;

        resources = resources.filter(function (item) {

            return String(item.id) !== String(id);

        });

        refreshResources();

    }


    /* EDIT */

    if (target.classList.contains("edit-btn")) {

        openEditModal(id);

    }

});


/* =========================================
   CREATE EDIT MODAL
========================================= */

function createEditModal() {

    const modal = document.createElement("div");

    modal.id = "editModal";

    modal.className = "edit-modal";

    modal.innerHTML = `
        <div class="edit-modal-content">

            <div class="edit-modal-header">

                <h2>Edit Study Resource</h2>

                <button type="button" id="closeEditModal"
                    class="close-modal">&times;</button>

            </div>

            <form id="editResourceForm">

                <div>
                    <label for="editName">Resource Name</label>
                    <input type="text" id="editName" required>
                </div>

                <div>
                    <label for="editSubject">Subject</label>
                    <select id="editSubject" required>
                        <option value="">Select Subject</option>
                        <option value="Programming">Programming</option>
                        <option value="Data Structures">Data Structures</option>
                        <option value="Database">Database</option>
                        <option value="Web Development">Web Development</option>
                    </select>
                </div>

                <div>
                    <label for="editType">Resource Type</label>
                    <select id="editType" required>
                        <option value="">Select Type</option>
                        <option value="Notes">Notes</option>
                        <option value="Book">Book</option>
                        <option value="Video">Video</option>
                        <option value="Tutorial">Tutorial</option>
                        <option value="Practice">Practice</option>
                    </select>
                </div>

                <div>
                    <label for="editLink">Resource Link</label>
                    <input type="url" id="editLink" required>
                </div>

                <div>
                    <label for="editDescription">Description</label>
                    <textarea id="editDescription" rows="5" required></textarea>
                </div>

                <div class="edit-modal-actions">

                    <button type="button" id="cancelEdit"
                        class="cancel-edit">Cancel</button>

                    <button type="submit"
                        class="save-edit">Save Changes</button>

                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.querySelector("#closeEditModal")
        .addEventListener("click", closeEditModal);

    document.querySelector("#cancelEdit")
        .addEventListener("click", closeEditModal);

    document.querySelector("#editResourceForm")
        .addEventListener("submit", saveEditedResource);

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {

            closeEditModal();

        }

    });

}


/* =========================================
   OPEN EDIT MODAL
========================================= */

function openEditModal(id) {

    let modal = document.querySelector("#editModal");

    if (!modal) {

        createEditModal();

        modal = document.querySelector("#editModal");

    }

    const resource = resources.find(function (item) {

        return String(item.id) === String(id);

    });

    if (!resource) return;

    modal.dataset.editingId = id;

    document.querySelector("#editName").value = resource.name;

    document.querySelector("#editSubject").value = resource.subject;

    document.querySelector("#editType").value = resource.type;

    document.querySelector("#editLink").value = resource.link;

    document.querySelector("#editDescription").value = resource.description;

    modal.classList.add("show");

    document.body.classList.add("modal-open");

}


/* =========================================
   SAVE EDITED RESOURCE
========================================= */

async function saveEditedResource(event) {

    event.preventDefault();

    const modal = document.querySelector("#editModal");

    const id = modal.dataset.editingId;

    const resource = resources.find(function (item) {

        return String(item.id) === String(id);

    });

    if (!resource) return;

    const newName = document.querySelector("#editName").value.trim();

    const newSubject = document.querySelector("#editSubject").value;

    const newType = document.querySelector("#editType").value;

    const newLink = document.querySelector("#editLink").value.trim();

    const newDescription = document.querySelector("#editDescription").value.trim();

    if (!newName || !newSubject || !newType || !newLink || !newDescription) {

        alert("Please fill all fields.");

        return;

    }

    try {

        const parsedURL = new URL(newLink);

        if (!["http:", "https:"].includes(parsedURL.protocol)) {
            throw new Error("Invalid URL");
        }

    } catch {

        alert("Please enter a valid HTTP or HTTPS resource URL.");

        return;

    }

    const updatedResource = {

        ...resource,

        name: newName,

        subject: newSubject,

        type: newType,

        link: newLink,

        description: newDescription

    };

    const saved = await saveResource(updatedResource);

    if (!saved) return;

    Object.assign(resource, updatedResource);

    closeEditModal();

    refreshResources();

    alert("Resource updated successfully!");

}


/* =========================================
   CLOSE EDIT MODAL
========================================= */

function closeEditModal() {

    const modal = document.querySelector("#editModal");

    if (!modal) return;

    modal.classList.remove("show");

    document.body.classList.remove("modal-open");

}


/* =========================================
   INITIAL STATE
========================================= */

refreshResources();

console.log("StudyHub Firebase application initialized successfully!");
