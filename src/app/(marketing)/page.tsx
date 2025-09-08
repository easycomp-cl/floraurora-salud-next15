// Ejemplo en una página Next.js/React
import Hero from "../../../src/components/acc-to-page/home/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero imageSrc="/images/terapia-grupal.jpg" onCtaClick={() => {
        window.location.href = "/reservar";
      }} />
    </main>
  );
}

