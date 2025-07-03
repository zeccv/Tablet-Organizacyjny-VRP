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
const membersList = document.getElementById('membersList');

let loggedUserRole = null; // rola użytkownika
let loggedUsername = null; // nazwa użytkownika
let loggedUserOrgId = null; // id organizacji użytkownika
const MEMBERS_LIMIT = 30;

// Po zalogowaniu — załaduj użytkownika i organizację
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      loggedUserRole = data.role;
      loggedUsername = data.username;
      // Zapisz w localStorage, aby trzymać stan po odświeżeniu
      localStorage.setItem('loggedInUser', loggedUsername);
      localStorage.setItem('userRole', loggedUserRole);

      // Załaduj postać i organizację
      loadCharacters({ character: data.character });
      loggedUserOrgId = data.character?.organizationId; // zakładam, że backend zwraca organizację postaci

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

// Wczytaj postać użytkownika (z backendu)
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

// Wybranie postaci i wejście do głównego panelu
function selectCharacter(character) {
  characterSelect.classList.add('hidden');
  mainPanel.classList.remove('hidden');
  characterNameDisplay.textContent = character.name;
  characterRankDisplay.textContent = loggedUserRole === 'admin' ? 'Opiekun' : 'Szef Organizacji';
  characterAvatar.src = `https://placehold.co/100x100?text=${encodeURIComponent(character.type)}`;

  updateUIByRole();

  // Załaduj listę członków od razu przy wejściu
  loadMembers();

  // Aktywuj domyślną zakładkę "members"
  activateTab('members');
}

// Aktualizuj UI w zależności od roli
function updateUIByRole() {
  if (loggedUserRole === 'admin' || loggedUserRole === 'user') {
    addMemberBtn.style.display = 'inline-block';
  } else {
    addMemberBtn.style.display = 'none';
  }
}

// Przełączanie zakładek w sidebarze
function activateTab(tabName) {
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

  if (tabName === 'missions') {
    fetchTasks();
  }
  if (tabName === 'members') {
    loadMembers();
  }
}

sidebarMenuLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const selectedTab = link.dataset.tab;
    activateTab(selectedTab);
  });
});

// Wylogowanie
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('userRole');
  loggedUserRole = null;
  loggedUsername = null;
  loggedUserOrgId = null;

  mainPanel.classList.add('hidden');
  characterSelect.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

// --- Członkowie organizacji ---

// Załaduj członków z backendu powiązanych z organizacją
async function loadMembers() {
  if (!loggedUserOrgId) {
    membersList.innerHTML = '<p>Brak przypisanej organizacji.</p>';
    addMemberBtn.style.display = 'none';
    return;
  }

  try {
    // Pobierz listę członków organizacji
    const response = await fetch(`https://tablet-organizacyjny-vrp.onrender.com/organizations/${loggedUserOrgId}/members`);
    const data = await response.json();

    if (!data.success) {
      membersList.innerHTML = '<p>Błąd podczas ładowania członków.</p>';
      return;
    }

    const members = data.members;
    renderMembers(members);

    // Wyświetl licznik członków i limit
    updateMembersCounter(members.length);

    // Pokaż/ukryj przycisk dodawania w zależności od limitu i roli
    if ((loggedUserRole === 'admin' || loggedUserRole === 'user') && members.length < MEMBERS_LIMIT) {
      addMemberBtn.style.display = 'inline-block';
    } else {
      addMemberBtn.style.display = 'none';
    }
  } catch (error) {
    membersList.innerHTML = '<p>Błąd połączenia z serwerem.</p>';
    console.error(error);
  }
}

