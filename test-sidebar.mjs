import { navigationSections } from './src/config/navigation.js';
const segment = 'general';
const allowedSections = ['Executivo & IA', 'Operacional & PCP', 'Comercial & Vendas', 'Controladoria & Fiscal', 'Gestão & Admin', 'Supply Chain & WMS'];

navigationSections.forEach(section => {
  const isVisible = !segment || (
    allowedSections.includes(section.label || "") || 
    !section.label
  );
  console.log(`Section: ${section.label}, Visible: ${isVisible}`);
});
