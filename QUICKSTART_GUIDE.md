# K-12 AI自适应学习平台 - 快速启动指南

## 📊 项目概览

**项目名称**: EduAI - K-12智能自适应学习平台

**核心特性**:
- ✅ 支持全K-12年级（幼儿园至12年级）
- ✅ 所有科目覆盖（数学、科学、文学、历史、社科、艺术等10+科目）
- ✅ 自适应学习（根据学生表现实时调整难度）
- ✅ AI驱动内容生成（使用Claude API）
- ✅ 个性化学习路径
- ✅ 实时学习分析
- ✅ 游戏化元素

---

## 🚀 快速启动（15分钟内）

### 第1步：环境设置

```bash
# 1. 克隆或创建项目目录
mkdir eduai-learning-platform
cd eduai-learning-platform

# 2. 创建虚拟环境（Python后端）
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows

# 3. 安装Python依赖
pip install -r requirements.txt

# 4. 创建前端项目（React）
npx create-react-app frontend
cd frontend
npm install
cd ..
```

### 第2步：配置文件

**创建 `requirements.txt`**（Python依赖）:
```
anthropic==0.7.8
flask==2.3.0
flask-cors==4.0.0
python-dotenv==1.0.0
psycopg2-binary==2.9.0
redis==4.5.0
numpy==1.24.0
pandas==2.0.0
apscheduler==3.10.0
```

**创建 `.env` 文件**（配置环境变量）:
```env
# Claude API
ANTHROPIC_API_KEY=sk-your-api-key-here

# 数据库（本地开发）
DATABASE_URL=postgresql://localhost/eduai_dev
REDIS_URL=redis://localhost:6379

# JWT认证
JWT_SECRET=your-super-secret-key-change-this-in-production

# API配置
API_HOST=localhost
API_PORT=5000
FLASK_ENV=development

# 前端
REACT_APP_API_URL=http://localhost:5000
```

### 第3步：启动应用

**终端1 - 启动Python后端**:
```bash
python app.py
# 应该看到: "Flask app running on http://localhost:5000"
```

**终端2 - 启动React前端**:
```bash
cd frontend
npm start
# 应该自动打开 http://localhost:3000
```

**完成！** 👏 你的平台现在正在运行。

---

## 📁 项目结构

```
eduai-learning-platform/
├── app.py                          # Flask后端主应用
├── requirements.txt                # Python依赖
├── .env                           # 环境变量（不要提交到git）
├── .gitignore
│
├── backend/
│   ├── __init__.py
│   ├── auth/                      # 认证模块
│   │   ├── jwt_handler.py
│   │   └── decorators.py
│   ├── models/                    # 数据库模型
│   │   ├── student.py
│   │   ├── progress.py
│   │   └── session.py
│   ├── api/                       # API路由
│   │   ├── students.py           # 学生管理
│   │   ├── courses.py            # 课程管理
│   │   ├── exercises.py          # 练习题
│   │   ├── progress.py           # 学习进度
│   │   └── ai_content.py         # AI内容生成
│   ├── services/                 # 业务逻辑
│   │   ├── adaptive_engine.py    # 自适应引擎（已提供）
│   │   ├── curriculum.py         # 课程管理
│   │   └── analytics.py          # 分析和报告
│   ├── utils/
│   │   ├── helpers.py
│   │   └── validators.py
│   └── database/
│       ├── db.py                 # 数据库连接
│       └── migrations/           # 数据库迁移
│
├── frontend/                       # React应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # 学生仪表板
│   │   │   ├── LessonViewer.jsx  # 课程查看器
│   │   │   ├── ExerciseInterface.jsx  # 练习界面
│   │   │   ├── ProgressTracker.jsx    # 进度追踪
│   │   │   └── AdminPanel.jsx        # 管理面板
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Lessons.jsx
│   │   ├── services/
│   │   │   ├── api.js            # API客户端
│   │   │   └── auth.js           # 认证服务
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.local
│
├── docs/
│   ├── API_DOCUMENTATION.md      # API文档
│   ├── DATABASE_SCHEMA.md        # 数据库设计
│   └── DEPLOYMENT_GUIDE.md       # 部署指南
│
└── tests/
    ├── test_adaptive_engine.py
    ├── test_api.py
    └── test_components.py
```

---

## 🔧 完整的Flask后端应用（app.py）

