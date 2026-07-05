import Image from 'next/image'; // 1. Add this at the very top

export default function Home() {
  return (
    <main>
      <header style={{ padding: '20px 50px' }}>
        {/* 2. Paste the Image component here inside your header */}
        <Image 
          src="/logo.png" 
          alt="Iwamizu Athletic Performance" 
          width={150} 
          height={150} 
          priority 
        />
      </header>

      {/* Your other sections go below here */}
      <section id="about" style={{ padding: '40px' }}>
        <h2>About Us</h2>
      </section>
    </main>
  );
}
