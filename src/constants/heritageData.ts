import { COUNTRIES as LOCATION_COUNTRIES } from './locationData';

export const HERITAGE_COUNTRIES = LOCATION_COUNTRIES;

export const TRIBES_BY_COUNTRY: Record<string, string[]> = {
  Nigeria: ['Yoruba', 'Igbo', 'Hausa', 'Fulani', 'Ijaw', 'Kanuri', 'Ibibio', 'Tiv', 'Edo', 'Nupe', 'Gbagyi', 'Jukun', 'Efik', 'Urhobo', 'Isoko', 'Idoma', 'Itsekiri', 'Kalabari', 'Ogoni', 'Ishan', 'Ika', 'Annang', 'Eket', 'Mbaise', 'Ezza'],
  Ghana: ['Akan', 'Ewe', 'Ga', 'Dagbani', 'Gonja', 'Fante', 'Ashanti', 'Kusasi', 'Mamprusi', 'Nzema', 'Brong', 'Akyem', 'Akwapim'],
  Kenya: ['Kikuyu', 'Luhya', 'Luo', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Mijikenda', 'Turkana', 'Maasai', 'Embu', 'Taita', 'Pokomo', 'Samburu', 'Rendille'],
  'South Africa': ['Zulu', 'Xhosa', 'Sotho', 'Tswana', 'Pedi', 'Venda', 'Tsonga', 'Swazi', 'Ndebele', 'Khoi', 'San', 'Cape Coloured', 'Cape Malay'],
  Ethiopia: ['Oromo', 'Amhara', 'Tigray', 'Somali', 'Sidama', 'Gurage', 'Welayta', 'Afar', 'Hadiya', 'Gamo', 'Konso'],
  Tanzania: ['Sukuma', 'Nyamwezi', 'Chagga', 'Haya', 'Makonde', 'Ha', 'Gogo', 'Hehe', 'Nyakyusa', 'Zaramo', 'Ngoni', 'Yao', 'Maasai', 'Pare', 'Luguru'],
  Uganda: ['Baganda', 'Banyankole', 'Basoga', 'Bakiga', 'Iteso', 'Langi', 'Acholi', 'Alur', 'Lugbara', 'Banyoro', 'Batooro', 'Samia'],
  Rwanda: ['Hutu', 'Tutsi', 'Twa'],
  Senegal: ['Wolof', 'Fula', 'Serer', 'Diola', 'Mandinka', 'Soninke', 'Jola', 'Balanta'],
  Cameroon: ['Bamileke', 'Fulani', 'Bassa', 'Duala', 'Ewondo', 'Tikar', 'Bamum', 'Beti', 'Bulu', 'Fang'],
  "Côte d'Ivoire": ['Akan', 'Baoulé', 'Bété', 'Senufo', 'Malinké', 'Agni', 'Lobi', 'Dan', 'Gouro', 'Dyula'],
  Zambia: ['Bemba', 'Tonga', 'Lozi', 'Nyanja', 'Luvale', 'Kaonde', 'Lunda', 'Tumbuka', 'Lala', 'Bisa'],
  Zimbabwe: ['Shona', 'Ndebele', 'Kalanga', 'Tonga', 'Shangaan', 'Venda', 'Chewa'],
  Mozambique: ['Makua', 'Tsonga', 'Lomwe', 'Sena', 'Ndau', 'Shangaan', 'Chewa', 'Yao', 'Makonde'],
  Angola: ['Ovimbundu', 'Kimbundu', 'Bakongo', 'Chokwe', 'Ganguela', 'Nyaneka', 'Herero', 'Mbunda'],
  Botswana: ['Tswana', 'Kalanga', 'San', 'Herero', 'Mbukushu', 'Yei', 'Kgalagadi'],
  Malawi: ['Chewa', 'Lomwe', 'Yao', 'Ngoni', 'Tumbuka', 'Nyanja', 'Sena', 'Tonga'],
  Liberia: ['Kpelle', 'Bassa', 'Gio', 'Mano', 'Kru', 'Grebo', 'Mandinka', 'Loma', 'Kissi', 'Vai'],
  'Sierra Leone': ['Temne', 'Mende', 'Limba', 'Kono', 'Krio', 'Fula', 'Mandinka', 'Susu', 'Yalunka'],
  Benin: ['Fon', 'Yoruba', 'Adja', 'Bariba', 'Dendi', 'Somba', 'Betamaribe', 'Fula', 'Goun', 'Mina'],
  Togo: ['Ewe', 'Kabye', 'Tem', 'Gourma', 'Moba', 'Losso', 'Akposso', 'Akebou', 'Ana', 'Konkomba'],
  Morocco: ['Moroccan Arab', 'Berber/Amazigh', 'Riffian', 'Sahrawi', 'Shilha', 'Soussi', 'Tamazight', 'Kabyle'],
  Algeria: ['Algerian Arab', 'Berber/Kabyle', 'Tuareg', 'Mozabite', 'Shawiya', 'Chenoua'],
  Egypt: ['Egyptian Arab', 'Coptic', 'Nubian', 'Bedouin Egyptian', 'Berber Egyptian'],
  'United States': ['African American', 'White/Caucasian', 'Hispanic/Latino', 'Asian American', 'Native American', 'Pacific Islander', 'Mixed/Multiracial'],
  Canada: ['English Canadian', 'French Canadian', 'Indigenous/First Nations', 'Chinese Canadian', 'Indian Canadian', 'Scottish Canadian', 'Irish Canadian', 'Italian Canadian'],
  Brazil: ['White Brazilian', 'Afro-Brazilian', 'Pardo (Mixed)', 'Indigenous', 'Asian Brazilian', 'Portuguese Brazilian', 'Italian Brazilian'],
  Mexico: ['Mestizo', 'Indigenous Mexican', 'White Mexican', 'Afro-Mexican', 'Maya', 'Nahuatl', 'Zapotec', 'Mixtec', 'Otomí'],
  Jamaica: ['Afro-Jamaican', 'Mixed Jamaican', 'Indian Jamaican', 'Chinese Jamaican', 'White Jamaican', 'Maroon'],
  'United Kingdom': ['English', 'Scottish', 'Welsh', 'Northern Irish', 'British Asian', 'British African', 'British Caribbean', 'Irish', 'Mixed British'],
  France: ['French', 'Breton', 'Basque', 'Alsatian', 'Corsican', 'North African French', 'Sub-Saharan African French', 'Occitan'],
  Germany: ['German', 'Turkish German', 'Polish German', 'Russian German', 'Italian German', 'Sorbian', 'Frisian', 'Bavarian', 'Saxon'],
  India: ['Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Assamese', 'Sikh', 'Kashmiri', 'Nepali Indian'],
  China: ['Han Chinese', 'Zhuang', 'Hui', 'Manchu', 'Uyghur', 'Miao', 'Yi', 'Mongol', 'Tibetan', 'Cantonese', 'Hakka', 'Teochew', 'Hokkien', 'Shanghainese'],
  Pakistan: ['Punjabi', 'Pashtun', 'Sindhi', 'Saraiki', 'Urdu', 'Baloch', 'Muhajir', 'Kashmiri'],
};

export const getTribesForCountry = (country: string) => TRIBES_BY_COUNTRY[country] || [];
