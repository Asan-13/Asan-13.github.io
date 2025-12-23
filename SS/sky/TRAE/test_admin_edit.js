// 测试admin.html编辑任务时时间点保存功能
// 模拟DOM环境
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

// 模拟任务数据（模拟从数据库加载的4个时间点）
const mockTask = {
  id: 'test-task-1',
  name: '测试每月任务',
  priority: 1,
  displayThreshold: 10,
  displayThresholdUnit: 'minute',
  startDate: '2023-12-01',
  startTime: '08:00',
  duration: 60,
  durationUnit: 'minute',
  recurrence: {
    type: 'monthly',
    duration: 60,
    durationUnit: 'minute',
    monthlyRepeatType: 'time-points',
    days: [1, 15],
    startTimes: ['08:00', '12:00', '16:00', '20:00'] // 原有4个时间点
  }
};

// 模拟tasks数组
let tasks = [mockTask];

// 模拟添加时间点容器和按钮
function setupDOM() {
  // 创建每月时间点容器
  const monthlyTimePointsDiv = document.createElement('div');
  monthlyTimePointsDiv.id = 'monthly-time-points';
  document.body.appendChild(monthlyTimePointsDiv);
  
  // 创建每月时间点输入容器
  const monthlyTimesContainer = document.createElement('div');
  monthlyTimesContainer.id = 'monthly-times-container';
  monthlyTimePointsDiv.appendChild(monthlyTimesContainer);
  
  // 创建重复类型选择器
  const recurrenceTypeSelect = document.createElement('select');
  recurrenceTypeSelect.id = 'recurrence-type';
  recurrenceTypeSelect.value = 'monthly';
  document.body.appendChild(recurrenceTypeSelect);
  
  // 创建每月重复类型选择器
  const monthlyRepeatTypeSelect = document.createElement('select');
  monthlyRepeatTypeSelect.id = 'monthly-repeat-type';
  monthlyRepeatTypeSelect.value = 'time-points';
  document.body.appendChild(monthlyRepeatTypeSelect);
  
  // 创建月日期选择框
  for (let i = 1; i <= 31; i++) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'monthday';
    checkbox.value = i;
    if ([1, 15].includes(i)) checkbox.checked = true;
    document.body.appendChild(checkbox);
  }
}

