import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <header style={{ padding: '20px 50px' }}>
        <Image 
          src="/logo.png" 
          alt="Iwamizu Athletic Performance" 
          width={150} 
          height={150} 
          priority 
        />
      </header>

      <section id="about" style={{ padding: '40px' }}>
        <h2>About Us</h2>
      </section>
    </main>
  );
}
