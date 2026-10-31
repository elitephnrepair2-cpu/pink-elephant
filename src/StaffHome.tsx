import React from 'react';
import { ArrowUpRight, ArrowRight, Users, FileText, Sparkles, User, Settings, QrCode, Heart } from 'lucide-react';
import './staffTheme.css';

export function StaffHome({ forms, artists, navigate, openQr }: {
  forms: any[]; artists: string[]; navigate: (view: any) => void; openQr: () => void;
}) {
  const waiting = forms.filter(form => !form.isArchived);
  const tattoos = waiting.filter(form => form.type === 'tattoo').length;
  const piercings = waiting.filter(form => ['piercing','minor-piercing'].includes(form.type)).length;
  return <div className="pe-staff-home">
    <header className="pe-staff-greeting">
      <div><span className="pe-staff-eyebrow"><Sparkles size={15} aria-hidden="true" /> BEHIND THE PINK</span><h1>Hey, <em>dream team.</em></h1><p>A little organization. More time for your art.</p></div>
      <div className="pe-staff-mascot"><img src="/assets/pink-elephant-logo.png" alt="The Pink Elephant" /><span>MAKE GOOD THINGS HAPPEN ♡</span></div>
    </header>

    <div className="pe-staff-numbers">
      {[{label:'Tattoo queue',value:tattoos,icon:Sparkles},{label:'Piercing queue',value:piercings,icon:Heart},{label:'Saved waivers',value:forms.length,icon:FileText}].map(({label,value,icon:Icon}) => <div key={label}><span><Icon size={18} aria-hidden="true" />{label}</span><strong>{value}</strong><small>{label === 'Saved waivers' ? 'All saved records' : 'Not yet archived'}</small></div>)}
    </div>

    <div className="pe-staff-main-grid">
      <section className="pe-staff-queue-card">
        <div className="pe-staff-card-top"><span><Users size={19} aria-hidden="true" /> THE STUDIO FLOW</span><span className="pe-staff-count">{waiting.length} in queue</span></div>
        <h2>Let’s make<br /><em>someone’s day.</em></h2>
        <p>Open completed intake forms, review saved documents, and archive finished visits.</p>
        <button type="button" onClick={() => navigate('staff-queue')}>Open staff queue <ArrowRight size={18} aria-hidden="true" /></button>
      </section>

      <section className="pe-staff-qr-card">
        <div className="pe-staff-card-top"><span><QrCode size={19} aria-hidden="true" /> CUSTOMER CHECK-IN</span></div>
        <h2>Less clipboard.<br /><em>More convenience.</em></h2>
        <p>Customers complete their waiver on their own phone. Staff check the physical ID and approve with their dedicated PIN.</p>
        <div className="pe-staff-qr-actions"><a href="/intake" target="_blank" rel="noopener noreferrer">Open customer intake <ArrowUpRight size={16} aria-hidden="true" /></a><button type="button" onClick={openQr}>Show QR <QrCode size={16} aria-hidden="true" /></button></div>
      </section>
    </div>

    <div className="pe-staff-section-label">THE REST OF YOUR TOOLKIT <Sparkles size={15} aria-hidden="true" /></div>
    <div className="pe-staff-tools">
      {[{view:'staff-history',title:'Form history',description:'Find past visits and saved waivers.',icon:FileText}, {view:'staff-artists',title:'Studio artists',description:`Manage your ${artists.length} listed artist${artists.length === 1 ? '' : 's'}.`,icon:User}, {view:'staff-settings',title:'Studio settings',description:'Your workspace, your way.',icon:Settings}].map(({view,title,description,icon:Icon}) => <button key={view} type="button" onClick={() => navigate(view)}><span className="pe-staff-tool-icon"><Icon size={21} aria-hidden="true" /></span><strong>{title}</strong><p>{description}</p><ArrowUpRight className="pe-staff-tool-arrow" size={17} aria-hidden="true" /></button>)}
    </div>
    <footer className="pe-staff-home-footer"><Heart size={13} aria-hidden="true" /> THE PINK ELEPHANT · MADE FOR THE PEOPLE BEHIND THE ART</footer>
  </div>;
}
