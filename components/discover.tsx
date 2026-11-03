"use client";

/* eslint-disable @next/next/no-img-element -- Local, pre-optimised WebP artwork; native dimensions preserve layout in the Worker build. */
import {useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent} from 'react';
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Plus, Search, X} from 'lucide-react';
import {Count, Reveal} from './editorial-motion';

type Company = {ticker: string; name: string; sector: string};
type Study = {ticker: string; name: string; title: string; question: string; summary: string; evidence: string; image: string; imageAlt: string; period: string};
const studies: Study[] = [
  {ticker: 'INFY', name: 'Infosys', title: 'Promises, meet performance.', question: 'How did management revenue growth guidance change during FY25?', summary: 'Follow a year of changing expectations. Compare successive management forecasts with the eventual annual outcome.', evidence: 'Curated FY25 forecast tracker, quarterly results and original earnings-call links. The forecasts concern the same annual period.', image: '/images/discover-markets.webp', imageAlt: 'Sculptural translucent green glass towers on an ivory surface', period: 'FY25 · Historical case study'},
  {ticker: 'HCLTECH', name: 'HCLTech', title: 'Beyond the headline number.', question: 'What did management report about operating cash flow and free cash flow?', summary: 'A reported profit is only a starting point. Go deeper into cash generation and the management commentary behind it.', evidence: 'Complete FY24 annual report and Q4 FY25 earnings-call transcript, with searchable PDF pages.', image: '/images/discover-industry.webp', imageAlt: 'Curved brushed metal and dark steel forms in soft architectural light', period: 'FY24–25 · Primary documents'},
  {ticker: 'ASIANPAINT', name: 'Asian Paints', title: 'Follow the cash. Find the context.', question: 'What is operating cash flow and cash conversion? Distinguish standalone and consolidated statements.', summary: 'Look past the narrative and into the original cash-flow statements. An independent investigation beyond the portfolio.', evidence: 'Complete FY25 annual report and Q3 FY25 earnings-call transcript. Research returns dated, page-linked source passages.', image: '/images/discover-evidence.webp', imageAlt: 'Folded sage paper and an emerald glass sphere on an ivory plinth', period: 'FY25 · Independent research'},
];

