"""
K-12 AI 自适应学习引擎
=========================================

这是一个完整的自适应学习系统，可以：
1. 跟踪K-12所有年级学生的学习进度
2. 支持数学、科学、文学、社科、艺术等所有科目
3. 根据学生表现实时调整课程难度
4. 生成个性化的学习路径
5. 使用Claude AI生成动态内容

作者：AI Learning Platform Team
版本：1.0
"""

import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import anthropic

# ============================================
# 1. 数据模型定义
# ============================================

class GradeLevel(Enum):
    """K-12年级定义"""
    K = "K"
    G1 = "1"
    G2 = "2"
    G3 = "3"
    G4 = "4"
    G5 = "5"
    G6 = "6"
    G7 = "7"
    G8 = "8"
    G9 = "9"
    G10 = "10"
    G11 = "11"
    G12 = "12"

class Subject(Enum):
    """支持的所有科目"""
    MATH = "数学"
    SCIENCE = "科学"
    LITERATURE = "文学"
    HISTORY = "历史"
    SOCIAL_STUDIES = "社会学"
    ENGLISH = "英语"
    ART = "艺术"
    MUSIC = "音乐"
    PHYSICAL_ED = "体育"
    COMPUTER_SCIENCE = "计算机科学"

class DifficultyLevel(Enum):
    """难度等级"""
    LEVEL_1 = "L1"  # 极简单 (Kindergarten)
    LEVEL_2 = "L2"  # 非常简单
    LEVEL_3 = "L3"  # 简单
    LEVEL_4 = "L4"  # 中等偏简单
    LEVEL_5 = "L5"  # 中等
    LEVEL_6 = "L6"  # 中等偏难
    LEVEL_7 = "L7"  # 困难
    LEVEL_8 = "L8"  # 非常困难
    LEVEL_9 = "L9"  # 高级困难
    LEVEL_10 = "L10"  # 竞赛级难度

@dataclass
class StudentProfile:
    """学生档案"""
    student_id: str
    name: str
    grade: GradeLevel
    current_subjects: List[Subject]
    created_at: datetime = None
    
    # 学习指标
    total_points: int = 0
    current_streak: int = 0
    total_exercises_completed: int = 0
    
    # 科目进度映射：{subject: mastery_level}
    subject_mastery: Dict[str, float] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.subject_mastery is None:
            # 初始化所有科目的掌握度为0.5（50%）
            self.subject_mastery = {
                subject.value: 0.5 for subject in Subject
            }


@dataclass
class LearningSession:
    """学习会话"""
    session_id: str
    student_id: str
    subject: Subject
    topic: str
    difficulty_level: DifficultyLevel
    created_at: datetime = None
    completed_at: Optional[datetime] = None
    
    # 会话结果
    exercises_completed: int = 0
    accuracy: float = 0.0  # 0-1
    time_spent_minutes: int = 0
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


@dataclass
class StudentProgress:
    """学生在某个科目的进度"""
    student_id: str
    subject: Subject
    
    # 掌握度 (0-100)
    mastery_level: float = 50.0
    
    # 学习历史
    exercises_attempted: int = 0
    exercises_correct: int = 0
    accuracy_rate: float = 0.5
    
    # 最近性能指标
    recent_5_accuracy: float = 0.5  # 最近5次练习的准确率
    recent_10_accuracy: float = 0.5  # 最近10次
    
    # 学习速度
    learning_velocity: float = 0.0  # 掌握度增长速率
    
    # 推荐难度
    recommended_difficulty: DifficultyLevel = DifficultyLevel.LEVEL_5
    
    # 弱点主题
    weak_topics: List[str] = None
    strong_topics: List[str] = None
    
    def __post_init__(self):
        if self.weak_topics is None:
            self.weak_topics = []
        if self.strong_topics is None:
            self.strong_topics = []


# ============================================
# 2. 课程库管理系统
# ============================================

