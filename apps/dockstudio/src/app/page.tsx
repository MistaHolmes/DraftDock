import { Hero } from "./internalComps/hero";
import { LiquidMetalBackground } from "./internalComps/LiquidMetalBackground";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <LiquidMetalBackground />
      <Hero />
      <Footer />
    </>
  );
}
