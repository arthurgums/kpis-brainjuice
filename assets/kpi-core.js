// kpi-core.js — Módulo compartilhado
// Requer PapaParse em window.Papa (inclua papaparse.min.js antes de importar este módulo)

export const DEFAULT_CSV_URL = './data/kpis.csv';

export const METRIC_GROUPS = {
  'Financeiro': [
    { key:'Financeiro_Faturamento_Total', label:'Faturamento Total', kind:'currency' },
    { key:'Financeiro_Lucro', label:'Lucro', kind:'currency' },
    { key:'Financeiro_Pedidos_Guru', label:'Pedidos Guru', kind:'count' },
    { key:'Financeiro_Pedidos_ML', label:'Pedidos ML', kind:'count' },
    { key:'Financeiro_Pedidos_Yampi', label:'Pedidos Yampi', kind:'count' },
    { key:'Financeiro_Gastos_Meta', label:'Gastos em Meta', kind:'currency' },
    { key:'Financeiro_Gastos_Google', label:'Gastos em Google', kind:'currency' },
    { key:'Financeiro_Gastos_Mktp', label:'Gastos em Mktp', kind:'currency' },
  ],
  'Esteira Scripts': [
    { key:'Scripts_Scripts_Briefing_Feitos', label:'Scripts/Briefing Feitos', kind:'count' },
    { key:'Scripts_Scripts_Briefing_Escoados', label:'Scripts/Briefing Escoados', kind:'count' },
    { key:'Scripts_Materiais_Recebidos', label:'Materiais Recebidos', kind:'count' },
    { key:'Scripts_Materiais_Aguardando_Receber', label:'Materiais Aguardando Receber', kind:'count' },
    { key:'Scripts_Pecas_Editadas_Jeff', label:'Peças Editadas Jeff', kind:'count' },
    { key:'Scripts_Pecas_Editadas_Natalia', label:'Peças Editadas Natalia', kind:'count' },
  ],
  'Esteira Estático': [
    { key:'Estatico_Estaticos_GG_Feitos', label:'Estáticos GG Feitos', kind:'count' },
    { key:'Estatico_Estaticos_Meta_Feitos', label:'Estáticos Meta Feitos', kind:'count' },
    { key:'Estatico_Assets_Infra', label:'Assets Infra', kind:'count' },
  ],
  'Esteira Gravação Própria': [
    { key:'Gravacao_Materias_Gravados', label:'Materias Gravados', kind:'count' },
    { key:'Gravacao_Materias_Editados', label:'Materias Editados', kind:'count' },
  ],
  'Tráfego': [
    { key:'Trafego_Ads_Upados_Meta', label:'Ads Upados Meta', kind:'count' },
    { key:'Trafego_Ads_Upados_Google', label:'Ads Upados Google', kind:'count' },
  ],
  'Conteúdo': [
    { key:'Conteudo_Prospeccoes_Feitas', label:'Prospecções Feitas', kind:'count' },
  ],
};

export const brNumber = new Intl.NumberFormat('pt-BR');
const brCurrency = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });

export function parsePtNumber(v){
  if(v===undefined || v===null) return null;
  let s = String(v).trim();
  if(!s) return null;
  // remove símbolos e espaços
  s = s.replace(/[^0-9,.-]/g,'');
  // vírgula decimal + ponto de milhar
  if(s.includes(',') && s.includes('.')){
    s = s.replace(/\./g,'').replace(',', '.');
  } else if(s.includes(',')){
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function formatByKind(kind, n){
  if(n===null || n===undefined || n==='') return '';
  return kind === 'currency' ? brCurrency.format(n) : brNumber.format(n);
}

export function ymd(d){ return d.toISOString().slice(0,10); }

export function listWeeksAsc(rows){
  const set = new Set(rows.map(r => r.week_ending));
  return Array.from(set).sort((a,b)=> a.localeCompare(b));
}

export function findMetricLabel(key){
  for(const [g, arr] of Object.entries(METRIC_GROUPS)){
    const m = arr.find(x=>x.key===key); if(m) return m.label;
  }
  return key;
}

export async function loadCsv(url=DEFAULT_CSV_URL){
  const res = await fetch(url, {cache:'no-store'});
  if(!res.ok) throw new Error('CSV não encontrado em '+url);
  const text = await res.text();
  return parseCsv(text);
}

export function parseCsv(text){
  const parsed = window.Papa.parse(text, {header:true, skipEmptyLines:true});
  const rows = parsed.data.map(r => ({...r}));

  const cleaned = rows.map(r => {
    const d = new Date(r.week_ending);
    const row = { week_ending: isNaN(d) ? null : ymd(d) };
    for(const metrics of Object.values(METRIC_GROUPS)){
      for(const m of metrics){ row[m.key] = parsePtNumber(r[m.key]); }
    }
    return row;
  }).filter(r => r.week_ending);

  cleaned.sort((a,b)=> a.week_ending.localeCompare(b.week_ending));
  return cleaned;
}