class CurriculumManager:
    """
    K-12 课程库管理
    定义了每个年级每个科目的学习路径
    """
    
    # 年级到难度级别的映射
    GRADE_TO_DIFFICULTY = {
        GradeLevel.K: DifficultyLevel.LEVEL_1,
        GradeLevel.G1: DifficultyLevel.LEVEL_2,
        GradeLevel.G2: DifficultyLevel.LEVEL_3,
        GradeLevel.G3: DifficultyLevel.LEVEL_3,
        GradeLevel.G4: DifficultyLevel.LEVEL_4,
        GradeLevel.G5: DifficultyLevel.LEVEL_4,
        GradeLevel.G6: DifficultyLevel.LEVEL_5,
        GradeLevel.G7: DifficultyLevel.LEVEL_5,
        GradeLevel.G8: DifficultyLevel.LEVEL_6,
        GradeLevel.G9: DifficultyLevel.LEVEL_6,
        GradeLevel.G10: DifficultyLevel.LEVEL_7,
        GradeLevel.G11: DifficultyLevel.LEVEL_8,
        GradeLevel.G12: DifficultyLevel.LEVEL_8,
    }
    
    # 科目课程标准（精简版本，实际项目应包含完整的标准）
    CURRICULUM_STANDARDS = {
        Subject.MATH: {
            GradeLevel.K: ["数字和计数", "基本形状", "大小比较"],
            GradeLevel.G1: ["加法和减法(1-20)", "数字和值", "时间和金钱"],
            GradeLevel.G2: ["两位数加减法", "测量", "数据和图表"],
            GradeLevel.G3: ["乘法和除法", "分数基础", "面积和周长"],
            GradeLevel.G4: ["多位数运算", "分数比较", "小数基础"],
            GradeLevel.G5: ["小数运算", "分数运算", "比例和比率"],
            GradeLevel.G6: ["有理数", "代数表达式", "比例"],
            GradeLevel.G7: ["整数", "一次方程", "不等式"],
            GradeLevel.G8: ["二次方程", "指数", "毕达哥拉斯定理"],
            GradeLevel.G9: ["函数", "二次函数", "根和无理数"],
            GradeLevel.G10: ["多项式", "有理函数", "三角函数"],
            GradeLevel.G11: ["指数和对数", "序列和级数", "组合数学"],
            GradeLevel.G12: ["微积分预备", "矩阵", "复数"],
        },
        Subject.SCIENCE: {
            GradeLevel.K: ["生物特征", "地球特征", "简单物理"],
            GradeLevel.G1: ["生活周期", "天气", "力和运动"],
            GradeLevel.G2: ["植物和动物", "地球变化", "光和声"],
            GradeLevel.G3: ["栖息地", "岩石和土壤", "磁性"],
            GradeLevel.G4: ["食物链", "天体", "能量"],
            GradeLevel.G5: ["物质属性", "水循环", "天气系统"],
            GradeLevel.G6: ["细胞", "遗传学基础", "地球系统"],
            GradeLevel.G7: ["细胞生物学", "进化", "地质学"],
            GradeLevel.G8: ["分子生物学", "物理学原理", "化学基础"],
            GradeLevel.G9: ["生物学", "化学", "地球科学"],
            GradeLevel.G10: ["化学", "物理学", "生物学深化"],
            GradeLevel.G11: ["AP化学", "AP物理", "AP生物"],
            GradeLevel.G12: ["AP微积分物理", "高级化学", "AP环境科学"],
        },
        Subject.LITERATURE: {
            GradeLevel.K: ["字母和声音", "简单故事", "诗歌"],
            GradeLevel.G1: ["基础阅读", "字母发音", "简单词汇"],
            GradeLevel.G2: ["分级读物", "故事元素", "字典技能"],
            GradeLevel.G3: ["章节书", "主题和细节", "推理能力"],
            GradeLevel.G4: ["文学分析", "写作风格", "目录和索引"],
            GradeLevel.G5: ["古典儿童文学", "体裁分析", "比喻语言"],
            GradeLevel.G6: ["现代文学", "角色分析", "叙事结构"],
            GradeLevel.G7: ["莎士比亚入门", "诗歌分析", "论文写作"],
            GradeLevel.G8: ["莎士比亚深化", "古代文学", "批评性阅读"],
            GradeLevel.G9: ["世界文学", "现代小说", "修辞分析"],
            GradeLevel.G10: ["美国文学", "文学流派", "深度论文"],
            GradeLevel.G11: ["英国文学", "创意写作", "研究论文"],
            GradeLevel.G12: ["当代文学", "文学理论", "高级研究"],
        },
        Subject.HISTORY: {
            GradeLevel.K: ["社区", "家族", "节日"],
            GradeLevel.G1: ["基本时间概念", "美国象征", "知名美国人"],
            GradeLevel.G2: ["邻近地区", "美国地理", "美国节日"],
            GradeLevel.G3: ["州政府", "州历史", "地图技能"],
            GradeLevel.G4: ["地区历史", "美国地理", "自然资源"],
            GradeLevel.G5: ["美国早期历史", "原住民", "殖民地"],
            GradeLevel.G6: ["古代文明", "中世纪", "文艺复兴"],
            GradeLevel.G7: ["美国独立", "美国内战", "工业革命"],
            GradeLevel.G8: ["美国历史深化", "全球冲突", "20世纪"],
            GradeLevel.G9: ["世界历史", "文明兴衰", "现代中东"],
            GradeLevel.G10: ["欧洲历史", "世界大战", "冷战"],
            GradeLevel.G11: ["美国历史AP", "政治历史", "社会运动"],
            GradeLevel.G12: ["世界历史AP", "比较文明", "当代全球问题"],
        },
    }
    
    @classmethod
    def get_curriculum_for_student(cls, student: StudentProfile) -> Dict:
        """获取学生应该学习的课程"""
        curriculum = {}
        for subject in student.current_subjects:
            if subject in cls.CURRICULUM_STANDARDS:
                topics = cls.CURRICULUM_STANDARDS[subject].get(student.grade, [])
                curriculum[subject.value] = topics
        return curriculum
    
    @classmethod
    def get_grade_appropriate_difficulty(cls, grade: GradeLevel) -> DifficultyLevel:
        """获取年级对应的基础难度"""
        return cls.GRADE_TO_DIFFICULTY.get(grade, DifficultyLevel.LEVEL_5)


