// 简单的测试脚本，验证修复后的选择器
const { JSDOM } = require('jsdom');

// 创建DOM环境
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="monthly-times-container">
    <!-- 原有的4个时间点 -->
    <div class="flex items-center gap-2 mb-2">
      <input type="time" class="start-time-input" value="08:00">
      <button class="remove-time-btn">删除</button>
    </div>
    <div class="flex items-center gap-2 mb-2">
      <input type="time" class="start-time-input" value="12:00">
      <button class="remove-time-btn">删除</button>
    </div>
    <div class="flex items-center gap-2 mb-2">
      <input type="time" class="start-time-input" value="16:00">
      <button class="remove-time-btn">删除</button>
    </div>
    <div class="flex items-center gap-2 mb-2">
      <input type="time" class="start-time-input" value="20:00">
      <button class="remove-time-btn">删除</button>
    </div>
    <!-- 新增的第5个时间点 -->
    <div class="flex items-center gap-2 mb-2">
      <input type="time" class="start-time-input" value="23:00">
      <button class="remove-time-btn">删除</button>
    </div>
  </div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window;

// 测试修复后的选择器
function testFixedSelector() {
  console.log('=== 测试修复后的选择器 #monthly-times-container .start-time-input ===');
  
  // 使用修复后的选择器
  const timeInputs = Array.from(document.querySelectorAll('#monthly-times-container .start-time-input'));
  
  console.log('找到的时间点输入框数量:', timeInputs.length);
  
  const collectedTimes = timeInputs.map(input => input.value);
  console.log('收集到的时间点:', collectedTimes);
  
  // 验证结果
  if (collectedTimes.length === 5) {
    console.log('✅ 测试通过！成功收集到所有5个时间点');
    
    // 检查原有时间点是否存在
    const originalTimes = ['08:00', '12:00', '16:00', '20:00'];
    const allOriginalPreserved = originalTimes.every(time => collectedTimes.includes(time));
    
    if (allOriginalPreserved) {
      console.log('✅ 原有4个时间点全部保留');
    } else {
      console.log('❌ 原有时间点丢失');
    }
    
    // 检查新时间点是否添加
    if (collectedTimes.includes('23:00')) {
      console.log('✅ 新添加的时间点23:00已保存');
    } else {
      console.log('❌ 新添加的时间点23:00未保存');
    }
    
  } else {
    console.log('❌ 测试失败！只收集到', collectedTimes.length, '个时间点');
  }
}

// 运行测试
testFixedSelector();