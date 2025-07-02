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
    const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('loggedInUser', data.username);
      localStorage.setItem('userRole', data.role);
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

  if (tabName === 'missions') {
    fetchTasks();
  }
}

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

// ------ Zadania ------

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
    const ul = document.createElement('ul');
    ul.className = 'tasks-list';

    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.textContent = task.title;

      if (loggedUserRole === 'admin') {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Usuń';
        delBtn.style.marginLeft = '1rem';
        delBtn.addEventListener('click', () => deleteTask(task.id));
        li.appendChild(delBtn);
      }

      ul.appendChild(li);
    });

    missionsTab.appendChild(ul);
  }

  if (loggedUserRole === 'admin') {
    const form = document.createElement('form');
    form.id = 'addTaskForm';
    form.innerHTML = `
            <h3>Dodaj nowe zadanie</h3>
            <input type="text" id="newTaskTitle" placeholder="Tytuł zadania" required />
            <textarea id="newTaskDescription" placeholder="Opis zadania"></textarea>
            <button type="submit">Dodaj</button>
        `;
    missionsTab.appendChild(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newTaskTitle').value.trim();
      const description = document.getElementById('newTaskDescription').value.trim();

      if (!title) return alert('Podaj tytuł zadania.');

      try {
        const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
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
      alert('Błąd: ' + data.message);
    }
  } catch {
    alert('Błąd połączenia z serwerem.');
  }
}