// Renderowanie listy członków w UI
function renderMembers(members) {
  membersList.innerHTML = '';

  if (members.length === 0) {
    membersList.innerHTML = '<p>Brak członków w organizacji.</p>';
    return;
  }

  members.forEach((member) => {
    const memberCard = document.createElement('div');
    memberCard.className = 'member-card';
    memberCard.style.backgroundColor = '#2c2c2c';
    memberCard.style.padding = '10px';
    memberCard.style.borderRadius = '8px';
    memberCard.style.marginBottom = '10px';
    memberCard.style.display = 'flex';
    memberCard.style.justifyContent = 'space-between';
    memberCard.style.alignItems = 'center';

    memberCard.innerHTML = `
      <div>
        <strong>${member.name}</strong><br/>
        <small>${member.role === 'admin' ? 'Opiekun' : 'Szef Organizacji'}</small>
      </div>
    `;

    // Dodaj przycisk usuwania jeśli rola pozwala
    if (loggedUserRole === 'admin' || loggedUserRole === 'user') {
      // User może usuwać tylko członków swojej organizacji
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Usuń';
      removeBtn.style.backgroundColor = '#ff4d4d';
      removeBtn.style.color = 'white';
      removeBtn.style.border = 'none';
      removeBtn.style.borderRadius = '5px';
      removeBtn.style.padding = '5px 10px';
      removeBtn.style.cursor = 'pointer';

      removeBtn.addEventListener('click', () => {
        if (confirm(`Czy na pewno chcesz usunąć członka ${member.name}?`)) {
          removeMember(member.id);
        }
      });

      memberCard.appendChild(removeBtn);
    }

    membersList.appendChild(memberCard);
  });
}

// Aktualizuj licznik członków w UI
function updateMembersCounter(currentCount) {
  let counter = document.getElementById('membersCounter');
  if (!counter) {
    counter = document.createElement('p');
    counter.id = 'membersCounter';
    counter.style.marginTop = '1rem';
    counter.style.fontWeight = '600';
    document.getElementById('membersTab').insertBefore(counter, addMemberBtn.nextSibling);
  }
  counter.textContent = `Liczba członków: ${currentCount}/${MEMBERS_LIMIT}`;
}

