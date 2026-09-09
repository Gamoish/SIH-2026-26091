import type { Bilingual, BusinessId } from '../../types/index.ts';

export type MockBusiness = {
  id: BusinessId;
  name: Bilingual;
  unit: Bilingual;
  basePrice: number;
  densityPer10k: number;
  /**
   * Share of the people around a unit who buy from that unit at all, and how
   * many units of `unit` each of them buys in a year. Together with the
   * suggested price these give the demand ceiling for one business.
   *
   * HAND-AUTHORED ASSUMPTIONS, not survey figures. They are ordinary-judgement
   * numbers for a Sonbhadra village, chosen so the demo reads honestly - no
   * NSS/MSME source stands behind them and none is claimed.
   */
  penetrationRate: number;
  purchaseFrequencyPerYear: number;
  /**
   * What a basic, working version of this business typically costs to set up,
   * all-in (total project cost, not one cost line).
   *
   * HAND-AUTHORED JUDGEMENT, not sourced. Each figure is what the cost lines
   * below add up to at a size that actually functions - one machine, one shed,
   * one batch - for rural Sonbhadra. Used only to warn when a plan comes out
   * well under it; it never blocks anything and never feeds the engine.
   */
  anchorCost: number;
  /** The one costSplit line that is working capital, not a fixed asset. */
  costSplit: { label: Bilingual; share: number; working?: true }[];
  /**
   * How many times a year the working-capital line turns over - stock bought,
   * sold, bought again. With `costSplit` this is the capacity ceiling: what
   * the applicant's own money can physically push through in a year.
   * Hand-authored assumption, same standing as the two above.
   */
  workingCapitalTurns: number;
  strengths: Bilingual[];
  weaknesses: Bilingual[];
  opportunities: Bilingual[];
  threats: Bilingual[];
};

