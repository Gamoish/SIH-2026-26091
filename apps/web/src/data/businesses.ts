import type { Bilingual, BusinessId } from '../types/index.ts';

export type MockBusiness = {
  id: BusinessId;
  name: Bilingual;
  unit: Bilingual;
  basePrice: number;
  densityPer10k: number;
  costSplit: { label: Bilingual; share: number }[];
  annualRevenueRatio: number;
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
    costSplit: [
      { label: { hi: 'पत्तल मशीन', en: 'Plate machines' }, share: 0.59 },
      { label: { hi: 'शेड + बिजली', en: 'Shed + power' }, share: 0.18 },
      { label: { hi: 'पत्ता + कार्यशील', en: 'Leaves + working' }, share: 0.23 },
    ],
    annualRevenueRatio: 1.75,
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
    costSplit: [
      { label: { hi: 'सिलाई मशीनें', en: 'Sewing machines' }, share: 0.46 },
      { label: { hi: 'दुकान + फर्नीचर', en: 'Shop + furniture' }, share: 0.3 },
      { label: { hi: 'कपड़ा + कार्यशील', en: 'Cloth + working' }, share: 0.24 },
    ],
    annualRevenueRatio: 1.4,
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
    costSplit: [
      { label: { hi: 'शुरुआती स्टॉक', en: 'Opening stock' }, share: 0.55 },
      { label: { hi: 'दुकान + रैक', en: 'Shop + shelving' }, share: 0.27 },
      { label: { hi: 'कार्यशील पूँजी', en: 'Working capital' }, share: 0.18 },
    ],
    annualRevenueRatio: 2.6,
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
    costSplit: [
      { label: { hi: 'औज़ार + मशीन', en: 'Tools + machines' }, share: 0.52 },
      { label: { hi: 'कार्यशाला', en: 'Workshop' }, share: 0.26 },
      { label: { hi: 'लकड़ी + कार्यशील', en: 'Timber + working' }, share: 0.22 },
    ],
    annualRevenueRatio: 1.3,
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
    costSplit: [
      { label: { hi: 'शेड + पिंजरा', en: 'Shed + cages' }, share: 0.44 },
      { label: { hi: 'चूज़े', en: 'Chicks' }, share: 0.21 },
      { label: { hi: 'दाना + कार्यशील', en: 'Feed + working' }, share: 0.35 },
    ],
    annualRevenueRatio: 2.1,
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