```python
"""
K-12 AI学习平台后端
使用Flask + PostgreSQL + Redis
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
import json
from functools import wraps
import jwt

# 加载环境变量
load_dotenv()

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 启用跨域

# 配置
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'dev-secret-key')
app.config['JSON_SORT_KEYS'] = False

# 导入自适应引擎
from adaptive_learning_engine import (
    AdaptiveLearningEngine, 
    StudentProfile, 
    Subject, 
    GradeLevel,
    LearningSession,
    DifficultyLevel,
    CurriculumManager
)

# 初始化引擎
adaptive_engine = AdaptiveLearningEngine()

# 临时内存数据库（生产环境应使用真实数据库）
students_db = {}
sessions_db = {}

# ============================================
# 认证中间件
# ============================================

def token_required(f):
    """JWT令牌验证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Missing token'}), 401
        
        try:
            token = token.split('Bearer ')[-1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_student_id = data['student_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_student_id, *args, **kwargs)
    return decorated


# ============================================
# API 路由 - 认证
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """注册新学生"""
    data = request.json
    
    # 验证必要字段
    required = ['name', 'grade', 'email', 'password']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # 创建学生档案
    student_id = f"student_{datetime.now().timestamp()}"
    student = StudentProfile(
        student_id=student_id,
        name=data['name'],
        grade=GradeLevel(data['grade']),
        current_subjects=[Subject[s] for s in data.get('subjects', ['MATH', 'SCIENCE'])]
    )
    
    # 保存到数据库
    students_db[student_id] = {
        'profile': student,
        'email': data['email'],
        'password_hash': data['password'],  # 实际应该加密
        'created_at': datetime.now()
    }
    
    # 生成JWT令牌
    token = jwt.encode(
        {
            'student_id': student_id,
            'exp': datetime.utcnow() + timedelta(days=30)
        },
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )
    
    return jsonify({
        'success': True,
        'token': token,
        'student_id': student_id,
        'message': '注册成功！'
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """学生登录"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # 查找学生
    for student_id, student_data in students_db.items():
        if student_data['email'] == email:
            # 实际应验证密码哈希
            if student_data['password_hash'] == password:
                token = jwt.encode(
                    {
                        'student_id': student_id,
                        'exp': datetime.utcnow() + timedelta(days=30)
                    },
                    app.config['SECRET_KEY'],
                    algorithm='HS256'
                )
                
                return jsonify({
                    'success': True,
                    'token': token,
                    'student_id': student_id
                })
    
    return jsonify({'error': 'Invalid credentials'}), 401


# ============================================
# API 路由 - 学生管理
# ============================================

@app.route('/api/student/profile', methods=['GET'])
@token_required
def get_student_profile(current_student_id):
    """获取学生档案"""
    if current_student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404
    
    student_data = students_db[current_student_id]
    student = student_data['profile']
    
    return jsonify({
        'student_id': student.student_id,
        'name': student.name,
        'grade': student.grade.value,
        'subjects': [s.value for s in student.current_subjects],
        'total_points': student.total_points,
        'streak': student.current_streak,
        'mastery_levels': student.subject_mastery
    })


# ============================================
# API 路由 - 日常任务
# ============================================

@app.route('/api/daily-tasks', methods=['GET'])
@token_required
def get_daily_tasks(current_student_id):
    """获取今日任务"""
    if current_student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404
    
    student_data = students_db[current_student_id]
    student = student_data['profile']
    
    # 生成今日任务
    tasks = []
    for i, subject in enumerate(student.current_subjects[:5]):  # 最多5个任务
        topic_count = 0
        rec = adaptive_engine.recommend_next_content(student, subject)
        
        if rec['recommended_topics']:
            topic = rec['recommended_topics'][topic_count % len(rec['recommended_topics'])]
            
            tasks.append({
                'id': f"task_{current_student_id}_{i}",
                'subject': subject.value,
                'topic': topic,
                'description': f'学习{subject.value}: {topic}',
                'difficulty': rec['difficulty'].value,
                'status': 'not-started',
                'duration_minutes': 15 + (i * 3)
            })
    
    return jsonify(tasks)


# ============================================
# API 路由 - 课程生成
# ============================================

@app.route('/api/lessons/generate', methods=['POST'])
@token_required
def generate_lesson(current_student_id):
    """生成自适应课程"""
    data = request.json
    
    if current_student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404
    
    student = students_db[current_student_id]['profile']
    
    try:
        subject = Subject[data['subject'].upper()]
        topic = data['topic']
        difficulty = DifficultyLevel[data.get('difficulty', 'LEVEL_5')]
        
        # 使用自适应引擎生成课程
        # 注意：这需要有效的Claude API密钥
        # lesson = adaptive_engine.generate_adaptive_lesson(
        #     student, subject, topic, difficulty
        # )
        
        # 为演示目的返回模拟数据
        lesson = {
            'title': f'{topic} - {subject.value}',
            'duration_minutes': 15,
            'complexity': 'medium',
            'learning_objectives': [
                f'理解{topic}的基本概念',
                f'掌握{topic}的关键技能',
                f'能够应用{topic}到实际问题'
            ],
            'introduction': f'欢迎学习{topic}！这是一个为你定制的课程。',
            'main_content': f'关于{topic}的详细讲解内容将在这里显示...',
            'examples': [
                {
                    'problem': f'{topic}的示例问题1',
                    'solution': '解答过程...',
                    'explanation': '这个解答是正确的，因为...'
                }
            ],
            'key_concepts': [
                {
                    'term': '关键概念1',
                    'definition': '定义...',
                    'example': '实际例子...'
                }
            ]
        }
        
        return jsonify(lesson)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ============================================
# API 路由 - 练习题
# ============================================

@app.route('/api/exercises/generate', methods=['POST'])
@token_required
def generate_exercises(current_student_id):
    """生成自适应练习题"""
    data = request.json
    
    if current_student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404
    
    student = students_db[current_student_id]['profile']
    
    try:
        subject = Subject[data['subject'].upper()]
        topic = data['topic']
        difficulty = DifficultyLevel[data.get('difficulty', 'LEVEL_5')]
        
        # 使用自适应引擎生成练习
        # exercises = adaptive_engine.generate_adaptive_exercises(
        #     student, subject, topic, difficulty
        # )
        
        # 演示数据
        exercises = [
            {
                'id': f'ex_{i}',
                'type': 'multiple_choice' if i % 2 == 0 else 'short_answer',
                'difficulty': difficulty.value,
                'question': f'{topic}的示例问题{i+1}',
                'options': ['选项A', '选项B', '选项C', '选项D'] if i % 2 == 0 else None,
                'correct_answer': '选项B' if i % 2 == 0 else '答案',
                'explanation': '这是讲解内容...'
            }
            for i in range(5)
        ]
        
        return jsonify(exercises)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ============================================
# API 路由 - 提交答案和评分
# ============================================

@app.route('/api/exercises/submit', methods=['POST'])
@token_required
def submit_answer(current_student_id):
    """提交答案并获取反馈"""
    data = request.json
    
    try:
        exercise_id = data['exercise_id']
        student_answer = data['user_answer']
        correct_answer = data.get('correct_answer', '')
        
        # 简单的评分逻辑（实际应使用AI评分）
        is_correct = student_answer.lower() == correct_answer.lower()
        score = 100 if is_correct else 40
        
        feedback = {
            'exercise_id': exercise_id,
            'is_correct': is_correct,
            'score': score,
            'feedback': '很好！' if is_correct else '再试一次',
            'explanation': f'这是对这个问题的讲解...',
            'learning_suggestion': '相关的学习建议...'
        }
        
        return jsonify(feedback)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ============================================
# API 路由 - 学习进度
# ============================================

@app.route('/api/progress', methods=['GET'])
@token_required
def get_progress(current_student_id):
    """获取学习进度"""
    if current_student_id not in students_db:
        return jsonify({'error': 'Student not found'}), 404
    
    student = students_db[current_student_id]['profile']
    
    progress = {
        'student_id': current_student_id,
        'total_exercises': student.total_exercises_completed,
        'total_points': student.total_points,
        'current_streak': student.current_streak,
        'subject_progress': {}
    }
    
    # 添加各科目进度
    for subject in student.current_subjects:
        key = f"{current_student_id}_{subject.value}"
        subject_progress = adaptive_engine.student_progress_db.get(key)
        
        if subject_progress:
            progress['subject_progress'][subject.value] = {
                'mastery_level': f"{subject_progress.mastery_level:.1f}%",
                'accuracy': f"{subject_progress.accuracy_rate*100:.1f}%",
                'exercises_completed': subject_progress.exercises_attempted
            }
    
    return jsonify(progress)


# ============================================
# API 路由 - 排行榜
# ============================================

@app.route('/api/leaderboard/<subject>', methods=['GET'])
def get_leaderboard(subject):
    """获取科目排行榜"""
    
    leaderboard = []
    for student_id, student_data in students_db.items():
        student = student_data['profile']
        key = f"{student_id}_{subject}"
        
        if key in adaptive_engine.student_progress_db:
            progress = adaptive_engine.student_progress_db[key]
            leaderboard.append({
                'name': student.name,
                'mastery': progress.mastery_level,
                'points': student.total_points
            })
    
    # 按掌握度排序
    leaderboard.sort(key=lambda x: x['mastery'], reverse=True)
    
    return jsonify({
        'subject': subject,
        'leaderboard': leaderboard[:10]  # 前10名
    })


# ============================================
# API 路由 - 健康检查
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'EduAI Learning Platform'
    })


# ============================================
# 错误处理
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ============================================
# 主程序
# ============================================

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("=" * 60)
    print("K-12 AI学习平台后端启动")
    print("=" * 60)
    print(f"API 地址: http://localhost:{port}")
    print(f"开发模式: {debug}")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
```

