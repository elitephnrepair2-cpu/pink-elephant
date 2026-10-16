import React, { useState } from 'react';
import { ArrowUpRight, Heart, Instagram, Sparkles, Flower2, Hand, Waves, Gem } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import './waitingRoom.css';

const INSTAGRAM = 'https://www.instagram.com/thepinkelephantparlorhtx/';
const CARE = {
  tattoo: {
    source: 'https://eadv.org/wp-content/uploads/2023/04/EADV-TATTOO-Tattoo-Aftercare.pdf',
    credit: 'European Academy of Dermatology and Venereology',
    tips: [
      { icon: Hand, title: 'Clean hands first', text: 'Wash your hands before caring for your new tattoo.' },
      { icon: Heart, title: 'Let it heal', text: 'Skip the picking and scratching. Let flakes come away naturally.' },
      { icon: Waves, title: 'Save the swim', text: 'Avoid swimming, baths, and saunas until your tattoo has healed.' },
    ],
  },
  piercing: {
    source: 'https://safepiercing.org/aftercare/',
    credit: 'Association of Professional Piercers',
    tips: [
      { icon: Hand, title: 'Clean hands first', text: 'Wash your hands before cleaning or touching your piercing.' },
      { icon: Gem, title: 'No twists, please', text: 'Leave healing jewelry alone. Don’t spin, twist, or rotate it.' },
      { icon: Waves, title: 'Save the swim', text: 'Avoid submerging your healing piercing in pools, lakes, or hot tubs.' },
    ],
  },
};

// Public, static content only. This component never requests customer records.
export function WaitingRoom() {
  const [careType, setCareType] = useState<'tattoo' | 'piercing'>('tattoo');
  const care = CARE[careType];
  return <div className="pe-welcome">
    <div className="pe-welcome-wrap">
      <header className="pe-welcome-header">
        <a href="/welcome" aria-label="The Pink Elephant welcome screen" className="pe-brand">
          <img src="/assets/pink-elephant-logo.png" alt="" />
          <span>THE PINK ELEPHANT<small>TATTOOS · PIERCINGS · HOUSTON</small></span>
        </a>
        <span className="pe-header-note"><Heart size={14} aria-hidden="true" /> A little bold. A little pink. All you.</span>
      </header>

      <main>
        <section className="pe-hello" aria-labelledby="pe-hello-title">
          <div className="pe-hello-copy">
            <span className="pe-eyebrow"><Sparkles size={15} aria-hidden="true" /> MAKE YOURSELF AT HOME</span>
            <h1 id="pe-hello-title">Your next little<br /><em>obsession</em> starts here.</h1>
            <p>New ink, a little sparkle, or something entirely you.<br className="pe-desktop-break" /> We’re so glad you’re here.</p>
            <div className="pe-checkin"><span><Heart size={17} aria-hidden="true" /></span><p><strong>First things first: say hi at the front desk.</strong><br />We’ll help you get checked in and settled.</p></div>
          </div>
          <div className="pe-mascot" aria-hidden="true">
            <span className="pe-mascot-halo" />
            <Flower2 className="pe-flower pe-flower-one" size={58} strokeWidth={1} />
            <Sparkles className="pe-flower pe-flower-two" size={38} strokeWidth={1.3} />
            <img src="/assets/pink-elephant-logo.png" alt="" />
            <span className="pe-mascot-caption">a little self-expression looks good on you ♡</span>
          </div>
        </section>

        <div className="pe-good-stuff"><span>WHILE YOU GET COMFY</span><Flower2 size={20} strokeWidth={1.3} aria-hidden="true" /><span>A FEW LITTLE THINGS FOR YOU</span></div>

        <div className="pe-welcome-cards">
          <section className="pe-social" aria-labelledby="pe-social-title">
            <div className="pe-card-kicker"><Instagram size={20} aria-hidden="true" /><span>LET’S STAY IN TOUCH</span><Heart size={19} aria-hidden="true" /></div>
            <h2 id="pe-social-title">Your feed could<br />use a little <em>pink.</em></h2>
            <p>Fresh work, studio moments, and a little inspiration for your next visit.</p>
            <div className="pe-social-bottom">
              <div className="pe-qr"><QRCodeCanvas value={INSTAGRAM} size={100} bgColor="#ffffff" fgColor="#502237" level="M" marginSize={2} /><span>SCAN TO FOLLOW</span></div>
              <div className="pe-social-link"><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Follow along <ArrowUpRight size={17} aria-hidden="true" /></a><span>@thepinkelephantparlorhtx</span></div>
            </div>
          </section>

          <section className="pe-care" aria-labelledby="pe-care-title">
            <div className="pe-card-kicker"><Flower2 size={21} aria-hidden="true" /><span>A LITTLE TLC GOES A LONG WAY</span></div>
            <div className="pe-care-heading"><h2 id="pe-care-title">Love it. <em>Care for it.</em></h2>
              <div className="pe-care-tabs" role="group" aria-label="Choose aftercare reminders">
                <button type="button" aria-pressed={careType === 'tattoo'} onClick={() => setCareType('tattoo')}>Tattoo</button>
                <button type="button" aria-pressed={careType === 'piercing'} onClick={() => setCareType('piercing')}>Piercing</button>
              </div>
            </div>
            <div className="pe-care-tips">
              {care.tips.map(({ icon: Icon, title, text }) => <div className="pe-care-tip" key={title}><span><Icon size={19} strokeWidth={1.6} aria-hidden="true" /></span><div><h3>{title}</h3><p>{text}</p></div></div>)}
            </div>
            <p className="pe-care-note">These are quick reminders. Ask your artist or piercer for your full, procedure-specific aftercare instructions.</p>
            <a className="pe-care-source" href={care.source} target="_blank" rel="noopener noreferrer">More aftercare guidance <ArrowUpRight size={13} aria-hidden="true" /><span className="sr-only"> from {care.credit}</span></a>
          </section>
        </div>
      </main>

      <footer className="pe-welcome-footer"><span>COME AS YOU ARE. LEAVE A LITTLE MORE YOU.</span><span><Heart size={13} aria-hidden="true" /> THE PINK ELEPHANT</span></footer>
    </div>
  </div>;
}
