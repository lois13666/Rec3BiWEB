// Seleção de elementos
const itemInput = document.getElementById('itemInput');
const addButton = document.getElementById('addButton');
const itemList = document.getElementById('itemList');
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const emptyState = document.getElementById('emptyState');
const clearAllButton = document.getElementById('clearAllButton');
const saveListButton = document.getElementById('saveListButton');
const lastSaved = document.getElementById('lastSaved');

// Elementos do modal
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');
const closeModal = document.querySelector('.close-modal');

// Filtros
const filterButtons = document.querySelectorAll('.filter-btn');

// Array para armazenar os itens e variáveis de controle
let items = [];
let currentFilter = 'all';
let itemToEdit = null;

// Carregar itens do localStorage ao iniciar
loadItems();

// Event Listeners
addButton.addEventListener('click', addItem);
itemInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addItem();
    }
});

clearAllButton.addEventListener('click', clearAllItems);
saveListButton.addEventListener('click', saveItems);

// Event Listeners para o modal
saveEdit.addEventListener('click', saveEditedItem);
cancelEdit.addEventListener('click', closeEditModal);
closeModal.addEventListener('click', closeEditModal);

// Fechar modal clicando fora dele
window.addEventListener('click', function(e) {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Event Listeners para os filtros
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remover classe active de todos os botões
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Adicionar classe active ao botão clicado
        this.classList.add('active');
        
        // Aplicar filtro
        currentFilter = this.dataset.filter;
        renderItems();
    });
});

// Função para adicionar item
function addItem() {
    const itemText = itemInput.value.trim();
    
    if (itemText === '') {
        showNotification('Por favor, digite um item!', 'warning');
        itemInput.focus();
        return;
    }
    
    // Verificar se o item já existe
    if (items.some(item => item.text.toLowerCase() === itemText.toLowerCase())) {
        showNotification('Este item já está na lista!', 'info');
        itemInput.value = '';
        itemInput.focus();
        return;
    }
    
    // Criar objeto do item
    const newItem = {
        id: Date.now(),
        text: itemText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar ao array
    items.push(newItem);
    
    // Limpar campo de entrada
    itemInput.value = '';
    itemInput.focus();
    
    // Atualizar a lista na tela
    renderItems();
    
    // Salvar no localStorage
    saveItems();
    
    // Mostrar notificação
    showNotification('Item adicionado com sucesso!', 'success');
}

// Função para renderizar os itens na tela
function renderItems() {
    // Limpar lista atual
    itemList.innerHTML = '';
    
    // Filtrar itens conforme o filtro atual
    let filteredItems = items;
    
    if (currentFilter === 'pending') {
        filteredItems = items.filter(item => !item.completed);
    } else if (currentFilter === 'completed') {
        filteredItems = items.filter(item => item.completed);
    }
    
    // Verificar se há itens para mostrar
    if (filteredItems.length === 0) {
        emptyState.style.display = 'block';
        itemList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        itemList.style.display = 'block';
        
        // Adicionar cada item à lista
        filteredItems.forEach(item => {
            const li = document.createElement('li');
            li.className = `list-item ${item.completed ? 'completed' : ''}`;
            li.dataset.id = item.id;
            
            li.innerHTML = `
                <span class="item-text ${item.completed ? 'completed' : ''}">${item.text}</span>
                <div class="item-actions">
                    <button class="item-btn edit-btn">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="item-btn toggle-btn">
                        <i class="fas ${item.completed ? 'fa-undo' : 'fa-check'}"></i>
                        ${item.completed ? 'Desfazer' : 'Comprar'}
                    </button>
                    <button class="item-btn delete-btn">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            `;
            
            // Adicionar event listeners aos botões
            const toggleBtn = li.querySelector('.toggle-btn');
            const deleteBtn = li.querySelector('.delete-btn');
            const editBtn = li.querySelector('.edit-btn');
            const itemText = li.querySelector('.item-text');
            
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleItem(item.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeItem(item.id);
            });
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(item.id);
            });
            
            itemText.addEventListener('click', () => toggleItem(item.id));
            
            itemList.appendChild(li);
        });
    }
    
    // Atualizar estatísticas
    updateStats();
    
    // Atualizar data do último salvamento
    updateLastSaved();
}