export const MOCK_BUSINESSES: Record<BusinessId, MockBusiness> = {
  'leaf-plates': {
    id: 'leaf-plates',
    name: { hi: 'दोना-पत्तल', en: 'Leaf plates' },
    unit: { hi: 'प्रति पत्तल', en: 'per plate' },
    basePrice: 1.6,
    densityPer10k: 1.4,
    penetrationRate: 0.35,
    purchaseFrequencyPerYear: 60,
    // Semi-automatic double-die press ~Rs 1,05,000 (59%), shed + power
    // connection ~Rs 32,000 (18%), leaves and working capital ~Rs 41,000 (23%).
    anchorCost: 180_000,
    costSplit: [
      { label: { hi: 'पत्तल मशीन', en: 'Plate machines' }, share: 0.59 },
      { label: { hi: 'शेड + बिजली', en: 'Shed + power' }, share: 0.18 },
      { label: { hi: 'पत्ता + कार्यशील', en: 'Leaves + working' }, share: 0.23, working: true },
    ],
    workingCapitalTurns: 8,
    strengths: [
      {
        hi: 'कच्चा माल (सखुआ पत्ता) पास के जंगल से मिलता है',
        en: 'Raw material (sal leaf) comes from the nearby forest',
      },
      { hi: 'मशीन चलाना एक हफ़्ते में सीखा जा सकता है', en: 'The machine can be learned in about a week' },
    ],
    weaknesses: [
      { hi: 'बिजली अनियमित — मशीन रुक सकती है', en: 'Irregular power — the press can stop' },
      { hi: 'बरसात में पत्ता सुखाना मुश्किल', en: 'Drying leaves is hard through the monsoon' },
    ],
    opportunities: [
      { hi: 'शादी-सीज़न व प्लास्टिक बैन से माँग', en: 'Wedding season & plastic-ban demand' },
      { hi: 'ढाबा और कैटरर थोक में लेते हैं', en: 'Dhabas and caterers buy in bulk' },
      { hi: 'ज़िले के बाहर भी भेजा जा सकता है', en: 'Can be sent beyond the district' },
    ],
    threats: [
      { hi: 'सस्ते प्लास्टिक/थर्मोकोल विकल्प', en: 'Cheap plastic/thermocol alternatives' },
      { hi: 'एक ही बड़े खरीदार पर निर्भरता', en: 'Dependence on a single large buyer' },
    ],
  },
  tailoring: {
    id: 'tailoring',
    name: { hi: 'सिलाई', en: 'Tailoring' },
    unit: { hi: 'प्रति सिलाई', en: 'per garment' },
    basePrice: 180,
    densityPer10k: 6.2,
    penetrationRate: 0.3,
    purchaseFrequencyPerYear: 2.5,
    // Two machines including an interlock ~Rs 41,000 (46%), shop fittings and
    // furniture ~Rs 27,000 (30%), cloth and working capital ~Rs 22,000 (24%).
    // The cheapest of the five: it can start from a room at home.
    anchorCost: 90_000,
    costSplit: [
      { label: { hi: 'सिलाई मशीनें', en: 'Sewing machines' }, share: 0.46 },
      { label: { hi: 'दुकान + फर्नीचर', en: 'Shop + furniture' }, share: 0.3 },
      { label: { hi: 'कपड़ा + कार्यशील', en: 'Cloth + working' }, share: 0.24, working: true },
    ],
    workingCapitalTurns: 10,
    strengths: [
      { hi: 'हर मौसम में माँग रहती है', en: 'Demand holds through every season' },
      { hi: 'घर से भी शुरू किया जा सकता है', en: 'Can be started from home' },
    ],
    weaknesses: [
      { hi: 'शुरुआत में ग्राहक बनने में समय लगता है', en: 'Building a customer base takes time' },
      { hi: 'हुनर पर निर्भर — सीखने में महीनों लगते हैं', en: 'Skill-dependent — takes months to learn' },
    ],
    opportunities: [
      { hi: 'स्कूल यूनिफ़ॉर्म का सालाना ऑर्डर', en: 'Annual school-uniform orders' },
      { hi: 'शादी-सीज़न में ब्लाउज़/सूट की माँग', en: 'Blouse/suit demand in wedding season' },
    ],
    threats: [
      { hi: 'शहर से आया सस्ता रेडीमेड कपड़ा', en: 'Cheap readymade clothing from town' },
      { hi: 'पास में पहले से कई दर्ज़ी', en: 'Several tailors already nearby' },
    ],
  },
  grocery: {
    id: 'grocery',
    name: { hi: 'किराना दुकान', en: 'Grocery shop' },
    unit: { hi: 'प्रति ग्राहक', en: 'per customer' },
    basePrice: 120,
    densityPer10k: 9.5,
    penetrationRate: 0.45,
    purchaseFrequencyPerYear: 20,
    // Opening stock ~Rs 82,500 (55%) is the bulk of it, shop and shelving
    // ~Rs 40,500 (27%), working capital ~Rs 27,000 (18%). Below this a kirana
    // cannot hold enough stock to be the shop people walk to.
    anchorCost: 150_000,
    costSplit: [
      { label: { hi: 'शुरुआती स्टॉक', en: 'Opening stock' }, share: 0.55, working: true },
      { label: { hi: 'दुकान + रैक', en: 'Shop + shelving' }, share: 0.27 },
      { label: { hi: 'कार्यशील पूँजी', en: 'Working capital' }, share: 0.18, working: true },
    ],
    workingCapitalTurns: 9,
    strengths: [
      { hi: 'रोज़ की नक़दी — उधार कम', en: 'Daily cash — little credit needed' },
      { hi: 'गाँव में सबसे जानी-पहचानी दुकान', en: 'The most familiar kind of shop in a village' },
    ],
    weaknesses: [
      { hi: 'मुनाफ़ा प्रति सामान बहुत कम', en: 'Very thin margin per item' },
      { hi: 'उधार माँगने वाले ग्राहक', en: 'Customers asking for credit' },
    ],
    opportunities: [
      { hi: 'नज़दीकी गाँवों में कोई बड़ी दुकान नहीं', en: 'No large shop in the neighbouring villages' },
    ],
    threats: [
      { hi: 'क़स्बे की थोक दुकानें सस्ता देती हैं', en: 'Wholesale shops in town undercut on price' },
      { hi: 'स्टॉक ख़राब होने का जोखिम', en: 'Risk of stock spoiling' },
    ],
  },
  carpentry: {
    id: 'carpentry',
    name: { hi: 'बढ़ईगीरी', en: 'Carpentry' },
    unit: { hi: 'प्रति काम', en: 'per job' },
    basePrice: 2200,
    densityPer10k: 3.1,
    penetrationRate: 0.06,
    purchaseFrequencyPerYear: 0.35,
    // Planer, circular saw and drill ~Rs 1,14,400 (52%), workshop space
    // ~Rs 57,200 (26%), timber and working capital ~Rs 48,400 (22%). The
    // dearest of the five - the heavy tools come first and cannot be skipped.
    anchorCost: 220_000,
    costSplit: [
      { label: { hi: 'औज़ार + मशीन', en: 'Tools + machines' }, share: 0.52 },
      { label: { hi: 'कार्यशाला', en: 'Workshop' }, share: 0.26 },
      { label: { hi: 'लकड़ी + कार्यशील', en: 'Timber + working' }, share: 0.22, working: true },
    ],
    workingCapitalTurns: 6,
    strengths: [
      { hi: 'एक काम पर अच्छा मुनाफ़ा', en: 'Good margin on a single job' },
      { hi: 'शादी और घर बनने के समय लगातार काम', en: 'Steady work in wedding and house-building season' },
    ],
    weaknesses: [
      { hi: 'भारी औज़ारों में शुरुआती खर्च ज़्यादा', en: 'High upfront cost in heavy tools' },
      { hi: 'काम मौसम पर निर्भर', en: 'Work depends on the season' },
    ],
    opportunities: [
      {
        hi: 'सरकारी आवास योजनाओं से फ़र्नीचर के ऑर्डर',
        en: 'Furniture orders from government housing schemes',
      },
    ],
    threats: [
      { hi: 'लकड़ी के दाम बढ़ना', en: 'Rising timber prices' },
      { hi: 'फ़ैक्ट्री का बना सस्ता फ़र्नीचर', en: 'Cheap factory-made furniture' },
    ],
  },
  poultry: {
    id: 'poultry',
    name: { hi: 'मुर्गी पालन', en: 'Poultry' },
    unit: { hi: 'प्रति किलो', en: 'per kg' },
    basePrice: 145,
    densityPer10k: 2.3,
    penetrationRate: 0.28,
    purchaseFrequencyPerYear: 4,
    // A ~500-bird broiler cycle: shed and cages ~Rs 70,400 (44%), chicks
    // ~Rs 33,600 (21%), feed and working capital ~Rs 56,000 (35%).
    anchorCost: 160_000,
    costSplit: [
      { label: { hi: 'शेड + पिंजरा', en: 'Shed + cages' }, share: 0.44 },
      { label: { hi: 'चूज़े', en: 'Chicks' }, share: 0.21, working: true },
      { label: { hi: 'दाना + कार्यशील', en: 'Feed + working' }, share: 0.35, working: true },
    ],
    workingCapitalTurns: 6,
    strengths: [
      { hi: '6–7 हफ़्ते में पहली बिक्री', en: 'First sale in 6–7 weeks' },
      { hi: 'क़स्बे में माँस की माँग लगातार', en: 'Steady meat demand in the town' },
    ],
    weaknesses: [
      { hi: 'बीमारी से पूरा बैच जा सकता है', en: 'Disease can take an entire batch' },
      { hi: 'रोज़ की देखभाल ज़रूरी', en: 'Needs daily attention' },
    ],
    opportunities: [{ hi: 'दुद्धी की माँस दुकानों को सीधी सप्लाई', en: 'Direct supply to Dudhi meat shops' }],
    threats: [
      { hi: 'दाने का दाम बढ़ना', en: 'Rising feed prices' },
      { hi: 'बीमारी फैलने पर बाज़ार बंद', en: 'Market closure during a disease scare' },
    ],
  },
};

