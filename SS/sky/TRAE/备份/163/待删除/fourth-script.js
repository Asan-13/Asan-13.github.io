document.addEventListener('DOMContentLoaded', async () => {
    // Supabase 配置
    let supabaseUrl = localStorage.getItem('supabaseUrl_163') || 'https://prusinqhwaduefiuqkwt.supabase.co';
    let supabaseKey = localStorage.getItem('supabaseKey_163') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydXNpbnFod2FkdWVmaXVxa3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTI5OTYsImV4cCI6MjA3OTU4ODk5Nn0.X__p8sP8ZdaOBGsbFWnhAdgLnjTXN-Y8YMVL5csVQ2Y';
    let supabase;

    // 初始化 Supabase
    function initSupabase() {
        try {
            // 检查域名是否有效
            const isValidDomain = supabaseUrl && supabaseUrl.includes('.supabase.co');
            if (!isValidDomain) {
                supabase = null;
                console.error('Supabase域名无效，将使用本地存储模式运行');
                return false;
            }
            
            // 检查API密钥是否有效
            if (!supabaseKey || supabaseKey.length < 30) {
                supabase = null;
                console.error('Supabase API密钥无效，将使用本地存储模式运行');
                return false;
            }
            
            // 检查Supabase是否已加载，支持多种方式：
            // 1. window.createClient (UMD版本)
            // 2. window.supabase.createClient (另一种UMD暴露方式)
            // 3. createClient (ES模块版本)
            let createClientFunc = null;
            if (typeof window.createClient === 'function') {
                createClientFunc = window.createClient;
            } else if (typeof window.supabase === 'object' && typeof window.supabase.createClient === 'function') {
                createClientFunc = window.supabase.createClient;
            } else if (typeof createClient === 'function') {
                createClientFunc = createClient;
            }
            
            if (createClientFunc) {
                supabase = createClientFunc(supabaseUrl, supabaseKey);
                console.log('Supabase初始化成功');
                return true;
            } else {
                supabase = null;
                console.error('未找到Supabase客户端创建函数，将使用本地存储模式运行');
                return false;
            }
        } catch (error) {
            console.error('Supabase初始化失败:', error);
            supabase = null;
            return false;
        }
    }
    
    // 测试Supabase连接
    async function testSupabaseConnection() {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('tasks_163').select('id').limit(1);
                if (error) {
                    console.error('Supabase连接测试失败:', error);
                    supabase = null;
                    return false;
                }
                console.log('Supabase连接测试成功');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Supabase连接测试异常:', error);
            supabase = null;
            return false;
        }
    }

    // 初始化Supabase
    initSupabase();
    
    // 1秒后再次检查Supabase连接状态
    setTimeout(async () => {
        if (!supabase) {
            console.log('尝试重新初始化Supabase...');
            initSupabase();
        }
    }, 1000);

    let tasks = [];

    // 从本地存储加载数据
    function loadFromLocalStorage() {
        try {
            const savedTasks = localStorage.getItem('tasks_163');
            if (savedTasks) {
                const parsedTasks = JSON.parse(savedTasks);
                // 确保解析后的数据是数组
                return Array.isArray(parsedTasks) ? parsedTasks : [];
            }
            return [];
        } catch (error) {
            console.error('从本地存储加载数据失败:', error);
            return [];
        }
    }

    // 保存数据到本地存储
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem('tasks_163', JSON.stringify(data));
        } catch (error) {
            console.error('保存数据到本地存储失败:', error);
            showNotification('保存数据失败', true);
        }
    }

    // 从Supabase加载数据
    async function loadFromSupabase() {
        try {
            if (!supabase) {
                console.error('Supabase未初始化，无法从云端加载数据');
                return loadFromLocalStorage();
            }

            const { data, error } = await supabase
                .from('tasks_163')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('从Supabase加载数据失败:', error);
                return loadFromLocalStorage();
            }

            if (data && Array.isArray(data)) {
                // 将云端数据保存到本地存储作为备份
                saveToLocalStorage(data);
                return data;
            } else {
                console.warn('从Supabase加载的数据格式不正确，使用本地存储数据');
                return loadFromLocalStorage();
            }
        } catch (error) {
            console.error('加载数据异常:', error);
            return loadFromLocalStorage();
        }
    }

    // 保存数据到本地存储和Supabase
    async function saveData(data) {
        try {
            // 先保存到本地存储
            saveToLocalStorage(data);

            // 如果Supabase已初始化且已登录，则保存到云端
            if (supabase && isLoggedIn) {
                // 准备数据，排除不需要保存的字段
                const dataToSave = data.map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    startDate: task.startDate,
                    endDate: task.endDate,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    location: task.location,
                    eventType: task.eventType,
                    organizer: task.organizer,
                    recurrenceType: task.recurrenceType,
                    recurrenceInterval: task.recurrenceInterval,
                    recurrenceEnd: task.recurrenceEnd,
                    priority: task.priority,
                    tags: task.tags,
                    status: task.status,
                    category: task.category,
                    attendees: task.attendees,
                    attachments: task.attachments,
                    color: task.color,
                    reminder: task.reminder
                }));

                // 使用upsert操作，自动处理新增和更新
                const { error } = await supabase
                    .from('tasks_163')
                    .upsert(dataToSave, { onConflict: 'id' });

                if (error) {
                    console.error('保存到Supabase失败:', error);
                    showNotification('保存到云端失败，但已保存到本地', true);
                } else {
                    console.log('数据已成功保存到本地和云端');
                }
            } else {
                console.log('数据已保存到本地存储');
            }
        } catch (error) {
            console.error('保存数据异常:', error);
            showNotification('保存数据失败', true);
        }
    }

    // 显示通知
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // 生成唯一ID
    function generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    let sortConfig = {
        key: null,
        direction: 1 // 1 升序, -1 降序
    };

    let isLoggedIn = false;
    const ADMIN_PASSWORD = 'admin123'; // 示例密码，实际应用中应该更安全

    // 检查登录状态
    function checkLogin() {
        const loginOverlay = document.getElementById('login-overlay');
        const adminContent = document.getElementById('admin-content');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const usernameDisplay = document.getElementById('username-display');

        isLoggedIn = localStorage.getItem('isLoggedIn_163') === 'true';

        if (isLoggedIn) {
            if (loginOverlay) loginOverlay.style.display = 'none';
            if (adminContent) adminContent.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (usernameDisplay) usernameDisplay.textContent = 'admin';
        } else {
            if (loginOverlay) loginOverlay.style.display = 'flex';
            if (adminContent) adminContent.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (usernameDisplay) usernameDisplay.textContent = '';
        }
    }

    // 处理登录
    function handleLogin(event) {
        event.preventDefault();
        const passwordInput = document.getElementById('password');
        const loginError = document.getElementById('login-error');

        if (passwordInput && passwordInput.value === ADMIN_PASSWORD) {
            isLoggedIn = true;
            localStorage.setItem('isLoggedIn_163', 'true');
            localStorage.setItem('loginTime_163', Date.now().toString());
            if (loginError) loginError.textContent = '';
            checkLogin();
            showNotification('登录成功');
        } else {
            if (loginError) loginError.textContent = '密码错误';
            showNotification('登录失败', true);
        }
    }

    // 显示/隐藏密码
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.querySelector('.password-toggle');
        
        if (passwordInput && toggleBtn) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '隐藏';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '显示';
            }
        }
    }

    // 处理登出
    function handleLogout() {
        isLoggedIn = false;
        localStorage.removeItem('isLoggedIn_163');
        localStorage.removeItem('loginTime_163');
        checkLogin();
        showNotification('已退出登录');
    }

    // 检查登录超时
    function checkLoginTimeout() {
        const loginTime = localStorage.getItem('loginTime_163');
        const timeout = 60 * 60 * 1000; // 1小时超时
        
        if (loginTime && Date.now() - parseInt(loginTime) > timeout) {
            handleLogout();
            showNotification('登录已超时，请重新登录', true);
        }
    }

    // 设置自动检查登录超时
    setInterval(checkLoginTimeout, 60 * 1000); // 每分钟检查一次

    // 任务排序
    function sortTasks(key) {
        if (sortConfig.key === key) {
            // 如果点击同一列，则切换排序方向
            sortConfig.direction *= -1;
        } else {
            // 否则设置新的排序键和默认方向（升序）
            sortConfig.key = key;
            sortConfig.direction = 1;
        }
        
        // 执行排序
        tasks.sort((a, b) => {
            // 处理空值情况
            const aValue = a[key] || '';
            const bValue = b[key] || '';
            
            // 日期时间类型排序
            if (key.includes('Date') || key.includes('Time')) {
                return (new Date(aValue) - new Date(bValue)) * sortConfig.direction;
            }
            
            // 字符串类型排序
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * sortConfig.direction;
            }
            
            // 数值类型排序
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return (aValue - bValue) * sortConfig.direction;
            }
            
            // 其他类型默认排序
            return 0;
        });
        
        // 重新渲染任务列表
        renderTasks();
    }

    // 渲染任务列表
    function renderTasks() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        taskList.innerHTML = '';

        if (tasks.length === 0) {
            const emptyMessage = document.createElement('tr');
            emptyMessage.innerHTML = '<td colspan="10" style="text-align: center; padding: 20px; color: #999;">暂无任务</td>';
            taskList.appendChild(emptyMessage);
            return;
        }

        tasks.forEach(task => {
            const taskRow = document.createElement('tr');
            taskRow.dataset.id = task.id;
            
            // 根据优先级设置行颜色
            if (task.priority === '高') {
                taskRow.style.backgroundColor = '#ffebee';
            } else if (task.priority === '中') {
                taskRow.style.backgroundColor = '#fff8e1';
            } else if (task.priority === '低') {
                taskRow.style.backgroundColor = '#e8f5e9';
            }
            
            // 格式化日期
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
            };
            
            // 格式化时间
            const formatTime = (timeString) => {
                if (!timeString) return '';
                return timeString;
            };
            
            taskRow.innerHTML = `
                <td>${task.title || '-'}</td>
                <td>${task.eventType || '-'}</td>
                <td>${formatDate(task.startDate)}</td>
                <td>${formatTime(task.startTime)}</td>
                <td>${formatDate(task.endDate)}</td>
                <td>${formatTime(task.endTime)}</td>
                <td>${task.location || '-'}</td>
                <td>${task.status || '-'}</td>
                <td>${task.category || '-'}</td>
                <td>
                    <button class="btn-edit" data-id="${task.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" data-id="${task.id}" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            taskList.appendChild(taskRow);
        });
        
        // 添加事件监听器
        addTaskRowListeners();
    }

    // 为任务行添加事件监听器
    function addTaskRowListeners() {
        // 编辑按钮事件
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.getAttribute('data-id');
                editTask(taskId);
            });
        });
        
        // 删除按钮事件
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.getAttribute('data-id');
                showDeleteModal(taskId);
            });
        });
    }

    // 打开添加任务模态框
    function openAddTaskModal() {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && form && modalTitle) {
            modalTitle.textContent = '添加事件';
            form.reset();
            form.dataset.taskId = '';
            modal.style.display = 'flex';
            
            // 重置重复类型选项的显示状态
            showRecurrenceOptions('none');
        }
    }

    // 编辑任务
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && form && modalTitle) {
            modalTitle.textContent = '编辑事件';
            form.dataset.taskId = taskId;
            
            // 填充表单数据
            document.getElementById('title').value = task.title || '';
            document.getElementById('description').value = task.description || '';
            document.getElementById('startDate').value = task.startDate || '';
            document.getElementById('endDate').value = task.endDate || '';
            document.getElementById('startTime').value = task.startTime || '';
            document.getElementById('endTime').value = task.endTime || '';
            document.getElementById('location').value = task.location || '';
            document.getElementById('eventType').value = task.eventType || '';
            document.getElementById('organizer').value = task.organizer || '';
            document.getElementById('recurrenceType').value = task.recurrenceType || 'none';
            document.getElementById('recurrenceInterval').value = task.recurrenceInterval || '1';
            document.getElementById('recurrenceEnd').value = task.recurrenceEnd || '';
            document.getElementById('priority').value = task.priority || '中';
            document.getElementById('tags').value = task.tags || '';
            document.getElementById('status').value = task.status || '未开始';
            document.getElementById('category').value = task.category || '';
            document.getElementById('attendees').value = task.attendees ? task.attendees.join(', ') : '';
            document.getElementById('attachments').value = task.attachments ? task.attachments.join(', ') : '';
            document.getElementById('color').value = task.color || '#337ab7';
            document.getElementById('reminder').value = task.reminder || '';
            
            // 显示重复类型选项
            showRecurrenceOptions(task.recurrenceType || 'none');
            
            modal.style.display = 'flex';
        }
    }

    // 显示重复类型选项
    function showRecurrenceOptions(type) {
        const recurrenceOptions = document.getElementById('recurrence-options');
        
        if (recurrenceOptions) {
            if (type === 'none') {
                recurrenceOptions.style.display = 'none';
            } else {
                recurrenceOptions.style.display = 'block';
            }
        }
    }

    // 关闭模态框
    function closeModal() {
        const modal = document.getElementById('task-modal');
        const deleteModal = document.getElementById('delete-modal');
        
        if (modal) modal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
    }

    // 显示删除确认模态框
    function showDeleteModal(taskId) {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.dataset.taskId = taskId;
            modal.style.display = 'flex';
        }
    }

    // 关闭删除确认模态框
    function closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) modal.style.display = 'none';
    }

    // 删除任务
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
        saveData(tasks);
        closeDeleteModal();
        showNotification('事件已删除');
    }

    // 初始化事件监听器
    function initEventListeners() {
        // 添加任务按钮
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', openAddTaskModal);
        }
        
        // 登录按钮
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // 登出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // 密码显示/隐藏按钮
        const togglePasswordBtn = document.querySelector('.password-toggle');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
        }
        
        // 任务表单提交
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const title = document.getElementById('title').value;
                const description = document.getElementById('description').value;
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                const startTime = document.getElementById('startTime').value;
                const endTime = document.getElementById('endTime').value;
                const location = document.getElementById('location').value;
                const eventType = document.getElementById('eventType').value;
                const organizer = document.getElementById('organizer').value;
                const recurrenceType = document.getElementById('recurrenceType').value;
                const recurrenceInterval = document.getElementById('recurrenceInterval').value;
                const recurrenceEnd = document.getElementById('recurrenceEnd').value;
                const priority = document.getElementById('priority').value;
                const tags = document.getElementById('tags').value;
                const status = document.getElementById('status').value;
                const category = document.getElementById('category').value;
                const attendees = document.getElementById('attendees').value.split(',').map(a => a.trim()).filter(Boolean);
                const attachments = document.getElementById('attachments').value.split(',').map(a => a.trim()).filter(Boolean);
                const color = document.getElementById('color').value;
                const reminder = document.getElementById('reminder').value;
                
                // 验证表单
                if (!title.trim()) {
                    showNotification('请输入事件标题', true);
                    return;
                }
                
                if (!startDate) {
                    showNotification('请选择开始日期', true);
                    return;
                }
                
                // 构建任务对象
                const taskData = {
                    title,
                    description,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    location,
                    eventType,
                    organizer,
                    recurrenceType,
                    recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : 1,
                    recurrenceEnd,
                    priority,
                    tags,
                    status,
                    category,
                    attendees,
                    attachments,
                    color,
                    reminder
                };
                
                const taskId = taskForm.dataset.taskId;
                
                if (taskId) {
                    // 更新现有任务
                    const taskIndex = tasks.findIndex(task => task.id === taskId);
                    if (taskIndex !== -1) {
                        tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
                        showNotification('事件已更新');
                    }
                } else {
                    // 添加新任务
                    const newTask = {
                        id: generateId(),
                        ...taskData,
                        createdAt: new Date().toISOString()
                    };
                    tasks.push(newTask);
                    showNotification('事件已添加');
                }
                
                // 重新渲染任务列表
                renderTasks();
                
                // 保存数据
                saveData(tasks);
                
                // 关闭模态框
                closeModal();
            });
        }
        
        // 重复类型变化事件
        const recurrenceTypeSelect = document.getElementById('recurrenceType');
        if (recurrenceTypeSelect) {
            recurrenceTypeSelect.addEventListener('change', (e) => {
                showRecurrenceOptions(e.target.value);
            });
        }
        
        // 关闭模态框按钮
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // 点击模态框外部关闭
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                    closeDeleteModal();
                }
            });
        });
        
        // 删除确认
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                const deleteModal = document.getElementById('delete-modal');
                if (deleteModal) {
                    const taskId = deleteModal.dataset.taskId;
                    if (taskId) {
                        deleteTask(taskId);
                    }
                }
            });
        }
        
        // 取消删除
        const cancelDeleteBtn = document.getElementById('cancel-delete');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        }
        
        // 保存按钮点击事件
        const saveBtn = document.querySelector('#task-form button[type="submit"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('task-form').dispatchEvent(new Event('submit'));
            });
        }
    }

    // 初始化应用
    async function initApp() {
        try {
            // 加载数据
            tasks = await loadFromSupabase();
            
            // 初始化事件监听器
            initEventListeners();
            
            // 检查登录状态
            checkLogin();
            
            // 渲染任务列表
            renderTasks();
            
            // 如果已登录，显示云端数据加载成功通知
            if (isLoggedIn) {
                showNotification(`从云端加载数据成功，共 ${tasks.length} 条记录`);
            }
        } catch (error) {
            console.error('初始化应用失败:', error);
            
            // 尝试直接从本地存储加载数据
            tasks = loadFromLocalStorage();
            
            // 初始化事件监听器
            initEventListeners();
            
            // 检查登录状态
            checkLogin();
            
            // 渲染任务列表
            renderTasks();
        }
    }

    // 启动应用
    initApp();
});