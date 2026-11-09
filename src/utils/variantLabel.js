// Supplier abbreviations for product names. Keep finish/base codes (FINE,
// OPACO, NF, P/TR, etc.) intact: they distinguish purchasable variants.
const NAME_ALIASES = {
  'Duca di Venezia': ['DUCA VENEZIA'],
  'Finitura Autolucidante': ['FINITURA AUTOL.'],
  'Finitura Madreperlata': ['FINITURA MADREPERLATO'],
  'Marmorino Naturale': ['MARMORINO NAT.', 'MARMOR.NAT.'],
  'Raffaello Decorstucco': ['RAFFAEL.D.S.'],
  'Stucco Romano': ['STUCCO ROM.OIKOS'],
  'Travertino Romano': ['TRAVER.ROM.'],
  'Travertino Romano Design': ['TRAVER.ROM. DESIGN'],
  'Travertino Romano Finitura': ['TRAVERTINO ROMANO FINIT.'],
  'Toner Travertino Romano Finitura': ['TONER P/TRAV.'],
  'Drywall Paint': ['DRYWALL PAINT OIK.'],
  'Pittura alla Calce Verona': ['PITTURA CALCE VERONA'],
  'Protettivo per Stucco e Marmorino': ['PROTETTIVO STUCCO /MARM.'],
  'Decorsil Primer Pigmentato': ['DECOR.PRIMER PIGMEMTATO'],
  'Consolidante per Calce': ['CONSOLIDANTE CALCE'],
  'Rasatura alla Calce': ['RASAT.ALLA CALCE'],
  'O-Addensante': ['ADDENSANTE OIKOS'],
  'Biocompact Elastic': ['BIOCOM.ELASTIC'],
  'Pittura alla Calce': ['PITTURA CALCE ADIGE'],
  'Betoncryll Idrorepellente': ['BETONCRYLL IDROREPELL.'],
  'Betoncryll Pigmentato': ['BETONCRYLL PIGM.'],
  'Superfinish 24': ['SUPERFINISH24'],
  'Ecosmalto Ferromicaceo': ['NV FERROMICAC.'],
  'Ecosmalto Metallizzato': ['NV METTALIZATO'],
  'Ecosmalto Thermo': ['NV THERMO'],
  'Ecosmalto Universale': ['NV SMALTO'],
  'Ecofondo Riempitivo': ['NV ECOFONDO RIEMPITIVO'],
  'Ecoimpregnante Legno': ['NV IMPREGANTE LEGNO'],
  'Ecoprotettivo Legno': ['NV PRITETTIVO LEGNO'],
  'Ecoprotettivo Parquet': ['NV PARQUET'],
  'Turapori Ecologico': ['NV TURAPORI'],
  'Aggrappante Ecologico': ['NV AGGRAPPANTE'],
  'Antiruggine Ecologico': ['NV ANTIRUGGINE ECOLOGICO'],
  'Convertitore Ecologico': ['NV CONVERTITORE ECOLOGICO'],
  'Ecoprotettivo Ferro': ['NV FERRO PROTTETIVO'],
}

export function variantLabel(product, variant) {
  const title = String(variant.title || variant.volume || '').trim()
  if (product.brand !== 'oikos') return title
  const prefixes = [product.title, ...(NAME_ALIASES[product.title] ?? [])]
    .filter(Boolean).sort((a, b) => b.length - a.length)
  const prefix = prefixes.find((name) => title.toUpperCase().startsWith(name.toUpperCase()))
  return (prefix ? title.slice(prefix.length).trim() : title) || variant.volume || title
}
