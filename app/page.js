'use client'; 
import Image from 'next/image';

export default function Home() {
  return (
    <main style={{ backgroundColor: '#1a1a1a', color: '#ffffff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <Image src="/logo.png" alt="Iwamizu Athletic Performance" width={150} height={50} />
        <nav>
          <a href="#home" style={{ margin: '0 10px', color: '#fff', textDecoration: 'none' }}>Home</a>
          <a href="#philosophy" style={{ margin: '0 10px', color: '#fff', textDecoration: 'none' }}>Philosophy</a>
          <a href="#principles" style={{ margin: '0 10px', color: '#fff', textDecoration: 'none' }}>Principles</a>
          <button style={{ marginLeft: '10px', padding: '8px 20px', background: 'transparent', border: '1px solid #fff', color: '#fff', cursor: 'pointer' }}>Apply</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3rem', margin: '20px 0' }}>The Way of Athletic Performance</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', maxWidth: '800px', margin: '0 auto' }}>
          Here at Iwamizu Athletic Performance strength is not built in a single workout. It is forged through disciplined practice, purposeful movement, and relentless refinement.
        </p>
        <button style={{ marginTop: '20px', padding: '15px 40px', background: '#ff0000', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Begin Your Journey</button>
      </section>

      {/* Core Values */}
      <section id="values" style={{ padding: '40px 0', borderTop: '1px solid #333' }}>
        <h2 style={{ textAlign: 'center' }}>Core Values</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
          {[{t:'Continuous Improvement', d:'Small improvements, consistently pursued, create extraordinary results.'}, 
            {t:'Disciplined Training', d:'Strength is earned through deliberate practice and consistency.'}, 
            {t:'Sincerity', d:'Honest coaching. Honest effort. Honest results.'}, 
            {t:'The Way', d:'Training is not an event. It is a lifelong practice.'}].map((val) => (
            <div key={val.t} style={{ width: '220px', background: '#262626', padding: '20px', borderRadius: '8px' }}>
              <h3>{val.t}</h3>
              <p style={{ fontSize: '0.9rem' }}>{val.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coach Philosophy */}
      <section id="philosophy" style={{ padding: '40px 0', backgroundColor: '#262626', textAlign: 'center' }}>
        <h2>Coach Philosophy</h2>
        <p style={{ maxWidth: '700px', margin: '0 auto' }}>
          We believe strength is earned through disciplined practice, refined through intentional coaching, and sustained by lifelong learning. Every session is an opportunity to improve—not only as an athlete, but as a person.
        </p>
      </section>

      {/* The Five Principles */}
      <section id="principles" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h2>The Five Principles</h2>
        <div style={{ marginTop: '20px' }}>
          {[ {t:'Purpose', d:'Every movement has intent.'}, {t:'Precision', d:'Quality before quantity.'}, {t:'Discipline', d:'Consistency beats intensity.'}, {t:'Mastery', d:'Practice never ends.'}, {t:'Legacy', d:'Train for the person you’ll become.'} ].map((p, i) => (
            <div key={p.t}>
              <h3 style={{ margin: '10px 0 0' }}>{p.t}</h3>
              <p style={{ margin: '5px 0' }}>{p.d}</p>
              {i < 4 && <div style={{ color: '#ff0000', margin: '10px 0' }}>⸻</div>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