---

## 🗄️ 数据库设计（PostgreSQL）

如果你想使用真实数据库，运行以下SQL：

```sql
-- 创建学生表
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建科目掌握度表
CREATE TABLE subject_mastery (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    mastery_level FLOAT DEFAULT 50.0,
    exercises_attempted INT DEFAULT 0,
    exercises_correct INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 创建学习会话表
CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    exercises_completed INT,
    accuracy FLOAT,
    time_spent_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 创建练习答案记录
CREATE TABLE exercise_answers (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    exercise_id VARCHAR(100) NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 创建索引
CREATE INDEX idx_student_id ON students(student_id);
CREATE INDEX idx_subject_mastery ON subject_mastery(student_id, subject);
CREATE INDEX idx_sessions_student ON learning_sessions(student_id);
```

---

## 🎯 下一步

### 第1周
- [ ] 完成基础API实现
- [ ] 整合Claude API生成课程
- [ ] 实现基础认证系统
- [ ] 完成前端仪表板UI

### 第2周
- [ ] 实现自适应难度调整
- [ ] 完成练习评分系统
- [ ] 添加用户进度追踪
- [ ] 开发学生报告生成

### 第3周
- [ ] 整合数据库（PostgreSQL）
- [ ] 完成排行榜功能
- [ ] 实现游戏化元素
- [ ] 优化性能

