export const htmlVoucherStyles = `
body:not(.roadmap) .header h1{text-transform:uppercase}
.details{min-height:367px;
  padding:24px 26px 24px}
.details .section-title{margin-bottom:14px}
.detail-row{display:flex;
  align-items:flex-start;
  justify-content:space-between;
  border-bottom:1px solid var(--border);
  padding:13px 0 16px;
  min-height:52px;
  gap:12px}
.detail-label{font-size:12px;
  line-height:22px;
  color:var(--cyan);
  font-weight:700;
  text-transform:uppercase;
  flex:0 0 32%}
.detail-value{font-size:16px;
  line-height:22px;
  text-align:right;
  font-weight:700;
  min-width:0;
  white-space:pre-wrap}
.payment{color:#174a42}
.details-row{gap:20px}
.items{padding:27px 26px 24px;
  min-height:285px}
.items .section-title{margin-bottom:29px}
.item-grid{display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px}
.service-item{display:flex;
  align-items:center;
  gap:16px;
  padding:13px 20px;
  min-height:81px;
  border:2px solid var(--border);
  border-radius:14px}
.service-item .puck{width:50px;
  height:50px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--pale);
  border-radius:50%;
  flex:none}
.service-copy{flex:1;
  min-width:0}
.service-item h3{font-size:15px;
  line-height:22px}
.description{color:var(--muted);
  font-size:12px;
  line-height:20px;
  margin-top:8px}
.service-item .check{width:30px;
  height:30px}
.local-qr{gap:12px}
.local-qr>.local{flex:2}
.local-qr>.qr-panel{flex:1}
.local{padding:24px 26px 20px;
  min-height:313px}
.local .section-title{margin-bottom:19px}
.local-row{display:flex;
  gap:14px;
  align-items:flex-start;
  min-height:56px;
  font-size:14px}
.local-row .icon{width:30px;
  height:30px;
  margin-top:6px}
.local-row p{flex:1;
  padding:10px 0 17px;
  border-bottom:1px solid var(--border)}
.qr-panel{padding:24px 36px 0;
  min-height:313px;
  display:flex;
  flex-direction:column;
  justify-content:center}
.qr-panel h2{font-size:13px;
  color:var(--cyan);
  line-height:20px;
  margin-bottom:5px}
.qr-panel .accent strong{font-size:22px}
.qr-panel .accent p{margin-top:0}
.qr-image{margin:10px 0 0;
  width:202px;
  height:202px;
  max-width:100%;
  align-self:flex-start}
.qr-panel .url-link{font-size:11px;
  color:var(--muted);
  margin-top:12px}
.policy{padding:24px 28px;
  color:var(--ink)}
.policy.dark{background:var(--dark);
  color:#d5e3df;
  border-color:var(--dark)}
.policy.dark .section-title,
.policy.dark .policy-list p:before{color:#a0b6a9}
.policy .section-title{margin-bottom:24px}
.policy-list p{padding:13px 0 15px 26px;
  position:relative;
  white-space:pre-wrap}
.policy-list p:before{content:'›';
  position:absolute;
  left:0;
  top:6px;
  color:var(--cyan);
  font-size:27px;
  line-height:24px}
.policy-list.dividers p+p{border-top:1px solid var(--border)}
.policy.dark .dividers p+p{border-color:#245854}
.hotel-policy{margin:22px 0 0;
  border-radius:0;
  padding:27px 74px 12px;
  min-height:262px}
.hotel-policy .section-title{padding-left:64px;
  margin-bottom:19px}
.hotel-policy .policy-list p{font-family:Inter;
  min-height:60px;
  font-size:13px;
  line-height:20px;
  padding-left:28px}
.numbered-item{display:flex;
  gap:20px;
  padding:11px 0 0}
.number{border-radius:50%;
  background:#a0b6a9;
  color:#082e30;
  display:flex;
  align-items:center;
  justify-content:center;
  flex:none;
  width:42px;
  height:42px;
  font-size:15px;
  font-weight:700}
.numbered-item .number{font-family:Inter}
.numbered-item>div{flex:1;
  min-width:0;
  padding:0 0 16px}
.numbered-item:not(:last-child)>div{border-bottom:1px solid var(--border)}
.numbered-item h3{font-size:15px;
  line-height:22px}
.menu{padding:28px 26px 22px;
  min-height:414px}
.menu .section-title{margin-bottom:9px}
.menu-row{gap:12px}
.menu-row>.menu{flex:1.78}
.menu-row>.qr-panel{flex:1;
  min-height:414px}
.menu-row .qr-image{width:230px;
  height:230px}
.dinner-presentation{min-height:165px;
  margin-top:20px;
  margin-bottom:12px}
.dinner-presentation>p{font-family:Inter;
  font-size:13px;
  line-height:18px;
  margin-top:27px;
  max-width:860px}
.dinner-terms{min-height:241px;
  padding:28px 26px 27px}
.dinner-terms .section-title{margin-bottom:15px}
.dinner-terms .policy-list{font-size:12px;
  line-height:19px}
.dinner-terms .policy-list p{min-height:48px}
`;
