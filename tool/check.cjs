/**
 * check.js —— 作业自检脚本
 * 用法：node tool/check.js
 * 检查 React 项目关键文件是否存在，metadata.json 是否填写。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

let passCount = 0;
let failCount = 0;

function pass(msg) {
  console.log(`  ✅  ${msg}`);
  passCount++;
}

function fail(msg) {
  console.error(`  ❌  ${msg}`);
  failCount++;
}

// ─────────────────────────────────────────────
// 1. 检查 metadata.json 是否存在并已填写
// ─────────────────────────────────────────────
console.log('\n📋 检查 metadata.json ...');
const metaPath = path.join(ROOT, 'metadata.json');
if (fs.existsSync(metaPath)) {
  pass('metadata.json 文件存在');
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.studentName && !meta.studentName.includes('请填写') && meta.studentName !== '小明') {
      pass(`姓名已填写：${meta.studentName}`);
    } else {
      fail('请在 metadata.json 中填写你的真实姓名');
    }
    if (meta.studentId && !meta.studentId.includes('请填写') && meta.studentId !== '23300000') {
      pass(`学号已填写：${meta.studentId}`);
    } else {
      fail('请在 metadata.json 中填写你的真实学号');
    }
    // 检查组员信息
    if (Array.isArray(meta.members) && meta.members.length > 0) {
      const filledMembers = meta.members.filter(m =>
        m.name && m.name !== '组员1姓名' && m.name !== '组员2姓名' && m.name !== '组员3姓名' && m.name !== '组员4姓名' &&
        m.studentId && m.studentId !== '学号'
      );
      if (filledMembers.length > 0) {
        pass(`已填写 ${filledMembers.length} 名组员信息：${filledMembers.map(m => m.name).join('、')}`);
      } else {
        fail('请在 metadata.json 的 members 数组中填写组员的真实姓名和学号');
      }
    } else {
      fail('metadata.json 中缺少 members 数组，请添加组员信息');
    }
  } catch (e) {
    fail('metadata.json 格式错误，请检查 JSON 语法');
  }
} else {
  fail('metadata.json 文件不存在，请确认根目录中存在该文件');
}

// ─────────────────────────────────────────────
// 2. 检查 Report.md
// ─────────────────────────────────────────────
console.log('\n📝 检查 Report.md ...');
const reportPath = path.join(ROOT, 'Report.md');
if (fs.existsSync(reportPath)) {
  pass('Report.md 文件存在');
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  if (reportContent.includes('___')) {
    fail('Report.md 中仍有未填写的空白项（___），请完善报告内容');
  } else {
    pass('Report.md 已填写');
  }
} else {
  fail('Report.md 文件不存在，请确认根目录中存在该文件');
}

// ─────────────────────────────────────────────
// 3. 检查构建是否能通过
// ─────────────────────────────────────────────
console.log('\n🔨 检查 npm run build 是否能成功构建 ...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  pass('npm run build 构建成功');
} catch (e) {
  fail('npm run build 构建失败，请检查代码错误');
  const output = (e.stderr || e.stdout || '').toString().trim();
  if (output) {
    console.error('  构建输出:\n' + output.split('\n').map(l => '    ' + l).join('\n'));
  }
}


// ─────────────────────────────────────────────
// 汇总结果
// ─────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log(`📊 检查完成：${passCount} 项通过，${failCount} 项未通过\n`);
if (failCount === 0) {
  console.log('🎉 恭喜！所有检查项均通过，可以打包提交了。');
  console.log('   运行命令：node tool/pack.js\n');
} else {
  console.log('⚠️  请根据上方提示修改后，重新运行检查。\n');
  process.exit(1);
}