// Dodawanie nowego członka (formularz)
addMemberBtn.addEventListener('click', () => {
  // Jeśli jest formularz już otwarty, nie twórz nowego
  if (document.getElementById('addMemberForm')) return;

  const form = document.createElement('form');
  form.id = 'addMemberForm';
  form.style.marginTop = '1rem';
  form.style.backgroundColor = '#222';
  form.style.padding = '1rem';
  form.style.borderRadius = '10px';

  form.innerHTML = `
    <h3>Dodaj członka organizacji</h3>
    <div class="form-group">
      <label for="memberName">Imię i nazwisko</label>
      <input type="text" id="memberName" required />
    </div>
    <div class="form-group">
      <label for="memberRole">Rola</label>
      <select id="memberRole" required>
        <option value="user">Szef Organizacji</option>
        <option value="admin">Opiekun</option>
      </select>
    </div>
    <button type="submit" class="btn" style="margin-top:0.5rem;">Dodaj</button>
    <button type="button" id="cancelAddMember" class="btn" style="background:#555; margin-top:0.5rem; margin-left:10px;">Anuluj</button>
  `;

  membersList.prepend(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;

    if (!name) {
      alert('Podaj imię i nazwisko członka.');
      return;
    }

    // Sprawdź limit jeszcze raz przed dodaniem
    try {
      const response = await fetch(`https://tablet-organizacyjny-vrp.onrender.com/organizations/${loggedUserOrgId}/members`);
      const data = await response.json();
      if (!data.success) {
        alert('Błąd pobierania członków.');
        return;
      }
      if (data.members.length >= MEMBERS_LIMIT) {
        alert('Limit członków osiągnięty, nie można dodać kolejnego.');
        return;
      }
    } catch {
      alert('Błąd połączenia z serwerem.');
      return;
    }

    // Wywołaj API do dodania członka
    try {
      const addResp = await fetch(`https://tablet-organizacyjny-vrp.onrender.com/organizations/${loggedUserOrgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role }),
      });
      const addData = await addResp.json();

      if (addData.success) {
        alert('Członek dodany.');
        form.remove();
        loadMembers();
      } else {
        alert('Błąd dodawania członka: ' + addData.message);
      }
    } catch {
      alert('Błąd połączenia z serwerem.');
    }
  });

  document.getElementById('cancelAddMember').addEventListener('click', () => {
    form.remove();
  });
});

// Usuwanie członka
async function removeMember(memberId) {
  try {
    const response = await fetch(`https://tablet-organizacyjny-vrp.onrender.com/organizations/${loggedUserOrgId}/members/${memberId}`, {
      method: 'DELETE',
    });
    const data = await response.json();

    if (data.success) {
      alert('Członek usunięty.');
      loadMembers();
    } else {
      alert('Błąd usuwania członka: ' + data.message);
    }
  } catch {
    alert('Błąd połączenia z serwerem.');
  }
}

// --- Zadania ---

const missionsTab = document.getElementById('missionsTab');

async function fetchTasks() {
  try {
    const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/tasks');
    const data = await response.json();

    if (data.success) {
      renderTasks(data.tasks);
    } else {
      missionsTab.innerHTML = '<h2>Zadania</h2><p>Nie udało się pobrać zadań.</p>';
    }
  } catch {
    missionsTab.innerHTML = '<h2>Zadania</h2><p>Błąd połączenia z serwerem.</p>';
  }
}

function renderTasks(tasks) {
  missionsTab.innerHTML = '<h2>Zadania</h2>';

  if (tasks.length === 0) {
    missionsTab.innerHTML += '<p>Brak zadań do wyświetlenia.</p>';
  } else {
    const container = document.createElement('div');
    container.className = 'tasks-container';

    tasks.forEach((task) => {
      const card = document.createElement('div');
      card.className = 'task-card';

      card.innerHTML = `
        <h3 class="task-title">${task.title}</h3>
        <p><strong>Lokalizacja:</strong> ${task.location || 'Nie podano'}</p>
        <p><strong>Opis:</strong> ${task.description || 'Brak opisu'}</p>
        <p><strong>Czas do kiedy:</strong> ${task.deadline ? new Date(task.deadline).toLocaleString() : 'Nie określono'}</p>
        <p><strong>Nagroda:</strong> ${task.reward || 'Brak informacji'}</p>
      `;

      // Usuń opcję usuwania/dodawania jeśli nie admin
      if (loggedUserRole === 'admin') {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Usuń';
        delBtn.className = 'delete-task-btn';
        delBtn.addEventListener('click', () => deleteTask(task.id));
        card.appendChild(delBtn);
      }

      container.appendChild(card);
    });

    missionsTab.appendChild(container);
  }

  if (loggedUserRole === 'admin') {
    const form = document.createElement('form');
    form.id = 'addTaskForm';
    form.innerHTML = `
      <h3>Dodaj nowe zadanie</h3>
      <div class="form-row" style="display:flex; gap:1rem; margin-bottom:1rem;">
        <input type="text" id="newTaskTitle" placeholder="Tytuł zadania" required style="flex:1" />
        <input type="text" id="newTaskLocation" placeholder="Lokalizacja" style="flex:1" />
      </div>
      <textarea id="newTaskDescription" placeholder="Opis zadania" style="width:100%; margin-bottom:1rem;"></textarea>
      <div class="form-row" style="display:flex; gap:1rem;">
        <input type="datetime-local" id="newTaskDeadline" placeholder="Czas do kiedy" style="flex:1" />
        <input type="text" id="newTaskReward" placeholder="Nagroda za wykonanie" style="flex:1" />
      </div>
      <button type="submit" class="btn" style="margin-top:1rem;">Dodaj</button>
    `;
    missionsTab.appendChild(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newTaskTitle').value.trim();
      const location = document.getElementById('newTaskLocation').value.trim();
      const description = document.getElementById('newTaskDescription').value.trim();
      const deadline = document.getElementById('newTaskDeadline').value;
      const reward = document.getElementById('newTaskReward').value.trim();

      if (!title) return alert('Podaj tytuł zadania.');

      try {
        const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            location,
            description,
            deadline: deadline || null,
            reward,
            role: loggedUserRole,
          }),
        });

        const data = await response.json();
        if (data.success) {
          alert('Zadanie dodane.');
          form.reset();
          fetchTasks();
        } else {
          alert('Błąd: ' + data.message);
        }
      } catch {
        alert('Błąd połączenia z serwerem.');
      }
    });
  }
}

async function deleteTask(id) {
  if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

  try {
    const response = await fetch(`https://tablet-organizacyjny-vrp.onrender.com/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: loggedUserRole }),
    });
    const data = await response.json();

    if (data.success) {
      alert('Zadanie usunięte.');
      fetchTasks();
    } else {
      alert('Błąd usuwania zadania: ' + data.message);
    }
  } catch {
    alert('Błąd połączenia z serwerem.');
  }
}
