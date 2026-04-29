import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function LearningPlatform() {
  // ================== 状态管理 ==================
  
  // 认证状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // 页面状态
  const [currentView, setCurrentView] = useState('auth');
  
  // 认证表单状态
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    grade: '6'
  });
  
  // 学习状态
  const [selectedSubject, setSelectedSubject] = useState('MATH');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [curriculum, setCurriculum] = useState({});
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseAnswer, setExerciseAnswer] = useState('');
  const [exerciseFeedback, setExerciseFeedback] = useState(null);
  
  // 进度状态
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ================== 认证相关 ==================

  const handleRegister = async () => {
    if (!authForm.name || !authForm.email || !authForm.password || !authForm.grade) {
      setError('请填写所有字段');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          grade: authForm.grade
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '注册失败');
        return;
      }

      setAuthToken(data.token);
      setCurrentUser({
        id: data.user_id,
        name: data.name,
        grade: data.grade
      });
      setIsLoggedIn(true);
      setCurrentView('home');
      setAuthForm({ name: '', email: '', password: '', grade: '6' });
    } catch (err) {
      setError(`注册错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      setError('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '登录失败');
        return;
      }

      setAuthToken(data.token);
      setCurrentUser({
        id: data.user_id,
        name: data.name,
        grade: data.grade
      });
      setIsLoggedIn(true);
      setCurrentView('home');
      setAuthForm({ name: '', email: '', password: '', grade: '6' });
    } catch (err) {
      setError(`登录错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView('auth');
    setAuthForm({ name: '', email: '', password: '', grade: '6' });
  };

  const loadCurriculum = async () => {
    if (!authToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/curriculum/recommend`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const data = await response.json();
      if (response.ok) {
        setCurriculum(data.curriculum);
      }
    } catch (err) {
      setError(`加载课程错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLesson = async () => {
    if (!authToken || !selectedTopic) {
      setError('请选择一个主题');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/lesson/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          difficulty: 'LEVEL_5'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '生成课程失败');
        return;
      }

      setCurrentLesson(data);
      setCurrentView('lesson');
    } catch (err) {
      setError(`生成课程错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExercise = async () => {
    if (!authToken || !selectedTopic) {
      setError('请选择一个主题');
      return;
    }

    setIsLoading(true);
    setError('');
    setExerciseFeedback(null);
    setExerciseAnswer('');
    
    try {
      const response = await fetch(`${API_URL}/api/exercise/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: selectedTopic,
          difficulty: 'LEVEL_5',
          type: 'multiple_choice'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '生成练习题失败');
        return;
      }

      setCurrentExercise(data);
      setCurrentView('exercise');
    } catch (err) {
      setError(`生成练习题错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitExerciseAnswer = async () => {
    if (!authToken || !currentExercise || !exerciseAnswer) {
      setError('请输入答案');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/exercise/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          exercise_id: currentExercise.exercise_id,
          answer: exerciseAnswer
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '提交答案失败');
        return;
      }

      setExerciseFeedback(data);
      
      setProgress(prev => ({
        ...prev,
        total_points: data.total_points,
        exercises_completed: data.total_exercises_completed
      }));
    } catch (err) {
      setError(`提交答案错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URL}/api/progress`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const data = await response.json();
      if (response.ok) {
        setProgress(data);
      }
    } catch (err) {
      console.error('加载进度错误:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && currentView === 'home') {
      loadCurriculum();
      loadProgress();
    }
  }, [isLoggedIn, currentView]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}>
        <h1 style={{ textAlign: 'center', color: '#667eea' }}>K-12 AI 学习平台</h1>
        
        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setAuthMode('login')}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px',
              background: authMode === 'login' ? '#667eea' : '#ddd',
              color: authMode === 'login' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            登录
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            style={{ 
              padding: '10px 20px',
              background: authMode === 'register' ? '#667eea' : '#ddd',
              color: authMode === 'register' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            注册
          </button>
        </div>

        {authMode === 'register' && (
          <div style={{ marginBottom: '10px' }}>
            <label>
              姓名:
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
                placeholder="输入你的名字"
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <label>
            邮箱:
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              placeholder="输入你的邮箱"
            />
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            密码:
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              placeholder="输入你的密码"
            />
          </label>
        </div>

        {authMode === 'register' && (
          <div style={{ marginBottom: '20px' }}>
            <label>
              年级:
              <select
                value={authForm.grade}
                onChange={(e) => setAuthForm({ ...authForm, grade: e.target.value })}
                style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
              >
                <option value="K">幼儿园</option>
                <option value="1">一年级</option>
                <option value="2">二年级</option>
                <option value="3">三年级</option>
                <option value="4">四年级</option>
                <option value="5">五年级</option>
                <option value="6">六年级</option>
                <option value="7">七年级</option>
                <option value="8">八年级</option>
                <option value="9">九年级</option>
                <option value="10">十年级</option>
                <option value="11">十一年级</option>
                <option value="12">十二年级</option>
              </select>
            </label>
          </div>
        )}

        <button
          onClick={authMode === 'login' ? handleLogin : handleRegister}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
        </button>
      </div>
    );
  }

  if (currentView === 'home') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>欢迎, {currentUser?.name}!</h1>
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            退出登录
          </button>
        </div>

        {progress && (
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>你的学习进度</h3>
            <p>总积分: <strong>{progress.total_points}</strong></p>
            <p>完成练习: <strong>{progress.exercises_completed}</strong></p>
            <p>准确率: <strong>{progress.accuracy_rate}</strong></p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {['MATH', 'SCIENCE', 'LITERATURE'].map(subject => (
            <button
              key={subject}
              onClick={() => {
                setSelectedSubject(subject);
                setCurrentView('curriculum');
              }}
              style={{
                padding: '30px',
                background: selectedSubject === subject ? '#667eea' : '#ddd',
                color: selectedSubject === subject ? 'white' : 'black',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              {subject === 'MATH' ? '数学' : subject === 'SCIENCE' ? '科学' : '文学'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentView('curriculum')}
          style={{
            padding: '15px 30px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          开始学习
        </button>
      </div>
    );
  }

  if (currentView === 'curriculum') {
    const topics = ['分数', '小数', '百分比', '代数基础', '几何基础'];

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
        <button
          onClick={() => setCurrentView('home')}
          style={{ marginBottom: '20px', padding: '10px 20px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← 返回首页
        </button>

        <h2>{selectedSubject === 'MATH' ? '数学' : selectedSubject === 'SCIENCE' ? '科学' : '文学'} 课程</h2>

        <div style={{ marginBottom: '20px' }}>
          <h3>选择主题:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {topics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: '15px',
                  background: selectedTopic === topic ? '#667eea' : '#ddd',
                  color: selectedTopic === topic ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={generateLesson}
            disabled={!selectedTopic || isLoading}
            style={{
              padding: '12px 30px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? '生成中...' : '📖 学习课程'}
          </button>

          <button
            onClick={generateExercise}
            disabled={!selectedTopic || isLoading}
            style={{
              padding: '12px 30px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? '生成中...' : '✏️ 做练习题'}
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'lesson' && currentLesson) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
        <button
          onClick={() => {
            setCurrentView('curriculum');
            setCurrentLesson(null);
          }}
          style={{ marginBottom: '20px', padding: '10px 20px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← 返回选题
        </button>

        <h1>{currentLesson.title}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          难度: {currentLesson.difficulty} | 时长: {currentLesson.duration_minutes}分钟
        </p>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>学习目标</h3>
          <ul>
            {currentLesson.learning_objectives.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
          {currentLesson.content}
        </div>

        <button
          onClick={generateExercise}
          style={{
            padding: '15px 30px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✏️ 做练习题检验学习
        </button>
      </div>
    );
  }

  if (currentView === 'exercise' && currentExercise) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
        <button
          onClick={() => {
            setCurrentView('curriculum');
            setCurrentExercise(null);
            setExerciseAnswer('');
            setExerciseFeedback(null);
          }}
          style={{ marginBottom: '20px', padding: '10px 20px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← 返回选题
        </button>

        <h2>练习题</h2>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>题目</h3>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>{currentExercise.question}</p>

          {currentExercise.type === 'multiple_choice' ? (
            <div>
              <h4>选择你的答案:</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {currentExercise.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = exerciseAnswer === letter;
                  return (
                    <button
                      key={idx}
                      onClick={() => setExerciseAnswer(letter)}
                      style={{
                        padding: '15px',
                        background: isSelected ? '#667eea' : '#fff',
                        color: isSelected ? 'white' : 'black',
                        border: `2px solid ${isSelected ? '#667eea' : '#ddd'}`,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '16px'
                      }}
                    >
                      <strong>{letter}.</strong> {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h4>请输入你的答案:</h4>
              <textarea
                value={exerciseAnswer}
                onChange={(e) => setExerciseAnswer(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  boxSizing: 'border-box'
                }}
                placeholder="输入你的答案..."
              />
            </div>
          )}
        </div>

        {!exerciseFeedback && (
          <button
            onClick={submitExerciseAnswer}
            disabled={!exerciseAnswer || isLoading}
            style={{
              padding: '15px 30px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '判卷中...' : '✓ 提交答案'}
          </button>
        )}

        {exerciseFeedback && (
          <div style={{
            background: exerciseFeedback.is_correct ? '#d4edda' : '#f8d7da',
            color: exerciseFeedback.is_correct ? '#155724' : '#721c24',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {exerciseFeedback.is_correct ? '✓ 答案正确!' : '✗ 答案错误'}
            </h3>
            <p><strong>得分:</strong> {exerciseFeedback.score}分</p>
            
            <button
              onClick={() => {
                setCurrentExercise(null);
                setExerciseAnswer('');
                setExerciseFeedback(null);
                setCurrentView('curriculum');
              }}
              style={{
                marginTop: '20px',
                padding: '12px 30px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              继续学习
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
