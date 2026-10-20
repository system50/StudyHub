/* =================================
   STUDY RESOURCE ORGANIZE
================================= */


/* =================================
   SELECT HTML ELEMENTS
================================= */

const addResourceForm =
    document.querySelector("#add-resource form");

const resourceNameInput =
    document.querySelector("#resourceName");

const subjectInput =
    document.querySelector("#subject");

const resourceTypeInput =
    document.querySelector("#resourceType");

const resourceLinkInput =
    document.querySelector("#resourceLink");

const descriptionInput =
    document.querySelector("#description");

const resourceContainer =
    document.querySelector(".resource-container");

const searchInput =
    document.querySelector("#searchBox");

const searchForm =
    document.querySelector("#search form");

const filterSubject =
    document.querySelector("#filterSubject");

const showAllButton =
    document.querySelector("#showAll");

const showFavoritesButton =
    document.querySelector("#showFavorites");


/* =================================
   DASHBOARD
================================= */

const totalResources =
    document.querySelector("#totalResources");

const favoriteResources =
    document.querySelector("#favoriteResources");

const totalSubjects =
    document.querySelector("#totalSubjects");


/* =================================
   RESOURCES
================================= */

let resources = [];
let currentUser = null;
let currentFilter = "all";
let showingFavorites = false;
let appStarted = false;

const supabaseConfig = window.STUDYHUB_SUPABASE_CONFIG || {};
const supabaseUrl = (supabaseConfig.url || "").trim();
const supabaseAnonKey = (supabaseConfig.anonKey || "").trim();
const supabaseReady = Boolean(
    window.supabase && supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes("YOUR_PROJECT") && !supabaseAnonKey.includes("YOUR_SUPABASE")
);
const supabaseClient = supabaseReady
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;

/* Save each signed-in user's resources to the online Supabase database. */
async function saveResources() {
    if (!supabaseClient || !currentUser) {
        showAuthMessage("Please configure Supabase and log in to save online.", false);
        return;
    }

    const rows = resources.map(resource => ({
        id: Number(resource.id),
        user_id: currentUser.id,
        name: resource.name,
        subject: resource.subject,
        type: resource.type,
        link: resource.link,
        description: resource.description,
        favorite: Boolean(resource.favorite),
        updated_at: new Date().toISOString()
    }));

    try {
        if (rows.length) {
            const { error: upsertError } = await supabaseClient
                .from("study_resources")
                .upsert(rows, { onConflict: "user_id,id" });
            if (upsertError) throw upsertError;
        }

        const { data: existingRows, error: readError } = await supabaseClient
            .from("study_resources")
            .select("id")
            .eq("user_id", currentUser.id);
        if (readError) throw readError;

        const keepIds = new Set(rows.map(row => row.id));
        const idsToDelete = (existingRows || [])
            .map(row => Number(row.id))
            .filter(id => !keepIds.has(id));

        if (idsToDelete.length) {
            const { error: deleteError } = await supabaseClient
                .from("study_resources")
                .delete()
                .eq("user_id", currentUser.id)
                .in("id", idsToDelete);
            if (deleteError) throw deleteError;
        }
    } catch (error) {
        console.error("Online save failed:", error);
        alert("Online save failed. Please check your Supabase setup and database SQL.");
    }
}

async function loadOnlineResources() {
    const { data, error } = await supabaseClient
        .from("study_resources")
        .select("id, name, subject, type, link, description, favorite")
        .eq("user_id", currentUser.id)
        .order("id", { ascending: true });

    if (error) throw error;
    resources = (data || []).map(row => ({
        id: Number(row.id),
        name: row.name,
        subject: row.subject,
        type: row.type,
        link: row.link,
        description: row.description,
        favorite: Boolean(row.favorite)
    }));
}


/* =================================
   UPDATE DASHBOARD
================================= */

function updateDashboard() {

    totalResources.textContent =
        resources.length;


    const favorites =
        resources.filter(function(resource) {

            return resource.favorite === true;

        });


    favoriteResources.textContent =
        favorites.length;


    const subjects =
        new Set(
            resources.map(function(resource) {

                return resource.subject;

            })
        );


    totalSubjects.textContent =
        subjects.size;

}


/* =================================
   DISPLAY RESOURCES
================================= */

