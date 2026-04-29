/**
 * K-12 AI Learning Platform - 完整React应用
 * 
 * 这个应用演示了：
 * 1. 学生仪表板
 * 2. 课程学习界面
 * 3. 练习题生成和交互
 * 4. AI驱动的自动评分和反馈
 * 
 * 使用方法：
 * 1. npm install react react-dom
 * 2. 设置 REACT_APP_API_URL 环境变量
 * 3. npm start
 */

import React, { useState, useEffect } from 'react';

// ============================================
// 全局样式
// ============================================
const GlobalStyle = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f5f5;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  button {
    padding: 10px 20px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  button:hover {
    background: #f0f0f0;
    border-color: #999;
  }
  
  button.primary {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;
  }
  
  button.primary:hover {
    background: #357abd;
    border-color: #357abd;
  }
  
  .card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .badge.success { background: #e6f4ea; color: #137333; }
  .badge.warning { background: #fef7e0; color: #f57c00; }
  .badge.danger { background: #fce8e6; color: #c5221f; }
  .badge.info { background: #e8f0fe; color: #1967d2; }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin: 10px 0;
  }
  
  .progress-bar-fill {
    height: 100%;
    background: #4a90e2;
    transition: width 0.3s;
  }
  
  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }
  
  .spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #4a90e2;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// ============================================
// 1. 学生仪表板
// ============================================
function StudentDashboard({ student, onSelectTask }) {
  const [tasks] = useState([
    {
      id: 1,
      subject: '📐 数学',
      topic: '二次方程',
      description: '学习如何解二次方程和因式分解',
      status: 'completed',
      duration: '15分钟',
      accuracy: 92
    },
    {
      id: 2,
      subject: '🔬 科学',
      topic: '细胞分裂',
      description: '理解有丝分裂和减数分裂过程',
      status: 'in-progress',
      duration: '20分钟',
      accuracy: null
    },
    {
      id: 3,
      subject: '📚 文学',
      topic: '莎士比亚作品分析',
      description: '分析哈姆雷特中的关键主题',
      status: 'not-started',
      duration: '18分钟',
      accuracy: null
    },
    {
      id: 4,
      subject: '🧮 数学',
      topic: '统计学基础',
      description: '平均数、中位数和众数',
      status: 'not-started',
      duration: '12分钟',
      accuracy: null
    },
    {
      id: 5,
      subject: '🌍 社科',
      topic: '工业革命',
      description: '从手工业到机器生产',
      status: 'not-started',
      duration: '16分钟',
      accuracy: null
    }
  ]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="container">
      <style>{GlobalStyle}</style>
      
      {/* 头部信息 */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>欢迎，{student.name}！</h1>
            <p style={{ marginTop: '5px', opacity: 0.9 }}>祝你今天学习愉快</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{student.streak || 0}🔥</div>
            <p style={{ marginTop: '5px', opacity: 0.9 }}>连续学习天数</p>
          </div>
        </div>
      </div>

      {/* 每日进度 */}
      <div className="card">
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>今日进度</h2>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontWeight: '500' }}>{completedCount} 个任务已完成 / {totalCount} 个</span>
          <span style={{ float: 'right', color: '#666' }}>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* 今日任务列表 */}
      <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>今日任务</h2>
      {tasks.map(task => (
        <div key={task.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onSelectTask(task.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>
                {task.subject} {task.topic}
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                {task.description}
              </p>
              <div style={{ fontSize: '13px', color: '#999' }}>
                ⏱️ 约 {task.duration}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '20px' }}>
              {task.status === 'completed' && (
                <>
                  <span className="badge success">✓ 完成</span>
                  <p style={{ marginTop: '8px', fontSize: '14px' }}>准确率: {task.accuracy}%</p>
                </>
              )}
              {task.status === 'in-progress' && (
                <span className="badge warning">进行中</span>
              )}
              {task.status === 'not-started' && (
                <span className="badge info">未开始</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 本周统计 */}
      <h2 style={{ fontSize: '18px', marginBottom: '15px', marginTop: '30px' }}>本周统计</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4a90e2' }}>18</div>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>任务完成</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34c759' }}>87%</div>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>平均准确率</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9500' }}>245</div>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>分钟学习</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2. 课程学习界面
// ============================================
function LessonViewer({ taskId, onBack }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟从API获取课程
    setTimeout(() => {
      setLesson({
        id: taskId,
        title: '二次方程求解',
        duration: 15,
        objectives: [
          '理解二次方程的标准形式',
          '掌握多种求解方法',
          '能够应用到实际问题'
        ],
        content: `
          ## 什么是二次方程？
          
          二次方程是形如 ax² + bx + c = 0 的方程（其中 a ≠ 0）。
          
          ### 求解方法：
          
          **方法1：因式分解**
          例如：x² + 5x + 6 = 0
          可以分解为：(x + 2)(x + 3) = 0
          所以 x = -2 或 x = -3
          
          **方法2：求根公式**
          x = (-b ± √(b² - 4ac)) / 2a
          
          **方法3：配方法**
          将方程改写成 (x + p)² = q 的形式
        `,
        examples: [
          {
            problem: '求解方程 x² - 5x + 6 = 0',
            solution: '因式分解：(x - 2)(x - 3) = 0，所以 x = 2 或 x = 3'
          },
          {
            problem: '求解方程 2x² + 4x - 6 = 0',
            solution: '使用求根公式：x = (-4 ± √(16 + 48)) / 4 = (-4 ± 8) / 4，所以 x = 1 或 x = -3'
          }
        ]
      });
      setLoading(false);
    }, 800);
  }, [taskId]);

  if (loading) {
    return (
      <div className="container">
        <style>{GlobalStyle}</style>
        <button onClick={onBack} style={{ marginBottom: '20px' }}>← 返回</button>
        <div className="loading">
          <div className="spinner"></div>
          <p>正在生成课程内容...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <style>{GlobalStyle}</style>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>← 返回</button>

      <div className="card">
        <h1 style={{ marginBottom: '10px' }}>{lesson.title}</h1>
        <p style={{ color: '#666' }}>⏱️ 预计时长：{lesson.duration} 分钟</p>

        {/* 学习目标 */}
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>学习目标</h2>
          <ul style={{ marginLeft: '20px' }}>
            {lesson.objectives.map((obj, i) => (
              <li key={i} style={{ marginBottom: '8px', lineHeight: '1.6' }}>
                {obj}
              </li>
            ))}
          </ul>
        </div>

        {/* 课程内容 */}
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>课程内容</h2>
          <div style={{ 
            background: '#f9f9f9', 
            padding: '15px', 
            borderRadius: '6px',
            lineHeight: '1.8',
            color: '#333'
          }}>
            {lesson.content.split('\n').map((line, i) => {
              if (line.startsWith('##')) {
                return <h3 key={i} style={{ fontSize: '16px', marginTop: '15px', marginBottom: '10px' }}>{line.replace('## ', '')}</h3>;
              }
              if (line.startsWith('**')) {
                return <p key={i} style={{ marginBottom: '10px', fontWeight: 'bold' }}>{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.trim()) {
                return <p key={i} style={{ marginBottom: '8px' }}>{line}</p>;
              }
              return null;
            })}
          </div>
        </div>

        {/* 例题讲解 */}
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>例题讲解</h2>
          {lesson.examples.map((ex, i) => (
            <div key={i} style={{ 
              background: '#f0f7ff', 
              padding: '15px', 
              borderRadius: '6px',
              marginBottom: '15px',
              borderLeft: '4px solid #4a90e2'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>例题 {i + 1}: {ex.problem}</p>
              <p style={{ color: '#555' }}>解答：{ex.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 3. 练习界面
// ============================================
function ExerciseInterface({ taskId, onBack, onComplete }) {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // 模拟从API获取练习题
    setTimeout(() => {
      setExercises([
        {
          id: 1,
          type: 'multiple_choice',
          difficulty: 'easy',
          question: '以下哪个是二次方程的标准形式？',
          options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + c = 0', 'ax² + b = 0'],
          correct_answer: 'ax² + bx + c = 0',
          explanation: '二次方程必须包含x²项，且a≠0。选项B是标准形式。'
        },
        {
          id: 2,
          type: 'short_answer',
          difficulty: 'medium',
          question: '求解方程 x² - 5x + 6 = 0',
          correct_answer: 'x=2或x=3',
          explanation: '可以因式分解为(x-2)(x-3)=0，所以x=2或x=3。',
          hint: '尝试因式分解或使用求根公式'
        },
        {
          id: 3,
          type: 'multiple_choice',
          difficulty: 'medium',
          question: '使用求根公式解 2x² + 4x - 6 = 0，判别式(b²-4ac)的值是多少？',
          options: ['8', '16', '32', '64'],
          correct_answer: '64',
          explanation: '判别式 = 4² - 4(2)(-6) = 16 + 48 = 64'
        },
        {
          id: 4,
          type: 'short_answer',
          difficulty: 'hard',
          question: '一个矩形的长比宽多2厘米，面积为15平方厘米。求矩形的宽度。',
          correct_answer: '3',
          explanation: '设宽为x，则长为x+2。面积方程：x(x+2)=15，即x²+2x-15=0，可分解为(x+5)(x-3)=0，所以x=3(舍去负值)。',
          hint: '列出方程：宽 × 长 = 面积'
        },
        {
          id: 5,
          type: 'multiple_choice',
          difficulty: 'hard',
          question: '二次方程x²+px+q=0有两个相等的根，这说明了什么？',
          options: ['判别式为正数', '判别式为零', '判别式为负数', '无法确定'],
          correct_answer: '判别式为零',
          explanation: '当判别式(b²-4ac)=0时，二次方程有两个相等的实根，也称为重根。'
        }
      ]);
      setLoading(false);
    }, 800);
  }, [taskId]);

  const handleSubmitAnswer = (answer) => {
    const current = exercises[currentIndex];
    const isCorrect = answer === current.correct_answer || 
                      answer.toLowerCase().replace(/\s/g, '') === 
                      current.correct_answer.toLowerCase().replace(/\s/g, '');
    
    setFeedback({
      isCorrect,
      explanation: current.explanation,
      userAnswer: answer
    });

    setUserAnswers({
      ...userAnswers,
      [current.id]: { answer, isCorrect }
    });
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback(null);
    } else {
      const correct = Object.values(userAnswers).filter(a => a.isCorrect).length;
      const accuracy = Math.round((correct / exercises.length) * 100);
      setCompleted(true);
      if (onComplete) {
        onComplete(accuracy);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <style>{GlobalStyle}</style>
        <button onClick={onBack} style={{ marginBottom: '20px' }}>← 返回</button>
        <div className="loading">
          <div className="spinner"></div>
          <p>正在生成练习题...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    const correct = Object.values(userAnswers).filter(a => a.isCorrect).length;
    const accuracy = Math.round((correct / exercises.length) * 100);
    const isExcellent = accuracy >= 80;

    return (
      <div className="container">
        <style>{GlobalStyle}</style>
        <button onClick={onBack} style={{ marginBottom: '20px' }}>← 返回仪表板</button>
        
        <div className="card" style={{ textAlign: 'center', background: isExcellent ? '#f0fdf4' : '#fff3cd' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>
            {isExcellent ? '🎉' : '👍'}
          </div>
          <h1 style={{ marginBottom: '10px' }}>
            {isExcellent ? '太棒了！' : '很好！'}
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
            你完成了 {correct} 个正确答案，共 {exercises.length} 个问题
          </p>
          
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: isExcellent ? '#16a34a' : '#f59e0b', marginBottom: '20px' }}>
            {accuracy}%
          </div>
          
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {isExcellent 
              ? '优秀！你已经掌握了这个主题。' 
              : '还不错！继续练习以提高你的技能。'}
          </p>

          <button className="primary" onClick={onBack}>
            继续学习其他课程
          </button>
        </div>
      </div>
    );
  }

  const current = exercises[currentIndex];
  const progress = ((currentIndex + 1) / exercises.length) * 100;

  return (
    <div className="container">
      <style>{GlobalStyle}</style>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>← 返回</button>

      {/* 进度条 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>第 {currentIndex + 1} / {exercises.length} 题</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* 题目 */}
      <div className="card">
        <div style={{ marginBottom: '15px' }}>
          <span className={`badge ${current.difficulty === 'easy' ? 'info' : current.difficulty === 'medium' ? 'warning' : 'danger'}`}>
            {current.difficulty === 'easy' ? '简单' : current.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>

        <h2 style={{ fontSize: '20px', marginBottom: '20px', lineHeight: '1.6' }}>
          {current.question}
        </h2>

        {/* 选择题 */}
        {current.type === 'multiple_choice' && (
          <div>
            {current.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSubmitAnswer(option)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 15px',
                  marginBottom: '10px',
                  border: `1px solid ${userAnswers[current.id]?.answer === option ? '#4a90e2' : '#ddd'}`,
                  backgroundColor: userAnswers[current.id]?.answer === option ? '#f0f7ff' : 'white',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <strong>{String.fromCharCode(65 + i)}.</strong> {option}
              </button>
            ))}
          </div>
        )}

        {/* 简答题 */}
        {current.type === 'short_answer' && (
          <div>
            {current.hint && (
              <p style={{ background: '#f0f7ff', padding: '10px', borderRadius: '6px', marginBottom: '15px', color: '#4a90e2' }}>
                💡 提示：{current.hint}
              </p>
            )}
            <input
              type="text"
              placeholder="输入你的答案"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmitAnswer(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '10px'
              }}
            />
            <button
              className="primary"
              onClick={(e) => {
                const input = e.target.parentElement.querySelector('input');
                handleSubmitAnswer(input.value);
              }}
            >
              提交答案
            </button>
          </div>
        )}

        {/* 反馈 */}
        {feedback && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '6px',
            background: feedback.isCorrect ? '#f0fdf4' : '#fef2f2',
            borderLeft: `4px solid ${feedback.isCorrect ? '#16a34a' : '#dc2626'}`
          }}>
            <p style={{
              fontWeight: 'bold',
              color: feedback.isCorrect ? '#16a34a' : '#dc2626',
              marginBottom: '10px'
            }}>
              {feedback.isCorrect ? '✓ 正确！' : '✗ 不对'}
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>讲解：</strong> {feedback.explanation}
            </p>
            <button
              className="primary"
              onClick={handleNext}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {currentIndex < exercises.length - 1 ? '下一题 →' : '查看结果'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 4. 主应用程序
// ============================================
export default function LearningPlatformApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [student] = useState({
    id: 'student_001',
    name: '李明',
    grade: 9,
    streak: 7,
    totalPoints: 1250
  });

  const handleSelectTask = (taskId) => {
    setSelectedTaskId(taskId);
    setCurrentView('lesson');
  };

  //const handleLessonComplete = () => {
  //  setCurrentView('exercise');
 // };

  const handleExerciseComplete = (accuracy) => {
    console.log(`课程完成！准确率：${accuracy}%`);
    setCurrentView('dashboard');
    setSelectedTaskId(null);
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedTaskId(null);
  };

  return (
    <>
      {currentView === 'dashboard' && (
        <StudentDashboard student={student} onSelectTask={handleSelectTask} />
      )}
      
      {currentView === 'lesson' && (
        <LessonViewer 
          taskId={selectedTaskId} 
          onBack={handleBack}
        />
      )}

      {currentView === 'exercise' && (
        <ExerciseInterface
          taskId={selectedTaskId}
          onBack={handleBack}
          onComplete={handleExerciseComplete}
        />
      )}
    </>
  );
}

// ============================================
// 如何使用此代码：
// ============================================
/*
1. 创建新的React应用：
   npx create-react-app learning-platform
   cd learning-platform

2. 替换 src/App.js 的内容为此文件

3. 启动应用：
   npm start

4. 应用会在 http://localhost:3000 打开

5. 集成真实API：
   - 在 StudentDashboard 中，替换 useState 为实际的 fetch() 调用
   - 连接到你的后端 API
   - 传递真实的学生数据和任务列表

示例API集成：
```javascript
useEffect(() => {
  fetch(`/api/daily-tasks/${student.id}`)
    .then(res => res.json())
    .then(data => setTasks(data))
    .catch(err => console.error(err));
}, [student.id]);
```

6. 生产环境部署：
   npm run build
   # 上传 build/ 文件夹到你的托管服务（Vercel, Netlify等）
*/
