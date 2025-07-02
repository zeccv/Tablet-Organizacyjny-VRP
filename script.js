const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('loginScreen');
const characterSelect = document.getElementById('characterSelect');
const characterList = document.getElementById('characterList');
const mainPanel = document.getElementById('mainPanel');
const characterNameDisplay = document.getElementById('characterNameDisplay');
const characterRankDisplay = document.getElementById('characterRankDisplay');
const characterAvatar = document.getElementById('characterAvatar');

const addMemberBtn = document.getElementById('addMemberBtn');
const sidebarMenuLinks = document.querySelectorAll('.sidebar-menu a[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

let loggedUserRole = null; // rola użytkownika

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(
            'https://tablet-organizacyjny-vrp.onrender.com/login',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            }
        );

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('loggedInUser', data.username);
            localStorage.setItem('userRole', data.role); // Zapisz rolę
            loggedUserRole = data.role;

            loadCharacters({ character: data.character });

            loginScreen.classList.add('hidden');
            characterSelect.classList.remove('hidden');
        } else {
            alert('Niepoprawna nazwa użytkownika lub hasło.');
        }
    } catch (error) {
        alert('Błąd połączenia z serwerem.');
        console.error(error);
    }
});

function loadCharacters(user) {
    characterList.innerHTML = '';
    const char = user.character;
    if (char) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-type">${char.type}</div>
            <h3>${char.name}</h3>
            <p>Ranga: ${char.type}</p>
            <p>Status: Active</p>
        `;
        card.addEventListener('click', () => selectCharacter(char));
        characterList.appendChild(card);
    }
}

function selectCharacter(character) {
    characterSelect.classList.add('hidden');
    mainPanel.classList.remove('hidden');
    characterNameDisplay.textContent = character.name;
    characterRankDisplay.textContent = character.type;
    characterAvatar.src = `https://placehold.co/100x100?text=${character.type}`;

    updateUIByRole();

    // Aktywuj domyślną zakładkę (np. "Członkowie")
    activateTab('members');
}

function updateUIByRole() {
    const role = loggedUserRole || localStorage.getItem('userRole');

    if (role === 'admin') {
        addMemberBtn.style.display = 'inline-block'; // pokaż przycisk dodawania członka
    } else {
        addMemberBtn.style.display = 'none'; // ukryj przycisk
    }
}

// Funkcja do aktywowania zakładek
function activateTab(tabName) {
    // Usuń klasę active z wszystkich linków i tabów
    sidebarMenuLinks.forEach((link) => {
        if (link.dataset.tab === tabName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    tabContents.forEach((tab) => {
        if (tab.id === tabName + 'Tab') {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Obsługa kliknięć na zakładki menu bocznego
sidebarMenuLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedTab = link.dataset.tab;
        activateTab(selectedTab);
    });
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    loggedUserRole = null;

    mainPanel.classList.add('hidden');
    characterSelect.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});
