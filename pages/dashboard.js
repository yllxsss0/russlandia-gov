import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const categories = [
  {
    title: '🏛️ Гражданство',
    color: '#4CAF50',
    items: [
      { id: 'hiring', title: 'Получение гражданства', description: 'Подать заявку на получение гражданства НЕЗАВИСИМОГО государства Руссландия', icon: '📝' },
      { id: 'transfer-to-lspd', title: 'Депортация', description: 'Подать заявку на становление помойным выблядком тупорылым', icon: '💩' },
    ]
  },
  {
    title: '📋 Секретариат',
    color: '#2196F3',
    items: [
      { id: 'promotion', title: 'Запрос на повышение', description: 'Подать запрос на повышение', icon: '📈' },
      { id: 'resignation', title: 'Заявление на увольнение', description: 'Подать заявление на увольнение', icon: '🚪' },
      { id: 'leave', title: 'Отпуск', description: 'OOC или IC отпуск', icon: '🏖️' },
      { id: 'weapon-request', title: 'Спец вооружение', description: 'Запрос на получение спец вооружения', icon: '🔫' }
    ]
  },
  {
    title: '🏢 Отделы',
    color: '#FF9800',
    items: [
      { id: 'transfer', title: 'Перевод в отдел', description: 'Перевод в другой отдел LSPD', icon: '🔄' },
      { id: 'report', title: 'Отчёт о повышении', description: 'Отчёт для своего отдела', icon: '📋' }
    ]
  },
  {
    title: '🌟 Старший состав',
    color: '#FF69B4',
    items: [
      { id: 'high-rank-report', title: 'Отчёт на повышение (Хай Ранги)', description: 'Повышение для старшего состава', icon: '🌟' }
    ]
  }
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/'); return; }
      setUser(d.user); setLoading(false);
    });
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) return (
    <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a1a',color:'white' }}>
      <div style={{ width:'50px',height:'50px',border:'4px solid rgba(88,101,242,0.15)',borderTopColor:'#5865F2',borderRadius:'50%',animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)',padding:'30px',color:'white' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:'1200px',margin:'0 auto 30px',padding:'20px',background:'rgba(255,255,255,0.03)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontSize:'28px',margin:0 }}>🏛️ Russlandia Forms</h1>
        <div style={{ display:'flex',alignItems:'center',gap:'12px',color:'#8b8ba7' }}>
          <img 
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
            alt="Avatar" 
            onClick={() => router.push('/profile')}
            style={{ width:'40px',height:'40px',borderRadius:'50%',cursor:'pointer',border:'2px solid transparent',transition:'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#5865F2'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          />
          <button 
            onClick={() => router.push('/profile')} 
            style={{ background:'rgba(88,101,242,0.2)',color:'white',border:'1px solid rgba(88,101,242,0.4)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,101,242,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(88,101,242,0.2)'}
          >
            👤 Профиль
          </button>
          <button 
            onClick={handleLogout} 
            style={{ background:'rgba(220,53,69,0.1)',color:'#ff6b6b',border:'1px solid rgba(220,53,69,0.4)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,53,69,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,53,69,0.1)'}
          >
            Выйти
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'1200px',margin:'0 auto 30px',display:'flex',gap:'15px' }}>
        <div style={{ flex:1,background:'rgba(88,101,242,0.1)',border:'1px solid rgba(88,101,242,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#5865F2' }}>{stats.today}</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Сегодня</div>
        </div>
        <div style={{ flex:1,background:'rgba(76,175,80,0.1)',border:'1px solid rgba(76,175,80,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#4CAF50' }}>{stats.total}</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Всего</div>
        </div>
        <div style={{ flex:1,background:'rgba(255,152,0,0.1)',border:'1px solid rgba(255,152,0,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center',cursor:'pointer' }} onClick={() => router.push('/history')}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#FF9800' }}>📋</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Мои заявки</div>
        </div>
      </div>

      <div style={{ maxWidth:'1200px',margin:'0 auto' }}>
        {categories.map(cat => (
          <div key={cat.title} style={{ marginBottom:'35px' }}>
            <h2 style={{ fontSize:'22px',marginBottom:'20px',paddingBottom:'10px',borderBottom:`2px solid ${cat.color}`,display:'inline-block' }}>
              {cat.title}
            </h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'15px' }}>
              {cat.items.map(item => (
                <div key={item.id} onClick={() => router.push(`/forms/${item.id}`)} 
                  style={{ background:'rgba(255,255,255,0.03)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'25px',cursor:'pointer',textAlign:'center',position:'relative',overflow:'hidden',transition:'all 0.3s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.boxShadow = `0 15px 40px ${cat.color}30`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div style={{ position:'absolute',top:0,left:0,width:'4px',height:'100%',background:cat.color }}></div>
                  <div style={{ fontSize:'36px',marginBottom:'10px' }}>{item.icon}</div>
                  <h3 style={{ fontSize:'16px',marginBottom:'8px' }}>{item.title}</h3>
                  <p style={{ color:'#8b8ba7',fontSize:'13px',margin:0 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
