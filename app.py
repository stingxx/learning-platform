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
        
        # 演示数据
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
        
        # 简单的评分逻辑
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
    port = int(os.getenv('PORT', 5000))
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