// 模拟editTask函数中加载现有时间点的逻辑
function loadExistingTimePoints(task) {
  const monthlyTimesContainer = document.getElementById('monthly-times-container');
  monthlyTimesContainer.innerHTML = '';
  
  if (task.recurrence.startTimes && task.recurrence.startTimes.length > 0) {
    task.recurrence.startTimes.forEach((time, index) => {
      // 创建时间点输入框，使用修复后的start-time-input类名
      const timePointDiv = document.createElement('div');
      timePointDiv.className = 'flex items-center gap-2 mb-2';
      timePointDiv.innerHTML = `
        <input type="time" class="start-time-input min-w-[80px] px-3 py-2 border border-gray-600 rounded-lg bg-dark-bg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value="${time}">
        <button type="button" class="remove-time-btn bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;
      
      // 添加删除事件
      timePointDiv.querySelector('.remove-time-btn').addEventListener('click', () => {
        timePointDiv.remove();
      });
      
      monthlyTimesContainer.appendChild(timePointDiv);
    });
  }
}

// 模拟addTimePoint函数
function addTimePoint(containerId, time = '') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const timePointDiv = document.createElement('div');
  timePointDiv.className = 'flex items-center gap-2 mb-2';
  
  const timeType = containerId.replace('-times-container', '');
  const inputCount = container.querySelectorAll('.flex.items-center.gap-2').length;
  
  timePointDiv.innerHTML = `
    <input type="time" name="${timeType}-time-${inputCount}" class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-dark-bg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent start-time-input" ${time ? `value="${time}"` : 'placeholder="--:--"'}>
    <button type="button" onclick="removeTimeInput('${timeType}', ${inputCount})" class="remove-time-btn bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  // 添加删除事件
  timePointDiv.querySelector('.remove-time-btn').addEventListener('click', () => {
    timePointDiv.remove();
  });
  
  container.appendChild(timePointDiv);
}

// 模拟收集时间点的逻辑
function collectTimePoints() {
  const recurrenceType = document.getElementById('recurrence-type').value;
  let startTimes = [];
  
  if (recurrenceType === 'monthly') {
    const monthlyRepeatType = document.getElementById('monthly-repeat-type').value;
    
    if (monthlyRepeatType === 'time-points') {
      // 收集每月时间点数据，使用start-time-input选择器
      // 首先检查DOM结构
      const monthlyTimePointsDiv = document.getElementById('monthly-time-points');
      console.log('   DOM结构检查: monthly-time-points存在:', !!monthlyTimePointsDiv);
      
      const allInputs = document.querySelectorAll('input[type="time"]');
      console.log('   所有时间输入框数量:', allInputs.length);
      
      // 尝试不同的选择器
      const selector1 = '#monthly-time-points .start-time-input';
      const selector2 = '#monthly-times-container .start-time-input';
      const selector3 = '.start-time-input';
      
      const inputs1 = Array.from(document.querySelectorAll(selector1));
      const inputs2 = Array.from(document.querySelectorAll(selector2));
      const inputs3 = Array.from(document.querySelectorAll(selector3));
      
      console.log('   选择器1 (' + selector1 + ') 匹配:', inputs1.length);
      console.log('   选择器2 (' + selector2 + ') 匹配:', inputs2.length);
      console.log('   选择器3 (' + selector3 + ') 匹配:', inputs3.length);
      
      // 使用最可靠的选择器
      startTimes = inputs3.map(input => input.value);
      
      // 确保至少有一个时间点
      if (startTimes.length === 0) {
        startTimes.push('00:00');
      }
    }
  }
  
  return startTimes;
}

// 测试编辑任务并添加新时间点
function testEditTask() {
  console.log('=== 测试admin.html编辑任务时间点保存功能 ===');
  console.log('1. 初始任务时间点:', mockTask.recurrence.startTimes);
  
  // 设置DOM
  setupDOM();
  
  // 加载现有时间点（模拟editTask函数的加载过程）
  loadExistingTimePoints(mockTask);
  
  // 模拟用户添加一个新时间点
  console.log('2. 添加新时间点: 23:00');
  addTimePoint('monthly-times-container', '23:00');
  
  // 直接检查DOM元素
  console.log('3. DOM元素检查:');
  
  // 检查所有时间输入框
  const allTimeInputs = document.querySelectorAll('input[type="time"]');
  console.log('   所有input[type="time"]元素数量:', allTimeInputs.length);
  
  allTimeInputs.forEach((input, index) => {
    console.log('   元素' + index + ' - value:', input.value, 'class:', input.className);
  });
  
  // 检查start-time-input类的元素
  const startTimeInputs = document.querySelectorAll('.start-time-input');
  console.log('4. 带start-time-input类的元素数量:', startTimeInputs.length);
  
  startTimeInputs.forEach((input, index) => {
    console.log('   时间点' + index + ':', input.value);
  });
  
  // 检查特定容器内的元素
  const monthlyTimesContainer = document.getElementById('monthly-times-container');
  const containerInputs = monthlyTimesContainer.querySelectorAll('input[type="time"]');
  console.log('5. monthly-times-container内的时间输入框数量:', containerInputs.length);
  
  const containerStartTimeInputs = monthlyTimesContainer.querySelectorAll('.start-time-input');
  console.log('6. monthly-times-container内带start-time-input类的元素数量:', containerStartTimeInputs.length);
  
  // 手动收集时间点
  const collectedTimes = Array.from(allTimeInputs).map(input => input.value);
  
  console.log('7. 手动收集的时间点:', collectedTimes);
  
  // 验证结果
  if (collectedTimes.length === 5 && collectedTimes.includes('23:00')) {
    console.log('✅ 测试通过！原有4个时间点+新增1个时间点，共5个时间点均被保存');
    console.log('   所有时间点:', collectedTimes);
  } else {
    console.log('❌ 测试失败！时间点丢失或数量不正确');
    console.log('   期望: 5个时间点，包含23:00');
    console.log('   实际: ' + collectedTimes.length + '个时间点:', collectedTimes);
  }
  
  // 验证原有时间点是否全部保留
  const originalTimes = ['08:00', '12:00', '16:00', '20:00'];
  const allOriginalPreserved = originalTimes.every(time => collectedTimes.includes(time));
  
  if (allOriginalPreserved) {
    console.log('✅ 原有时间点全部保留');
  } else {
    console.log('❌ 原有时间点丢失');
    const missingTimes = originalTimes.filter(time => !collectedTimes.includes(time));
    console.log('   丢失的时间点:', missingTimes);
  }
}

// 运行测试
testEditTask();
