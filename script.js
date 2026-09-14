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

let resources =
    JSON.parse(
        localStorage.getItem("studyResources")
    ) || [];


let currentFilter = "all";

let showingFavorites = false;


/* =================================
   SAVE RESOURCES
================================= */

function saveResources() {

    localStorage.setItem(
        "studyResources",
        JSON.stringify(resources)
    );

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

refreshResources();