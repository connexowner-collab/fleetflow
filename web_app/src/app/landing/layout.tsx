import type { Metadata } from "next";
import "./landing.css";

export const metadata: Metadata = {
  title: "FleetFlow — Gestão de Frotas Inteligente para Transportadoras",
  description:
    "O FleetFlow centraliza o controle de veículos, ocorrências e checklists da sua operação. Reduza riscos, automatize processos e tome decisões com dados reais em tempo real.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
