import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Common
  'common.back': { en: 'Back', hi: 'वापस' },
  'common.home': { en: 'Home', hi: 'होम' },
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.confirm': { en: 'Confirm', hi: 'पुष्टि करें' },
  'common.delete': { en: 'Delete', hi: 'हटाएं' },
  'common.edit': { en: 'Edit', hi: 'संपादित करें' },
  'common.view': { en: 'View', hi: 'देखें' },
  'common.close': { en: 'Close', hi: 'बंद करें' },
  'common.yes': { en: 'Yes', hi: 'हाँ' },
  'common.no': { en: 'No', hi: 'नहीं' },
  'common.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'common.profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'common.logout': { en: 'Logout', hi: 'लॉगआउट' },
  'common.login': { en: 'Login', hi: 'लॉगिन' },
  'common.signup': { en: 'Sign Up', hi: 'साइन अप' },

  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.bookings': { en: 'Bookings', hi: 'बुकिंग' },
  'nav.history': { en: 'History', hi: 'इतिहास' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'nav.lots': { en: 'Lots', hi: 'पार्किंग स्थल' },
  'nav.analytics': { en: 'Analytics', hi: 'विश्लेषण' },
  'nav.users': { en: 'Users', hi: 'उपयोगकर्ता' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },

  // Citizen Portal
  'citizen.title': { en: 'NIGAM-Park', hi: 'निगम-पार्क' },
  'citizen.subtitle': { en: 'Find Parking in Delhi', hi: 'दिल्ली में पार्किंग खोजें' },
  'citizen.searchPlaceholder': { en: 'Find parking near...', hi: 'पास में पार्किंग खोजें...' },
  'citizen.liveMap': { en: 'Live Map', hi: 'लाइव मैप' },
  'citizen.loyalty': { en: 'Loyalty Rewards', hi: 'लॉयल्टी पुरस्कार' },
  'citizen.myReservations': { en: 'My Reservations', hi: 'मेरी बुकिंग' },
  'citizen.alertSettings': { en: 'Alerts Settings', hi: 'अलर्ट सेटिंग्स' },
  'citizen.reportViolation': { en: 'Report Violation', hi: 'उल्लंघन रिपोर्ट करें' },
  'citizen.pullToRefresh': { en: 'Pull to refresh', hi: 'रिफ्रेश करने के लिए खींचें' },
  'citizen.releaseToRefresh': { en: 'Release to refresh', hi: 'रिफ्रेश करने के लिए छोड़ें' },
  'citizen.noLotsFound': { en: 'No parking lots found', hi: 'कोई पार्किंग स्थल नहीं मिला' },
  'citizen.tryDifferentLocation': { en: 'Try searching for a different location', hi: 'किसी अन्य स्थान की खोज करें' },

  // Parking
  'parking.available': { en: 'Available', hi: 'उपलब्ध' },
  'parking.limited': { en: 'Limited', hi: 'सीमित' },
  'parking.full': { en: 'Full', hi: 'भरा हुआ' },
  'parking.spots': { en: 'spots', hi: 'स्थान' },
  'parking.perHour': { en: '/hr', hi: '/घंटा' },
  'parking.occupancy': { en: 'Occupancy', hi: 'अधिभोग' },
  'parking.directions': { en: 'Directions', hi: 'दिशा' },
  'parking.reserve': { en: 'Reserve', hi: 'बुक करें' },
  'parking.lightTraffic': { en: 'light traffic', hi: 'हल्का ट्रैफ़िक' },
  'parking.moderateTraffic': { en: 'moderate traffic', hi: 'मध्यम ट्रैफ़िक' },
  'parking.heavyTraffic': { en: 'heavy traffic', hi: 'भारी ट्रैफ़िक' },
  'parking.min': { en: 'min', hi: 'मिनट' },

  // Admin
  'admin.dashboard': { en: 'Command Center', hi: 'कमांड सेंटर' },
  'admin.revenueAssurance': { en: 'Revenue Assurance Dashboard', hi: 'राजस्व आश्वासन डैशबोर्ड' },
  'admin.systemLive': { en: 'System Live', hi: 'सिस्टम चालू' },
  'admin.lastUpdated': { en: 'Last updated', hi: 'अंतिम अपडेट' },
  'admin.alerts': { en: 'Alerts', hi: 'अलर्ट' },
  'admin.revenueToday': { en: 'Revenue Today', hi: 'आज का राजस्व' },
  'admin.transactions': { en: 'transactions', hi: 'लेनदेन' },
  'admin.leakage': { en: 'Leakage', hi: 'रिसाव' },
  'admin.fraudCases': { en: 'fraud cases', hi: 'धोखाधड़ी मामले' },
  'admin.pendingAction': { en: 'Pending action', hi: 'लंबित कार्रवाई' },
  'admin.parkingNetwork': { en: 'Parking Network', hi: 'पार्किंग नेटवर्क' },
  'admin.locations': { en: 'locations', hi: 'स्थान' },
  'admin.liveActivity': { en: 'Live Activity', hi: 'लाइव गतिविधि' },
  'admin.revenueAnalytics': { en: 'Revenue Analytics', hi: 'राजस्व विश्लेषण' },
  'admin.backToDashboard': { en: 'Back to Dashboard', hi: 'डैशबोर्ड पर वापस' },

  // Fines
  'fines.title': { en: 'Fine Management', hi: 'जुर्माना प्रबंधन' },
  'fines.total': { en: 'Total Fines', hi: 'कुल जुर्माना' },
  'fines.pending': { en: 'Pending', hi: 'लंबित' },
  'fines.pendingAmount': { en: 'Pending Amount', hi: 'लंबित राशि' },
  'fines.collected': { en: 'Collected', hi: 'एकत्रित' },
  'fines.waived': { en: 'Waived', hi: 'माफ़' },
  'fines.resolve': { en: 'Resolve', hi: 'हल करें' },
  'fines.waive': { en: 'Waive', hi: 'माफ़ करें' },
  'fines.adjust': { en: 'Adjust', hi: 'समायोजित करें' },

  // Violations
  'violations.title': { en: 'Violation Reports', hi: 'उल्लंघन रिपोर्ट' },
  'violations.subtitle': { en: 'Review and manage citizen-reported parking violations', hi: 'नागरिक द्वारा रिपोर्ट किए गए पार्किंग उल्लंघनों की समीक्षा और प्रबंधन करें' },
  'violations.pending': { en: 'Pending', hi: 'लंबित' },
  'violations.reviewing': { en: 'Reviewing', hi: 'समीक्षाधीन' },
  'violations.resolved': { en: 'Resolved', hi: 'हल' },
  'violations.rejected': { en: 'Rejected', hi: 'अस्वीकृत' },
  'violations.actionTaken': { en: 'Action Taken', hi: 'कार्रवाई की गई' },

  // AQI
  'aqi.title': { en: 'Park Smartly, Reduce AQI', hi: 'स्मार्ट पार्किंग, AQI कम करें' },
  'aqi.description': { en: 'Efficient parking reduces vehicle idling and helps improve Delhi\'s air quality', hi: 'कुशल पार्किंग वाहनों के इंतजार को कम करती है और दिल्ली की वायु गुणवत्ता में सुधार करती है' },
  'aqi.current': { en: 'Current AQI', hi: 'वर्तमान AQI' },

  // Accessibility
  'a11y.skipToContent': { en: 'Skip to main content', hi: 'मुख्य सामग्री पर जाएं' },
  'a11y.openMenu': { en: 'Open menu', hi: 'मेनू खोलें' },
  'a11y.closeMenu': { en: 'Close menu', hi: 'मेनू बंद करें' },
  'a11y.loading': { en: 'Loading content', hi: 'सामग्री लोड हो रही है' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app-language');
      if (stored === 'hi' || stored === 'en') return stored;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  const isHindi = language === 'hi';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHindi }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
