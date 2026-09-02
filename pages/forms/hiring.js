import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const EXPERIENCE_OPTIONS = [
  'Нет опыта',
  'Был в LSCSD',
  'Был в FIB',
  'Был в SANG',
  'Другое'
];

const LAW_KNOWLEDGE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function HiringForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({ fullName: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    experience: '',
    lawKnowledge: '',
    passport: '',
    militaryId: '',
    medical: ''
  });

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/');
          return;
        }
        setUser(data.user);
      });
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data.profile);
        if (data.profile.fullName) {
          setFormData(prev => ({ ...prev, fullName: data.profile.fullName }));
        }
        setLoading(false);
      });
  }, []);

  const isFormValid = () => {
    if (!formData.fullName.trim()) return false;
    if (!formData.age.trim()) return false;
    if (!formData.experience) return false;
    if (!formData.lawKnowledge) return false;
    if (!formData.passport.trim()) return false;
    if (!formData.militaryId.trim()) return false;
    if (!formData.medical.trim()) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert('❌ Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hiring',
          fullName: formData.fullName,
          age: formData.age,
          experience: formData.experience,
          lawKnowledge: formData.lawKnowledge,
          passport: formData.passport,
          militaryId: formData.militaryId,
          medical: formData.medical
        })
      });

      if (res.ok) {
        alert('✅ Заявка на гражданства успешно отправлена!');
        router.push('/dashboard');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      alert('❌ Ошибка при отправке заявки: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <button onClick={() => router.push('/dashboard')} className="back-btn">
        ← Назад к выбору
      </button>
      
      <div className="form-container">
        <h1>📝 Получение гражданства</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО * {profile.fullName && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <input 
              type="text" 
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="Например: Назар Перегонов Андреевич"
              disabled={!!profile.fullName}
              className={profile.fullName ? 'disabled-input' : ''}
            />
          </div>

          <div className="form-group">
            <label>Возраст *</label>
            <input 
              type="text" 
              required
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              placeholder="Например: 25"
            />
          </div>

          <div className="form-group">
            <label>Опыт работы в гос. структурах *</label>
            <select
              required
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="select-input"
            >
              <option value="">-- Выберите вариант --</option>
              {EXPERIENCE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Знание законов RP (1-10) *</label>
            <select
              required
              value={formData.lawKnowledge}
              onChange={(e) => setFormData({...formData, lawKnowledge: e.target.value})}
              className="select-input"
            >
              <option value="">-- Оцените знания --</option>
              {LAW_KNOWLEDGE.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Скриншот паспорта *</label>
            <textarea 
              required
              value={formData.passport}
              onChange={(e) => setFormData({...formData, passport: e.target.value})}
              placeholder="Вставьте ссылку на скриншот паспорта..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Скриншот военного билета *</label>
            <textarea 
              required
              value={formData.militaryId}
              onChange={(e) => setFormData({...formData, militaryId: e.target.value})}
              placeholder="Вставьте ссылку на скриншот военного билета..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Скриншот мед. справок *</label>
            <textarea 
              required
              value={formData.medical}
              onChange={(e) => setFormData({...formData, medical: e.target.value})}
              placeholder="Вставьте ссылку на скриншот медицинских справок..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Discord ID</label>
            <input 
              type="text" 
              value={`${user.username} (${user.id})`}
              disabled 
              className="disabled-input" 
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting || !isFormValid()}
          >
            {submitting ? '⏳ Отправка...' : '📤 Отправить заявку'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .form-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%);
          padding: 30px;
        }
        .back-btn {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s;
          font-size: 14px;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .form-container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        h1 {
          color: white;
          margin-bottom: 30px;
          font-size: 28px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #8b8ba7;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        input, textarea, .select-input {
          width: 100%;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          font-size: 15px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .select-input {
          appearance: none;
          cursor: pointer;
        }
        .select-input option {
          background: #1a1a3e;
          color: white;
        }
        input:focus, textarea:focus, .select-input:focus {
          outline: none;
          border-color: #5865F2;
          background: rgba(255, 255, 255, 0.08);
        }
        .disabled-input {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.03);
        }
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #388E3C;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #0a0a1a;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(88, 101, 242, 0.2);
          border-top-color: #5865F2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-container p {
          color: #8b8ba7;
        }
      `}</style>
    </div>
  );
}