# ============================================
# 3. 自适应学习引擎（核心）
# ============================================

class AdaptiveLearningEngine:
    """
    自适应学习引擎
    
    这是整个系统的心脏，负责：
    1. 根据学生表现调整难度
    2. 追踪学生掌握度
    3. 生成个性化学习路径
    4. 推荐下一个最优学习内容
    """
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key="your-api-key")
        self.student_progress_db = {}  # {student_id + subject: StudentProgress}
        self.session_history = []
    
    # ============ 核心算法 ============
    
    def calculate_mastery_level(
        self, 
        exercises_correct: int,
        exercises_attempted: int,
        recent_accuracy: float,
        time_factor: float = 1.0
    ) -> float:
        """
        计算掌握度 (0-100)
        
        公式：
        Mastery = (准确率 × 0.6) + (最近性能 × 0.3) + (时间因子 × 0.1)
        """
        if exercises_attempted == 0:
            return 50.0
        
        overall_accuracy = exercises_correct / exercises_attempted
        mastery = (overall_accuracy * 0.6) + (recent_accuracy * 0.3) + (time_factor * 0.1)
        return min(100.0, max(0.0, mastery * 100))
    
    def calculate_recommended_difficulty(
        self,
        current_accuracy: float,
        mastery_level: float,
        current_difficulty: DifficultyLevel
    ) -> DifficultyLevel:
        """
        根据表现推荐难度
        
        规则：
        - 准确率 > 85% & 掌握度 > 75% → 增加难度
        - 准确率 < 60% & 掌握度 < 50% → 降低难度
        - 否则 → 保持当前难度
        """
        all_difficulties = [d for d in DifficultyLevel]
        current_index = all_difficulties.index(current_difficulty)
        
        if current_accuracy > 0.85 and mastery_level > 75:
            # 学生表现优秀，提高难度
            if current_index < len(all_difficulties) - 1:
                return all_difficulties[current_index + 1]
        elif current_accuracy < 0.60 and mastery_level < 50:
            # 学生需要更多基础练习，降低难度
            if current_index > 0:
                return all_difficulties[current_index - 1]
        
        return current_difficulty
    
    def calculate_learning_velocity(
        self,
        mastery_changes: List[float]
    ) -> float:
        """
        计算学习速度（掌握度增长率）
        
        用于检测学生是否在进步
        """
        if len(mastery_changes) < 2:
            return 0.0
        
        # 使用线性回归计算趋势
        n = len(mastery_changes)
        x_mean = sum(range(n)) / n
        y_mean = sum(mastery_changes) / n
        
        numerator = sum((i - x_mean) * (mastery_changes[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return 0.0
        
        velocity = numerator / denominator
        return velocity
    
    def identify_weak_topics(
        self,
        session_history: List[LearningSession],
        recent_count: int = 20
    ) -> List[str]:
        """
        识别学生的弱点主题
        
        分析最近的N个会话，找出准确率最低的主题
        """
        recent_sessions = session_history[-recent_count:]
        
        topic_accuracy = {}
        for session in recent_sessions:
            if session.exercises_completed > 0:
                if session.topic not in topic_accuracy:
                    topic_accuracy[session.topic] = []
                topic_accuracy[session.topic].append(session.accuracy)
        
        # 计算每个主题的平均准确率
        topic_avg_accuracy = {
            topic: sum(accs) / len(accs)
            for topic, accs in topic_accuracy.items()
        }
        
        # 返回准确率最低的3个主题
        weak_topics = sorted(
            topic_avg_accuracy.items(),
            key=lambda x: x[1]
        )[:3]
        
        return [topic for topic, _ in weak_topics]
    
    def identify_strong_topics(
        self,
        session_history: List[LearningSession],
        recent_count: int = 20
    ) -> List[str]:
        """
        识别学生的强点主题
        """
        recent_sessions = session_history[-recent_count:]
        
        topic_accuracy = {}
        for session in recent_sessions:
            if session.exercises_completed > 0:
                if session.topic not in topic_accuracy:
                    topic_accuracy[session.topic] = []
                topic_accuracy[session.topic].append(session.accuracy)
        
        topic_avg_accuracy = {
            topic: sum(accs) / len(accs)
            for topic, accs in topic_accuracy.items()
        }
        
        # 返回准确率最高的3个主题
        strong_topics = sorted(
            topic_avg_accuracy.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return [topic for topic, _ in strong_topics]
    
    # ============ 学生追踪 ============
    
    def update_student_progress(
        self,
        session: LearningSession,
        student: StudentProfile
    ) -> StudentProgress:
        """
        根据学习会话更新学生进度
        """
        key = f"{session.student_id}_{session.subject.value}"
        
        if key not in self.student_progress_db:
            self.student_progress_db[key] = StudentProgress(
                student_id=session.student_id,
                subject=session.subject
            )
        
        progress = self.student_progress_db[key]
        
        # 更新练习统计
        progress.exercises_attempted += session.exercises_completed
        correct_count = int(session.exercises_completed * session.accuracy)
        progress.exercises_correct += correct_count
        progress.accuracy_rate = progress.exercises_correct / max(1, progress.exercises_attempted)
        
        # 更新最近性能
        # 这里简化处理，实际应维护一个历史数组
        progress.recent_5_accuracy = session.accuracy * 0.7 + progress.recent_5_accuracy * 0.3
        progress.recent_10_accuracy = session.accuracy * 0.5 + progress.recent_10_accuracy * 0.5
        
        # 计算新的掌握度
        progress.mastery_level = self.calculate_mastery_level(
            progress.exercises_correct,
            progress.exercises_attempted,
            progress.recent_5_accuracy
        )
        
        # 推荐新的难度
        progress.recommended_difficulty = self.calculate_recommended_difficulty(
            session.accuracy,
            progress.mastery_level,
            session.difficulty_level
        )
        
        # 识别弱点和强点
        self.session_history.append(session)
        progress.weak_topics = self.identify_weak_topics(self.session_history)
        progress.strong_topics = self.identify_strong_topics(self.session_history)
        
        # 更新学生档案的掌握度
        student.subject_mastery[session.subject.value] = progress.mastery_level / 100.0
        
        return progress
    
    # ============ 推荐系统 ============
    
    def recommend_next_content(
        self,
        student: StudentProfile,
        subject: Subject
    ) -> Dict:
        """
        为学生推荐下一个学习内容
        
        考虑因素：
        1. 学生的当前掌握度
        2. 弱点主题
        3. 年级标准课程
        4. 学习进度
        """
        key = f"{student.student_id}_{subject.value}"
        progress = self.student_progress_db.get(key)
        
        curriculum = CurriculumManager.get_curriculum_for_student(student)
        available_topics = curriculum.get(subject.value, [])
        
        recommendation = {
            "subject": subject.value,
            "recommended_topics": [],
            "difficulty": DifficultyLevel.LEVEL_5,
            "reasoning": ""
        }
        
        if progress:
            # 优先推荐弱点主题
            if progress.weak_topics:
                weak_available = [t for t in progress.weak_topics if t in available_topics]
                recommendation["recommended_topics"].extend(weak_available[:2])
                recommendation["reasoning"] = f"优先学习弱点领域: {', '.join(weak_available[:2])}"
            
            # 推荐难度
            recommendation["difficulty"] = progress.recommended_difficulty
        else:
            # 新学生，从基础开始
            recommendation["recommended_topics"] = available_topics[:3]
            recommendation["difficulty"] = CurriculumManager.get_grade_appropriate_difficulty(student.grade)
            recommendation["reasoning"] = "新学生，从基础课程开始"
        
        # 如果推荐主题不足，补充其他话题
        if len(recommendation["recommended_topics"]) < 3:
            other_topics = [t for t in available_topics if t not in recommendation["recommended_topics"]]
            recommendation["recommended_topics"].extend(other_topics[:3-len(recommendation["recommended_topics"])])
        
        return recommendation
    
    # ============ AI驱动的内容生成 ============
    
    def generate_adaptive_lesson(
        self,
        student: StudentProfile,
        subject: Subject,
        topic: str,
        difficulty: DifficultyLevel
    ) -> Dict:
        """
        使用Claude AI生成自适应课程
        
        自动调整：
        - 语言复杂度（根据年级）
        - 例子和比喻（根据兴趣）
        - 深度和速度（根据掌握度）
        """
        
        grade_name = student.grade.value if student.grade != GradeLevel.K else "幼儿园"
        difficulty_desc = {
            DifficultyLevel.LEVEL_1: "极其简单，适合刚开始学习",
            DifficultyLevel.LEVEL_3: "简单，适合初学者",
            DifficultyLevel.LEVEL_5: "中等，标准课程",
            DifficultyLevel.LEVEL_7: "困难，需要更深的理解",
            DifficultyLevel.LEVEL_9: "高级困难，适合高级学习者",
        }
        
        prompt = f"""
        为{grade_name}年级学生创建关于"{topic}"的{subject.value}课程。
        
        学生信息：
        - 年级: {grade_name}
        - 学科: {subject.value}
        - 主题: {topic}
        - 难度级别: {difficulty.value} ({difficulty_desc.get(difficulty, '中等')})
        - 学生掌握度: {student.subject_mastery.get(subject.value, 0.5)*100:.0f}%
        
        要求：
        1. 根据年级调整语言复杂度
        2. 如果掌握度低，从基础开始；如果掌握度高，深化内容
        3. 使用符合年级的例子和比喻
        4. 包含10-15个关键学习点
        5. 提供2-3个完整的例题讲解
        
        返回JSON格式:
        {{
            "title": "课程标题",
            "duration_minutes": 数字,
            "complexity": "简单|中等|困难",
            "learning_objectives": ["目标1", "目标2", ...],
            "introduction": "课程介绍",
            "main_content": "详细讲解内容",
            "examples": [
                {{"problem": "问题", "solution": "解答", "explanation": "为什么这是对的"}}
            ],
            "key_concepts": [
                {{"term": "术语", "definition": "定义", "example": "日常例子"}}
            ],
            "summary": "课程总结",
            "transition_to_practice": "过渡到练习的说明"
        }}
        """
        
        message = self.client.messages.create(
            model="claude-opus-4-6",
            max_tokens=3000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        import json
        response_text = message.content[0].text
        # 清理JSON
        lesson_data = json.loads(response_text)
        return lesson_data
    
    def generate_adaptive_exercises(
        self,
        student: StudentProfile,
        subject: Subject,
        topic: str,
        difficulty: DifficultyLevel,
        student_progress: Optional[StudentProgress] = None
    ) -> Dict:
        """
        生成自适应练习题
        
        根据学生的掌握度生成：
        - 合适难度的题目
        - 多样的题型
        - 针对弱点的额外题目
        """
        
        num_questions = {
            DifficultyLevel.LEVEL_1: 3,
            DifficultyLevel.LEVEL_3: 5,
            DifficultyLevel.LEVEL_5: 6,
            DifficultyLevel.LEVEL_7: 8,
            DifficultyLevel.LEVEL_9: 10,
        }.get(difficulty, 6)
        
        weak_topics_info = ""
        if student_progress and student_progress.weak_topics:
            weak_topics_info = f"学生的弱点主题: {', '.join(student_progress.weak_topics)}"
        
        prompt = f"""
        为{student.grade.value if student.grade != GradeLevel.K else '幼儿园'}年级学生生成{num_questions}道{subject.value}练习题。
        
        主题: {topic}
        难度: {difficulty.value}
        {weak_topics_info}
        
        要求：
        1. 题目类型多样化：
           - 30% 选择题
           - 30% 填空/短答
           - 40% 应用/综合题
        
        2. 如果学生有弱点领域，针对性地设计3-4道题
        
        3. 每道题目包含：
           - 清晰的题目文本
           - 难度标记
           - 标准答案
           - 详细讲解
           - 常见错误分析
           - 相关学习提示
        
        4. 确保题目顺序从容易到难
        
        返回JSON数组格式
        """
        
        message = self.client.messages.create(
            model="claude-opus-4-6",
            max_tokens=3500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        import json
        response_text = message.content[0].text
        exercises_data = json.loads(response_text)
        return exercises_data
    
    def generate_intelligent_feedback(
        self,
        question: str,
        student_answer: str,
        correct_answer: str,
        question_type: str,
        student_grade: GradeLevel,
        previous_similar_errors: List[str] = None
    ) -> Dict:
        """
        使用Claude AI生成智能反馈
        
        反馈内容包括：
        - 答案是否正确
        - 错误分析
        - 学习建议
        - 相关概念
        """
        
        prompt = f"""
        评估这个学生的答案：
        
        题目: {question}
        题目类型: {question_type}
        学生答案: {student_answer}
        标准答案: {correct_answer}
        学生年级: {student_grade.value if student_grade != GradeLevel.K else '幼儿园'}
        {f'之前犯过的相似错误: {previous_similar_errors}' if previous_similar_errors else ''}
        
        返回JSON:
        {{
            "is_correct": true/false,
            "score": 0-100,
            "immediate_feedback": "对答案的直接反馈（1-2句话）",
            "explanation": "详细讲解为什么这是正确/错误的",
            "why_student_may_be_wrong": "学生可能的思维误区（如果错误）",
            "learning_suggestion": "改进建议",
            "related_concept": "需要复习的相关概念",
            "next_step": "下一步学习建议",
            "encouragement": "根据学生表现的激励语言"
        }}
        """
        
        message = self.client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        import json
        response_text = message.content[0].text
        feedback_data = json.loads(response_text)
        return feedback_data
    
    # ============ 学习分析 ============
    
    def generate_weekly_report(
        self,
        student: StudentProfile
    ) -> Dict:
        """
        生成学生周学习报告
        """
        
        report = {
            "student_name": student.name,
            "week_ending": datetime.now().strftime("%Y-%m-%d"),
            "subjects_studied": {},
        }
        
        for subject in student.current_subjects:
            key = f"{student.student_id}_{subject.value}"
            progress = self.student_progress_db.get(key)
            
            if progress:
                report["subjects_studied"][subject.value] = {
                    "mastery_level": f"{progress.mastery_level:.1f}%",
                    "accuracy_rate": f"{progress.accuracy_rate*100:.1f}%",
                    "exercises_completed": progress.exercises_attempted,
                    "weak_topics": progress.weak_topics,
                    "strong_topics": progress.strong_topics,
                    "recommended_focus": progress.weak_topics[0] if progress.weak_topics else "复习"
                }
        
        return report
    
    def recommend_intervention(
        self,
        student: StudentProfile,
        subject: Subject
    ) -> Optional[Dict]:
        """
        检测学生是否需要额外帮助
        
        如果学生在某个科目的表现：
        - 掌握度 < 30%（严重不足）
        - 最近准确率 < 40%（持续困难）
        - 学习速度为负（在退步）
        
        则推荐干预
        """
        key = f"{student.student_id}_{subject.value}"
        progress = self.student_progress_db.get(key)
        
        if not progress:
            return None
        
        if progress.mastery_level < 30 or progress.recent_5_accuracy < 0.4:
            return {
                "intervention_type": "additional_support_needed",
                "subject": subject.value,
                "reason": "学生在此科目遇到困难",
                "recommendations": [
                    "增加基础练习",
                    "放慢学习速度",
                    "提供更多一对一反馈",
                    "简化题目难度"
                ],
                "urgency": "high"
            }
        
        return None


# ============================================
# 4. 使用示例
# ============================================

def main():
    """演示自适应学习引擎的使用"""
    
    # 创建引擎
    engine = AdaptiveLearningEngine()
    
    # 创建学生
    student = StudentProfile(
        student_id="student_001",
        name="李明",
        grade=GradeLevel.G6,
        current_subjects=[Subject.MATH, Subject.SCIENCE, Subject.LITERATURE]
    )
    
    print("=" * 60)
    print("K-12 自适应学习引擎演示")
    print("=" * 60)
    
    # 1. 获取课程
    print("\n1. 学生的课程标准:")
    curriculum = CurriculumManager.get_curriculum_for_student(student)
    for subject, topics in curriculum.items():
        print(f"   {subject}: {topics[:3]}...")  # 只显示前3个
    
    # 2. 推荐内容
    print("\n2. 为数学推荐学习内容:")
    rec = engine.recommend_next_content(student, Subject.MATH)
    print(f"   推荐主题: {rec['recommended_topics']}")
    print(f"   推荐难度: {rec['difficulty'].value}")
    print(f"   理由: {rec['reasoning']}")
    
    # 3. 生成课程（注意：需要有效的API密钥）
    print("\n3. 生成自适应课程...")
    # lesson = engine.generate_adaptive_lesson(
    #     student, 
    #     Subject.MATH, 
    #     "分数基础",
    #     DifficultyLevel.LEVEL_4
    # )
    # print(f"   课程标题: {lesson['title']}")
    # print(f"   时长: {lesson['duration_minutes']}分钟")
    
    # 4. 模拟学习会话
    print("\n4. 模拟学习会话:")
    session = LearningSession(
        session_id="session_001",
        student_id="student_001",
        subject=Subject.MATH,
        topic="分数基础",
        difficulty_level=DifficultyLevel.LEVEL_4,
        exercises_completed=6,
        accuracy=0.83,  # 83% 准确率
        time_spent_minutes=18
    )
    
    progress = engine.update_student_progress(session, student)
    print(f"   掌握度: {progress.mastery_level:.1f}%")
    print(f"   准确率: {progress.accuracy_rate*100:.1f}%")
    print(f"   推荐难度: {progress.recommended_difficulty.value}")
    
    # 5. 周报告
    print("\n5. 生成周报告:")
    report = engine.generate_weekly_report(student)
    print(f"   学生: {report['student_name']}")
    print(f"   学习科目: {list(report['subjects_studied'].keys())}")
    
    print("\n=" * 60)
    print("演示完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
