
const STORAGE_KEY = "campusnotes-notes-v1";

const notesGrid = document.getElementById("notesGrid");
const emptyState = document.getElementById("emptyState");
const noteDialog = document.getElementById("noteDialog");
const noteForm = document.getElementById("noteForm");

const searchInput = document.getElementById("searchInput");
const subjectFilter = document.getElementById("subjectFilter");
const sortSelect = document.getElementById("sortSelect");

let notes = loadNotes();

// Load notes from browser storage
function loadNotes() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

// Save notes
function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    updateStats();
}

// Update dashboard statistics
function updateStats() {
    document.getElementById("totalCount").textContent =
        notes.length;

    document.getElementById("pinnedCount").textContent =
        notes.filter(note => note.pinned).length;

    document.getElementById("subjectCount").textContent =
        new Set(notes.map(note => note.subject.toLowerCase())).size;
}

// Update subject filter options
function updateSubjectFilter() {
    const current = subjectFilter.value;

    const subjects = [
        ...new Set(notes.map(note => note.subject))
    ].sort();

    subjectFilter.innerHTML =
        '<option value="all">All Subjects</option>';

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });

    subjectFilter.value =
        subjects.includes(current) ? current : "all";
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Create note card
function createNoteCard(note) {
    const card = document.createElement("article");
    card.className = "note-card";

    const top = document.createElement("div");
    top.className = "note-top";

    const subject = document.createElement("span");
    subject.className = "subject-tag";
    subject.textContent = note.subject;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    // Pin button
    const pin = document.createElement("button");
    pin.className = "icon-button";
    pin.textContent = note.pinned ? "★" : "☆";
    pin.title = note.pinned ? "Unpin" : "Pin";
    pin.addEventListener("click", () => togglePin(note.id));

    // Edit button
    const edit = document.createElement("button");
    edit.className = "icon-button";
    edit.textContent = "✎";
    edit.title = "Edit";
    edit.addEventListener("click", () => openEditor(note.id));

    // Delete button
    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.textContent = "⌫";
    remove.title = "Delete";
    remove.addEventListener("click", () => deleteNote(note.id));

    actions.append(pin, edit, remove);
    top.append(subject, actions);

    const title = document.createElement("h3");
    title.textContent = note.title;

    const content = document.createElement("p");
    content.className = "note-preview";
    content.textContent = note.content;

    const date = document.createElement("div");
    date.className = "note-date";
    date.textContent = "Updated " + formatDate(note.updatedAt);

    card.append(top, title, content, date);

    return card;
}

// Display notes
function renderNotes() {
    updateSubjectFilter();

    const query = searchInput.value.toLowerCase().trim();
    const selectedSubject = subjectFilter.value;
    const sort = sortSelect.value;

    let filteredNotes = notes.filter(note => {
        const matchesSearch =
            note.title.toLowerCase().includes(query) ||
            note.subject.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query);

        const matchesSubject =
            selectedSubject === "all" ||
            note.subject === selectedSubject;

        return matchesSearch && matchesSubject;
    });

    // Sorting
    filteredNotes.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return Number(b.pinned) - Number(a.pinned);
        }

        if (sort === "oldest") {
            return new Date(a.updatedAt) - new Date(b.updatedAt);
        }

        if (sort === "title") {
            return a.title.localeCompare(b.title);
        }

        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    notesGrid.replaceChildren(
        ...filteredNotes.map(createNoteCard)
    );

    emptyState.hidden = filteredNotes.length > 0;
    notesGrid.hidden = filteredNotes.length === 0;

    document.getElementById("resultsText").textContent =
        `${filteredNotes.length} notes shown`;

    updateStats();
}

// Open create/edit dialog
function openEditor(id = null) {
    noteForm.reset();

    document.getElementById("noteId").value = "";

    document.getElementById("dialogTitle").textContent =
        id ? "Edit Note" : "Create a Note";

    if (id) {
        const note = notes.find(item => item.id === id);

        if (!note) return;

        document.getElementById("noteId").value = note.id;
        document.getElementById("noteTitle").value = note.title;
        document.getElementById("noteSubject").value = note.subject;
        document.getElementById("noteContent").value = note.content;
    }

    noteDialog.showModal();
}

// Save note
noteForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const id = document.getElementById("noteId").value;
    const title = document.getElementById("noteTitle").value.trim();
    const subject = document.getElementById("noteSubject").value.trim();
    const content = document.getElementById("noteContent").value.trim();

    if (!title || !subject || !content) return;

    const now = new Date().toISOString();

    if (id) {
        notes = notes.map(note =>
            note.id === id
                ? { ...note, title, subject, content, updatedAt: now }
                : note
        );
    } else {
        notes.unshift({
            id: crypto.randomUUID(),
            title,
            subject,
            content,
            pinned: false,
            createdAt: now,
            updatedAt: now
        });
    }

    saveNotes();
    noteDialog.close();
    renderNotes();
});

// Pin/unpin note
function togglePin(id) {
    notes = notes.map(note =>
        note.id === id
            ? { ...note, pinned: !note.pinned }
            : note
    );

    saveNotes();
    renderNotes();
}

// Delete note
function deleteNote(id) {
    const note = notes.find(item => item.id === id);

    if (!note) return;

    if (!confirm(`Delete "${note.title}"?`)) return;

    notes = notes.filter(note => note.id !== id);

    saveNotes();
    renderNotes();
}

// Button events
document.getElementById("newNoteButton")
    .addEventListener("click", () => openEditor());

document.getElementById("emptyNewNoteButton")
    .addEventListener("click", () => openEditor());

document.getElementById("closeDialogButton")
    .addEventListener("click", () => noteDialog.close());

document.getElementById("cancelButton")
    .addEventListener("click", () => noteDialog.close());

// Search and filter events
searchInput.addEventListener("input", renderNotes);
subjectFilter.addEventListener("change", renderNotes);
sortSelect.addEventListener("change", renderNotes);

// Initial display
renderNotes();
