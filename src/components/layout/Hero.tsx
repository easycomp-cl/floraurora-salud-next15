// src/components/layout/Hero.tsx
import React from "react";
import styles from "../hero/Hero.module.css";
import Image from "next/image";
import niceImg from "../Fotos/nice.jpg";

type HeroProps = {
  imageSrc: string;
  onCtaClick?: () => void;
};

export default function Hero( {} : HeroProps) {
  return (
    <section className={styles.hero}>
  <div className={styles.hero__left}>
    <h1 className={styles.hero__title}>FlorAurora <br /> Salud</h1>
    <p className={styles.hero__subtitle}>
      Cuidamos el bienestar de las personas, <br /> desde la raíz
    </p>
    <button className={styles.hero__btn}>Agenda una consulta</button>
  </div>
  <div className={styles.hero__right}>
   <Image
          src={niceImg}  // 👈 usas la variable importada
          alt="Sesión de terapia grupal"
          fill
          style={{ objectFit: "cover" }}
          priority/>
  </div>
</section>
  );
}
