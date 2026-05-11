'use client';
import { useState } from 'react';

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'◉', href:'/dashboard' },
  { id:'orders',    label:'Orders',          icon:'▦', href:'/orders' },
  { id:'artwork',   label:'Artwork Library', icon:'◈', href:'/artwork' },
  { id:'studio',    label:'Design Studio',   icon:'✦', href:'/studio' },
  { id:'billing',   label:'Billing',         icon:'◎', href:'/billing' },
  { id:'messages',  label:'Messages',        icon:'✉', href:'/messages' },
  { id:'settings',  label:'Settings',        icon:'⚙', href:'/settings' },
];

const INVOICES = [
  { id:'INV-093', amount:342.00, issued:'May 10, 2026', due:'Jun 9, 2026',  status:'pending', items:[{desc:'24x T-Shirts, Front Print',qty:24,price:10.50},{desc:'Setup fee',qty:1,price:90.00}] },
  { id:'INV-091', amount:180.00, issued:'Apr 10, 2026', due:'May 10, 2026', status:'overdue', items:[{desc:'36x Jerseys, Name+Number',qty:36,price:5.00}] },
  { id:'INV-087', amount:480.00, issued:'Mar 2, 2026',  due:'Apr 1, 2026',  status:'paid',    items:[{desc:'60x T-Shirts, 2-color print',qty:60,price:8.00}] },
  { id:'INV-082', amount:240.00, issued:'Jan 15, 2026', due:'Feb 14, 2026', status:'paid',    items:[{desc:'24x Hoodies, Full Back',qty:24,price:10.00}] },
];

const STATUS = {
  pending: { bg:'#fef3c7', color:'#92400e', label:'Pending' },
  overdue: { bg:'#fee2e2', color:'#991b1b', label:'Overdue' },
  paid:    { bg:'#d1fae5', color:'#065f46', label:'Paid' },
};

const VENMO_HANDLE = 'SandAScreenPrinting';
const ZELLE_EMAIL  = 'billing@sascreenprinting.com';
const ZELLE_PHONE  = '(973) 555-0100';