/**
 * How many units of each business are running in each demo village.
 *
 * HAND-AUTHORED DEMO DATA. There is no business registry behind this - no
 * Udyam export, no block survey, nothing counted on the ground. These are
 * plausible figures written by hand for the six fixture villages, in the same
 * MOCK_ spirit as the rest of this folder, and the UI's permanent "sample
 * data" badge is what tells the user so.
 *
 * They are hand-written rather than derived from `densityPer10k` because a
 * formula gives every village the same shape of market. A real block does not
 * look like that: Jarha sits at the forest edge with the sal leaves but nobody
 * pressing plates, Dudhi is the block town and has a row of everything, Kutku
 * is small and remote. Those differences are the whole point of the report.
 */
export const MOCK_COMPETITOR_COUNTS: Record<string, Record<BusinessId, number>> = {
  // Small, forest-edge, 2,320 people. Leaf-plates deliberately 0 - the raw
  // material is next door and nobody is using it. That gap is the walkthrough.
  jarha: { 'leaf-plates': 0, tailoring: 2, grocery: 3, carpentry: 1, poultry: 1 },
  // The block town, 17,400 people, weekly market. Crowded in everything.
  dudhi: { 'leaf-plates': 3, tailoring: 19, grocery: 24, carpentry: 7, poultry: 5 },
  // 6,900 people, block headquarters, its own small bazaar.
  myorpur: { 'leaf-plates': 2, tailoring: 6, grocery: 8, carpentry: 3, poultry: 3 },
  // 5,400 people, on the Dudhi road, so the town takes some of its trade.
  bijpur: { 'leaf-plates': 1, tailoring: 4, grocery: 6, carpentry: 2, poultry: 2 },
  // 2,900 people, far from the town - what is here is here because nothing
  // else is close. No leaf-plate work; the forest is on the other side.
  ranitali: { 'leaf-plates': 0, tailoring: 2, grocery: 4, carpentry: 1, poultry: 2 },
  // 1,900 people, remotest of the six. One family presses plates; too small
  // to hold a carpenter or a poultry shed.
  kutku: { 'leaf-plates': 1, tailoring: 1, grocery: 2, carpentry: 0, poultry: 0 },
};