export function sectorImage(sector: string) {
  return /IT|Bank|Telecom/.test(sector) ? studies[0].image : /Consumer|Pharma/.test(sector) ? studies[2].image : studies[1].image;
}
function tilt(event: PointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.finnMotion === 'off') return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -3}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 3}deg`);
}
function untilt(event: PointerEvent<HTMLButtonElement>) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg');
  event.currentTarget.style.setProperty('--tilt-y', '0deg');
}

function StudyDialog({study, onClose, onResearch}: {study: Study; onClose: () => void; onResearch: (ticker: string, question?: string) => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="study-dialog" aria-labelledby={titleId} onCancel={onClose}>
    <div className="study-dialog-image"><img src={study.image} alt={study.imageAlt} width={1448} height={1086}/><span className="art-label">FINN / RESEARCH STUDY</span></div>
    <div className="study-dialog-copy"><button className="icon-button study-close" aria-label="Close research preview" onClick={onClose}><X size={22}/></button>
      <span className="editorial-kicker">{study.ticker} / {study.period}</span><h2 id={titleId}>{study.title}</h2><p>{study.summary}</p>
      <div className="study-evidence"><span>THE EVIDENCE</span><p>{study.evidence}</p></div>
      <div className="study-question"><span>A QUESTION TO START WITH</span><p>{study.question}</p></div>
      <button className="editorial-button dark" onClick={() => { onClose(); onResearch(study.ticker, study.question); }}>Open {study.name} research <ArrowUpRight size={19}/></button>
      <small>Artwork is illustrative. Financial claims come from linked company disclosures.</small>
    </div>
  </dialog>;
}

export default function Discover({portfolio, onResearch, onNavigate}: {portfolio: Company[]; onResearch: (ticker: string, question?: string) => void; onNavigate: (tab: string) => void}) {
  const [selected, setSelected] = useState<Study | null>(null);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All companies');
  const gallery = useRef<HTMLDivElement>(null);
  const workId = useId();
  const visible = portfolio.filter(company => `${company.ticker} ${company.name} ${company.sector}`.toLowerCase().includes(query.toLowerCase()) && (group === 'All companies' || (group === 'Technology' ? /IT|Telecom/.test(company.sector) : group === 'Consumer' ? /Consumer|Pharma/.test(company.sector) : !/IT|Telecom|Consumer|Pharma/.test(company.sector))));
  const workflow = [
    {title: 'Start with what changed.', text: 'A considered view of your portfolio. Material filings come first, routine disclosures stay in the background, and original sources are always within reach.', action: 'Open your briefing', run: () => onNavigate('Briefing')},
    {title: 'Ask a sharper question.', text: 'Go from an interesting signal to an independent investigation. Search primary annual reports and earnings-call transcripts, one question at a time.', action: 'Investigate Asian Paints', run: () => onResearch('ASIANPAINT', studies[2].question)},
    {title: 'Build a view you can trace.', text: 'Return to the original page. Check the period, the reporting basis and the words management actually used. Missing evidence stays missing.', action: 'Explore source-backed research', run: () => onResearch('HCLTECH', studies[1].question)},
  ];
  return <div className="discover-view">
    <section className="discover-hero" aria-labelledby="discover-title">
      <div className="hero-index"><span className="editorial-kicker">INDEPENDENT THINKING. ORIGINAL SOURCES.</span><span className="edition-mark">FINN / 01</span></div>
      <div className="hero-composition"><div><h1 id="discover-title"><span>A clearer</span><span>point of <em>view.</em></span></h1><div className="hero-actions"><button className="editorial-button dark" onClick={() => onNavigate('Briefing')}>Open your briefing <ArrowUpRight size={19}/></button><a href="#research-edit" className="quiet-link">Explore the research <ArrowDown size={16}/></a></div></div>
        <div className="hero-aside"><span className="small-orbit" aria-hidden="true"><ArrowUpRight strokeWidth={1} size={52}/></span><p>Investment intelligence.<br/>Designed around<br/>what matters.</p><span>Less noise. Better questions.<br/>A view grounded in evidence.</span></div></div>
      <div className="hero-baseline"><span>YOUR INVESTMENT WORKSPACE</span><div><span><Count value={portfolio.length}/> companies</span><span>Primary sources first</span><span className="baseline-live"><i/> Live briefing</span></div><a href="#research-edit" aria-label="Scroll to the research edit"><ArrowDown size={20}/></a></div>
    </section>

    <section className="research-edit" id="research-edit" aria-labelledby="research-edit-title">
      <Reveal className="editorial-section-head"><div><span className="editorial-kicker">01 / THE RESEARCH EDIT</span><h2 id="research-edit-title">A closer look.</h2></div><div><p>Three ways into the evidence.<br/>Choose what makes you curious.</p><div className="gallery-controls"><button className="circle-control" aria-label="Previous research card" onClick={() => gallery.current?.scrollBy({left: -(gallery.current.clientWidth * .85), behavior: document.documentElement.dataset.finnMotion === 'off' ? 'auto' : 'smooth'})}><ArrowLeft size={19}/></button><button className="circle-control" aria-label="Next research card" onClick={() => gallery.current?.scrollBy({left: gallery.current.clientWidth * .85, behavior: document.documentElement.dataset.finnMotion === 'off' ? 'auto' : 'smooth'})}><ArrowRight size={19}/></button></div></div></Reveal>
      <div className="research-gallery" ref={gallery}>
        {studies.map((study, index) => <Reveal className="research-tile" delay={index * 80} key={study.ticker}>
          <button className="study-card" onClick={() => setSelected(study)} onPointerMove={tilt} onPointerLeave={untilt} aria-label={`Preview ${study.name} research`} style={{'--card-index': index} as CSSProperties}>
            <div className="study-art"><img src={study.image} alt={study.imageAlt} width={1448} height={1086} loading={index === 0 ? 'eager' : 'lazy'}/><span className="study-number">0{index + 1}</span><span className="study-open"><ArrowUpRight size={23}/></span><span className="study-hover-label">TAKE A CLOSER LOOK</span></div>
            <div className="study-card-meta"><span>{study.name}</span><span>{study.ticker}</span></div><h3>{study.title}</h3><span className="study-period">{study.period}</span>
          </button>
        </Reveal>)}
      </div>
    </section>

    <Reveal className="workbench-section"><section aria-labelledby="workbench-title" className="workbench-grid"><div className="workbench-title"><span className="editorial-kicker">02 / A MORE CONSIDERED PROCESS</span><h2 id="workbench-title">From signal<br/>to perspective.</h2><p>Good research starts with curiosity.<br/>Great research lets you follow the evidence.</p><div className="process-stamp" aria-hidden="true"><span>f.</span><ArrowUpRight size={28}/></div></div><div className="process-steps">{workflow.map((item, index) => <div className={`process-step ${step === index ? 'is-open' : ''}`} key={item.title}><button aria-expanded={step === index} aria-controls={`${workId}-${index}`} onClick={() => setStep(index)}><span>0{index + 1}</span><h3>{item.title}</h3><Plus size={20}/></button><div className="process-panel" id={`${workId}-${index}`} hidden={step !== index}><p>{item.text}</p><button className="underlined-action" onClick={item.run}>{item.action}<ArrowUpRight size={18}/></button></div></div>)}</div></section></Reveal>

    <section className="universe-section" aria-labelledby="universe-title"><Reveal className="editorial-section-head"><div><span className="editorial-kicker">03 / YOUR FIELD OF VIEW</span><h2 id="universe-title">An interesting universe.</h2></div><p>A diversified mock watchlist.<br/>Your next question can start anywhere.</p></Reveal>
      <div className="universe-toolbar"><div className="universe-filters" role="group" aria-label="Company group">{['All companies', 'Technology', 'Consumer', 'Industry & finance'].map(name => <button key={name} className={group === name ? 'selected' : ''} aria-pressed={group === name} onClick={() => setGroup(name)}>{name}</button>)}</div><label className="universe-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Search the company universe</span><input aria-label="Search the company universe" placeholder="Company or ticker" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
      <div className="universe-grid">{visible.slice(0, 6).map(company => <button key={company.ticker} className="universe-company" onClick={() => onResearch(company.ticker)}><span className="universe-monogram">{company.ticker.slice(0, 2)}</span><span><strong>{company.name}</strong><small>{company.ticker} / {company.sector}</small></span><ArrowUpRight size={19}/></button>)}</div>
      {!visible.length && <p className="universe-empty" role="status">No companies match this view. Try a ticker or another group.</p>}
      <div className="universe-foot"><span>{visible.length} of {portfolio.length} companies in this view</span><button className="underlined-action" onClick={() => onNavigate('Portfolio')}>View the full portfolio <ArrowUpRight size={18}/></button></div>
    </section>

    <Reveal><section className="discover-closing"><span className="editorial-kicker">THE WORLD MOVES. KEEP YOUR PERSPECTIVE.</span><div><h2>Make your next<br/>question count.</h2><button className="closing-arrow" aria-label="Open research workspace" onClick={() => onNavigate('Research')}><ArrowUpRight strokeWidth={1} size={56}/></button></div><p>Original documents. Thoughtful questions. Your own conclusions.</p><span className="wordmark-floor" aria-hidden="true">perspective.</span></section></Reveal>
    {selected && <StudyDialog study={selected} onClose={() => setSelected(null)} onResearch={onResearch}/>}
  </div>;
}
