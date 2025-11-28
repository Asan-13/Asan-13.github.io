
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
                } else if (typeof window.supabase?.createClient === 'function') {
                    createClientFunc = window.supabase.createClient;
                } else if (typeof createClient === 'function') {
                    createClientFunc = createClient;
                }
                
                if (!createClientFunc) {
                    supabase = null;
                    console.error('Supabase库未加载，将使用本地存储模式运行');
                    return false;
                }
                
                // 创建Supabase客户端
                supabase = createClientFunc(supabaseUrl, supabaseKey);
                console.log('Supabase初始化成功');
                
                // 测试连接
                testSupabaseConnection();
                return true;
            } catch (error) {
                supabase = null;
                console.error('Supabase初始化失败:', error);
                return false;
            }
        }
        
        // 测试Supabase连接
        async function testSupabaseConnection() {
            if (!supabase) return false;
            
            try {
                // 尝试执行一个简单的查询来测试连接
                const { error } = await supabase.from('tasks_163').select('*').limit(1);
                if (error) {
                    console.error('Supabase连接测试失败:', error);
                    return false;
                }
                console.log('Supabase连接测试成功');
                return true;
            } catch (error) {
                console.error('Supabase连接测试失败:', error);
                return false;
            }
        }

        // 初始调用
        initSupabase();
        
        // 如果初始调用失败，添加一个延迟重试机制
        if (!supabase) {
            console.log('初始Supabase初始化失败，将在1秒后重试...');
            setTimeout(() => {
                console.log('重试Supabase初始化...');
                initSupabase();
            }, 1000);
        }

        // 任务数据
        let tasks = [];

        // 从本地存储加载数据
        function loadFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('timeProjectReminderTasks_163');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    console.log('从本地存储加载数据成功:', parsedData.length, '条记录');
                    return parsedData;
                }
                console.log('本地存储中没有数据');
                return [];
            } catch (error) {
                console.error('从本地存储加载数据失败:', error);
                return [];
            }
        }

        // 保存数据到本地存储
        function saveToLocalStorage(data) {
            try {
                localStorage.setItem('timeProjectReminderTasks_163', JSON.stringify(data));
                console.log('数据已保存到本地存储:', data.length, '条记录');
            } catch (error) {
                console.error('保存数据到本地存储失败:', error);
            }
        }

        // 从 Supabase 加载任务数据
        async function loadFromSupabase() {
            if (!supabase) {
                console.error('Supabase 未初始化，无法加载数据');
                showNotification('Supabase 未初始化，无法从云端加载数据', true);
                return [];
            }

            try {
                // 强制从 Supabase 获取最新数据，忽略本地缓存
                const { data, error } = await supabase
                    .from('tasks_163')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) {
                    // Supabase请求失败时，记录错误但仍尝试使用本地缓存
                    console.error('从Supabase加载数据失败:', error);
                    showNotification('从Supabase加载数据失败，正在尝试使用最新缓存', false);
                    return loadFromLocalStorage();
                }

                if (data && data.length > 0) {
                    // 将Supabase数据保存到localStorage作为备份
                    saveToLocalStorage(data);
                    console.log('从Supabase加载数据成功:', data.length, '条记录');
                    return data;
                } else {
                    console.log('从Supabase没有加载到数据，尝试从localStorage加载');
                    // 如果Supabase中没有数据，尝试从localStorage加载
                    const localData = loadFromLocalStorage();
                    if (localData && localData.length > 0) {
                        // 将本地数据同步到Supabase
                        console.log('从localStorage加载到数据，准备同步到Supabase:', localData.length, '条记录');
                        
                        // 处理数据，确保只包含Supabase表中存在的字段
                const processedData = localData.map(task => {
                    // 创建一个新的任务对象，只包含必要的字段
                    // 为recurrence添加默认值，防止违反NOT NULL约束
                    const processedTask = {
                        id: task.id,
                        name: task.name,
                        startDate: task.startDate,
                        startTime: task.startTime,
                        displayThreshold: task.displayThreshold,
                        displayThresholdUnit: task.displayThresholdUnit,
                        priority: task.priority,
                        recurrence: task.recurrence || ''
                        // 注意：不直接包含duration、durationUnit和type字段
                    };
                    return processedTask;
                });
                        
                        const { error: syncError } = await supabase.from('tasks_163').insert(processedData);
                        if (syncError) {
                            console.error('将本地数据同步到Supabase失败:', syncError);
                        } else {
                            console.log('本地数据同步到Supabase成功');
                        }
                        return localData;
                    }
                }
            } catch (error) {
                console.error('从Supabase加载数据异常:', error);
                // 异常情况下仍尝试从localStorage加载，确保系统可用性
                showNotification('从Supabase加载数据异常，使用本地存储数据', true);
                return loadFromLocalStorage();
            }
            return [];
        }

        // 保存数据到localStorage和Supabase
        async function saveData(data) {
            // 1. 保存到localStorage
            try {
                localStorage.setItem('timeProjectReminderTasks_163', JSON.stringify(data));
                console.log('数据已保存到本地存储:', data.length, '条记录');
                showNotification('数据已保存到本地存储', false);
            } catch (localError) {
                console.error('保存到本地存储失败:', localError);
                showNotification('保存到本地存储失败', true);
                return false;
            }

            // 2. 如果Supabase可用，尝试保存到Supabase
            if (supabase) {
                try {
                    console.log('开始保存数据到Supabase...');
                    console.log('准备保存的数据:', data.length, '条记录');
                    
                    // 处理数据，确保只包含Supabase表中存在的字段
            const processedData = data.map(task => {
                // 创建一个新的任务对象，只包含必要的字段
                // 为recurrence添加默认值，防止违反NOT NULL约束
                const processedTask = {
                    id: task.id,
                    name: task.name,
                    startDate: task.startDate,
                    startTime: task.startTime,
                    displayThreshold: task.displayThreshold,
                    displayThresholdUnit: task.displayThresholdUnit,
                    priority: task.priority,
                    recurrence: task.recurrence || ''
                    // 注意：不直接包含duration、durationUnit和type字段
                };
                return processedTask;
            });
                    
                    // 使用upsert操作更新或插入数据，保留其他设备的编辑
                    if (processedData.length > 0) {
                        console.log('开始同步数据...');
                        const { data: syncedData, error: upsertError } = await supabase
                            .from('tasks_163')
                            .upsert(processedData, { onConflict: 'id' })
                            .select();
                        if (upsertError) {
                            console.error('同步数据失败:', upsertError);
                            showNotification('同步数据到Supabase失败', true);
                            return false;
                        }
                        console.log('数据同步成功:', syncedData.length, '条记录');
                    } else {
                        console.log('没有数据需要同步');
                    }
                    
                    showNotification('数据已同步到Supabase', false);
                    return true;
                } catch (supabaseError) {
                    console.error('Supabase保存失败，详细错误:', supabaseError);
                    showNotification('Supabase保存失败，仅保留本地存储', true);
                    return true;
                }
            } else {
                console.log('Supabase未初始化，仅保存到本地存储');
            }
            return true;
        }

        // 显示通知
        function showNotification(message, isError = false) {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notification-text');
            
            if (notification && notificationText) {
                notificationText.textContent = message;
                notification.className = `notification ${isError ? 'error' : ''} show`;
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }
        }

        // 生成唯一ID
        function generateId() {
            return Math.max(...tasks.map(task => task.id || 0), 0) + 1;
        }

        // 排序状态
        let sortConfig = {
            key: null,
            direction: 1 // 1 升序, -1 降序
        };

        // 登录状态
        let isLoggedIn = false;
        const ADMIN_PASSWORD = 'admin123'; // 示例密码，实际应用中应该更安全

        // 检查登录状态
        function checkLogin() {
            isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            if (isLoggedIn) {
                const loginContainer = document.getElementById('login-container');
                const adminContainer = document.getElementById('admin-container');
                if (loginContainer && adminContainer) {
                    loginContainer.classList.add('hidden');
                    adminContainer.classList.remove('hidden');
                    // 在切换容器显示后，确保DOM已更新，然后渲染任务列表
                    setTimeout(() => renderTasks(), 0);
                }
            }
        }

        // 登录处理
        function handleLogin(event) {
            event.preventDefault();
            const passwordInput = document.getElementById('password');
            if (!passwordInput) return;
            
            const password = passwordInput.value;
            if (password === ADMIN_PASSWORD) {
                isLoggedIn = true;
                localStorage.setItem('adminLoggedIn', 'true');
                
                const loginContainer = document.getElementById('login-container');
                const adminContainer = document.getElementById('admin-container');
                const loginError = document.getElementById('login-error');
                
                if (loginContainer && adminContainer) {
                    loginContainer.classList.add('hidden');
                    adminContainer.classList.remove('hidden');
                    // 在切换容器显示后，确保DOM已更新，然后渲染任务列表
                    setTimeout(() => renderTasks(), 0);
                }
                
                if (loginError) {
                    loginError.classList.add('hidden');
                }
            } else {
                const loginError = document.getElementById('login-error');
                if (loginError) {
                    loginError.classList.remove('hidden');
                }
            }
        }
        
        // 密码显示/隐藏切换
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const toggleButton = document.getElementById('toggle-password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleButton.innerHTML = '<i class="fa fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                toggleButton.innerHTML = '<i class="fa fa-eye"></i>';
            }
        }

        // 退出登录
        function handleLogout() {
            isLoggedIn = false;
            localStorage.removeItem('adminLoggedIn');
            const loginContainer = document.getElementById('login-container');
            const adminContainer = document.getElementById('admin-container');
            if (loginContainer && adminContainer) {
                loginContainer.classList.remove('hidden');
                adminContainer.classList.add('hidden');
            }
        }

        // 排序函数
        function sortTasks(key) {
            if (sortConfig.key === key) {
                // 如果点击同一列，切换排序方向
                sortConfig.direction *= -1;
            } else {
                // 否则，设置新的排序列和排序方向
                sortConfig.key = key;
                // 对于ID列和duration列，首次点击默认降序
                // 因为数据从数据库加载时已经是ID升序和duration升序
                if (key === 'id' || key === 'duration') {
                    sortConfig.direction = -1;
                } else {
                    sortConfig.direction = 1;
                }
            }
            renderTasks();
        }

        // 渲染任务列表
        function renderTasks() {
            const tbody = document.getElementById('tasks-table-body');
            
            // 检查tbody元素是否存在
            if (!tbody) {
                console.error('tasks-table-body元素不存在');
                return;
            }
            
            // 排序任务
            let sortedTasks = [...tasks];
            if (sortConfig.key) {
                sortedTasks.sort((a, b) => {
                    let aVal = a[sortConfig.key];
                    let bVal = b[sortConfig.key];
                    
                    // 处理优先级比较
                    if (sortConfig.key === 'priority') {
                        const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
                        aVal = priorityOrder[aVal] || 0;
                        bVal = priorityOrder[bVal] || 0;
                    }
                    
                    // 处理日期比较
                    if (sortConfig.key === 'startDate') {
                        aVal = new Date(aVal);
                        bVal = new Date(bVal);
                    }
                    
                    // 处理时间比较
                    if (sortConfig.key === 'startTime') {
                        aVal = new Date(`2000-01-01 ${aVal}`);
                        bVal = new Date(`2000-01-01 ${bVal}`);
                    }
                    
                    // 处理持续时间比较，转换为统一单位（毫秒）后比较
                    if (sortConfig.key === 'duration') {
                        // 定义时间单位转换函数
                        function convertToMilliseconds(value, unit) {
                            const msPerUnit = {
                                minute: 60 * 1000,
                                hour: 60 * 60 * 1000,
                                day: 24 * 60 * 60 * 1000,
                                week: 7 * 24 * 60 * 60 * 1000
                            };
                            return value * (msPerUnit[unit] || msPerUnit.minute);
                        }
                        
                        const durationA = parseFloat(a.duration) || 0;
                        const durationB = parseFloat(b.duration) || 0;
                        const unitA = a.durationUnit || 'minute';
                        const unitB = b.durationUnit || 'minute';
                        
                        aVal = convertToMilliseconds(durationA, unitA);
                        bVal = convertToMilliseconds(durationB, unitB);
                    }
                    
                    // 数值比较
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        return (aVal - bVal) * sortConfig.direction;
                    }
                    
                    // 字符串比较
                    aVal = String(aVal);
                    bVal = String(bVal);
                    return aVal.localeCompare(bVal) * sortConfig.direction;
                });
            }

            if (sortedTasks.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-10 text-dark-textSecondary">
                            <i class="fa fa-calendar-times-o text-4xl mb-2"></i>
                            <p>暂无事件数据</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // 生成表格行
            let html = '';
            sortedTasks.forEach((task, index) => {
                const priorityText = task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : task.priority === 'low' ? '低' : '无';
                const repeatText = task.type === 'none' ? '无重复' : task.type === 'daily' ? '每天' : task.type === 'weekly' ? '每周' : task.type === 'monthly' ? '每月' : '自定义';
                const thresholdText = `${task.displayThreshold} ${task.displayThresholdUnit === 'minute' ? '分钟' : task.displayThresholdUnit === 'hour' ? '小时' : task.displayThresholdUnit === 'day' ? '天' : '周'}`;
                const durationText = `${task.duration} ${task.durationUnit === 'minute' ? '分钟' : task.durationUnit === 'hour' ? '小时' : task.durationUnit === 'day' ? '天' : '周'}`;

                html += `
                    <tr class="hover:bg-dark-hover transition-colors ${index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-card-alt'}">
                        <td class="py-2 px-4 text-sm">${index + 1}</td>
                        <td class="py-2 px-4 text-sm">${task.name}</td>
                        <td class="py-2 px-4 text-sm">
                            <span class="bg-priority-${task.priority || 'none'} text-white text-xs px-2 py-1 rounded-full">
                                ${priorityText}优先级
                            </span>
                        </td>
                        <td class="py-2 px-4 text-sm">${task.startDate} ${task.startTime}</td>
                        <td class="py-2 px-4 text-sm">${durationText}</td>
                        <td class="py-2 px-4 text-sm">${task.location || '-'}</td>
                        <td class="py-2 px-4 text-sm">${thresholdText}</td>
                        <td class="py-2 px-4 text-sm">${repeatText}</td>
                        <td class="py-2 px-4 text-sm flex gap-2">
                            <button class="action-btn edit-btn" data-task-id="${task.id}" title="编辑">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="action-btn delete-btn" data-task-id="${task.id}" title="删除">
                                <i class="fa fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

            // 添加事件监听器
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const taskId = parseInt(e.target.closest('.edit-btn').dataset.taskId);
                    editTask(taskId);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const taskId = parseInt(e.target.closest('.delete-btn').dataset.taskId);
                    showDeleteModal(taskId);
                });
            });
        }

        // 打开添加任务模态框
        function openAddTaskModal() {
            const modal = document.getElementById('task-modal');
            const modalTitle = document.getElementById('modal-title');
            const taskForm = document.getElementById('task-form');
            
            if (modal && modalTitle && taskForm) {
                modalTitle.textContent = '添加新事件';
                taskForm.reset();
                
                const taskIdInput = document.getElementById('task-id');
                const taskRecurrenceTypeInput = document.getElementById('task-recurrence-type');
                if (taskIdInput) taskIdInput.value = '';
                if (taskRecurrenceTypeInput) taskRecurrenceTypeInput.value = 'none';
                
                // 重置重复选项
                const recurrenceOptions = document.querySelectorAll('.recurrence-option');
                if (recurrenceOptions.length > 0) {
                    recurrenceOptions.forEach(option => {
                        option.classList.remove('selected');
                    });
                    
                    const noneOption = document.querySelector('.recurrence-option[data-type="none"]');
                    if (noneOption) {
                        noneOption.classList.add('selected');
                    }
                }
                
                // 隐藏所有重复选项面板
                const weeklyOptions = document.getElementById('weekly-options');
                const monthlyOptions = document.getElementById('monthly-options');
                const customOptions = document.getElementById('custom-options');
                if (weeklyOptions) weeklyOptions.classList.add('hidden');
                if (monthlyOptions) monthlyOptions.classList.add('hidden');
                if (customOptions) customOptions.classList.add('hidden');
                
                modal.classList.remove('hidden');
            }
        }

        // 打开编辑任务模态框
        function editTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const modal = document.getElementById('task-modal');
            const modalTitle = document.getElementById('modal-title');
            
            if (modal && modalTitle) {
                modalTitle.textContent = '编辑事件';
                
                // 填充表单数据
                const taskIdInput = document.getElementById('task-id');
                const taskNameInput = document.getElementById('task-name');
                const taskStartDateInput = document.getElementById('task-start-date');
                const taskStartTimeInput = document.getElementById('task-start-time');
                const taskDisplayThresholdInput = document.getElementById('task-display-threshold');
                const taskDisplayThresholdUnitInput = document.getElementById('task-display-threshold-unit');
                const taskPriorityInput = document.getElementById('task-priority');
                const taskDurationInput = document.getElementById('task-duration');
                const taskDurationUnitInput = document.getElementById('task-duration-unit');
                const taskRecurrenceTypeInput = document.getElementById('task-recurrence-type');
                
                if (taskIdInput) taskIdInput.value = task.id;
                if (taskNameInput) taskNameInput.value = task.name;
                if (taskStartDateInput) taskStartDateInput.value = task.startDate;
                if (taskStartTimeInput) taskStartTimeInput.value = task.startTime;
                if (taskDisplayThresholdInput) taskDisplayThresholdInput.value = task.displayThreshold;
                if (taskDisplayThresholdUnitInput) taskDisplayThresholdUnitInput.value = task.displayThresholdUnit;
                if (taskPriorityInput) taskPriorityInput.value = task.priority;
                if (taskDurationInput) taskDurationInput.value = task.duration;
                if (taskDurationUnitInput) taskDurationUnitInput.value = task.durationUnit;
                if (taskRecurrenceTypeInput) taskRecurrenceTypeInput.value = task.type;
                
                // 设置重复类型选项
                const recurrenceOptions = document.querySelectorAll('.recurrence-option');
                if (recurrenceOptions.length > 0) {
                    recurrenceOptions.forEach(option => {
                        option.classList.remove('selected');
                    });
                    const selectedOption = document.querySelector(`.recurrence-option[data-type="${task.type}"]`) || document.querySelector('.recurrence-option[data-type="none"]');
                    if (selectedOption) {
                        selectedOption.classList.add('selected');
                    }
                }
                
                // 显示相应的重复选项面板
                showRecurrenceOptions(task.type);
                
                modal.classList.remove('hidden');
            }
        }

        // 显示重复选项
        function showRecurrenceOptions(type) {
            // 隐藏所有选项
            const weeklyOptions = document.getElementById('weekly-options');
            const monthlyOptions = document.getElementById('monthly-options');
            const customOptions = document.getElementById('custom-options');
            
            if (weeklyOptions) weeklyOptions.classList.add('hidden');
            if (monthlyOptions) monthlyOptions.classList.add('hidden');
            if (customOptions) customOptions.classList.add('hidden');
            
            // 显示对应选项
            if (type === 'weekly' && weeklyOptions) {
                weeklyOptions.classList.remove('hidden');
            } else if (type === 'monthly' && monthlyOptions) {
                monthlyOptions.classList.remove('hidden');
            } else if (type === 'custom' && customOptions) {
                customOptions.classList.remove('hidden');
            }
        }

        // 关闭模态框
        function closeModal() {
            const taskModal = document.getElementById('task-modal');
            if (taskModal) {
                taskModal.classList.add('hidden');
            }
        }

        // 显示删除确认模态框
        function showDeleteModal(taskId) {
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) {
                deleteModal.classList.remove('hidden');
                
                // 保存要删除的任务ID
                deleteModal.dataset.taskId = taskId;
            }
        }

        // 关闭删除模态框
        function closeDeleteModal() {
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) {
                deleteModal.classList.add('hidden');
            }
        }

        // 删除任务
        function deleteTask(taskId) {
            tasks = tasks.filter(task => task.id !== taskId);
            renderTasks();
            closeDeleteModal();
            showNotification('事件已删除');
        }

        // 初始化事件监听器
        function initEventListeners() {
            // 登录功能
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
            
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleLogin(e);
                    }
                });
            }
            
            // 密码显示/隐藏切换
            const togglePasswordBtn = document.getElementById('toggle-password');
            if (togglePasswordBtn) {
                togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
            }
            
            // 登出功能
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
            
            // 添加任务按钮
            const addTaskBtn = document.getElementById('add-task-btn');
            if (addTaskBtn) {
                addTaskBtn.addEventListener('click', openAddTaskModal);
            }
            
            // 排序事件处理
            document.addEventListener('click', (e) => {
                const th = e.target.closest('th.sortable');
                if (th) {
                    const sortKey = th.dataset.sortKey;
                    sortTasks(sortKey);
                }
            });
            
            // 关闭模态框
            const closeModalBtn = document.getElementById('close-modal');
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', closeModal);
            }
            
            const cancelBtn = document.getElementById('cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', closeModal);
            }
            
            // 点击模态框背景关闭
            const taskModalBackdrop = document.querySelector('#task-modal .modal-backdrop');
            if (taskModalBackdrop) {
                taskModalBackdrop.addEventListener('click', closeModal);
            }
            
            // 重复类型选择
            const recurrenceOptions = document.querySelectorAll('.recurrence-option');
            if (recurrenceOptions.length > 0) {
                recurrenceOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        document.querySelectorAll('.recurrence-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        e.currentTarget.classList.add('selected');
                        
                        const type = e.currentTarget.dataset.type;
                        const taskRecurrenceType = document.getElementById('task-recurrence-type');
                        if (taskRecurrenceType) {
                            taskRecurrenceType.value = type;
                            showRecurrenceOptions(type);
                        }
                    });
                });
            }
            
            // 表单提交
            const taskForm = document.getElementById('task-form');
            if (taskForm) {
                taskForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const taskId = parseInt(document.getElementById('task-id').value) || 0;
                    const name = document.getElementById('task-name').value;
                    const startDate = document.getElementById('task-start-date').value;
                    const startTime = document.getElementById('task-start-time').value;
                    const displayThreshold = parseInt(document.getElementById('task-display-threshold').value);
                    const displayThresholdUnit = document.getElementById('task-display-threshold-unit').value;
                    const priority = document.getElementById('task-priority').value;
                    const duration = parseInt(document.getElementById('task-duration').value);
                    const durationUnit = document.getElementById('task-duration-unit').value;
                    const recurrenceType = document.getElementById('task-recurrence-type').value;
                    
                    // 构建重复规则
                    const recurrence = {};
                
                if (recurrenceType === 'weekly') {
                    const weekdays = Array.from(document.querySelectorAll('input[name="weekdays"]:checked')).map(checkbox => parseInt(checkbox.value));
                    recurrence.weekdays = weekdays;
                } else if (recurrenceType === 'monthly') {
                    const monthdays = Array.from(document.querySelectorAll('input[name="monthdays"]:checked')).map(checkbox => checkbox.value === 'last' ? 'last' : parseInt(checkbox.value));
                    const monthweekdays = Array.from(document.querySelectorAll('input[name="monthweekdays"]:checked')).map(checkbox => parseInt(checkbox.value));
                    
                    if (monthdays.length > 0) {
                        recurrence.days = monthdays;
                    }
                    if (monthweekdays.length > 0) {
                        recurrence.weekdays = monthweekdays;
                    }
                } else if (recurrenceType === 'custom') {
                    const intervalCount = parseInt(document.getElementById('custom-interval-count').value);
                    const intervalUnit = document.getElementById('custom-interval-unit').value;
                    
                    recurrence.count = intervalCount;
                    recurrence.unit = intervalUnit;
                }
                
                // 构建任务对象
                const taskData = {
                    name,
                    startDate,
                    startTime,
                    displayThreshold,
                    displayThresholdUnit,
                    priority,
                    duration,
                    durationUnit,
                    type: recurrenceType,
                    recurrence: Object.keys(recurrence).length > 0 ? recurrence : undefined
                };
                
                if (taskId) {
                    // 更新现有任务
                    const taskIndex = tasks.findIndex(t => t.id === taskId);
                    if (taskIndex !== -1) {
                        tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
                        showNotification('事件已更新');
                    }
                } else {
                    // 添加新任务
                    const newTask = {
                        id: generateId(),
                        ...taskData
                    };
                    tasks.push(newTask);
                    showNotification('事件已添加');
                }
                
                // 重新渲染任务列表
                renderTasks();
                
                // 关闭模态框
                closeModal();
            });
            
            // 删除确认
            const confirmDeleteBtn = document.getElementById('confirm-delete');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    const deleteModal = document.getElementById('delete-modal');
                    if (deleteModal) {
                        const taskId = parseInt(deleteModal.dataset.taskId);
                        deleteTask(taskId);
                    }
                });
            }
            
            // 取消删除
            const cancelDeleteBtn = document.getElementById('cancel-delete');
            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', closeDeleteModal);
            }
            
            // 点击删除模态框背景关闭
            const deleteModalBackdrop = document.querySelector('#delete-modal .modal-backdrop');
            if (deleteModalBackdrop) {
                deleteModalBackdrop.addEventListener('click', closeDeleteModal);
            }
            
            // 保存数据按钮 - 仅当元素存在时添加事件监听器
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    await saveData(tasks);
                });
            }
            
            // 表头排序事件已在admin.html中通过document.addEventListener统一处理，此处不再重复绑定
        }

        // 初始化应用
        async function initApp() {
            try {
                // 加载数据
                console.log('开始加载数据...');
                
                // 只从Supabase加载数据，忽略本地缓存
                let loadedTasks = await loadFromSupabase();
                
                tasks = loadedTasks;
                console.log('从云端加载到的数据:', tasks.length, '条记录');
                
                // 初始化事件监听器
                initEventListeners();
                
                // 检查登录状态
                checkLogin();
                
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
            }
        }

        // 启动应用
        initApp();
    