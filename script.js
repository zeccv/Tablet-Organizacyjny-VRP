// Przykładowa lista użytkowników (ustalone przez administratorów)
const users = [
    { username: 'admin', password: 'admin123', character: { id: 1, name: 'Samir Makajew', type: 'Boss' } },
    { username: 'user1', password: 'password1', character: { id: 2, name: 'John Doe', type: 'Lieutenant' } },
    { username: 'user2', password: 'password2', character: { id: 3, name: 'Jane Smith', type: 'Soldier' } }
];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const characterSelect = document.getElementById('characterSelect');
const mainPanel = document.getElementById('mainPanel');
const loginForm = document.getElementById('loginForm');
const characterList = document.getElementById('characterList');
const logoutBtn = document.getElementById('logoutBtn');
const tabLinks = document.querySelectorAll('[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');
const membersList = document.getElementById('membersList');
const characterNameDisplay = document.getElementById('characterNameDisplay');
const characterRankDisplay = document.getElementById('characterRankDisplay');
const characterAvatar = document.getElementById('characterAvatar');

// State
let currentCharacter = null;
let members = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const loggedInUser  = localStorage.getItem('loggedInUser ');
    if (loggedInUser ) {
        loginScreen.classList.add('hidden');
        loadCharacters();
        characterSelect.classList.remove('hidden');
    }

    // Load members if any
    const savedMembers = localStorage.getItem('organizationMembers');
    if (savedMembers) {
        members = JSON.parse(savedMembers);
        renderMembers();
    }
});

// Login Form
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Sprawdzenie, czy użytkownik i hasło są poprawne
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
        // Zaloguj użytkownika
        localStorage.setItem('loggedInUser ', username);
        loginScreen.classList.add('hidden');
        loadCharacters();
        characterSelect.classList.remove('hidden');
    } else {
        alert('Niepoprawna nazwa użytkownika lub hasło. Spróbuj ponownie.');
    }
});

// Load characters from localStorage
function loadCharacters() {
    characterList.innerHTML = '';
    const loggedInUser  = localStorage.getItem('loggedInUser ');
    const user = users.find(user => user.username === loggedInUser );

    if (user && user.character) {
        const characterCard = document.createElement('div');
        characterCard.className = 'character-card';
        characterCard.innerHTML = `
            <div class="character-type">${user.character.type}</div>
            <h3>${user.character.name}</h3>
            <p>Ranga: ${user.character.type}</p>
            <p>Status: Active</p>
        `;
        characterCard.addEventListener('click', () => selectCharacter(user.character));
        characterList.appendChild(characterCard);
    }
}

// Select Character
function selectCharacter(character) {
    currentCharacter = character;
    characterSelect.classList.add('hidden');
    mainPanel.classList.remove('hidden');
    
    // Update character info in sidebar
    characterNameDisplay.textContent = character.name;
    characterRankDisplay.textContent = character.type;
    
    // For demo purposes, set a different avatar based on type
    let avatarText = '';
    if (character.type === 'Boss') avatarText = 'boss';
    else if (character.type === 'Lieutenant') avatarText = 'lieutenant';
    else avatarText = 'soldier';
    
    characterAvatar.src = `https://placehold.co/100x100?text=${avatarText}`;
}

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser ');
    mainPanel.classList.add('hidden');
    characterSelect.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// Tab Navigation
tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        link.classList.add('active');
        const tabId = link.getAttribute('data-tab') + 'Tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// Render Members
function renderMembers() {
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.innerHTML = `
            <h3>${member.name}</h3>
            <p>Ranga: ${member.rank}</p>
            <p>Status: ${member.status}</p>
            <p>Dołączył: ${member.joinDate}</p>
            <div class="member-actions">
                <button class="edit-btn" data-id="${member.id}">Edytuj</button>
                <button class="delete-btn" data-id="${member.id}">Usuń</button>
            </div>
        `;
        
        membersList.appendChild(memberCard);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const memberId = parseInt(e.target.getAttribute('data-id'));
            editMember(memberId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const memberId = parseInt(e.target.getAttribute('data-id'));
            deleteMember(memberId);
        });
    });
}

// Edit Member
function editMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;
    
    const newRank = prompt('Nowa ranga:', member.rank);
    if (newRank) {
        member.rank = newRank;
    }
    
    const newStatus = prompt('Nowy status:', member.status);
    if (newStatus) {
        member.status = newStatus;
    }
    
    localStorage.setItem('organizationMembers', JSON.stringify(members));
    renderMembers();
}

// Delete Member
function deleteMember(id) {
    if (confirm('Czy na pewno chcesz usunąć tego członka?')) {
        members = members.filter(m => m.id !== id);
        localStorage.setItem('organizationMembers', JSON.stringify(members));
        renderMembers();
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === createCharacterModal) {
        createCharacterModal.classList.remove('active');
    }
    if (e.target === addMemberModal) {
        addMemberModal.classList.remove('active');
    }
});

// Zakładka do tworzenia kont
function createAccount(username, password, character) {
    const newUser  = { username, password, character };
    users.push(newUser );
}

// Przykładowe dodanie konta
createAccount('newUser ', 'newPassword', { id: 4, name: 'New Character', type: 'Soldier' });
