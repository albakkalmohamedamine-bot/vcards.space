export interface BusinessNicheOption {
  value: string;
  label: string;
  defaultImage: string;
}

export const BUSINESS_NICHES: BusinessNicheOption[] = [
  { 
    value: 'restaurant', 
    label: '🍽️ Restaurant / Café / Fast Food',
    defaultImage: '/images/niches/restaurant.jpg',
  },
  { 
    value: 'barbershop', 
    label: '💈 Barbershop / Coiffure Homme',
    defaultImage: '/images/niches/barbershop.jpg',
  },
  { 
    value: 'cosmetique', 
    label: '💄 Cosmétique Shop / Parfumerie',
    defaultImage: '/images/niches/cosmetique.jpg',
  },
  { 
    value: 'women_cosmetique', 
    label: '🌸 Only Women Cosmétique Shop',
    defaultImage: '/images/niches/women_cosmetique.jpg',
  },
  { 
    value: 'women_salon', 
    label: '💅 Women Salon / Spa / Beauty Center',
    defaultImage: '/images/niches/women_salon.jpg',
  },
  { 
    value: 'library', 
    label: '📚 Library / Bookshop / Papeterie',
    defaultImage: '/images/niches/library.jpg',
  },
  { 
    value: 'lawyer', 
    label: '⚖️ Lawyer / Cabinet d\'Avocat',
    defaultImage: '/images/niches/lawyer.jpg',
  },
  { 
    value: 'doctor', 
    label: '🩺 Doctor / Clinic / Cabinet Médical',
    defaultImage: '/images/niches/doctor.jpg',
  },
  { 
    value: 'real_estate', 
    label: '🏢 Real Estate / Immobilier',
    defaultImage: '/images/niches/real_estate.jpg',
  },
  { 
    value: 'gym', 
    label: '🏋️ Fitness / Gym / Sport',
    defaultImage: '/images/niches/gym.jpg',
  },
  { 
    value: 'others', 
    label: '✏️ Others (Specify below)',
    defaultImage: '/images/niches/others.jpg',
  },
];

export const DEFAULT_BUSINESS_BACKGROUND = '/images/niches/default.jpg';

export function getNicheBackgroundImage(niche?: string): string {
  if (!niche) return DEFAULT_BUSINESS_BACKGROUND;
  const match = BUSINESS_NICHES.find(n => n.value === niche);
  return match?.defaultImage || DEFAULT_BUSINESS_BACKGROUND;
}