/**
 * A rough local purchasing-power / market-access multiplier on the grocery
 * basket, per demo village. HAND-AUTHORED, same standing as the counts above.
 *
 * Grocery alone gets this because grocery alone is everyday cash spending: the
 * basket tracks how much money actually circulates in a village and whether
 * the household does its shopping here or on a trip to the town. The other
 * four are lumpy or occasional - a wedding order, a garment, a chicken, a
 * carpentry job - and are not set by weekly household cash the same way.
 *
 * Without it grocery revenue is nearly identical across the six villages,
 * because grocery competitors track population almost exactly and everything
 * else in the model then cancels out. These figures vary independently of
 * population, which is the point: Bijpur is bigger than Ranitali but sits on
 * the Dudhi road, so part of its weekly shopping happens in the town instead.
 */
export const MOCK_GROCERY_SPEND_INDEX: Record<string, number> = {
  jarha: 0.95, // forest edge, mostly farm labour — thin, seasonal cash
  dudhi: 1.2, // block town: salaries, the weekly market, the road head
  myorpur: 1.05, // block HQ, on the road, some cash economy of its own
  bijpur: 0.9, // big, but the Dudhi road takes the weekly shop into town
  ranitali: 0.85, // far out and poorer; more grown at home than bought
  kutku: 0.8, // remotest of the six, smallest cash economy
};