### 第4周+
- [ ] 测试和调试
- [ ] 部署到云端（Heroku/AWS/Vercel）
- [ ] 邀请测试用户
- [ ] 收集反馈和迭代

---

## 📚 有用的资源

### Python/Flask
- [Flask官方文档](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://www.sqlalchemy.org/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)

### React
- [React文档](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Axios HTTP客户端](https://axios-http.com/)

### 部署
- [Heroku部署指南](https://devcenter.heroku.com/)
- [Vercel部署指南](https://vercel.com/docs)
- [AWS部署指南](https://aws.amazon.com/getting-started/)

### AI和教育
- [Claude API文档](https://docs.anthropic.com/)
- [K-12课程标准](https://www.corestandards.org/)
- [自适应学习论文](https://scholar.google.com/)

---

## 💡 提示和最佳实践

### 安全性
```python
# ✅ 正确: 使用环境变量存储敏感信息
API_KEY = os.getenv('ANTHROPIC_API_KEY')

# ❌ 错误: 硬编码敏感信息
API_KEY = "sk-real-key-here"
```

### API调用优化
```python
# ✅ 缓存课程内容以减少API调用
CACHE_TIMEOUT = 3600  # 1小时
cached_lessons = {}

# ✅ 批量生成多个练习题
def generate_bulk_exercises(topics, count=50):
    # 一次API调用生成多个
    pass
```

### 前端最佳实践
```javascript
// ✅ 使用loading状态
const [loading, setLoading] = useState(false);

// ✅ 错误处理
try {
    const data = await fetchLessons();
} catch (error) {
    console.error('Error:', error);
}
```

---

## ❓ 常见问题

**Q: 我需要多少钱来启动这个项目？**
A: 零成本！所有工具都是免费或开源的。只需付费的是Claude API调用（~$50/月用于1000个学生）。

**Q: 能否离线使用？**
A: 可以。预先生成内容并缓存到本地数据库。

**Q: 如何添加新科目？**
A: 编辑`CurriculumManager.CURRICULUM_STANDARDS`并添加新的科目和主题。

**Q: 如何自定义难度级别？**
A: 修改`AdaptiveLearningEngine`中的难度计算逻辑。

---

## 📞 获取帮助

- 查看完整技术文档：`learning_platform_technical_guide.md`
- 查看自适应引擎：`adaptive_learning_engine.py`
- 查看前端代码：`learning_platform_app.jsx`

---

**祝你构建成功！** 🚀

如有问题，请参考docs目录中的详细文档或查看代码注释。
