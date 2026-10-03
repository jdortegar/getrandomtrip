export const htmlRoadmapStyles = `.roadmap{--ink:#082e30;
  --cyan:#0f5c60;
  --muted:#082e30;
  color:#082e30}
.roadmap .header,
.roadmap .header .subtitle{color:#082e30}
.roadmap .route-small,
.roadmap .reference,
.roadmap .summary p,
.roadmap .summary strong,
.roadmap .itinerary-card h3,
.roadmap .itinerary-card .rich,
.roadmap .number{color:#082e30}
.roadmap .logo{width:243.84px;
  height:61.2px}
.roadmap .logo path{fill:#082e30!important}
.roadmap .status:before{content:none;
  margin:0;
  letter-spacing:0}
.roadmap [data-icon] [fill="#4ca6d0"],
.roadmap [data-icon] [fill="#4c9cc0"],
.roadmap [data-icon] [fill="#4b9fc2"],
.roadmap [data-icon] [fill="#3f96bd"],
.roadmap [data-icon] [fill="#49cd81"]{fill:#0f5c60}
.roadmap .map-panel [data-icon] path{fill:#a0b6a9}
.roadmap .header{display:flex;
  flex-direction:column;
  justify-content:space-between;
  min-height:220px;
  padding-bottom:28px;
  margin-bottom:28px}
.roadmap .header-top{display:flex;
  align-items:flex-start;
  justify-content:space-between}
.roadmap .header-bottom{display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:24px}
.roadmap .header-right{position:static;
  width:auto;
  top:auto;
  right:auto}
.roadmap .header .eyebrow{font-family:Barlow;
  font-size:15px;
  margin-top:12px;
  line-height:19px}
.roadmap .header h1{font-family:Barlow;
  font-size:34px;
  line-height:41px;
  margin-top:0;
  max-width:715px}
.roadmap .header .subtitle{font-family:Barlow;
  font-size:15px;
  margin-top:0;
  line-height:20px;
  max-width:715px}
.roadmap .header-right{right:80px;
  width:270px;
  top:40px}
.roadmap .status{width:220px;
  font-size:13px;
  color:#a0b6a9}
.roadmap .experience-lockup,
.roadmap .brand-lockup{margin-top:0;
  margin-right:0}
.route-small{font-size:13px;
  color:#3e5c58;
  margin-top:9px;
  line-height:18px;
  white-space:pre-wrap}
.brand-lockup{display:block;
  margin-top:9px;
  margin-left:auto;
  margin-right:20px;
  width:179px;
  height:36px}
.brand-lockup svg{width:100%;
  height:100%}
.brand-lockup [fill="#f4f1ee"],
.brand-lockup [fill="#ffffff"],
.brand-lockup [fill="#e8874d"],
.experience-get-lost path,
.pareja path{fill:#082e30}
.experience-lockup{display:flex;
  align-items:flex-end;
  gap:10px;
  justify-content:flex-end;
  margin-top:7px;
  margin-right:14px}
.traveler{font-family:Barlow;
  font-size:38px;
  font-weight:700;
  line-height:38px;
  white-space:pre-wrap;
  max-width:180px}
.experience-get-lost{display:block;
  width:73px;
  height:11px;
  margin-bottom:5px;
  color:#082e30}
.pareja{display:block;
  width:118px;
  height:32px}
.roadmap .experience-lockup,
.roadmap .experience-divider{color:#082e30}
.experience-divider{border-left:3px solid #082e30;
  padding-left:10px;
  font-family:Barlow;
  font-size:12px;
  font-weight:700;
  line-height:14px;
  white-space:pre-wrap;
  text-align:left;
  max-width:120px}
.roadmap .card{border-color:#082e30}
.roadmap .summary-row{align-items:flex-start;
  gap:34px;
  margin-bottom:45px}
.roadmap .summary{height:auto;
  min-height:0;
  padding:22px 26px}
.roadmap .summary h2{margin-bottom:14px;
  white-space:normal;
  color:#082e30}
.roadmap .section-title{color:#082e30}
.roadmap .summary strong{font-size:20px;
  line-height:24px}
.roadmap .summary p{font-size:13.5px;
  line-height:19px;
  margin-top:10px}
.roadmap .summary .accent:before{top:1px}
.itinerary-heading{margin-bottom:23px;
  font-size:15px;
  line-height:22px;
  gap:16px;
  height:42px}
.itinerary-heading .tile{width:42px;
  height:42px}
.itinerary-card{position:relative;
  height:auto;
  padding:22px 38px 22px 86px;
  margin-bottom:20px;
  min-height:0}
.itinerary-card .number{position:absolute;
  left:24px;
  top:22px;
  width:44px;
  height:44px}
.itinerary-card .item-header{display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:25px;
  margin-bottom:13px}
.itinerary-card h3{font-size:19px;
  line-height:25px;
  flex:1;
  min-width:0}
.itinerary-card .time{font-size:15px;
  line-height:17px;
  color:#082e30;
  font-weight:700;
  white-space:pre-wrap;
  text-align:right;
  max-width:210px}
.itinerary-card .rich{font-size:14.5px;
  line-height:23px}
.itinerary-card p+p{margin-top:8px}
.itinerary-card .bullet{padding-left:30px;
  position:relative}
.itinerary-card .bullet:before{content:'•';
  position:absolute;
  left:10px;
  color:var(--cyan);
  font-size:20px}
.itinerary-card .rich{max-width:920px}
.itinerary-card .rich p:not(:first-child){max-width:630px}
.map-panel{min-height:165px;
  background:#082e30;
  color:#d5e3df;
  border:0;
  padding:31px 86px 21px;
  position:relative;
  margin-bottom:0}
.map-panel>.tile{position:absolute;
  left:34px;
  top:30px;
  background:transparent;
  border:1.5px solid #a0b6a9;
  width:42px;
  height:42px}
.map-panel h2{font-size:15px;
  line-height:22px;
  color:#a0b6a9}
.map-panel p{font-size:14px;
  line-height:22px;
  margin-top:13px}
.map-panel .map-button{display:inline-block;
  background:#a0b6a9;
  color:#082e30;
  text-align:center;
  width:280px;
  border-radius:8px;
  padding:9px 10px;
  font-size:15px;
  font-weight:700;
  text-decoration:none;
  margin-top:17px;
  line-height:22px}
.map-panel .map-farewell{position:absolute;
  bottom:32px;
  right:86px;
  color:#a0b6a9;
  font-size:13px}
.map-panel [data-icon] path{fill:#a0b6a9}
.roadmap .footer{bottom:31px;
  font-size:12px}
.roadmap .footer-label{color:#0f5c60}
.split-fragment{min-height:0!important}
.stacked{display:block!important}
.stacked>*{margin-bottom:16px;
  min-height:0!important}
.continuation .unit{margin-top:0}
.overflow-text{white-space:pre-wrap;
  overflow-wrap:anywhere;
  font-size:15px;
  line-height:24px}
.flow-warning{padding:20px 26px;
  background:var(--pale);
  border-radius:12px;
  white-space:pre-wrap}
.continued-card{padding:25px 30px}
.continued-card h2{font-size:15px;
  color:var(--cyan);
  margin-bottom:15px}


.hotel .details-row{margin-bottom:14px}
.hotel .items{margin-bottom:18px}
.hotel-policy{min-height:261px;padding-bottom:11px}
.hotel-policy .policy-list p{padding-bottom:7px}
.dinner .header{margin-bottom:24px}
.dinner .summary-row{margin-bottom:19px}
.dinner .details-row{margin-bottom:12px}
.footer-label{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.hotel .unit{margin-right:69.24px}
.hotel .header,.hotel .hotel-policy{margin-right:0}
.hotel .summary-row{margin-right:68.07px;gap:67.85px}
.hotel .details-row{gap:22.24px}
.hotel .local-qr{display:grid;grid-template-columns:minmax(0,694.75px) minmax(0,1fr);gap:12px}
.local-qr:has(> :only-child){display:block}
.dinner .summary-row,.dinner .details-row{margin-right:68.8px}
.dinner .menu-row{display:grid;grid-template-columns:minmax(0,669.57px) minmax(0,1fr);margin-left:65.4px;margin-right:68.8px;gap:10.26px}
.menu-row:has(> :only-child){display:block}
.dinner-presentation,.dinner-terms{margin-left:66.15px;margin-right:67.15px}
.activity .details-row,.activity .items{margin-left:74px}
.activity .details-row{gap:19px}
.map-panel{padding-left:94px;padding-top:34px}
.roadmap .header .eyebrow{margin-top:11.5px}
.roadmap .header h1{margin-top:4px;line-height:39px}
.experience-roadmap .header .subtitle{margin-top:5px}
`;