// Função para marcar/desmarcar item como comprado
function toggleItem(id) {
    items = items.map(item => {
        if (item.id === id) {
            const updatedItem = { ...item, completed: !item.completed };
            
            // Mostrar notificação
            if (updatedItem.completed) {
                showNotification(`"${updatedItem.text}" marcado como comprado!`, 'success');
            } else {
                showNotification(`"${updatedItem.text}" marcado como pendente!`, 'info');
            }
            
            return updatedItem;
        }
        return item;
    });
    
    renderItems();
    saveItems();
}

// Função para remover item
function removeItem(id) {
    const item = items.find(item => item.id === id);
    
    if (confirm(`Tem certeza que deseja remover o item "${item.text}"?`)) {
        items = items.filter(item => item.id !== id);
        renderItems();
        saveItems();
        
        // Mostrar notificação
        showNotification('Item removido com sucesso!', 'info');
    }
}

// Função para abrir modal de edição
function openEditModal(id) {
    itemToEdit = items.find(item => item.id === id);
    
    if (itemToEdit) {
        editInput.value = itemToEdit.text;
        editModal.style.display = 'flex';
        editInput.focus();
    }
}

// Função para fechar modal de edição
function closeEditModal() {
    editModal.style.display = 'none';
    itemToEdit = null;
    editInput.value = '';
}

// Função para salvar item editado
function saveEditedItem() {
    const newText = editInput.value.trim();
    
    if (newText === '') {
        showNotification('O texto não pode estar vazio!', 'warning');
        editInput.focus();
        return;
    }
    
    if (itemToEdit) {
        // Verificar se o novo texto já existe (exceto para o próprio item)
        if (items.some(item => 
            item.id !== itemToEdit.id && 
            item.text.toLowerCase() === newText.toLowerCase()
        )) {
            showNotification('Este item já está na lista!', 'info');
            editInput.focus();
            return;
        }
        
        // Atualizar o item
        items = items.map(item => {
            if (item.id === itemToEdit.id) {
                return { ...item, text: newText };
            }
            return item;
        });
        
        renderItems();
        saveItems();
        closeEditModal();
        
        // Mostrar notificação
        showNotification('Item atualizado com sucesso!', 'success');
    }
}

// Função para limpar todos os itens
function clearAllItems() {
    if (items.length === 0) {
        showNotification('A lista já está vazia!', 'info');
        return;
    }
    
    if (confirm('Tem certeza que deseja remover TODOS os itens da lista?')) {
        items = [];
        renderItems();
        saveItems();
        
        // Mostrar notificação
        showNotification('Todos os itens foram removidos!', 'info');
    }
}

// Função para atualizar estatísticas
function updateStats() {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const pending = total - completed;
    
    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
}

// Função para atualizar a data do último salvamento
function updateLastSaved() {
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    lastSaved.textContent = `Último salvamento: ${formattedDate}`;
}

// Função para salvar itens no localStorage
function saveItems() {
    localStorage.setItem('shoppingList', JSON.stringify(items));
    updateLastSaved();
}

// Função para carregar itens do localStorage
function loadItems() {
    const savedItems = localStorage.getItem('shoppingList');
    
    if (savedItems) {
        items = JSON.parse(savedItems);
        renderItems();
    } else {
        // Itens de exemplo para primeira execução
        items = [
            { id: 1, text: 'Maçã', completed: false, createdAt: new Date().toISOString() },
            { id: 2, text: 'Leite', completed: true, createdAt: new Date().toISOString() },
            { id: 3, text: 'Pão', completed: false, createdAt: new Date().toISOString() },
            { id: 4, text: 'Café', completed: false, createdAt: new Date().toISOString() }
        ];
        renderItems();
        saveItems();
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getIconByType(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${getBgColorByType(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Estilos do conteúdo
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
    `;
    
    // Estilos do botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        padding: 0;
    `;
    
    // Event listener para fechar notificação
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Funções auxiliares para notificações
function getIconByType(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'danger': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

function getBgColorByType(type) {
    switch(type) {
        case 'success': return '#28a745';
        case 'warning': return '#ffc107';
        case 'danger': return '#dc3545';
        case 'info': return '#17a2b8';
        default: return '#6c757d';
    }
}