export default function BillingPage() {
  const [viewing, setViewing]     = useState(null);
  const [payModal, setPayModal]   = useState(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote]         = useState({ description:'', qty:'', notes:'' });
  const [quoteSent, setQuoteSent] = useState(false);
  const [copied, setCopied]       = useState('');

  const outstanding = INVOICES.filter(i => i.status !== 'paid').reduce((s,i) => s+i.amount, 0);
  const paid        = INVOICES.filter(i => i.status === 'paid').reduce((s,i) => s+i.amount, 0);

  function sendQuote() {
    setQuoteSent(true);
    setTimeout(() => { setShowQuote(false); setQuoteSent(false); setQuote({description:'',qty:'',notes:''}); }, 2500);
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  function venmoLink(inv) {
    const note = encodeURIComponent(`Invoice ${inv.id} — S&A Screen Printing`);
    return `venmo://paycharge?txn=pay&recipients=${VENMO_HANDLE}&amount=${inv.amount.toFixed(2)}&note=${note}`;
  }

  function venmoWebLink(inv) {
    const note = encodeURIComponent(`Invoice ${inv.id} — S&A Screen Printing`);
    return `https://venmo.com/${VENMO_HANDLE}?txn=pay&amount=${inv.amount.toFixed(2)}&note=${note}`;
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f0', fontFamily:'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width:'220px', background:'#EFEDE8', display:'flex', flexDirection:'column', padding:'28px 20px', position:'fixed', height:'100vh', justifyContent:'space-between' }}>
        <div>
          <div style={{ marginBottom:'32px' }}>
            <img src="/Logoblack.png" alt="S&A" style={{ width:'110px' }}/>
          </div>
          <div style={{ marginBottom:'36px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'700', fontSize:'18px', marginBottom:'12px' }}>R</div>
            <div style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a1a' }}>Riverside Youth</div>
            <div style={{ fontSize:'12px', color:'#aaa' }}>Sports</div>
          </div>
          <nav style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
            {NAV.map(item => {
              const isActive = item.id === 'billing';
              return (
                <a key={item.id} href={item.href}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', textDecoration:'none', background:isActive?'#1a1a1a':'transparent', color:isActive?'white':'#666', fontSize:'13px', fontWeight:isActive?'600':'400' }}>
                  <span style={{ fontSize:'16px' }}>{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
        <a href="/" style={{ display:'block', padding:'8px 12px', color:'#666', fontSize:'12px', textDecoration:'none', textAlign:'center' }}>Sign Out</a>
      </div>

      {/* Main */}
      <div style={{ flex:1, marginLeft:'220px', padding:'36px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
          <div>
            <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#1a1a1a', margin:'0 0 4px' }}>Billing</h1>
            <p style={{ fontSize:'14px', color:'#aaa', margin:0 }}>Your invoices and payment history</p>
          </div>
          <button onClick={() => setShowQuote(true)}
            style={{ padding:'10px 20px', background:'#1a1a1a', color:'white', borderRadius:'10px', fontSize:'13px', fontWeight:'600', border:'none', cursor:'pointer' }}>
            + Request a Quote
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
          {[
            { label:'Outstanding Balance', value:`$${outstanding.toFixed(2)}`, color:outstanding>0?'#dc2626':'#059669', sub:`${INVOICES.filter(i=>i.status!=='paid').length} unpaid` },
            { label:'Paid to Date',        value:`$${paid.toFixed(2)}`,        color:'#059669', sub:`${INVOICES.filter(i=>i.status==='paid').length} invoices` },
            { label:'Total Invoices',      value:String(INVOICES.length),      color:'#1a1a1a', sub:'All time' },
          ].map(stat => (
            <div key={stat.label} style={{ background:'white', borderRadius:'12px', padding:'20px', border:'1px solid #e5e5e5' }}>
              <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{stat.label}</div>
              <div style={{ fontSize:'26px', fontWeight:'700', color:stat.color, marginBottom:'4px' }}>{stat.value}</div>
              <div style={{ fontSize:'12px', color:'#aaa' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Invoices */}
        <div style={{ background:'white', borderRadius:'14px', padding:'22px', border:'1px solid #e5e5e5', marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a1a', marginBottom:'16px', marginTop:0 }}>Your Invoices</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {INVOICES.map(inv => {
              const st = STATUS[inv.status];
              return (
                <div key={inv.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', background:'#f9fafb', borderRadius:'10px', border:`1px solid #e5e5e5`, gap:'16px', ...(inv.status==='overdue'?{borderLeft:'3px solid #dc2626'}:{}) }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <span style={{ fontSize:'14px', fontWeight:'700', color:'#1a1a1a' }}>{inv.id}</span>
                      <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 8px', borderRadius:'20px', background:st.bg, color:st.color }}>{st.label}</span>
                      {inv.status==='overdue' && <span style={{ fontSize:'11px', color:'#dc2626', fontWeight:'600' }}>⚠ Overdue</span>}
                    </div>
                    <div style={{ fontSize:'13px', color:'#6b7280' }}>Issued {inv.issued} · Due {inv.due}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ fontSize:'20px', fontWeight:'700', color:'#1a1a1a' }}>${inv.amount.toFixed(2)}</div>
                    {inv.status !== 'paid' && (
                      <button onClick={() => setPayModal(inv)}
                        style={{ padding:'7px 14px', background:'#059669', color:'white', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
                        Pay Now
                      </button>
                    )}
                    <button onClick={() => setViewing(inv)}
                      style={{ padding:'7px 14px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap' }}>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment info */}
        <div style={{ background:'white', borderRadius:'14px', padding:'22px', border:'1px solid #e5e5e5' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a1a', marginBottom:'14px', marginTop:0 }}>How to Pay</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
            {[
              { icon:'💙', label:'Venmo', detail:`@${VENMO_HANDLE}`, action:() => window.open(venmoWebLink({ id:'', amount:0 }), '_blank') },
              { icon:'💜', label:'Zelle', detail:ZELLE_EMAIL, action:() => copyToClipboard(ZELLE_EMAIL, 'zelle') },
              { icon:'🏦', label:'Bank Transfer', detail:'Contact us for routing info', action:null },
              { icon:'✉', label:'Questions?', detail:'info@sascreenprinting.com', action:null },
            ].map(m => (
              <div key={m.label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:'#f9fafb', borderRadius:'10px', border:'1px solid #e5e5e5' }}>
                <span style={{ fontSize:'22px' }}>{m.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a1a' }}>{m.label}</div>
                  <div style={{ fontSize:'12px', color:'#6b7280' }}>{m.detail}</div>
                </div>
                {m.action && (
                  <button onClick={m.action}
                    style={{ padding:'5px 12px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'6px', fontSize:'11px', fontWeight:'600', cursor:'pointer' }}>
                    {m.label==='Zelle' && copied==='zelle' ? 'Copied!' : 'Open'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pay Now modal */}
      {payModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'32px', maxWidth:'440px', width:'100%', position:'relative' }}>
            <button onClick={() => setPayModal(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f3f4f6', border:'none', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px' }}>✕</button>
            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Invoice {payModal.id}</div>
              <div style={{ fontSize:'32px', fontWeight:'800', color:'#1a1a1a' }}>${payModal.amount.toFixed(2)}</div>
              <div style={{ fontSize:'13px', color:'#dc2626', fontWeight:'600', marginTop:'4px' }}>
                {payModal.status === 'overdue' ? '⚠ Payment Overdue' : `Due ${payModal.due}`}
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px' }}>
              {/* Venmo */}
              <a href={venmoLink(payModal)}
                onClick={e => { e.preventDefault(); window.open(venmoWebLink(payModal), '_blank'); }}
                style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', background:'#3D95CE', borderRadius:'12px', textDecoration:'none', cursor:'pointer' }}>
                <div style={{ width:'36px', height:'36px', background:'white', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>💙</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:'700', color:'white' }}>Pay with Venmo</div>
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>@{VENMO_HANDLE}</div>
                </div>
                <span style={{ marginLeft:'auto', color:'white', fontSize:'18px' }}>→</span>
              </a>

              {/* Zelle */}
              <div style={{ padding:'16px', background:'#6B2FA0', borderRadius:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
                  <div style={{ width:'36px', height:'36px', background:'white', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>💜</div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'white' }}>Pay with Zelle</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>Open your bank app → Send with Zelle</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <button onClick={() => copyToClipboard(ZELLE_EMAIL, 'email')}
                    style={{ padding:'8px 10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'white', fontSize:'11px', cursor:'pointer', fontWeight:'600' }}>
                    {copied === 'email' ? '✓ Copied!' : `📧 Copy Email`}
                  </button>
                  <button onClick={() => copyToClipboard(ZELLE_PHONE, 'phone')}
                    style={{ padding:'8px 10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'white', fontSize:'11px', cursor:'pointer', fontWeight:'600' }}>
                    {copied === 'phone' ? '✓ Copied!' : `📞 Copy Phone`}
                  </button>
                </div>
                <div style={{ marginTop:'8px', fontSize:'11px', color:'rgba(255,255,255,0.5)', textAlign:'center' }}>
                  {ZELLE_EMAIL} · {ZELLE_PHONE}
                </div>
              </div>
            </div>

            <div style={{ padding:'12px', background:'#f9fafb', borderRadius:'8px', fontSize:'12px', color:'#6b7280', lineHeight:'1.5' }}>
              <strong>Include in your payment note:</strong> {payModal.id} — {payModal.amount.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Invoice viewer */}
      {viewing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'14px', padding:'32px', maxWidth:'640px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h3 style={{ margin:0, fontSize:'16px', fontWeight:'700' }}>Invoice {viewing.id}</h3>
              <div style={{ display:'flex', gap:'8px' }}>
                {viewing.status !== 'paid' && (
                  <button onClick={() => { setViewing(null); setPayModal(viewing); }}
                    style={{ padding:'6px 14px', background:'#059669', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                    💳 Pay Now
                  </button>
                )}
                <button onClick={() => window.print()} style={{ padding:'6px 14px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>🖨 Print</button>
                <button onClick={() => setViewing(null)} style={{ padding:'6px 14px', background:'#f3f4f6', border:'1px solid #e5e5e5', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }}>✕ Close</button>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
              <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#1a1a2e' }}>S&A Screen Printing</div><div style={{ fontSize:'13px', color:'#6b7280', marginTop:'4px', lineHeight:1.6 }}>123 Print Ave, Newark NJ<br/>(973) 555-0100</div></div>
              <div style={{ textAlign:'right' }}><div style={{ fontSize:'22px', fontWeight:'800' }}>INVOICE</div><div style={{ fontSize:'16px', fontWeight:'700', color:'#e8a020' }}>{viewing.id}</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px', padding:'14px', background:'#f9fafb', borderRadius:'8px' }}>
              <div><div style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:'4px' }}>Bill To</div><div style={{ fontSize:'14px', fontWeight:'600' }}>Riverside Youth Sports</div></div>
              <div><div style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:'4px' }}>Details</div><div style={{ fontSize:'13px', color:'#374151', lineHeight:1.7 }}><div>Issued: {viewing.issued}</div><div>Due: {viewing.due}</div></div></div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'16px' }}>
              <thead><tr style={{ background:'#1a1a2e' }}>{['Description','Qty','Price','Total'].map(h=><th key={h} style={{ padding:'9px 12px', textAlign:h==='Description'?'left':'right', color:'#e8a020', fontSize:'12px', fontWeight:'700' }}>{h}</th>)}</tr></thead>
              <tbody>{viewing.items.map((item,i)=><tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}><td style={{ padding:'10px 12px', fontSize:'13px' }}>{item.desc}</td><td style={{ padding:'10px 12px', fontSize:'13px', textAlign:'right' }}>{item.qty}</td><td style={{ padding:'10px 12px', fontSize:'13px', textAlign:'right' }}>${item.price.toFixed(2)}</td><td style={{ padding:'10px 12px', fontSize:'13px', fontWeight:'600', textAlign:'right' }}>${(item.qty*item.price).toFixed(2)}</td></tr>)}</tbody>
            </table>
            {(() => { const sub=viewing.items.reduce((s,i)=>s+i.qty*i.price,0); const tax=sub*0.07; return (
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ width:'200px' }}>
                  {[['Subtotal',sub],['Tax (7%)',tax]].map(([l,v])=><div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'13px', color:'#6b7280', borderBottom:'1px solid #f3f4f6' }}><span>{l}</span><span>${v.toFixed(2)}</span></div>)}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:'16px', fontWeight:'700', color:'#1a1a1a' }}><span>Total</span><span>${(sub*1.07).toFixed(2)}</span></div>
                </div>
              </div>
            ); })()}
          </div>
        </div>
      )}

      {/* Quote modal */}
      {showQuote && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'14px', padding:'32px', maxWidth:'440px', width:'100%', position:'relative' }}>
            <button onClick={() => setShowQuote(false)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f3f4f6', border:'none', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', fontSize:'14px' }}>✕</button>
            <h2 style={{ fontSize:'18px', fontWeight:'700', margin:'0 0 4px' }}>Request a Quote</h2>
            <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'20px' }}>Tell us what you need and we'll get back to you.</p>
            {quoteSent ? (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#059669', fontSize:'16px', fontWeight:'600' }}>✓ Request sent! We'll be in touch soon.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div><label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px' }}>What do you need?</label>
                  <textarea value={quote.description} onChange={e=>setQuote(q=>({...q,description:e.target.value}))} style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px', height:'80px', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} placeholder="e.g. T-shirts with logo on front left chest…"/></div>
                <div><label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px' }}>Quantity</label>
                  <input value={quote.qty} onChange={e=>setQuote(q=>({...q,qty:e.target.value}))} style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px', fontFamily:'inherit', boxSizing:'border-box' }} placeholder="e.g. 48"/></div>
                <div><label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'5px' }}>Additional notes</label>
                  <textarea value={quote.notes} onChange={e=>setQuote(q=>({...q,notes:e.target.value}))} style={{ width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px', height:'60px', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} placeholder="Colors, deadline, special requests…"/></div>
                <button onClick={sendQuote} style={{ padding:'11px 0', background:'#1a1a1a', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Send Quote Request</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
