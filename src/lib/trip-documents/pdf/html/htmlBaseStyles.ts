export const htmlBaseStyles = `
@page { size:A4;
   margin:0 }

*{box-sizing:border-box}
html,body{margin:0;
  padding:0}
body{font-family:Arimo,sans-serif;
  color:var(--ink);
  font-size:14px;
  line-height:1.45;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact}

body{--ink:#19323d;
  --dark:#17313b;
  --cyan:#4c9cc0;
  --muted:#66899b;
  --border:#d8e7ee;
  --pale:#edf6fa;
  --inset:60.643px}

body.roadmap{--ink:#16313c;
  --dark:#163641;
  --cyan:#4ca6d0;
  --muted:#5c8495;
  --border:#cfe2ea;
  --pale:#e9f5fa;
  --inset:62px}

body.activity{--border:#d8eaf2;
  --cyan:#3f96bd;
  --pale:#eaf5fa}

h1,h2,h3,p{margin:0}
h1,h2,h3,strong,b{font-weight:700}
a{color:inherit;
  text-decoration:underline;
  overflow-wrap:anywhere}
p{white-space:pre-wrap;
  overflow-wrap:anywhere}
h1,h2,h3,span,strong,td{overflow-wrap:anywhere}
svg{display:block}
.icon{display:inline-flex;
  align-items:center;
  justify-content:center;
  flex:none;
  width:30px;
  height:30px}
.icon svg{width:100%;
  height:100%}
.tile{display:inline-flex;
  align-items:center;
  justify-content:center;
  width:40px;
  height:40px;
  border-radius:11px;
  background:var(--pale);
  flex:none}
.tile .icon{width:26px;
  height:26px}

.sheet{position:relative;
  width:1191px;
  height:1684px;
  overflow:hidden;
  background:white;
  break-after:page;
  zoom:1;
  margin:0 auto}
.roadmap .sheet{width:1200px;
  height:1740px;
  zoom:1}
.sheet:last-child{break-after:auto}
.page-content{padding-bottom:0}
.continuation .page-content{padding-top:42px}
.unit{margin:0 var(--inset) 16px}
.row{display:flex;
  gap:20px;
  align-items:stretch}
.row>*{flex:1;
  min-width:0}
.card{border:2px solid var(--border);
  border-radius:18px;
  background:white}
.section-title{display:flex;
  align-items:center;
  gap:11px;
  color:var(--cyan);
  font-size:13px;
  line-height:20px;
  text-transform:uppercase;
  font-weight:700}
.section-title .tile{margin-right:0}
.section-title.spacer{padding-left:50px}
 .header{position:relative;
  min-height:213px;
  padding:28px var(--inset) 15px;
  background:var(--dark);
  color:white;
  margin:0 0 26px}
.logo{width:203.2px;
  height:51px;
  margin-left:-2.84px}
.header .eyebrow{color:var(--cyan);
  font-size:13px;
  line-height:16px;
  margin-top:10px;
  text-transform:uppercase}
.header h1{font-size:29px;
  line-height:35px;
  margin-top:6px;
  max-width:760px}
.header .subtitle{font-size:12px;
  color:var(--cyan);
  text-transform:uppercase;
  font-weight:700;
  margin-top:12px;
  max-width:760px;
  white-space:pre-wrap}
.header .authored-label{font-size:10px;
  color:#9fc5d6;
  margin-top:4px;
  white-space:pre-wrap}
.header-right{position:absolute;
  right:47px;
  top:39px;
  width:271px;
  text-align:right}
.status{background:#173e3c;
  color:#36cf78;
  border-radius:32px;
  padding:8px 10px;
  text-align:center;
  font-weight:700;
  font-size:12px;
  line-height:19px;
  white-space:pre-wrap}
.status:before{content:'••';
  letter-spacing:4px;
  margin-right:5px}
.header-icon{position:absolute;
  right:287px;
  top:-1px;
  width:43px;
  height:43px}
.header-icon svg{height:100%;
  width:100%}
.hotel .header-icon{width:32.347px;
  height:34px;
  right:288.052px;
  top:1.15px}
.dinner .header-icon{width:49.2px;
  height:35.008px;
  right:282.404px;
  top:-0.856px}
.activity .header-icon{width:41.888px;
  height:44.001px;
  right:289.295px;
  top:-2.453px}
.reference{margin-top:9px;
  font-size:14px;
  color:#7ba8bb;
  white-space:pre-wrap}
.reference-flow{color:var(--muted);
  font-size:14px;
  white-space:pre-wrap}
.summary-row{gap:66px;
  margin-bottom:16px;
  position:relative}
.summary{min-height:148px;
  padding:29px 26px 21px}
.summary h2{font-size:13px;
  line-height:20px;
  color:var(--cyan);
  text-transform:uppercase;
  margin-bottom:15px}
.accent{position:relative;
  padding-left:19px}
.accent:before{position:absolute;
  content:'';
  left:0;
  top:3px;
  bottom:0;
  width:5px;
  border-radius:3px;
  background:var(--cyan)}
.accent strong{font-size:20px;
  line-height:27px;
  display:block}
.accent p{color:var(--muted);
  font-size:14px;
  line-height:20px;
  margin-top:12px}
.summary-arrow{position:absolute;
  left:50%;
  top:18px;
  transform:translateX(-50%);
  height:32px;
  width:32px}
.summary-arrow svg{width:100%;
  height:100%}

`;