function displayResources(resourceList) {

    resourceContainer.innerHTML = "";


    if (resourceList.length === 0) {

        resourceContainer.innerHTML = `
            <p class="no-resource">
                No study resources found.
            </p>
        `;

        return;

    }


    resourceList.forEach(function(resource) {

        const card =
            document.createElement("article");

        card.classList.add("resource-card");


        card.innerHTML = `

            <button
                class="favorite-btn"
                data-id="${resource.id}"
                title="Add to favorites"
            >
                ${resource.favorite ? "⭐" : "☆"}
            </button>


            <h3>
                ${resource.name}
            </h3>


            <p>
                ${resource.description}
            </p>


            <p>
                <strong>Type:</strong>
                ${resource.type}
            </p>


            <p>
                <strong>Subject:</strong>
                ${resource.subject}
            </p>


            <div class="resource-actions">

                <a
                    href="${resource.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Resource
                </a>


                <button
                    class="edit-btn"
                    data-id="${resource.id}"
                >
                    Edit
                </button>


                <button
                    class="delete-btn"
                    data-id="${resource.id}"
                >
                    Delete
                </button>

            </div>

        `;


        resourceContainer.appendChild(card);

    });

}


/* =================================
   FILTER RESOURCES
================================= */

function getFilteredResources() {

    let result = [...resources];


    /* Subject */

    if (currentFilter !== "all") {

        result =
            result.filter(function(resource) {

                return resource.subject === currentFilter;

            });

    }


    /* Favorites */

    if (showingFavorites) {

        result =
            result.filter(function(resource) {

                return resource.favorite === true;

            });

    }


    /* Search */

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    if (searchText !== "") {

        result =
            result.filter(function(resource) {

                return (

                    resource.name
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    resource.subject
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    resource.type
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    resource.description
                        .toLowerCase()
                        .includes(searchText)

                );

            });

    }


    return result;

}


/* =================================
   REFRESH
================================= */

function refreshResources() {

    displayResources(
        getFilteredResources()
    );

    updateDashboard();

}


/* =================================
   ADD RESOURCE
================================= */

addResourceForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const name =
            resourceNameInput.value.trim();

        const subject =
            subjectInput.value;

        const type =
            resourceTypeInput.value;

        const link =
            resourceLinkInput.value.trim();

        const description =
            descriptionInput.value.trim();


        /* Validation */

        if (
            name === "" ||
            subject === "" ||
            type === "" ||
            link === "" ||
            description === ""
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        /* URL validation */

        try {

            new URL(link);

        } catch {

            alert(
                "Please enter a valid resource URL."
            );

            return;

        }


        /* New resource */

        const newResource = {

            id: Date.now(),

            name: name,

            subject: subject,

            type: type,

            link: link,

            description: description,

            favorite: false

        };


        resources.push(newResource);


        saveResources();

        refreshResources();


        addResourceForm.reset();


        alert(
            "Resource added successfully!"
        );

    }
);


/* =================================
   SEARCH
================================= */

searchForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        refreshResources();

    }
);


searchInput.addEventListener(
    "input",
    function() {

        refreshResources();

    }
);


/* =================================
   SUBJECT FILTER
================================= */

filterSubject.addEventListener(
    "change",
    function() {

        currentFilter =
            filterSubject.value;

        showingFavorites = false;

        refreshResources();

    }
);


/* =================================
   SHOW ALL
================================= */

showAllButton.addEventListener(
    "click",
    function() {

        currentFilter = "all";

        showingFavorites = false;

        filterSubject.value = "all";

        refreshResources();

    }
);


/* =================================
   SHOW FAVORITES
================================= */

showFavoritesButton.addEventListener(
    "click",
    function() {

        currentFilter = "all";

        showingFavorites = true;

        filterSubject.value = "all";

        refreshResources();

    }
);


/* =================================
   SUBJECT BUTTONS
================================= */

document.querySelectorAll(
    ".subject-filter"
).forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            currentFilter =
                button.dataset.subject;

            showingFavorites = false;

            filterSubject.value =
                currentFilter;


            document
                .querySelector("#resources")
                .scrollIntoView({
                    behavior: "smooth"
                });


            refreshResources();

        }
    );

});


/* =================================
   RESOURCE ACTIONS
================================= */

resourceContainer.addEventListener(
    "click",
    function(event) {


        /* =========================
           FAVORITE
        ========================= */

        if (
            event.target.classList.contains(
                "favorite-btn"
            )
        ) {

            const id =
                Number(
                    event.target.dataset.id
                );


            const resource =
                resources.find(function(item) {

                    return item.id === id;

                });


            if (!resource) {
                return;
            }


            resource.favorite =
                !resource.favorite;


            saveResources();

            refreshResources();

        }


        /* =========================
           DELETE
        ========================= */

        if (
            event.target.classList.contains(
                "delete-btn"
            )
        ) {

            const id =
                Number(
                    event.target.dataset.id
                );


            const confirmation =
                confirm(
                    "Are you sure you want to delete this resource?"
                );


            if (!confirmation) {
                return;
            }


            resources =
                resources.filter(
                    function(resource) {

                        return resource.id !== id;

                    }
                );


            saveResources();

            refreshResources();

        }


        /* =========================
           EDIT
        ========================= */

        if (
            event.target.classList.contains(
                "edit-btn"
            )
        ) {

            const id =
                Number(
                    event.target.dataset.id
                );


            openEditModal(id);

        }

    }
);


