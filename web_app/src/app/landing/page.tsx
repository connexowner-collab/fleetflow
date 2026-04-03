"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Truck,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
  Zap,
  Globe,
  Star,
  Play,
} from "lucide-react";

// --- Hook para detectar quando elemento entra na viewport ---
function useIntersectionObserver(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// --- Componente: Contador Animado ---
function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useIntersectionObserver(0.5);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

// --- Dados ---
const features = [
  {
    icon: Truck,
    title: "Gestão Completa de Frota",
    description:
      "Cadastre, monitore e controle todos os veículos da sua operação em um único painel. Rastreie status, documentação e histórico completo de cada ativo.",
    color: "from-blue-500/20 to-blue-600/10",
    accent: "#0056B3",
  },
  {
    icon: AlertTriangle,
    title: "Registro de Ocorrências",
    description:
      "Gerencie acidentes, avarias e sinistros com fluxo de aprovação inteligente. Controle de orçamentos, gravidade e responsáveis com rastreabilidade total.",
    color: "from-red-500/20 to-red-600/10",
    accent: "#dc2626",
  },
  {
    icon: ClipboardCheck,
    title: "Checklists Digitais",
    description:
      "Substitua papéis por formulários digitais inteligentes. Auditorias automáticas identificam padrões de não-conformidade antes que virem problemas.",
    color: "from-green-500/20 to-green-600/10",
    accent: "#6AB023",
  },
  {
    icon: Shield,
    title: "Controle de Acessos",
    description:
      "Defina permissões granulares por função. Motoristas, analistas e gestores veem apenas o que precisam, com logs completos de toda atividade.",
    color: "from-purple-500/20 to-purple-600/10",
    accent: "#7c3aed",
  },
  {
    icon: BarChart3,
    title: "Relatórios & Métricas",
    description:
      "Dashboards em tempo real com indicadores críticos da operação. Tome decisões baseadas em dados, não em suposições.",
    color: "from-orange-500/20 to-orange-600/10",
    accent: "#ea580c",
  },
  {
    icon: Users,
    title: "Gestão Multi-Empresa",
    description:
      "Solução SaaS white-label para transportadoras de qualquer porte. Cada empresa com sua identidade visual, seus usuários e suas regras de negócio.",
    color: "from-cyan-500/20 to-cyan-600/10",
    accent: "#0891b2",
  },
];

const testimonials = [
  {
    name: "Marcus Pinheiro",
    role: "Diretor de Operações",
    company: "ViaCargas Transportes",
    text: "Reduzimos em 40% o tempo de tratamento de ocorrências. O fluxo de aprovação de orçamentos é simplesmente perfeito para nossa operação.",
    rating: 5,
    avatar: "MP",
  },
  {
    name: "Juliana Ramos",
    role: "Gerente de Frota",
    company: "LogísticaPro",
    text: "O checklist digital eliminou completamente os papéis. Agora temos rastreabilidade total de cada veículo, em tempo real, de qualquer lugar.",
    rating: 5,
    avatar: "JR",
  },
  {
    name: "Fernando Assis",
    role: "CEO",
    company: "Assis & Associados",
    text: "Implementamos em menos de uma semana. A equipe de onboarding é excelente e o suporte responde rápido. Vale cada centavo.",
    rating: 5,
    avatar: "FA",
  },
];

const plans = [
  {
    name: "Starter",
    price: "R$ 297",
    period: "/mês",
    description: "Para frotas de até 20 veículos",
    features: [
      "Até 20 veículos",
      "5 usuários",
      "Checklists digitais",
      "Registro de ocorrências",
      "Relatórios básicos",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "R$ 697",
    period: "/mês",
    description: "Para operações em crescimento",
    features: [
      "Até 100 veículos",
      "Usuários ilimitados",
      "Tudo do Starter",
      "Aprovações de orçamento",
      "Relatórios avançados",
      "API de integração",
      "Suporte prioritário",
    ],
    cta: "Começar grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Para grandes transportadoras",
    features: [
      "Veículos ilimitados",
      "Multi-empresa (white-label)",
      "Tudo do Professional",
      "SLA garantido",
      "Onboarding dedicado",
      "Manager de conta",
      "Integrações customizadas",
    ],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

// --- Componente Principal ---
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* ===== NAVBAR ===== */}
      <nav
        className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`}
      >
        <div className="landing-container landing-nav__inner">
          {/* Logo */}
          <Link href="/landing" className="landing-logo">
            <div className="landing-logo__icon">
              <img src="/logo_v3.png" alt="FleetFlow" />
            </div>
            <span className="landing-logo__text">
              Fleet<span className="landing-logo__accent">Flow</span>
            </span>
          </Link>

          {/* Links desktop */}
          <div className="landing-nav__links">
            <a href="#features" className="landing-nav__link">
              Funcionalidades
            </a>
            <a href="#stats" className="landing-nav__link">
              Resultados
            </a>
            <a href="#testimonials" className="landing-nav__link">
              Depoimentos
            </a>
            <a href="#pricing" className="landing-nav__link">
              Planos
            </a>
          </div>

          {/* CTAs desktop */}
          <div className="landing-nav__ctas">
            <Link href="/login" className="landing-btn landing-btn--ghost">
              Entrar
            </Link>
            <Link href="/login" className="landing-btn landing-btn--primary">
              Teste Grátis
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            className="landing-nav__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Funcionalidades
            </a>
            <a href="#stats" onClick={() => setMenuOpen(false)}>
              Resultados
            </a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>
              Depoimentos
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              Planos
            </a>
            <Link href="/login" className="landing-btn landing-btn--primary landing-btn--full">
              Começar Grátis
            </Link>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        {/* Background grid decorativo */}
        <div className="landing-hero__bg-grid" aria-hidden />
        <div className="landing-hero__bg-glow-1" aria-hidden />
        <div className="landing-hero__bg-glow-2" aria-hidden />

        <div className="landing-container landing-hero__content">
          {/* Badge */}
          <div className="landing-hero__badge">
            <Zap size={14} />
            <span>Novo · Módulo de Aprovações de Troca v2.0</span>
          </div>

          <h1 className="landing-hero__headline">
            Gestão de Frotas
            <br />
            <span className="landing-hero__headline-accent">
              sem complicação.
            </span>
          </h1>

          <p className="landing-hero__description">
            O FleetFlow centraliza o controle de veículos, ocorrências e
            checklists da sua operação. Reduza riscos, automatize processos
            e tome decisões com dados reais em tempo real.
          </p>

          <div className="landing-hero__actions">
            <Link href="/login" className="landing-btn landing-btn--hero-primary">
              Começar gratuitamente
              <ArrowRight size={18} />
            </Link>
            <a href="#features" className="landing-btn landing-btn--hero-ghost">
              <Play size={16} className="landing-btn__play-icon" />
              Ver como funciona
            </a>
          </div>

          {/* Social proof */}
          <div className="landing-hero__proof">
            <div className="landing-hero__avatars">
              {["JP", "AL", "MR", "CS"].map((init) => (
                <div key={init} className="landing-hero__avatar">
                  {init}
                </div>
              ))}
            </div>
            <p>
              <strong>+850 gestores</strong> já confiam no FleetFlow
            </p>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="landing-hero__preview-wrapper">
          <div className="landing-hero__preview">
            <div className="landing-hero__preview-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="landing-hero__preview-content">
              {/* Mini dashboard mockup */}
              <div className="landing-mockup">
                <div className="landing-mockup__sidebar">
                  <div className="landing-mockup__logo-row">
                    <div className="landing-mockup__logo-dot" />
                    <div className="landing-mockup__logo-text" />
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`landing-mockup__nav-item ${i === 1 ? "landing-mockup__nav-item--active" : ""}`}
                    />
                  ))}
                </div>
                <div className="landing-mockup__main">
                  <div className="landing-mockup__header">
                    <div className="landing-mockup__search" />
                    <div className="landing-mockup__avatar" />
                  </div>
                  <div className="landing-mockup__cards">
                    {[
                      { color: "#0056B3", label: "Veículos", value: "142" },
                      { color: "#dc2626", label: "Ocorrências", value: "18" },
                      { color: "#ca8a04", label: "Pendentes", value: "5" },
                      { color: "#2563eb", label: "Manutenção", value: "11" },
                    ].map((card) => (
                      <div key={card.label} className="landing-mockup__card">
                        <div
                          className="landing-mockup__card-icon"
                          style={{ background: card.color + "20" }}
                        >
                          <div
                            className="landing-mockup__card-dot"
                            style={{ background: card.color }}
                          />
                        </div>
                        <div className="landing-mockup__card-value">
                          {card.value}
                        </div>
                        <div className="landing-mockup__card-label">
                          {card.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="landing-mockup__table">
                    <div className="landing-mockup__table-header" />
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="landing-mockup__table-row">
                        <div className="landing-mockup__table-cell landing-mockup__table-cell--bold" />
                        <div className="landing-mockup__table-cell" />
                        <div
                          className="landing-mockup__table-badge"
                          style={{
                            background:
                              i === 1
                                ? "#fee2e2"
                                : i === 3
                                  ? "#dcfce7"
                                  : "#fef9c3",
                          }}
                        />
                        <div className="landing-mockup__table-cell landing-mockup__table-cell--sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="#features" className="landing-hero__scroll-hint">
          <ChevronDown size={20} />
        </a>
      </section>

      {/* ===== LOGOS BAND ===== */}
      <section className="landing-logos">
        <div className="landing-container">
          <p className="landing-logos__label">
            Confiado por empresas de todos os portes
          </p>
          <div className="landing-logos__row">
            {[
              "ViaCargas",
              "LogísticaPro",
              "TransBrasil",
              "Frota+ Express",
              "RodoNorte",
              "Assis & Associados",
            ].map((name) => (
              <div key={name} className="landing-logos__item">
                <Truck size={16} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="landing-section landing-features">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-section__tag">Funcionalidades</span>
            <h2 className="landing-section__title">
              Tudo que sua frota precisa,
              <br />
              em um só lugar.
            </h2>
            <p className="landing-section__subtitle">
              Desenvolvido especificamente para o mercado de transporte
              brasileiro. Cada módulo resolve um problema real da sua operação.
            </p>
          </div>

          <div className="landing-features__grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="landing-feature-card"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="landing-feature-card__icon-wrap"
                    style={{
                      background: `linear-gradient(135deg, ${f.accent}22, ${f.accent}10)`,
                      border: `1px solid ${f.accent}30`,
                    }}
                  >
                    <Icon size={24} style={{ color: f.accent }} />
                  </div>
                  <h3 className="landing-feature-card__title">{f.title}</h3>
                  <p className="landing-feature-card__desc">{f.description}</p>
                  <div
                    className="landing-feature-card__line"
                    style={{ background: f.accent }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section id="stats" className="landing-stats">
        <div className="landing-stats__bg-decor" aria-hidden />
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-section__tag landing-section__tag--light">
              Resultados reais
            </span>
            <h2 className="landing-section__title landing-section__title--light">
              Números que comprovam
              <br />
              o impacto do FleetFlow.
            </h2>
          </div>
          <div className="landing-stats__grid">
            {[
              {
                value: 850,
                suffix: "+",
                label: "Gestores ativos",
                desc: "na plataforma hoje",
              },
              {
                value: 12400,
                suffix: "+",
                label: "Veículos gerenciados",
                desc: "em todo o Brasil",
              },
              {
                value: 40,
                suffix: "%",
                label: "Redução de tempo",
                desc: "no tratamento de ocorrências",
              },
              {
                value: 98,
                suffix: "%",
                label: "Satisfação",
                desc: "dos clientes nos últimos 12 meses",
              },
            ].map((stat) => (
              <div key={stat.label} className="landing-stat-card">
                <div className="landing-stat-card__value">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="landing-stat-card__label">{stat.label}</div>
                <div className="landing-stat-card__desc">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-section landing-how">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-section__tag">Como funciona</span>
            <h2 className="landing-section__title">
              Do cadastro à operação
              <br />
              em 3 passos simples.
            </h2>
          </div>
          <div className="landing-how__steps">
            {[
              {
                step: "01",
                title: "Configure sua empresa",
                desc: "Cadastre sua transportadora, importe a frota existente e convide os usuários com as permissões certas para cada função.",
                icon: Globe,
              },
              {
                step: "02",
                title: "Ative os módulos",
                desc: "Personalize checklists para seu tipo de frota, defina fluxos de aprovação e configure alertas automáticos de ocorrências.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Opere com controle total",
                desc: "Acompanhe tudo em tempo real pelo dashboard. Receba alertas, aprove orçamentos e gere relatórios com um clique.",
                icon: BarChart3,
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="landing-how__step">
                  <div className="landing-how__step-number">{step.step}</div>
                  {i < 2 && <div className="landing-how__step-connector" />}
                  <div className="landing-how__step-icon-wrap">
                    <Icon size={28} />
                  </div>
                  <h3 className="landing-how__step-title">{step.title}</h3>
                  <p className="landing-how__step-desc">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="landing-section landing-testimonials">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-section__tag">Depoimentos</span>
            <h2 className="landing-section__title">
              Quem usa, recomenda.
            </h2>
          </div>
          <div className="landing-testimonials__grid">
            {testimonials.map((t) => (
              <div key={t.name} className="landing-testimonial-card">
                <div className="landing-testimonial-card__stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill="#f59e0b"
                      stroke="none"
                    />
                  ))}
                </div>
                <blockquote className="landing-testimonial-card__text">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className="landing-testimonial-card__author">
                  <div className="landing-testimonial-card__avatar">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="landing-testimonial-card__name">
                      {t.name}
                    </div>
                    <div className="landing-testimonial-card__role">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="landing-section landing-pricing">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-section__tag">Planos</span>
            <h2 className="landing-section__title">
              Preço justo para
              <br />
              qualquer tamanho de frota.
            </h2>
            <p className="landing-section__subtitle">
              Todos os planos incluem 14 dias de teste gratuito. Sem cartão de
              crédito.
            </p>
          </div>
          <div className="landing-pricing__grid">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`landing-pricing-card ${plan.highlighted ? "landing-pricing-card--highlighted" : ""}`}
              >
                {plan.highlighted && (
                  <div className="landing-pricing-card__badge">
                    Mais popular
                  </div>
                )}
                <div className="landing-pricing-card__name">{plan.name}</div>
                <div className="landing-pricing-card__price">
                  <span className="landing-pricing-card__amount">
                    {plan.price}
                  </span>
                  <span className="landing-pricing-card__period">
                    {plan.period}
                  </span>
                </div>
                <p className="landing-pricing-card__desc">{plan.description}</p>
                <ul className="landing-pricing-card__features">
                  {plan.features.map((f) => (
                    <li key={f} className="landing-pricing-card__feature">
                      <CheckCircle size={15} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`landing-btn landing-btn--full ${plan.highlighted ? "landing-btn--primary" : "landing-btn--outline"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="landing-cta-final">
        <div className="landing-cta-final__bg-glow" aria-hidden />
        <div className="landing-container landing-cta-final__content">
          <h2 className="landing-cta-final__title">
            Pronto para ter controle
            <br />
            total da sua frota?
          </h2>
          <p className="landing-cta-final__subtitle">
            Junte-se a mais de 850 gestores que já evoluíram com o FleetFlow.
            <br />
            Configure em minutos, sem necessidade de TI.
          </p>
          <div className="landing-cta-final__actions">
            <Link href="/login" className="landing-btn landing-btn--hero-primary landing-btn--lg">
              Começar gratuitamente
              <ArrowRight size={18} />
            </Link>
            <p className="landing-cta-final__disclaimer">
              14 dias grátis · Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <Link href="/landing" className="landing-logo">
                <div className="landing-logo__icon">
                  <img src="/logo_v3.png" alt="FleetFlow" />
                </div>
                <span className="landing-logo__text">
                  Fleet<span className="landing-logo__accent">Flow</span>
                </span>
              </Link>
              <p className="landing-footer__tagline">
                Sistema inteligente de gestão de frotas e ocorrências para
                transportadoras brasileiras.
              </p>
            </div>
            <div className="landing-footer__cols">
              <div className="landing-footer__col">
                <h4>Produto</h4>
                <a href="#features">Funcionalidades</a>
                <a href="#pricing">Planos</a>
                <a href="#testimonials">Depoimentos</a>
              </div>
              <div className="landing-footer__col">
                <h4>Empresa</h4>
                <a href="#">Sobre nós</a>
                <a href="#">Blog</a>
                <a href="#">Contato</a>
              </div>
              <div className="landing-footer__col">
                <h4>Legal</h4>
                <a href="#">Termos de Uso</a>
                <a href="#">Privacidade</a>
                <a href="#">LGPD</a>
              </div>
            </div>
          </div>
          <div className="landing-footer__bottom">
            <p>© 2026 FleetFlow. Todos os direitos reservados.</p>
            <p>Feito com excelência no Brasil 🇧🇷</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
