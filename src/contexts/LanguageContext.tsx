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
  'common.submit': { en: 'Submit', hi: 'जमा करें' },
  'common.refresh': { en: 'Refresh', hi: 'रिफ्रेश करें' },
  'common.all': { en: 'All', hi: 'सभी' },
  'common.none': { en: 'None', hi: 'कोई नहीं' },
  'common.status': { en: 'Status', hi: 'स्थिति' },
  'common.action': { en: 'Action', hi: 'कार्रवाई' },
  'common.details': { en: 'Details', hi: 'विवरण' },
  'common.date': { en: 'Date', hi: 'तारीख' },
  'common.time': { en: 'Time', hi: 'समय' },
  'common.amount': { en: 'Amount', hi: 'राशि' },
  'common.total': { en: 'Total', hi: 'कुल' },
  'common.error': { en: 'Error', hi: 'त्रुटि' },
  'common.success': { en: 'Success', hi: 'सफल' },
  'common.warning': { en: 'Warning', hi: 'चेतावनी' },
  'common.info': { en: 'Information', hi: 'जानकारी' },
  'common.active': { en: 'Active', hi: 'सक्रिय' },
  'common.inactive': { en: 'Inactive', hi: 'निष्क्रिय' },
  'common.today': { en: 'Today', hi: 'आज' },
  'common.yesterday': { en: 'Yesterday', hi: 'कल' },
  'common.thisWeek': { en: 'This Week', hi: 'इस सप्ताह' },
  'common.thisMonth': { en: 'This Month', hi: 'इस महीने' },
  'common.noData': { en: 'No data available', hi: 'कोई डेटा उपलब्ध नहीं' },

  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.bookings': { en: 'Bookings', hi: 'बुकिंग' },
  'nav.history': { en: 'History', hi: 'इतिहास' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'nav.lots': { en: 'Lots', hi: 'पार्किंग स्थल' },
  'nav.analytics': { en: 'Analytics', hi: 'विश्लेषण' },
  'nav.users': { en: 'Users', hi: 'उपयोगकर्ता' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'nav.help': { en: 'Help', hi: 'सहायता' },
  'nav.about': { en: 'About', hi: 'हमारे बारे में' },

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
  'citizen.viewDetails': { en: 'View Details', hi: 'विवरण देखें' },
  'citizen.bookNow': { en: 'Book Now', hi: 'अभी बुक करें' },
  'citizen.nearbyParking': { en: 'Nearby Parking', hi: 'आस-पास की पार्किंग' },

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
  'parking.evCharging': { en: 'EV Charging', hi: 'EV चार्जिंग' },
  'parking.covered': { en: 'Covered', hi: 'ढकी पार्किंग' },
  'parking.nearMetro': { en: 'Near Metro', hi: 'मेट्रो के पास' },
  'parking.monthlyPass': { en: 'Monthly Pass', hi: 'मासिक पास' },
  'parking.referral': { en: 'Referral', hi: 'रेफरल' },
  'parking.parkingTips': { en: 'Parking Tips', hi: 'पार्किंग टिप्स' },
  'parking.findByArea': { en: 'Find parking by area:', hi: 'क्षेत्र के अनुसार पार्किंग खोजें:' },
  'parking.capacity': { en: 'Capacity', hi: 'क्षमता' },
  'parking.rate': { en: 'Rate', hi: 'दर' },
  'parking.zone': { en: 'Zone', hi: 'ज़ोन' },
  'parking.status': { en: 'Status', hi: 'स्थिति' },
  'parking.online': { en: 'Online', hi: 'ऑनलाइन' },
  'parking.offline': { en: 'Offline', hi: 'ऑफलाइन' },
  'parking.maintenance': { en: 'Maintenance', hi: 'रखरखाव' },

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
  'admin.visionAI': { en: 'Vision AI', hi: 'विज़न AI' },
  'admin.fraudHunter': { en: 'Fraud Hunter', hi: 'धोखाधड़ी खोजक' },
  'admin.violations': { en: 'Violations', hi: 'उल्लंघन' },
  'admin.fines': { en: 'Fines', hi: 'जुर्माना' },
  'admin.surgePricing': { en: 'Surge Pricing', hi: 'सर्ज प्राइसिंग' },
  'admin.analytics': { en: 'Analytics', hi: 'विश्लेषण' },
  'admin.realtime': { en: 'Realtime', hi: 'रीयलटाइम' },
  'admin.manageLots': { en: 'Manage Lots', hi: 'स्थल प्रबंधन' },
  'admin.users': { en: 'Users', hi: 'उपयोगकर्ता' },
  'admin.shifts': { en: 'Shifts', hi: 'शिफ्ट' },
  'admin.fleet': { en: 'Fleet', hi: 'फ्लीट' },
  'admin.broadcast': { en: 'Broadcast', hi: 'प्रसारण' },
  'admin.sendBroadcast': { en: 'Send Broadcast', hi: 'प्रसारण भेजें' },
  'admin.broadcastTitle': { en: 'Broadcast Title', hi: 'प्रसारण शीर्षक' },
  'admin.broadcastMessage': { en: 'Broadcast Message', hi: 'प्रसारण संदेश' },
  'admin.selectAudience': { en: 'Select Audience', hi: 'दर्शक चुनें' },
  'admin.allUsers': { en: 'All Users', hi: 'सभी उपयोगकर्ता' },
  'admin.attendants': { en: 'Attendants', hi: 'अटेंडेंट' },
  'admin.citizens': { en: 'Citizens', hi: 'नागरिक' },
  'admin.revenueTarget': { en: 'Revenue Target', hi: 'राजस्व लक्ष्य' },
  'admin.targetAchieved': { en: 'Target Achieved', hi: 'लक्ष्य प्राप्त' },
  'admin.setTarget': { en: 'Set Target', hi: 'लक्ष्य निर्धारित करें' },
  'admin.surgeRevenue': { en: 'Surge Revenue', hi: 'सर्ज राजस्व' },
  'admin.withoutSurge': { en: 'Without Surge', hi: 'सर्ज के बिना' },
  'admin.withSurge': { en: 'With Surge', hi: 'सर्ज के साथ' },
  'admin.additionalRevenue': { en: 'Additional Revenue', hi: 'अतिरिक्त राजस्व' },

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
  'fines.reason': { en: 'Reason', hi: 'कारण' },
  'fines.vehicleNumber': { en: 'Vehicle Number', hi: 'वाहन नंबर' },
  'fines.fineAmount': { en: 'Fine Amount', hi: 'जुर्माना राशि' },
  'fines.issuedOn': { en: 'Issued On', hi: 'जारी तिथि' },

  // Violations
  'violations.title': { en: 'Violation Reports', hi: 'उल्लंघन रिपोर्ट' },
  'violations.subtitle': { en: 'Review and manage citizen-reported parking violations', hi: 'नागरिक द्वारा रिपोर्ट किए गए पार्किंग उल्लंघनों की समीक्षा और प्रबंधन करें' },
  'violations.pending': { en: 'Pending', hi: 'लंबित' },
  'violations.reviewing': { en: 'Reviewing', hi: 'समीक्षाधीन' },
  'violations.resolved': { en: 'Resolved', hi: 'हल' },
  'violations.rejected': { en: 'Rejected', hi: 'अस्वीकृत' },
  'violations.actionTaken': { en: 'Action Taken', hi: 'कार्रवाई की गई' },
  'violations.type': { en: 'Violation Type', hi: 'उल्लंघन प्रकार' },
  'violations.description': { en: 'Description', hi: 'विवरण' },
  'violations.reportedBy': { en: 'Reported By', hi: 'रिपोर्टकर्ता' },
  'violations.location': { en: 'Location', hi: 'स्थान' },

  // Attendant
  'attendant.pos': { en: 'Attendant POS', hi: 'अटेंडेंट पीओएस' },
  'attendant.subtitle': { en: 'Point of Sale Terminal', hi: 'पॉइंट ऑफ सेल टर्मिनल' },
  'attendant.currentlyParked': { en: 'Currently Parked', hi: 'वर्तमान में पार्क' },
  'attendant.noVehiclesParked': { en: 'No vehicles currently parked with reservations', hi: 'वर्तमान में कोई वाहन रिजर्वेशन के साथ पार्क नहीं है' },
  'attendant.overdue': { en: 'Overdue', hi: 'समय अधिक' },
  'attendant.endingSoon': { en: 'Ending soon', hi: 'जल्द समाप्त' },
  'attendant.slot': { en: 'Slot', hi: 'स्लॉट' },
  'attendant.parked': { en: 'Parked', hi: 'पार्क किया' },
  'attendant.overstay': { en: 'Overstay', hi: 'अतिरिक्त समय' },
  'attendant.checkout': { en: 'Checkout', hi: 'चेकआउट' },
  'attendant.confirmCheckout': { en: 'Confirm Checkout', hi: 'चेकआउट की पुष्टि करें' },
  'attendant.vehicleEntry': { en: 'Vehicle Entry', hi: 'वाहन प्रवेश' },
  'attendant.vehicleNumber': { en: 'Vehicle Number', hi: 'वाहन नंबर' },
  'attendant.enterVehicle': { en: 'Enter Vehicle Number', hi: 'वाहन नंबर दर्ज करें' },
  'attendant.selectDuration': { en: 'Select Duration', hi: 'अवधि चुनें' },
  'attendant.hours': { en: 'hours', hi: 'घंटे' },
  'attendant.generateTicket': { en: 'Generate Ticket', hi: 'टिकट बनाएं' },
  'attendant.scanQR': { en: 'Scan QR', hi: 'QR स्कैन करें' },
  'attendant.todayStats': { en: "Today's Stats", hi: 'आज के आंकड़े' },
  'attendant.vehiclesIn': { en: 'Vehicles In', hi: 'वाहन अंदर' },
  'attendant.vehiclesOut': { en: 'Vehicles Out', hi: 'वाहन बाहर' },
  'attendant.totalCollection': { en: 'Total Collection', hi: 'कुल संग्रह' },
  'attendant.shiftHours': { en: 'Shift Hours', hi: 'शिफ्ट घंटे' },
  'attendant.recentTransactions': { en: 'Recent Transactions', hi: 'हाल के लेनदेन' },
  'attendant.noTransactions': { en: 'No transactions yet', hi: 'अभी तक कोई लेनदेन नहीं' },
  'attendant.cash': { en: 'Cash', hi: 'नकद' },
  'attendant.upi': { en: 'UPI', hi: 'यूपीआई' },
  'attendant.card': { en: 'Card', hi: 'कार्ड' },
  'attendant.checkIn': { en: 'Check In', hi: 'चेक इन' },
  'attendant.checkOut': { en: 'Check Out', hi: 'चेक आउट' },
  'attendant.performance': { en: 'Performance', hi: 'प्रदर्शन' },
  'attendant.myShifts': { en: 'My Shifts', hi: 'मेरी शिफ्ट' },
  'attendant.notifications': { en: 'Notifications', hi: 'सूचनाएं' },

  // AQI
  'aqi.title': { en: 'Park Smartly, Reduce AQI', hi: 'स्मार्ट पार्किंग, AQI कम करें' },
  'aqi.description': { en: 'Efficient parking reduces vehicle idling and helps improve Delhi\'s air quality', hi: 'कुशल पार्किंग वाहनों के इंतजार को कम करती है और दिल्ली की वायु गुणवत्ता में सुधार करती है' },
  'aqi.current': { en: 'Current AQI', hi: 'वर्तमान AQI' },

  // Voice Search
  'voice.search': { en: 'Voice search', hi: 'आवाज़ से खोजें' },
  'voice.listening': { en: 'Listening...', hi: 'सुन रहा हूँ...' },
  'voice.stop': { en: 'Stop', hi: 'रोकें' },
  'voice.speakNow': { en: 'Start speaking... e.g., "Find parking near India Gate"', hi: 'बोलना शुरू करें... उदाहरण: "इंडिया गेट के पास पार्किंग खोजें"' },
  'voice.notSupported': { en: 'Voice search not available', hi: 'आवाज़ खोज उपलब्ध नहीं है' },
  'voice.permissionDenied': { en: 'Microphone permission denied', hi: 'माइक्रोफोन की अनुमति नहीं है' },
  'voice.error': { en: 'Voice recognition error', hi: 'आवाज़ पहचान में त्रुटि' },
  'voice.micFailed': { en: 'Failed to start microphone', hi: 'माइक्रोफोन शुरू नहीं हुआ' },

  // Business Account
  'business.title': { en: 'Business Accounts', hi: 'व्यापार खाते' },
  'business.subtitle': { en: 'Corporate Parking Management', hi: 'कॉर्पोरेट पार्किंग प्रबंधन' },
  'business.solutions': { en: 'Business Solutions', hi: 'व्यापार समाधान' },
  'business.contactSales': { en: 'Contact Sales', hi: 'संपर्क करें' },
  'business.viewPlans': { en: 'View Plans', hi: 'प्लान देखें' },
  'business.features': { en: 'Business Account Features', hi: 'व्यापार खाते की विशेषताएं' },
  'business.plans': { en: 'Business Plans', hi: 'व्यापार प्लान' },
  'business.chooseSize': { en: 'Choose based on your company size', hi: 'अपनी कंपनी के आकार के अनुसार चुनें' },
  'business.mostPopular': { en: 'Most Popular', hi: 'सबसे लोकप्रिय' },
  'business.employees': { en: 'employees', hi: 'कर्मचारी' },
  'business.month': { en: 'month', hi: 'माह' },
  'business.customPricing': { en: 'Custom Pricing', hi: 'कस्टम मूल्य' },
  'business.getStarted': { en: 'Get Started', hi: 'शुरू करें' },
  'business.contactUs': { en: 'Contact Us', hi: 'संपर्क करें' },
  'business.contactForm': { en: 'Contact for Business Account', hi: 'व्यापार खाते के लिए संपर्क करें' },
  'business.formDescription': { en: 'Fill in your details and our team will contact you within 24 hours', hi: 'अपनी जानकारी भरें और हमारी टीम 24 घंटे में संपर्क करेगी' },
  'business.companyName': { en: 'Company Name', hi: 'कंपनी का नाम' },
  'business.contactPerson': { en: 'Contact Person', hi: 'संपर्क व्यक्ति' },
  'business.email': { en: 'Email', hi: 'ईमेल' },
  'business.phone': { en: 'Phone', hi: 'फ़ोन' },
  'business.numEmployees': { en: 'Number of Employees', hi: 'कर्मचारियों की संख्या' },
  'business.submitRequest': { en: 'Submit Request', hi: 'अनुरोध भेजें' },
  'business.trustedBy': { en: 'Trusted by leading organizations', hi: 'इनके द्वारा विश्वसनीय' },
  'business.thankYou': { en: 'Thank you! Our team will contact you shortly.', hi: 'धन्यवाद! हमारी टीम जल्द ही संपर्क करेगी।' },
  'business.fleetManagement': { en: 'Fleet Management', hi: 'फ्लीट प्रबंधन' },
  'business.addVehicle': { en: 'Add Vehicle', hi: 'वाहन जोड़ें' },
  'business.vehicleCount': { en: 'Vehicle Count', hi: 'वाहन संख्या' },
  'business.monthlyBudget': { en: 'Monthly Budget', hi: 'मासिक बजट' },
  'business.currentUsage': { en: 'Current Usage', hi: 'वर्तमान उपयोग' },

  // Weather
  'weather.recommendation': { en: 'Weather Recommendation', hi: 'मौसम सिफारिश' },
  'weather.hot': { en: 'Hot weather today! Look for covered parking to protect your vehicle.', hi: 'आज गर्म मौसम! अपने वाहन की सुरक्षा के लिए ढकी पार्किंग खोजें।' },
  'weather.rain': { en: 'Rain expected. Covered parking recommended.', hi: 'बारिश की संभावना। ढकी पार्किंग की सिफारिश है।' },
  'weather.pleasant': { en: 'Pleasant weather for outdoor parking.', hi: 'बाहरी पार्किंग के लिए सुहावना मौसम।' },

  // Filters
  'filter.evCharging': { en: 'EV Charging', hi: 'EV चार्जिंग' },
  'filter.covered': { en: 'Covered', hi: 'ढकी हुई' },
  'filter.nearMetro': { en: 'Near Metro', hi: 'मेट्रो के पास' },
  'filter.clearAll': { en: 'Clear All', hi: 'सभी हटाएं' },
  'filter.applyFilters': { en: 'Apply Filters', hi: 'फ़िल्टर लागू करें' },
  'filter.noResults': { en: 'No results match your filters', hi: 'आपके फ़िल्टर से कोई परिणाम नहीं मिला' },

  // Header
  'header.signIn': { en: 'Sign In', hi: 'साइन इन करें' },
  'header.signOut': { en: 'Sign Out', hi: 'साइन आउट' },
  'header.myReservations': { en: 'My Reservations', hi: 'मेरी बुकिंग' },
  'header.profileSettings': { en: 'Profile Settings', hi: 'प्रोफाइल सेटिंग्स' },
  'header.switchRole': { en: 'Switch Role', hi: 'भूमिका बदलें' },
  'header.admin': { en: 'Admin', hi: 'एडमिन' },
  'header.attendant': { en: 'Attendant', hi: 'अटेंडेंट' },
  'header.citizen': { en: 'Citizen', hi: 'नागरिक' },

  // Footer
  'footer.quickLinks': { en: 'Quick Links', hi: 'त्वरित लिंक' },
  'footer.findParking': { en: 'Find Parking', hi: 'पार्किंग खोजें' },
  'footer.myBookings': { en: 'My Bookings', hi: 'मेरी बुकिंग' },
  'footer.reportIssue': { en: 'Report Issue', hi: 'समस्या रिपोर्ट करें' },
  'footer.contactUs': { en: 'Contact Us', hi: 'संपर्क करें' },
  'footer.legal': { en: 'Legal', hi: 'कानूनी' },
  'footer.privacyPolicy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'footer.termsOfService': { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
  'footer.faq': { en: 'FAQ', hi: 'सामान्य प्रश्न' },
  'footer.contactInfo': { en: 'Contact', hi: 'संपर्क' },
  'footer.helpline': { en: 'Helpline', hi: 'हेल्पलाइन' },
  'footer.email': { en: 'Email', hi: 'ईमेल' },
  'footer.copyright': { en: 'All rights reserved', hi: 'सर्वाधिकार सुरक्षित' },
  'footer.madeWith': { en: 'Made with', hi: 'इसके साथ बनाया' },
  'footer.forDelhi': { en: 'for Delhi', hi: 'दिल्ली के लिए' },

  // Accessibility
  'a11y.skipToContent': { en: 'Skip to main content', hi: 'मुख्य सामग्री पर जाएं' },
  'a11y.openMenu': { en: 'Open menu', hi: 'मेनू खोलें' },
  'a11y.closeMenu': { en: 'Close menu', hi: 'मेनू बंद करें' },
  'a11y.loading': { en: 'Loading content', hi: 'सामग्री लोड हो रही है' },

  // Ads
  'ads.sponsored': { en: 'Sponsored', hi: 'प्रायोजित' },
  'ads.localBusiness': { en: 'Local Business', hi: 'स्थानीय व्यापार' },

  // Reservations
  'reservation.title': { en: 'My Reservations', hi: 'मेरी बुकिंग' },
  'reservation.upcoming': { en: 'Upcoming', hi: 'आगामी' },
  'reservation.past': { en: 'Past', hi: 'पिछले' },
  'reservation.active': { en: 'Active', hi: 'सक्रिय' },
  'reservation.cancelled': { en: 'Cancelled', hi: 'रद्द' },
  'reservation.completed': { en: 'Completed', hi: 'पूर्ण' },
  'reservation.expired': { en: 'Expired', hi: 'समाप्त' },
  'reservation.checkedIn': { en: 'Checked In', hi: 'चेक इन हुआ' },
  'reservation.startTime': { en: 'Start Time', hi: 'शुरू समय' },
  'reservation.endTime': { en: 'End Time', hi: 'समाप्त समय' },
  'reservation.duration': { en: 'Duration', hi: 'अवधि' },
  'reservation.totalAmount': { en: 'Total Amount', hi: 'कुल राशि' },
  'reservation.noReservations': { en: 'No reservations found', hi: 'कोई बुकिंग नहीं मिली' },
  'reservation.makeReservation': { en: 'Make a Reservation', hi: 'बुकिंग करें' },
  'reservation.cancelReservation': { en: 'Cancel Reservation', hi: 'बुकिंग रद्द करें' },
  'reservation.confirmCancel': { en: 'Are you sure you want to cancel this reservation?', hi: 'क्या आप वाकई इस बुकिंग को रद्द करना चाहते हैं?' },

  // Profile
  'profile.title': { en: 'My Profile', hi: 'मेरी प्रोफाइल' },
  'profile.fullName': { en: 'Full Name', hi: 'पूरा नाम' },
  'profile.email': { en: 'Email', hi: 'ईमेल' },
  'profile.phone': { en: 'Phone Number', hi: 'फोन नंबर' },
  'profile.savedVehicles': { en: 'Saved Vehicles', hi: 'सहेजे गए वाहन' },
  'profile.addVehicle': { en: 'Add Vehicle', hi: 'वाहन जोड़ें' },
  'profile.updateProfile': { en: 'Update Profile', hi: 'प्रोफाइल अपडेट करें' },
  'profile.changePassword': { en: 'Change Password', hi: 'पासवर्ड बदलें' },
  'profile.avatar': { en: 'Profile Picture', hi: 'प्रोफाइल फोटो' },
  'profile.referralCode': { en: 'Referral Code', hi: 'रेफरल कोड' },

  // Loyalty
  'loyalty.title': { en: 'Loyalty Program', hi: 'लॉयल्टी प्रोग्राम' },
  'loyalty.points': { en: 'Points', hi: 'पॉइंट्स' },
  'loyalty.tier': { en: 'Tier', hi: 'स्तर' },
  'loyalty.bronze': { en: 'Bronze', hi: 'ब्रॉन्ज़' },
  'loyalty.silver': { en: 'Silver', hi: 'सिल्वर' },
  'loyalty.gold': { en: 'Gold', hi: 'गोल्ड' },
  'loyalty.platinum': { en: 'Platinum', hi: 'प्लैटिनम' },
  'loyalty.earnPoints': { en: 'Earn Points', hi: 'पॉइंट्स कमाएं' },
  'loyalty.redeemPoints': { en: 'Redeem Points', hi: 'पॉइंट्स इस्तेमाल करें' },
  'loyalty.history': { en: 'Points History', hi: 'पॉइंट्स इतिहास' },
  'loyalty.rewards': { en: 'Rewards', hi: 'पुरस्कार' },
  'loyalty.discount': { en: 'Discount', hi: 'छूट' },

  // Monthly Pass
  'monthlyPass.title': { en: 'Monthly Pass', hi: 'मासिक पास' },
  'monthlyPass.buy': { en: 'Buy Pass', hi: 'पास खरीदें' },
  'monthlyPass.renew': { en: 'Renew Pass', hi: 'पास नवीनीकृत करें' },
  'monthlyPass.validity': { en: 'Validity', hi: 'वैधता' },
  'monthlyPass.validFrom': { en: 'Valid From', hi: 'से मान्य' },
  'monthlyPass.validTo': { en: 'Valid To', hi: 'तक मान्य' },
  'monthlyPass.unlimited': { en: 'Unlimited Parking', hi: 'असीमित पार्किंग' },
  'monthlyPass.selectLot': { en: 'Select Parking Lot', hi: 'पार्किंग स्थल चुनें' },
  'monthlyPass.selectVehicle': { en: 'Select Vehicle', hi: 'वाहन चुनें' },
  'monthlyPass.price': { en: 'Pass Price', hi: 'पास मूल्य' },

  // Referral
  'referral.title': { en: 'Refer & Earn', hi: 'रेफर करें और कमाएं' },
  'referral.shareCode': { en: 'Share your code', hi: 'अपना कोड शेयर करें' },
  'referral.copyCode': { en: 'Copy Code', hi: 'कोड कॉपी करें' },
  'referral.codeCopied': { en: 'Code copied!', hi: 'कोड कॉपी हुआ!' },
  'referral.earnReward': { en: 'Earn ₹100 for each friend', hi: 'हर दोस्त के लिए ₹100 कमाएं' },
  'referral.yourReferrals': { en: 'Your Referrals', hi: 'आपके रेफरल' },
  'referral.pending': { en: 'Pending', hi: 'लंबित' },
  'referral.completed': { en: 'Completed', hi: 'पूर्ण' },

  // Reviews
  'reviews.title': { en: 'Reviews', hi: 'समीक्षाएं' },
  'reviews.writeReview': { en: 'Write a Review', hi: 'समीक्षा लिखें' },
  'reviews.rating': { en: 'Rating', hi: 'रेटिंग' },
  'reviews.yourReview': { en: 'Your Review', hi: 'आपकी समीक्षा' },
  'reviews.submitReview': { en: 'Submit Review', hi: 'समीक्षा जमा करें' },
  'reviews.helpful': { en: 'Helpful', hi: 'उपयोगी' },
  'reviews.verified': { en: 'Verified', hi: 'सत्यापित' },
  'reviews.noReviews': { en: 'No reviews yet', hi: 'अभी तक कोई समीक्षा नहीं' },
  'reviews.beFirst': { en: 'Be the first to review', hi: 'पहले समीक्षा करें' },

  // Notifications
  'notifications.title': { en: 'Notifications', hi: 'सूचनाएं' },
  'notifications.preferences': { en: 'Notification Preferences', hi: 'सूचना प्राथमिकताएं' },
  'notifications.email': { en: 'Email Notifications', hi: 'ईमेल सूचनाएं' },
  'notifications.sms': { en: 'SMS Notifications', hi: 'SMS सूचनाएं' },
  'notifications.push': { en: 'Push Notifications', hi: 'पुश सूचनाएं' },
  'notifications.reminder': { en: 'Reminder before expiry', hi: 'समाप्ति से पहले रिमाइंडर' },
  'notifications.markAllRead': { en: 'Mark all as read', hi: 'सभी पढ़ा हुआ करें' },
  'notifications.noNotifications': { en: 'No notifications', hi: 'कोई सूचना नहीं' },

  // Auth
  'auth.title': { en: 'Welcome', hi: 'स्वागत है' },
  'auth.signIn': { en: 'Sign In', hi: 'साइन इन करें' },
  'auth.signUp': { en: 'Create Account', hi: 'खाता बनाएं' },
  'auth.email': { en: 'Email Address', hi: 'ईमेल पता' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.confirmPassword': { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें' },
  'auth.forgotPassword': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'auth.resetPassword': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करें' },
  'auth.noAccount': { en: "Don't have an account?", hi: 'खाता नहीं है?' },
  'auth.hasAccount': { en: 'Already have an account?', hi: 'पहले से खाता है?' },
  'auth.orContinueWith': { en: 'Or continue with', hi: 'या इसके साथ जारी रखें' },
  'auth.demoLogin': { en: 'Demo Login', hi: 'डेमो लॉगिन' },
  'auth.loginAsAdmin': { en: 'Login as Admin', hi: 'एडमिन के रूप में लॉगिन' },
  'auth.loginAsAttendant': { en: 'Login as Attendant', hi: 'अटेंडेंट के रूप में लॉगिन' },
  'auth.loginAsCitizen': { en: 'Login as Citizen', hi: 'नागरिक के रूप में लॉगिन' },

  // Report Violation
  'report.title': { en: 'Report a Violation', hi: 'उल्लंघन की रिपोर्ट करें' },
  'report.vehicleNumber': { en: 'Vehicle Number', hi: 'वाहन नंबर' },
  'report.violationType': { en: 'Violation Type', hi: 'उल्लंघन प्रकार' },
  'report.description': { en: 'Description', hi: 'विवरण' },
  'report.location': { en: 'Location', hi: 'स्थान' },
  'report.uploadPhoto': { en: 'Upload Photo', hi: 'फोटो अपलोड करें' },
  'report.submit': { en: 'Submit Report', hi: 'रिपोर्ट जमा करें' },
  'report.success': { en: 'Report submitted successfully', hi: 'रिपोर्ट सफलतापूर्वक जमा हुई' },
  'report.doubleParking': { en: 'Double Parking', hi: 'डबल पार्किंग' },
  'report.noParking': { en: 'No Parking Zone', hi: 'नो पार्किंग ज़ोन' },
  'report.handicapped': { en: 'Handicapped Spot', hi: 'विकलांग स्थान' },
  'report.expired': { en: 'Expired Ticket', hi: 'समाप्त टिकट' },
  'report.other': { en: 'Other', hi: 'अन्य' },

  // Analytics
  'analytics.title': { en: 'Analytics Dashboard', hi: 'विश्लेषण डैशबोर्ड' },
  'analytics.revenue': { en: 'Revenue', hi: 'राजस्व' },
  'analytics.occupancy': { en: 'Occupancy', hi: 'अधिभोग' },
  'analytics.transactions': { en: 'Transactions', hi: 'लेनदेन' },
  'analytics.comparison': { en: 'Comparison', hi: 'तुलना' },
  'analytics.daily': { en: 'Daily', hi: 'दैनिक' },
  'analytics.weekly': { en: 'Weekly', hi: 'साप्ताहिक' },
  'analytics.monthly': { en: 'Monthly', hi: 'मासिक' },
  'analytics.yearly': { en: 'Yearly', hi: 'वार्षिक' },
  'analytics.exportData': { en: 'Export Data', hi: 'डेटा निर्यात करें' },
  'analytics.downloadReport': { en: 'Download Report', hi: 'रिपोर्ट डाउनलोड करें' },

  // Fraud
  'fraud.title': { en: 'Fraud Detection', hi: 'धोखाधड़ी पहचान' },
  'fraud.alerts': { en: 'Fraud Alerts', hi: 'धोखाधड़ी अलर्ट' },
  'fraud.investigating': { en: 'Investigating', hi: 'जांच जारी' },
  'fraud.resolved': { en: 'Resolved', hi: 'हल' },
  'fraud.new': { en: 'New', hi: 'नया' },
  'fraud.severity': { en: 'Severity', hi: 'गंभीरता' },
  'fraud.low': { en: 'Low', hi: 'कम' },
  'fraud.medium': { en: 'Medium', hi: 'मध्यम' },
  'fraud.high': { en: 'High', hi: 'उच्च' },
  'fraud.critical': { en: 'Critical', hi: 'गंभीर' },
  'fraud.investigate': { en: 'Investigate', hi: 'जांच करें' },
  'fraud.markResolved': { en: 'Mark Resolved', hi: 'हल के रूप में चिह्नित करें' },

  // Shift Scheduling
  'shifts.title': { en: 'Shift Scheduling', hi: 'शिफ्ट शेड्यूलिंग' },
  'shifts.morning': { en: 'Morning', hi: 'सुबह' },
  'shifts.afternoon': { en: 'Afternoon', hi: 'दोपहर' },
  'shifts.evening': { en: 'Evening', hi: 'शाम' },
  'shifts.night': { en: 'Night', hi: 'रात' },
  'shifts.assign': { en: 'Assign Shift', hi: 'शिफ्ट असाइन करें' },
  'shifts.scheduled': { en: 'Scheduled', hi: 'निर्धारित' },
  'shifts.completed': { en: 'Completed', hi: 'पूर्ण' },
  'shifts.missed': { en: 'Missed', hi: 'छूटा' },
  'shifts.selectAttendant': { en: 'Select Attendant', hi: 'अटेंडेंट चुनें' },
  'shifts.selectLot': { en: 'Select Lot', hi: 'स्थल चुनें' },
  'shifts.startTime': { en: 'Start Time', hi: 'शुरू समय' },
  'shifts.endTime': { en: 'End Time', hi: 'समाप्त समय' },

  // Vision AI
  'vision.title': { en: 'Vision AI Dashboard', hi: 'विज़न AI डैशबोर्ड' },
  'vision.cameras': { en: 'Cameras', hi: 'कैमरे' },
  'vision.online': { en: 'Online', hi: 'ऑनलाइन' },
  'vision.offline': { en: 'Offline', hi: 'ऑफलाइन' },
  'vision.detections': { en: 'Detections', hi: 'पहचान' },
  'vision.vehicles': { en: 'Vehicles', hi: 'वाहन' },
  'vision.anpr': { en: 'ANPR', hi: 'ANPR' },
  'vision.liveStream': { en: 'Live Stream', hi: 'लाइव स्ट्रीम' },

  // Contact
  'contact.title': { en: 'Contact Us', hi: 'संपर्क करें' },
  'contact.name': { en: 'Your Name', hi: 'आपका नाम' },
  'contact.email': { en: 'Your Email', hi: 'आपका ईमेल' },
  'contact.message': { en: 'Message', hi: 'संदेश' },
  'contact.send': { en: 'Send Message', hi: 'संदेश भेजें' },
  'contact.success': { en: 'Message sent successfully', hi: 'संदेश सफलतापूर्वक भेजा गया' },
  'contact.address': { en: 'Address', hi: 'पता' },
  'contact.phone': { en: 'Phone', hi: 'फोन' },

  // Install App
  'install.title': { en: 'Install App', hi: 'ऐप इंस्टॉल करें' },
  'install.description': { en: 'Get the best experience by installing our app', hi: 'हमारा ऐप इंस्टॉल करके बेहतर अनुभव पाएं' },
  'install.android': { en: 'Download for Android', hi: 'Android के लिए डाउनलोड करें' },
  'install.ios': { en: 'Download for iOS', hi: 'iOS के लिए डाउनलोड करें' },
  'install.pwa': { en: 'Add to Home Screen', hi: 'होम स्क्रीन पर जोड़ें' },

  // Kiosk
  'kiosk.title': { en: 'Self Service Kiosk', hi: 'स्व-सेवा कियोस्क' },
  'kiosk.scanQR': { en: 'Scan QR Code', hi: 'QR कोड स्कैन करें' },
  'kiosk.enterNumber': { en: 'Enter Vehicle Number', hi: 'वाहन नंबर दर्ज करें' },
  'kiosk.selectHours': { en: 'Select Hours', hi: 'घंटे चुनें' },
  'kiosk.pay': { en: 'Pay Now', hi: 'अभी भुगतान करें' },
  'kiosk.printTicket': { en: 'Print Ticket', hi: 'टिकट प्रिंट करें' },

  // Blog
  'blog.title': { en: 'Parking Tips & Blog', hi: 'पार्किंग टिप्स और ब्लॉग' },
  'blog.readMore': { en: 'Read More', hi: 'और पढ़ें' },
  'blog.categories': { en: 'Categories', hi: 'श्रेणियां' },
  'blog.recentPosts': { en: 'Recent Posts', hi: 'हाल की पोस्ट' },
  'blog.share': { en: 'Share', hi: 'शेयर करें' },

  // Alerts & Availability
  'availability.notifyMe': { en: 'Notify Me', hi: 'मुझे सूचित करें' },
  'availability.alertSet': { en: 'Alert Set', hi: 'अलर्ट सेट' },
  'availability.notifyWhenAvailable': { en: 'Notify when available', hi: 'उपलब्ध होने पर सूचित करें' },
  'availability.subscribed': { en: 'You will be notified when a spot opens up', hi: 'जब स्थान उपलब्ध होगा तो आपको सूचित किया जाएगा' },
  'availability.unsubscribed': { en: 'Alert removed', hi: 'अलर्ट हटाया गया' },
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