/* =================================
   CREATE EDIT MODAL
================================= */

function createEditModal() {

    const modal =
        document.createElement("div");

    modal.id = "editModal";

    modal.className = "edit-modal";


    modal.innerHTML = `

        <div class="edit-modal-content">

            <div class="edit-modal-header">

                <h2>
                    Edit Study Resource
                </h2>

                <button
                    id="closeEditModal"
                    class="close-modal"
                >
                    &times;
                </button>

            </div>


            <form id="editResourceForm">


                <div>

                    <label for="editName">
                        Resource Name
                    </label>

                    <input
                        type="text"
                        id="editName"
                        required
                    >

                </div>


                <div>

                    <label for="editSubject">
                        Subject
                    </label>

                    <select
                        id="editSubject"
                        required
                    >

                        <option value="">
                            Select Subject
                        </option>

                        <option value="Programming">
                            Programming
                        </option>

                        <option value="Data Structures">
                            Data Structures
                        </option>

                        <option value="Database">
                            Database
                        </option>

                        <option value="Web Development">
                            Web Development
                        </option>

                    </select>

                </div>


                <div>

                    <label for="editType">
                        Resource Type
                    </label>

                    <select
                        id="editType"
                        required
                    >

                        <option value="">
                            Select Type
                        </option>

                        <option value="Notes">
                            Notes
                        </option>

                        <option value="Book">
                            Book
                        </option>

                        <option value="Video">
                            Video
                        </option>

                        <option value="Tutorial">
                            Tutorial
                        </option>

                        <option value="Practice">
                            Practice
                        </option>

                    </select>

                </div>


                <div>

                    <label for="editLink">
                        Resource Link
                    </label>

                    <input
                        type="url"
                        id="editLink"
                        required
                    >

                </div>


                <div>

                    <label for="editDescription">
                        Description
                    </label>

                    <textarea
                        id="editDescription"
                        rows="5"
                        required
                    ></textarea>

                </div>


                <div class="edit-modal-actions">

                    <button
                        type="button"
                        id="cancelEdit"
                        class="cancel-edit"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="save-edit"
                    >
                        Save Changes
                    </button>

                </div>


            </form>

        </div>

    `;


    document.body.appendChild(modal);


    /* Close button */

    document
        .querySelector("#closeEditModal")
        .addEventListener(
            "click",
            closeEditModal
        );


    /* Cancel button */

    document
        .querySelector("#cancelEdit")
        .addEventListener(
            "click",
            closeEditModal
        );


    /* Save */

    document
        .querySelector("#editResourceForm")
        .addEventListener(
            "submit",
            saveEditedResource
        );


    /* Click outside */

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target === modal
            ) {

                closeEditModal();

            }

        }
    );

}


/* =================================
   OPEN EDIT MODAL
================================= */

function openEditModal(id) {

    let modal =
        document.querySelector("#editModal");


    if (!modal) {

        createEditModal();

        modal =
            document.querySelector("#editModal");

    }


    const resource =
        resources.find(function(item) {

            return item.id === id;

        });


    if (!resource) {
        return;
    }


    /* Store ID */

    modal.dataset.editingId = id;


    /* Fill existing data */

    document.querySelector("#editName").value =
        resource.name;


    document.querySelector("#editSubject").value =
        resource.subject;


    document.querySelector("#editType").value =
        resource.type;


    document.querySelector("#editLink").value =
        resource.link;


    document.querySelector("#editDescription").value =
        resource.description;


    /* Show modal */

    modal.classList.add("show");


    document.body.classList.add(
        "modal-open"
    );

}


/* =================================
   SAVE EDITED RESOURCE
================================= */

