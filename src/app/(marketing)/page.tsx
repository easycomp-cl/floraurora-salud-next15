// Ejemplo en una página Next.js/React
import Hero from "../../../src/components/layout/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero imageSrc="/images/terapia-grupal.jpg" onCtaClick={() => {
        // navega o abre modal
        window.location.href = "/reservar";
      }} />
    </main>
  );
}



/*export default function HomePage() {
  return (
    <main>
    <div className="min-h-screen">
      <p className="text-center text-2xl font-bold mt-20">
        Desarrollar Home 
      </p>
    </div>
    </main>
  );
}*/
