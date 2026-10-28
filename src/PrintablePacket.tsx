import React from 'react';
import { ClipboardCheck } from 'lucide-react';
// Keep the original consent print layout; batch printing only separates customers.
export function PrintablePacket({ clients }: { clients: Record<string, any>[] }) {
  return <>{clients.map(client => <article className="packet" key={client.id}>
    <ConsentPage client={client} />
  </article>)}</>;
}

const ConsentPage = ({ client }: { client: any }) => {
  if (!client) return null;
  const isMinor = client.type === 'minor-piercing';

  return (
    <div className="consent-page w-full bg-white p-4 sm:p-8 text-black font-serif text-[11px] leading-snug min-h-[100vh]">
      <div className="max-w-4xl mx-auto border-2 border-black p-6">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white p-2">
              <ClipboardCheck size={20} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tighter leading-none">THE Pink Elephant</h1>
              <p className="text-[8px] font-bold tracking-[0.4em] uppercase border-t border-b border-black py-0.5 mt-0.5">Piercing & Tattoo Parlor</p>
            </div>
          </div>
          <h2 className="text-base font-bold mt-1 uppercase underline mb-0">
            {client.type.replace('-', ' ')} consent and release form
          </h2>
        </div>

        {/* Legal Text */}
        <div className="text-[9px] mb-2 space-y-1 leading-tight">
          <p className="font-bold">PLEASE READ:</p>
          {client.type === 'tattoo' ? (
            <>
              <p>You are hereby notified of the possible risks and dangers associated with the application of each tattoo. These risks and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-8 space-y-1">
                <li>the possibility of discomfort or pain;</li>
                <li>the permanence of the markings;</li>
                <li>the risk of infection; and</li>
                <li>the possibility of allergic reaction to the pigments or other materials used.</li>
              </ol>
            </>
          ) : isMinor ? (
            <div className="space-y-4">
              <p>I acknowledge by signing this release form that I hereby release THE PINK ELEPHANT and it's employees and agents from all manner of liabilities, claims, actions, and demands, in law or in equity, which I or my heirs have or might have now or hereafter by reason of complying with my requests to pierce my child.</p>
              <p>I certify that I am the parent or legal guardian of the minor receiving the piercing. I agree that I will assume all responsibility for any medical, legal, or other situation resulting from my request to pierce my child. I understand that I must remain in the presence of this minor during piercing procedures.</p>
              <p>I understand that my child will be pierced using appropriate instruments and techniques.</p>
              <p>I understand that this type of piercing usually takes <span className="underline font-bold px-2">{client.healingTime || '________'}</span> or longer to heal.</p>
            </div>
          ) : (
            <>
              <p>You are hereby notified of the possible risks and dangers associated with receiving a body piercing. These risk and dangers include, but are not limited to, at least the following:</p>
              <ol className="list-decimal ml-8 space-y-1">
                <li>The possibility of discomfort or pain;</li>
                <li>The possibility of scarring;</li>
                <li>The possibility of bleeding;</li>
                <li>The possibility of swelling;</li>
                <li>The risk of infection;</li>
                <li>The possibility of nerve damage; and</li>
                <li>The increased risk of adolescents during certain stages of development.</li>
              </ol>
            </>
          )}

          <p className="text-center font-bold border-t border-b border-black py-1 my-2">
            NO PERSON MAY BE {client.type === 'tattoo' ? 'TATTOOED' : 'PIERCED'} WHO APPEARS TO BE UNDER THE INFLUENCE OF ALCOHOL OR DRUGS
          </p>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-2">
          <div className="border-b border-black pb-0.5"><strong>Name:</strong> {client.name || client.minorName}</div>
          <div className="border-b border-black pb-0.5"><strong>Date:</strong> {client.submissionDate}</div>
          <div className="border-b border-black pb-0.5"><strong>Address:</strong> {client.address}</div>
          <div className="border-b border-black pb-0.5"><strong>Phone#:</strong> {client.phone}</div>
          <div className="col-span-2 grid grid-cols-3 gap-4">
            <div className="border-b border-black pb-0.5"><strong>City:</strong> {client.city}</div>
            <div className="border-b border-black pb-0.5"><strong>State:</strong> {client.state}</div>
            <div className="border-b border-black pb-0.5"><strong>Zip:</strong> {client.zip}</div>
          </div>
          {isMinor && (
            <>
              <div className="border-b border-black pb-0.5"><strong>Parent/Guardian:</strong> {client.parentGuardianName}</div>
              <div className="border-b border-black pb-0.5"><strong>Relation:</strong> {client.relationToMinor}</div>
            </>
          )}
        </div>

        {/* Acknowledgement */}
        <div className="font-bold mb-1 uppercase text-[8px] text-center">
          I have received a copy of applicable written care instructions and I have read and understand such written care instructions.
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-6 mb-2">
          <div className="border-t border-black pt-1">
            <img src={client.signature || client.adultSignature} className="max-h-10 mix-blend-multiply mb-0.5 object-contain" />
            <p className="text-[8px] uppercase font-bold">Signature (Client/Guardian)</p>
          </div>
          {isMinor && (
            <div className="border-t border-black pt-1">
              <img src={client.minorSignature} className="max-h-10 mix-blend-multiply mb-0.5 object-contain" />
              <p className="text-[10px] uppercase font-bold">Minor Signature</p>
            </div>
          )}
        </div>

        {/* Artist Box */}
        <div className="border-2 border-black p-2 mb-2">
          <h3 className="text-xs font-black uppercase mb-1 text-center">To be completed by the studio artist:</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[9px]">
            <div className="border-b border-slate-300"><strong>Artist Name:</strong> {client.artistName || '________________'}</div>
            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Tattoo' : 'Piercing'} price:</strong> {client.price || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Client\'s Age:</strong> {client.clientAge || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Client\'s DOB:</strong> {client.clientDOB || '________________'}</div>
            <div className="col-span-2 border-b border-slate-300"><strong>Type of valid identification provided:</strong> {client.idType || '________________'}</div>
            <div className="col-span-2 border-b border-slate-300"><strong>Location of {client.type}:</strong> {client.location || '________________'}</div>

            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Color(s)' : 'Jewelry'} used:</strong> {client.colorsUsed || client.jewelryUsed || '________________'}</div>
            <div className="border-b border-slate-300"><strong>Catalogue #:</strong> {client.catalogueNumber || '________________'}</div>
            <div className="border-b border-slate-300"><strong>{client.type === 'tattoo' ? 'Color(s)' : 'Jewelry'} used:</strong> ________________</div>
            <div className="border-b border-slate-300"><strong>Catalogue #:</strong> ________________</div>
          </div>
        </div>

        <div className="text-[9px] leading-tight italic text-slate-600">
          {client.type === 'tattoo' ? (
            <p>An artist may not tattoo a person younger than 18 years of age without meeting the requirements of 25 Texas Administration Code, §229.406(d), whose parent or guardian determines it to be in the best interest of the minor child to cover an existing tattoo.</p>
          ) : (
            <p>This document was electronically signed and verified through The Pink Elephant Consent System. Digital Reference ID: {client.id}</p>
          )}
        </div>
      </div>

      {/* Original identification grid: no separate attachment or signature pages. */}
      <div className="mt-1 border-t-2 border-black pt-1 print-id-section" style={{ breakInside: 'avoid' }}>
        <h3 className="text-[10px] font-bold mb-1 uppercase text-center">Identification Verification</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Primary ID (Front)', client.idPhotoFront || client.idPhoto || client.guardianIdPhotoFront || client.guardianIdPhoto],
            ['Primary ID (Back / Barcode)', client.idPhotoBack || client.guardianIdPhotoBack],
            ['Minor ID', client.minorIdPhoto],
            ['Minor Birth Certificate', client.minorBirthCert],
          ].filter(([, source]) => source).map(([label, source]) => <div key={label} className="text-center" style={{ breakInside: 'avoid' }}>
            <p className="text-[8px] font-bold uppercase mb-0.5">{label}</p>
            <img src={source} alt={label} className="mx-auto border-2 border-black shadow-md object-contain max-h-[250px] print:max-h-[500px]" style={{ pageBreakInside: 'avoid' }} />
          </div>)}
        </div>
      </div>

    </div>
  );
};