function saveEditedResource(event) {

    event.preventDefault();


    const modal =
        document.querySelector("#editModal");


    const id =
        Number(
            modal.dataset.editingId
        );


    const resource =
        resources.find(function(item) {

            return item.id === id;

        });


    if (!resource) {
        return;
    }


    const newName =
        document
            .querySelector("#editName")
            .value
            .trim();


    const newSubject =
        document
            .querySelector("#editSubject")
            .value;


    const newType =
        document
            .querySelector("#editType")
            .value;


    const newLink =
        document
            .querySelector("#editLink")
            .value
            .trim();


    const newDescription =
        document
            .querySelector("#editDescription")
            .value
            .trim();


    /* Validation */

    if (
        newName === "" ||
        newSubject === "" ||
        newType === "" ||
        newLink === "" ||
        newDescription === ""
    ) {

        alert(
            "Please fill all fields."
        );

        return;

    }


    /* URL validation */

    try {

        new URL(newLink);

    } catch {

        alert(
            "Please enter a valid resource URL."
        );

        return;

    }


    /* Update resource */

    resource.name =
        newName;

    resource.subject =
        newSubject;

    resource.type =
        newType;

    resource.link =
        newLink;

    resource.description =
        newDescription;


    /* Save */

    saveResources();


    /* Close */

    closeEditModal();


    /* Refresh */

    refreshResources();


    alert(
        "Resource updated successfully!"
    );

}


/* =================================
   CLOSE EDIT MODAL
================================= */

function closeEditModal() {

    const modal =
        document.querySelector("#editModal");


    if (!modal) {
        return;
    }


    modal.classList.remove("show");


    document.body.classList.remove(
        "modal-open"
    );

}


/* =================================
   INITIAL LOAD
================================= */


/* =================================
   LOGIN / SIGNUP AND APP STARTUP
================================= */
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

function showAuthMessage(message, success = false) {
    if (!authMessage) return;
    authMessage.textContent = message || "";
    authMessage.classList.toggle("success", Boolean(success));
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    authHeading.textContent = signup ? "Create your account" : "Welcome back!";
    authSubheading.textContent = signup
        ? "Sign up with your email and create a password."
        : "Log in to access your personal study resources.";
    authSubmit.textContent = signup ? "Create Account" : "Login";
    authSwitchText.textContent = signup ? "Already have an account?" : "New to StudyHub?";
    authSwitch.textContent = signup ? "Login" : "Create account";
    authConfirmPassword.hidden = !signup;
    confirmPasswordLabel.hidden = !signup;
    authConfirmPassword.required = signup;
    authPassword.autocomplete = signup ? "new-password" : "current-password";
    authPassword.value = "";
    authConfirmPassword.value = "";
    showAuthMessage("");
}

authSwitch.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "signup" : "login");
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();
    showAuthMessage("");

    if (!supabaseClient) {
        showAuthMessage("Setup required: add your Supabase Project URL and anon key in supabase-config.js, then run supabase-setup.sql.");
        return;
    }

    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (password.length < 6) {
        showAuthMessage("Password must be at least 6 characters.");
        return;
    }

    if (authMode === "signup" && password !== authConfirmPassword.value) {
        showAuthMessage("Passwords do not match.");
        return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = authMode === "signup" ? "Creating account..." : "Logging in...";

    try {
        if (authMode === "signup") {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            if (data.session) {
                showAuthMessage("Account created successfully!", true);
            } else {
                showAuthMessage("Account created. Check your email to confirm, then log in.", true);
                setAuthMode("login");
                authEmail.value = email;
            }
        } else {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (error) {
        showAuthMessage(error.message || "Could not sign in. Please try again.");
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = authMode === "signup" ? "Create Account" : "Login";
    }
});

logoutButton.addEventListener("click", async () => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) alert(error.message);
});

async function openStudyHub(session) {
    if (!session || !session.user) return;
    currentUser = session.user;
    document.body.classList.add("authenticated");
    signedInEmail.textContent = currentUser.email || "Signed in";
    if (appStarted) return;
    appStarted = true;

    try {
        await loadOnlineResources();
        refreshResources();
    } catch (error) {
        console.error("Could not load online resources:", error);
        alert("Could not load your online resources. Please check that you ran supabase-setup.sql.");
        resources = [];
        refreshResources();
    }
}

function showLoggedOutScreen() {
    currentUser = null;
    resources = [];
    appStarted = false;
    document.body.classList.remove("authenticated");
    signedInEmail.textContent = "";
    setAuthMode("login");
}

if (!supabaseClient) {
    showAuthMessage("First-time setup: open README.txt and follow the Supabase setup steps.", false);
} else {
    supabaseClient.auth.getSession().then(({ data, error }) => {
        if (error) console.error(error);
        if (data && data.session) openStudyHub(data.session);
        else showLoggedOutScreen();
    });

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            openStudyHub(session);
        } else {
            showLoggedOutScreen();
        }
    });
}
