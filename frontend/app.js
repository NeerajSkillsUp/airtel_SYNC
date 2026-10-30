/* Project Udyam Digital frontend: wizard state, API calls, and language strings. */

(() => {
  "use strict";

  const configuredApiBase = document
    .querySelector('meta[name="api-base-url"]')
    ?.content.trim();
  const API_BASE = configuredApiBase
    ? configuredApiBase.replace(/\/+$/, "")
    : ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://127.0.0.1:8000"
      : window.location.origin;
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const ORDER_STORAGE_KEY = "udyam-digital-order";

  // UI copy is kept in one dictionary so every static label changes together.
  const translations = {
    en: {
      languageLabel: "Language",
      initiative: "Small business, big possibilities",
      pageTitle: "Project Udyam Digital",
      pageSubtitle: "Enterprise Onboarding — a simpler way to get your business connected.",
      onboardingProgress: "Onboarding progress",
      businessTypePlaceholder: "e.g. Bakery, Dental clinic",
      statePlaceholder: "e.g. Maharashtra",
      gstinPlaceholder: "15-character GSTIN",
      udyamPlaceholder: "UDYAM-XX-00-0000000",
      tierOne: "Tier 1",
      tierTwo: "Tier 2",
      apiConnection: "Backend",
      apiReady: "Connected",
      apiUnavailable: "Not connected",
      stepAdvisor: "AI Advisor",
      stepKyc: "Smart KYC",
      stepCheckout: "Checkout",
      stepTracker: "Order tracker",
      stepOneKicker: "STEP 1 · YOUR BUSINESS",
      advisorHeading: "Let’s find your right-fit plan",
      advisorPrompt: "Tell us a little about your business. We’ll use your answers to build a practical recommendation.",
      businessType: "Business type",
      employeeCount: "Employee count",
      siteCount: "Number of sites",
      cityTier: "City tier",
      state: "State",
      gstinAvailable: "GSTIN available?",
      yes: "Yes",
      no: "No",
      monthlyBudget: "Monthly budget (₹)",
      keyNeeds: "What do you need most?",
      needsPrompt: "Select any services that matter to your business.",
      needBackup: "Failover backup",
      needWifi: "Secure Wi-Fi",
      needPos: "POS & billing",
      needCloud: "Cloud backup",
      needCctv: "CCTV",
      needWhatsapp: "WhatsApp business",
      getRecommendation: "Get my recommendation",
      recommendationEmptyTitle: "Your business plan starts here",
      recommendationEmptyCopy: "Complete the profile to see a tailored bundle, transparent pricing, and ways to save.",
      recommendedBundle: "RECOMMENDED BUNDLE",
      monthlyTotal: "Monthly total",
      setupFee: "One-time setup",
      estimatedSavings: "Estimated savings / month",
      withinBudget: "Within budget",
      overBudget: "Over budget",
      continueKyc: "Continue to Smart KYC",
      advisoryWithin: "This bundle fits your monthly budget. Review the included services and estimated savings before continuing.",
      advisoryOver: "This recommendation is above your monthly budget. You can adjust your profile or remove optional add-ons at checkout.",
      advisoryNeeds: "We could not include these needs with the current eligibility or budget: ",
      noProducts: "No products are currently eligible for this profile. Update the profile or contact support.",
      productQuantity: "Qty",
      stepTwoKicker: "STEP 2 · YOUR CONSENT",
      consentHeading: "Your information stays in your control",
      consentPrompt: "Before we verify documents, please review how your information will be used.",
      purposeNotice: "We’ll use your registration details and documents only to verify your business identity, check eligibility, and process this onboarding request. Only the information needed for these checks is collected.",
      consentExplicit: "I explicitly consent to the processing of my information for the purpose described above under the DPDP Act 2023.",
      consentMinimization: "I understand that only data necessary for verification and onboarding will be collected.",
      recordConsent: "Record my consent",
      consentRecorded: "Consent receipt recorded.",
      consentRequired: "Please check both consent boxes before continuing.",
      consentGate: "Record both consent acknowledgements to enable document uploads.",
      registryChecks: "REGISTRY CHECKS",
      registryHeading: "Verify your registrations",
      registryPrompt: "Enter an identifier. We’ll check the mock registry as you type or when you leave the field.",
      gstinNumber: "GSTIN",
      udyamNumber: "Udyam registration number",
      lookupWaiting: "Enter an identifier to check the registry.",
      lookupChecking: "Checking registry…",
      lookupNotFound: "No matching registry record found.",
      registryFound: "Found",
      lookupFailed: "Registry lookup failed. Check your connection and try again.",
      lookupInvalid: "Enter a complete identifier to search.",
      registryName: "Registered name",
      documentChecks: "DOCUMENT CHECKS",
      uploadHeading: "Add your verification documents",
      uploadPrompt: "Upload a recent utility bill and a signatory ID. Images are checked by the KYC service and are not saved by this page.",
      utilityBill: "Utility bill / address proof",
      signatoryId: "Signatory ID",
      chooseImage: "Choose an image or drop it here",
      imageLimit: "PNG, JPG or TIFF · up to 10 MB",
      uploadConsentRequired: "Record consent before uploading documents.",
      uploadInvalidType: "Please choose an image file.",
      uploadTooLarge: "This image exceeds the 10 MB limit.",
      uploadChecking: "Verifying document…",
      uploadPass: "Document passed verification.",
      uploadFlagged: "Document needs review.",
      extracted: "Extracted",
      noFields: "No fields could be extracted.",
      reasons: "Reasons",
      back: "Back",
      continueCheckout: "Continue to checkout",
      stepThreeKicker: "STEP 3 · YOUR ORDER",
      checkoutHeading: "A clear quote, with no surprises",
      checkoutPrompt: "Review your recommended plan and add only what you need.",
      optionalAddons: "Optional add-ons",
      addonsPrompt: "Switch on an add-on to include it in your quote.",
      priceSummary: "PRICE SUMMARY",
      yourQuote: "Your quote",
      monthlyPlan: "Plan per month",
      addonMonthly: "Add-ons per month",
      priceDisclaimer: "Prices use the catalogue minimum monthly rate. Savings compare the catalogue’s monthly price range; no extra bundle discount is assumed.",
      installEstimate: "Installation estimate",
      installDays: "{days} days · longest installation SLA in your bundle",
      confirmOrder: "Confirm order",
      orderCreated: "Your order has been submitted.",
      stepFourKicker: "STEP 4 · YOUR ORDER",
      trackerHeading: "Your business is on its way",
      trackerPrompt: "Follow each milestone as your connection gets ready.",
      orderId: "ORDER ID",
      activationEstimate: "Estimated activation timeline",
      activateBy: "Estimated within {days} days · around {date}",
      milestoneSubmitted: "Order submitted",
      milestoneKyc: "KYC verified",
      milestoneDispatch: "Field dispatch",
      milestoneActivated: "Activated",
      trackerSubmitted: "Order submitted. We’ll keep you updated as verification progresses.",
      trackerKycPending: "Your order is submitted. Complete consent and pass both document checks to mark KYC verified.",
      trackerKycDone: "KYC verified. Your order is ready for field dispatch.",
      trackerDispatch: "Field team dispatched. Activation is in progress.",
      trackerComplete: "Your service is activated. Welcome to Airtel SYNC!",
      trackerKycBlocked: "Complete consent and pass the utility bill and signatory ID checks before advancing.",
      advanceTracker: "Advance demo tracker",
      startAnother: "Start another application",
      trackerDemoNote: "Demo tracker: milestone advancement is simulated in this frontend.",
      footerProject: "Project Udyam Digital",
      footerPrivacy: "Your information is used only for verification and onboarding.",
      apiUnavailableError: "Can’t reach the backend. Start FastAPI at http://127.0.0.1:8000 and check CORS settings.",
      recommendationError: "We couldn’t create a recommendation. Check the form and backend, then try again.",
      addonUnavailable: "Not available for this profile",
      addonCctv: "Cloud CCTV",
      addonBackup: "Cloud Backup 1 TB",
      addonPos: "POS SIM · Cloud POS & Billing",
      perMonth: "/ month",
      setup: "setup",
      genericError: "Something went wrong. Please try again."
    },
    hi: {
      languageLabel: "भाषा", initiative: "छोटा व्यवसाय, बड़ी संभावनाएँ", pageTitle: "प्रोजेक्ट उद्यम डिजिटल",
      pageSubtitle: "एंटरप्राइज़ ऑनबोर्डिंग — अपने व्यवसाय को जोड़ने का आसान तरीका।", apiConnection: "बैकएंड",
      onboardingProgress: "ऑनबोर्डिंग की प्रगति", businessTypePlaceholder: "जैसे बेकरी, डेंटल क्लिनिक",
      statePlaceholder: "जैसे महाराष्ट्र", gstinPlaceholder: "15 अक्षरों का GSTIN",
      udyamPlaceholder: "UDYAM-XX-00-0000000", tierOne: "श्रेणी 1", tierTwo: "श्रेणी 2",
      apiReady: "कनेक्टेड", apiUnavailable: "कनेक्ट नहीं है", stepAdvisor: "AI सलाहकार", stepKyc: "स्मार्ट KYC",
      stepCheckout: "चेकआउट", stepTracker: "ऑर्डर ट्रैकर", stepOneKicker: "चरण 1 · आपका व्यवसाय",
      advisorHeading: "आपके लिए सही प्लान चुनें", advisorPrompt: "अपने व्यवसाय के बारे में बताएं। हम आपके लिए उपयोगी सुझाव बनाएंगे।",
      businessType: "व्यवसाय का प्रकार", employeeCount: "कर्मचारियों की संख्या", siteCount: "साइटों की संख्या",
      cityTier: "शहर श्रेणी", state: "राज्य", gstinAvailable: "क्या GSTIN उपलब्ध है?", yes: "हाँ", no: "नहीं",
      monthlyBudget: "मासिक बजट (₹)", keyNeeds: "आपको सबसे अधिक किसकी ज़रूरत है?",
      needsPrompt: "अपने व्यवसाय के लिए आवश्यक सेवाएँ चुनें।", needBackup: "बैकअप कनेक्शन", needWifi: "सुरक्षित Wi-Fi",
      needPos: "POS और बिलिंग", needCloud: "क्लाउड बैकअप", needCctv: "CCTV", needWhatsapp: "WhatsApp बिज़नेस",
      getRecommendation: "मेरी सिफारिश देखें", recommendationEmptyTitle: "आपका व्यवसाय प्लान यहाँ से शुरू होता है",
      recommendationEmptyCopy: "व्यक्तिगत बंडल, स्पष्ट कीमत और बचत के विकल्प देखने के लिए प्रोफ़ाइल पूरी करें।",
      recommendedBundle: "अनुशंसित बंडल", monthlyTotal: "कुल मासिक शुल्क", setupFee: "एकमुश्त सेटअप शुल्क",
      estimatedSavings: "अनुमानित मासिक बचत", withinBudget: "बजट के भीतर", overBudget: "बजट से अधिक",
      continueKyc: "स्मार्ट KYC जारी रखें", advisoryWithin: "यह बंडल आपके मासिक बजट में है। आगे बढ़ने से पहले सेवाएँ और अनुमानित बचत देखें।",
      advisoryOver: "यह सुझाव आपके बजट से अधिक है। प्रोफ़ाइल बदलें या वैकल्पिक ऐड-ऑन हटाएँ।",
      advisoryNeeds: "इन ज़रूरतों को पात्रता या बजट के कारण शामिल नहीं किया जा सका: ", noProducts: "इस प्रोफ़ाइल के लिए कोई उत्पाद उपलब्ध नहीं है। जानकारी बदलें या सहायता लें।",
      productQuantity: "मात्रा", stepTwoKicker: "चरण 2 · आपकी सहमति", consentHeading: "आपकी जानकारी आपके नियंत्रण में है",
      consentPrompt: "दस्तावेज़ सत्यापित करने से पहले, कृपया जानकारी के उपयोग को समझें।",
      purposeNotice: "आपके पंजीकरण विवरण और दस्तावेज़ केवल व्यवसाय पहचान सत्यापित करने, पात्रता जाँचने और इस अनुरोध को संसाधित करने के लिए उपयोग होंगे। केवल आवश्यक जानकारी ली जाएगी।",
      consentExplicit: "DPDP अधिनियम 2023 के अंतर्गत ऊपर बताए उद्देश्य के लिए मैं अपनी जानकारी के प्रसंस्करण की स्पष्ट सहमति देता/देती हूँ।",
      consentMinimization: "मैं समझता/समझती हूँ कि केवल सत्यापन और ऑनबोर्डिंग के लिए आवश्यक डेटा लिया जाएगा।",
      recordConsent: "मेरी सहमति दर्ज करें", consentRecorded: "सहमति रसीद दर्ज हो गई।",
      consentRequired: "आगे बढ़ने के लिए दोनों सहमति बॉक्स चुनें।", consentGate: "दस्तावेज़ अपलोड करने के लिए दोनों सहमतियाँ दर्ज करें।",
      registryChecks: "रजिस्ट्री जाँच", registryHeading: "अपने पंजीकरण सत्यापित करें",
      registryPrompt: "पहचान संख्या दर्ज करें। टाइप करते समय या फ़ील्ड छोड़ने पर रजिस्ट्री जाँची जाएगी।",
      gstinNumber: "GSTIN", udyamNumber: "उद्यम पंजीकरण संख्या", lookupWaiting: "रजिस्ट्री जाँचने के लिए पहचान संख्या दर्ज करें।",
      lookupChecking: "रजिस्ट्री जाँची जा रही है…", lookupNotFound: "रजिस्ट्री में रिकॉर्ड नहीं मिला।",
      registryFound: "मिला",
      lookupFailed: "रजिस्ट्री जाँच विफल। कनेक्शन जाँचकर फिर कोशिश करें।", lookupInvalid: "खोजने के लिए पूरी पहचान संख्या दर्ज करें।",
      registryName: "पंजीकृत नाम", documentChecks: "दस्तावेज़ जाँच", uploadHeading: "सत्यापन दस्तावेज़ जोड़ें",
      uploadPrompt: "हाल का उपयोगिता बिल और हस्ताक्षरकर्ता ID अपलोड करें। इस पेज पर चित्र सहेजे नहीं जाते।",
      utilityBill: "उपयोगिता बिल / पता प्रमाण", signatoryId: "हस्ताक्षरकर्ता ID", chooseImage: "चित्र चुनें या यहाँ छोड़ें",
      imageLimit: "PNG, JPG या TIFF · अधिकतम 10 MB", uploadConsentRequired: "दस्तावेज़ अपलोड से पहले सहमति दर्ज करें।",
      uploadInvalidType: "कृपया चित्र फ़ाइल चुनें।", uploadTooLarge: "चित्र 10 MB सीमा से बड़ा है।",
      uploadChecking: "दस्तावेज़ सत्यापित हो रहा है…", uploadPass: "दस्तावेज़ सत्यापन सफल।",
      uploadFlagged: "दस्तावेज़ की समीक्षा आवश्यक है।", extracted: "निकाली गई जानकारी", noFields: "कोई जानकारी नहीं निकाली जा सकी।",
      reasons: "कारण", back: "वापस", continueCheckout: "चेकआउट जारी रखें", stepThreeKicker: "चरण 3 · आपका ऑर्डर",
      checkoutHeading: "स्पष्ट कोटेशन, कोई छिपा शुल्क नहीं", checkoutPrompt: "अपने प्लान की समीक्षा करें और ज़रूरत के ऐड-ऑन चुनें।",
      optionalAddons: "वैकल्पिक ऐड-ऑन", addonsPrompt: "कोटेशन में शामिल करने के लिए ऐड-ऑन चालू करें।",
      priceSummary: "कीमत का सारांश", yourQuote: "आपका कोटेशन", monthlyPlan: "मासिक प्लान",
      addonMonthly: "मासिक ऐड-ऑन", priceDisclaimer: "कीमतें कैटलॉग की न्यूनतम मासिक दर पर हैं। बचत कैटलॉग की मूल्य सीमा की तुलना है; अतिरिक्त बंडल छूट नहीं जोड़ी गई।",
      installEstimate: "इंस्टॉलेशन अनुमान", installDays: "{days} दिन · बंडल का सबसे लंबा इंस्टॉलेशन समय",
      confirmOrder: "ऑर्डर की पुष्टि करें", orderCreated: "आपका ऑर्डर जमा हो गया।", stepFourKicker: "चरण 4 · आपका ऑर्डर",
      trackerHeading: "आपका व्यवसाय शुरू होने को तैयार है", trackerPrompt: "कनेक्शन तैयार होने तक हर चरण देखें।",
      orderId: "ऑर्डर ID", activationEstimate: "सक्रिय होने का अनुमान", activateBy: "{days} दिनों के भीतर · लगभग {date}",
      milestoneSubmitted: "ऑर्डर जमा", milestoneKyc: "KYC सत्यापित", milestoneDispatch: "फील्ड टीम रवाना", milestoneActivated: "सक्रिय",
      trackerSubmitted: "ऑर्डर जमा हो गया। सत्यापन के दौरान आपको अपडेट देंगे।",
      trackerKycPending: "ऑर्डर जमा है। KYC सत्यापन के लिए सहमति और दोनों दस्तावेज़ जाँच पूरी करें।",
      trackerKycDone: "KYC सत्यापित। ऑर्डर फील्ड टीम के लिए तैयार है।",
      trackerDispatch: "फील्ड टीम रवाना हो गई। सक्रियण जारी है।", trackerComplete: "सेवा सक्रिय है। Airtel SYNC में आपका स्वागत है!",
      trackerKycBlocked: "आगे बढ़ने से पहले सहमति और दोनों दस्तावेज़ जाँच पास करें।",
      advanceTracker: "डेमो ट्रैकर आगे बढ़ाएँ", startAnother: "नया आवेदन शुरू करें",
      trackerDemoNote: "डेमो ट्रैकर: चरण इस पेज पर सिम्युलेट किए गए हैं।",
      footerProject: "प्रोजेक्ट उद्यम डिजिटल", footerPrivacy: "आपकी जानकारी केवल सत्यापन और ऑनबोर्डिंग के लिए है।",
      apiUnavailableError: "बैकएंड उपलब्ध नहीं है। http://127.0.0.1:8000 पर FastAPI शुरू करें और CORS जाँचें।",
      recommendationError: "सुझाव नहीं बन सका। फ़ॉर्म और बैकएंड जाँचकर फिर कोशिश करें।",
      addonUnavailable: "इस प्रोफ़ाइल के लिए उपलब्ध नहीं", addonCctv: "क्लाउड CCTV",
      addonBackup: "क्लाउड बैकअप 1 TB", addonPos: "POS SIM · क्लाउड POS और बिलिंग",
      perMonth: "/ माह", setup: "सेटअप", genericError: "कुछ गलत हुआ। कृपया फिर कोशिश करें।"
    },
    te: {
      languageLabel: "భాష", initiative: "చిన్న వ్యాపారం, పెద్ద అవకాశాలు", pageTitle: "ప్రాజెక్ట్ ఉదయం డిజిటల్",
      pageSubtitle: "ఎంటర్‌ప్రైజ్ ఆన్‌బోర్డింగ్ — మీ వ్యాపారాన్ని కనెక్ట్ చేసే సులభమైన మార్గం.", apiConnection: "బ్యాకెండ్",
      onboardingProgress: "ఆన్‌బోర్డింగ్ పురోగతి", businessTypePlaceholder: "ఉదా. బేకరీ, డెంటల్ క్లినిక్",
      statePlaceholder: "ఉదా. మహారాష్ట్ర", gstinPlaceholder: "15 అక్షరాల GSTIN",
      udyamPlaceholder: "UDYAM-XX-00-0000000", tierOne: "శ్రేణి 1", tierTwo: "శ్రేణి 2",
      apiReady: "కనెక్ట్ అయింది", apiUnavailable: "కనెక్ట్ కాలేదు", stepAdvisor: "AI సలహాదారు", stepKyc: "స్మార్ట్ KYC",
      stepCheckout: "చెకౌట్", stepTracker: "ఆర్డర్ ట్రాకర్", stepOneKicker: "దశ 1 · మీ వ్యాపారం",
      advisorHeading: "మీ వ్యాపారానికి సరైన ప్లాన్‌ను ఎంచుకోండి", advisorPrompt: "మీ వ్యాపారం గురించి కొద్దిగా చెప్పండి. మీకు ఉపయోగకరమైన సిఫార్సును రూపొందిస్తాం.",
      businessType: "వ్యాపార రకం", employeeCount: "ఉద్యోగుల సంఖ్య", siteCount: "సైట్‌ల సంఖ్య", cityTier: "నగర శ్రేణి",
      state: "రాష్ట్రం", gstinAvailable: "GSTIN ఉందా?", yes: "అవును", no: "కాదు", monthlyBudget: "నెలవారీ బడ్జెట్ (₹)",
      keyNeeds: "మీకు అత్యవసరంగా ఏది కావాలి?", needsPrompt: "మీ వ్యాపారానికి అవసరమైన సేవలను ఎంచుకోండి.",
      needBackup: "ఫెయిలోవర్ బ్యాకప్", needWifi: "సురక్షిత Wi-Fi", needPos: "POS & బిల్లింగ్", needCloud: "క్లౌడ్ బ్యాకప్",
      needCctv: "CCTV", needWhatsapp: "WhatsApp బిజినెస్", getRecommendation: "నా సిఫార్సును పొందండి",
      recommendationEmptyTitle: "మీ వ్యాపార ప్లాన్ ఇక్కడ ప్రారంభమవుతుంది",
      recommendationEmptyCopy: "మీకు సరిపోయే బండిల్, ధరలు, ఆదా వివరాల కోసం ప్రొఫైల్‌ను పూర్తి చేయండి.",
      recommendedBundle: "సిఫార్సు చేసిన బండిల్", monthlyTotal: "నెలవారీ మొత్తం", setupFee: "ఒకసారి సెటప్ ఛార్జీ",
      estimatedSavings: "అంచనా నెలవారీ ఆదా", withinBudget: "బడ్జెట్‌లో ఉంది", overBudget: "బడ్జెట్ మించింది",
      continueKyc: "స్మార్ట్ KYCకి కొనసాగండి", advisoryWithin: "ఈ బండిల్ మీ నెలవారీ బడ్జెట్‌లో ఉంది. ముందుకు వెళ్లే ముందు సేవలు, ఆదాను సమీక్షించండి.",
      advisoryOver: "ఈ సిఫార్సు మీ బడ్జెట్‌ను మించింది. ప్రొఫైల్‌ను మార్చండి లేదా ఐచ్ఛిక యాడ్-ఆన్‌లను తొలగించండి.",
      advisoryNeeds: "అర్హత లేదా బడ్జెట్ కారణంగా ఈ అవసరాలను చేర్చలేకపోయాం: ", noProducts: "ఈ ప్రొఫైల్‌కు ఉత్పత్తులు అందుబాటులో లేవు. వివరాలు మార్చండి లేదా సహాయం పొందండి.",
      productQuantity: "పరిమాణం", stepTwoKicker: "దశ 2 · మీ సమ్మతి", consentHeading: "మీ సమాచారం మీ నియంత్రణలో ఉంటుంది",
      consentPrompt: "పత్రాలను ధృవీకరించే ముందు, మీ సమాచారం ఎలా ఉపయోగించబడుతుందో చూడండి.",
      purposeNotice: "మీ వ్యాపార గుర్తింపును ధృవీకరించడానికి, అర్హతను తనిఖీ చేయడానికి, ఈ అభ్యర్థనను పూర్తి చేయడానికి మాత్రమే మీ నమోదు వివరాలు, పత్రాలు ఉపయోగిస్తాం. అవసరమైన సమాచారమే సేకరిస్తాం.",
      consentExplicit: "DPDP చట్టం 2023 ప్రకారం, పైన తెలిపిన ప్రయోజనం కోసం నా సమాచారాన్ని ప్రాసెస్ చేయడానికి నేను స్పష్టంగా సమ్మతిస్తున్నాను.",
      consentMinimization: "ధృవీకరణ, ఆన్‌బోర్డింగ్‌కు అవసరమైన డేటా మాత్రమే సేకరిస్తారని నాకు తెలుసు.",
      recordConsent: "నా సమ్మతిని నమోదు చేయండి", consentRecorded: "సమ్మతి రసీదు నమోదు అయింది.",
      consentRequired: "కొనసాగడానికి రెండు సమ్మతి పెట్టెలను ఎంచుకోండి.", consentGate: "పత్రాలను అప్‌లోడ్ చేయడానికి రెండు సమ్మతులను నమోదు చేయండి.",
      registryChecks: "రిజిస్ట్రీ తనిఖీలు", registryHeading: "మీ రిజిస్ట్రేషన్‌లను ధృవీకరించండి",
      registryPrompt: "ఐడెంటిఫైయర్‌ను నమోదు చేయండి. టైప్ చేసినప్పుడు లేదా ఫీల్డ్ నుంచి బయటకు వచ్చినప్పుడు తనిఖీ చేస్తాం.",
      gstinNumber: "GSTIN", udyamNumber: "ఉదయం రిజిస్ట్రేషన్ నంబర్", lookupWaiting: "రిజిస్ట్రీ తనిఖీకి ఐడెంటిఫైయర్‌ను నమోదు చేయండి.",
      lookupChecking: "రిజిస్ట్రీని తనిఖీ చేస్తున్నాం…", lookupNotFound: "రిజిస్ట్రీలో సరిపోలే రికార్డు లేదు.",
      registryFound: "లభించింది",
      lookupFailed: "రిజిస్ట్రీ తనిఖీ విఫలమైంది. కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
      lookupInvalid: "శోధించడానికి పూర్తి ఐడెంటిఫైయర్‌ను నమోదు చేయండి.", registryName: "నమోదైన పేరు",
      documentChecks: "పత్రాల తనిఖీలు", uploadHeading: "ధృవీకరణ పత్రాలను జోడించండి",
      uploadPrompt: "ఇటీవలి యుటిలిటీ బిల్లు, సంతకదారుడి ID అప్‌లోడ్ చేయండి. ఈ పేజీ చిత్రాలను నిల్వ చేయదు.",
      utilityBill: "యుటిలిటీ బిల్లు / చిరునామా రుజువు", signatoryId: "సంతకదారుడి ID",
      chooseImage: "చిత్రాన్ని ఎంచుకోండి లేదా ఇక్కడ వదలండి", imageLimit: "PNG, JPG లేదా TIFF · 10 MB వరకు",
      uploadConsentRequired: "పత్రాలను అప్‌లోడ్ చేయడానికి ముందు సమ్మతిని నమోదు చేయండి.",
      uploadInvalidType: "చిత్ర ఫైల్‌ను ఎంచుకోండి.", uploadTooLarge: "ఈ చిత్రం 10 MB పరిమితిని మించింది.",
      uploadChecking: "పత్రాన్ని ధృవీకరిస్తున్నాం…", uploadPass: "పత్రం ధృవీకరణ విజయవంతమైంది.",
      uploadFlagged: "పత్రాన్ని సమీక్షించాలి.", extracted: "సేకరించిన వివరాలు", noFields: "వివరాలను సేకరించలేకపోయాం.",
      reasons: "కారణాలు", back: "వెనక్కి", continueCheckout: "చెకౌట్‌కు కొనసాగండి",
      stepThreeKicker: "దశ 3 · మీ ఆర్డర్", checkoutHeading: "స్పష్టమైన ధరలు, దాచిన ఛార్జీలు లేవు",
      checkoutPrompt: "మీ ప్లాన్‌ను సమీక్షించి అవసరమైన యాడ్-ఆన్‌లను మాత్రమే జోడించండి.",
      optionalAddons: "ఐచ్ఛిక యాడ్-ఆన్‌లు", addonsPrompt: "కోట్‌లో చేర్చడానికి యాడ్-ఆన్‌ను ఆన్ చేయండి.",
      priceSummary: "ధరల సారాంశం", yourQuote: "మీ కోట్", monthlyPlan: "నెలవారీ ప్లాన్",
      addonMonthly: "నెలవారీ యాడ్-ఆన్‌లు", priceDisclaimer: "క్యాటలాగ్‌లోని కనీస నెలవారీ ధరలు చూపించబడ్డాయి. ఆదా ధరల శ్రేణి వ్యత్యాసం; అదనపు బండిల్ తగ్గింపు లేదు.",
      installEstimate: "ఇన్‌స్టాలేషన్ అంచనా", installDays: "{days} రోజులు · బండిల్‌లో గరిష్ఠ ఇన్‌స్టాలేషన్ SLA",
      confirmOrder: "ఆర్డర్‌ను నిర్ధారించండి", orderCreated: "మీ ఆర్డర్ సమర్పించబడింది.",
      stepFourKicker: "దశ 4 · మీ ఆర్డర్", trackerHeading: "మీ వ్యాపారం ప్రారంభానికి సిద్ధమవుతోంది",
      trackerPrompt: "మీ కనెక్షన్ సిద్ధమయ్యే ప్రతి దశను అనుసరించండి.", orderId: "ఆర్డర్ ID",
      activationEstimate: "సక్రియం అంచనా", activateBy: "{days} రోజుల్లో · సుమారు {date}",
      milestoneSubmitted: "ఆర్డర్ సమర్పించబడింది", milestoneKyc: "KYC ధృవీకరించబడింది",
      milestoneDispatch: "ఫీల్డ్ బృందం బయలుదేరింది", milestoneActivated: "సక్రియం అయింది",
      trackerSubmitted: "ఆర్డర్ సమర్పించబడింది. ధృవీకరణ పురోగతిని తెలియజేస్తాం.",
      trackerKycPending: "ఆర్డర్ సమర్పించబడింది. KYC కోసం సమ్మతి, రెండు పత్రాల తనిఖీలను పూర్తి చేయండి.",
      trackerKycDone: "KYC ధృవీకరించబడింది. ఫీల్డ్ బృందానికి ఆర్డర్ సిద్ధంగా ఉంది.",
      trackerDispatch: "ఫీల్డ్ బృందం బయలుదేరింది. సక్రియం ప్రక్రియలో ఉంది.", trackerComplete: "సేవ సక్రియమైంది. Airtel SYNCకి స్వాగతం!",
      trackerKycBlocked: "ముందుకు వెళ్లడానికి సమ్మతి మరియు రెండు పత్రాల తనిఖీలు విజయవంతం కావాలి.",
      advanceTracker: "డెమో ట్రాకర్‌ను ముందుకు తీసుకెళ్లండి", startAnother: "మరో దరఖాస్తు ప్రారంభించండి",
      trackerDemoNote: "డెమో ట్రాకర్: ఈ పేజీలో దశల పురోగతి సిమ్యులేట్ చేయబడుతుంది.",
      footerProject: "ప్రాజెక్ట్ ఉదయం డిజిటల్", footerPrivacy: "మీ సమాచారం ధృవీకరణ, ఆన్‌బోర్డింగ్ కోసం మాత్రమే.",
      apiUnavailableError: "బ్యాకెండ్‌ను చేరుకోలేకపోయాం. http://127.0.0.1:8000 వద్ద FastAPI ప్రారంభించి CORS తనిఖీ చేయండి.",
      recommendationError: "సిఫార్సును రూపొందించలేకపోయాం. ఫారమ్, బ్యాకెండ్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
      addonUnavailable: "ఈ ప్రొఫైల్‌కు అందుబాటులో లేదు", addonCctv: "క్లౌడ్ CCTV",
      addonBackup: "క్లౌడ్ బ్యాకప్ 1 TB", addonPos: "POS SIM · క్లౌడ్ POS & బిల్లింగ్",
      perMonth: "/ నెల", setup: "సెటప్", genericError: "ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి."
    },
    ta: {
      languageLabel: "மொழி", initiative: "சிறு வணிகம், பெரிய வாய்ப்புகள்", pageTitle: "ப்ராஜெக்ட் உதயம் டிஜிட்டல்",
      pageSubtitle: "நிறுவன இணைப்பு — உங்கள் வணிகத்தை இணைக்க எளிய வழி.", apiConnection: "பின்தளம்",
      onboardingProgress: "இணைப்பு முன்னேற்றம்", businessTypePlaceholder: "எ.கா. பேக்கரி, பல் மருத்துவமனை",
      statePlaceholder: "எ.கா. மகாராஷ்டிரா", gstinPlaceholder: "15 எழுத்து GSTIN",
      udyamPlaceholder: "UDYAM-XX-00-0000000", tierOne: "வகை 1", tierTwo: "வகை 2",
      apiReady: "இணைக்கப்பட்டது", apiUnavailable: "இணைக்கப்படவில்லை", stepAdvisor: "AI ஆலோசகர்",
      stepKyc: "ஸ்மார்ட் KYC", stepCheckout: "செக்அவுட்", stepTracker: "ஆர்டர் கண்காணிப்பு",
      stepOneKicker: "படி 1 · உங்கள் வணிகம்", advisorHeading: "உங்கள் வணிகத்திற்கான சரியான திட்டத்தைக் கண்டறியுங்கள்",
      advisorPrompt: "உங்கள் வணிகத்தைப் பற்றி கூறுங்கள். நடைமுறைப் பரிந்துரையை உருவாக்குவோம்.",
      businessType: "வணிக வகை", employeeCount: "பணியாளர் எண்ணிக்கை", siteCount: "தளங்களின் எண்ணிக்கை",
      cityTier: "நகர வகை", state: "மாநிலம்", gstinAvailable: "GSTIN உள்ளதா?", yes: "ஆம்", no: "இல்லை",
      monthlyBudget: "மாதாந்திர பட்ஜெட் (₹)", keyNeeds: "உங்களுக்கு மிகவும் தேவையானது எது?",
      needsPrompt: "உங்கள் வணிகத்திற்குத் தேவையான சேவைகளைத் தேர்ந்தெடுக்கவும்.",
      needBackup: "காப்பு இணைப்பு", needWifi: "பாதுகாப்பான Wi-Fi", needPos: "POS & பில்லிங்",
      needCloud: "கிளவுட் காப்பு", needCctv: "CCTV", needWhatsapp: "WhatsApp வணிகம்",
      getRecommendation: "எனது பரிந்துரையைப் பெறுக", recommendationEmptyTitle: "உங்கள் வணிகத் திட்டம் இங்கே தொடங்குகிறது",
      recommendationEmptyCopy: "தனிப்பயன் தொகுப்பு, விலை மற்றும் சேமிப்பைக் காண சுயவிவரத்தை நிரப்பவும்.",
      recommendedBundle: "பரிந்துரைக்கப்பட்ட தொகுப்பு", monthlyTotal: "மாதாந்திர மொத்தம்",
      setupFee: "ஒருமுறை அமைப்புக் கட்டணம்", estimatedSavings: "மாதாந்திர சேமிப்பு மதிப்பீடு",
      withinBudget: "பட்ஜெட்டுக்குள்", overBudget: "பட்ஜெட்டை மீறுகிறது",
      continueKyc: "ஸ்மார்ட் KYC-க்கு தொடரவும்",
      advisoryWithin: "இந்தத் தொகுப்பு உங்கள் மாதாந்திர பட்ஜெட்டுக்குள் உள்ளது. தொடர்வதற்கு முன் சேவைகளையும் சேமிப்பையும் பாருங்கள்.",
      advisoryOver: "இந்தப் பரிந்துரை உங்கள் பட்ஜெட்டை மீறுகிறது. சுயவிவரத்தை மாற்றவும் அல்லது விருப்பச் சேர்க்கைகளை நீக்கவும்.",
      advisoryNeeds: "தகுதி அல்லது பட்ஜெட் காரணமாக இவை சேர்க்கப்படவில்லை: ", noProducts: "இந்த சுயவிவரத்திற்கு தயாரிப்புகள் இல்லை. விவரங்களை மாற்றவும் அல்லது உதவியைத் தொடர்புகொள்ளவும்.",
      productQuantity: "அளவு", stepTwoKicker: "படி 2 · உங்கள் ஒப்புதல்",
      consentHeading: "உங்கள் தகவல் உங்கள் கட்டுப்பாட்டில் இருக்கும்",
      consentPrompt: "ஆவணங்களைச் சரிபார்ப்பதற்கு முன், உங்கள் தகவல் எவ்வாறு பயன்படுத்தப்படும் என்பதைப் பாருங்கள்.",
      purposeNotice: "வணிக அடையாளத்தைச் சரிபார்க்கவும், தகுதியை உறுதிப்படுத்தவும், இந்தக் கோரிக்கையைச் செயல்படுத்தவும் மட்டுமே பதிவு விவரங்களும் ஆவணங்களும் பயன்படுத்தப்படும். தேவையான தகவல் மட்டுமே சேகரிக்கப்படும்.",
      consentExplicit: "DPDP சட்டம் 2023-ன் கீழ் மேலே கூறிய நோக்கத்திற்காக எனது தகவலைச் செயலாக்க வெளிப்படையாக ஒப்புக்கொள்கிறேன்.",
      consentMinimization: "சரிபார்ப்பு மற்றும் இணைப்புக்கு தேவையான தரவு மட்டுமே சேகரிக்கப்படும் என்பதைப் புரிந்துகொள்கிறேன்.",
      recordConsent: "எனது ஒப்புதலைப் பதிவு செய்", consentRecorded: "ஒப்புதல் ரசீது பதிவு செய்யப்பட்டது.",
      consentRequired: "தொடர இரண்டு ஒப்புதல் பெட்டிகளையும் தேர்வு செய்யவும்.",
      consentGate: "ஆவணங்களைப் பதிவேற்ற இரண்டு ஒப்புதல்களையும் பதிவு செய்யவும்.",
      registryChecks: "பதிவேட்டு சரிபார்ப்பு", registryHeading: "உங்கள் பதிவுகளைச் சரிபார்க்கவும்",
      registryPrompt: "அடையாள எண்ணை உள்ளிடவும். தட்டச்சிடும்போதோ வெளியேறும்போதோ பதிவேட்டைச் சரிபார்ப்போம்.",
      gstinNumber: "GSTIN", udyamNumber: "உதயம் பதிவு எண்",
      lookupWaiting: "பதிவேட்டைச் சரிபார்க்க அடையாள எண்ணை உள்ளிடவும்.", lookupChecking: "பதிவேடு சரிபார்க்கப்படுகிறது…",
      lookupNotFound: "பொருந்தும் பதிவு எதுவும் இல்லை.", lookupFailed: "பதிவேடு சரிபார்ப்பு தோல்வியடைந்தது. இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.",
      registryFound: "கண்டறியப்பட்டது", lookupFailed: "பதிவேடு சரிபார்ப்பு தோல்வியடைந்தது. இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.",
      lookupInvalid: "தேட முழு அடையாள எண்ணை உள்ளிடவும்.", registryName: "பதிவு செய்யப்பட்ட பெயர்",
      documentChecks: "ஆவணச் சரிபார்ப்பு", uploadHeading: "சரிபார்ப்பு ஆவணங்களைச் சேர்க்கவும்",
      uploadPrompt: "சமீபத்திய பயன்பாட்டு கட்டணச் சீட்டையும் கையொப்பமிடுபவர் ID-யையும் பதிவேற்றவும். இந்தப் பக்கம் படங்களைச் சேமிக்காது.",
      utilityBill: "பயன்பாட்டு கட்டணச் சீட்டு / முகவரிச் சான்று", signatoryId: "கையொப்பமிடுபவர் ID",
      chooseImage: "படத்தைத் தேர்ந்தெடுக்கவும் அல்லது இங்கே இடவும்", imageLimit: "PNG, JPG அல்லது TIFF · 10 MB வரை",
      uploadConsentRequired: "ஆவணங்களைப் பதிவேற்றுவதற்கு முன் ஒப்புதலைப் பதிவு செய்யவும்.",
      uploadInvalidType: "படக் கோப்பைத் தேர்ந்தெடுக்கவும்.", uploadTooLarge: "படம் 10 MB வரம்பை மீறுகிறது.",
      uploadChecking: "ஆவணம் சரிபார்க்கப்படுகிறது…", uploadPass: "ஆவணச் சரிபார்ப்பு வெற்றி.",
      uploadFlagged: "ஆவணத்தை மறுபரிசீலனை செய்ய வேண்டும்.", extracted: "பெறப்பட்ட விவரங்கள்",
      noFields: "விவரங்களைப் பெற முடியவில்லை.", reasons: "காரணங்கள்", back: "பின் செல்லவும்",
      continueCheckout: "செக்அவுட்டுக்கு தொடரவும்", stepThreeKicker: "படி 3 · உங்கள் ஆர்டர்",
      checkoutHeading: "தெளிவான விலை, மறைக்கப்பட்ட கட்டணங்கள் இல்லை",
      checkoutPrompt: "உங்கள் திட்டத்தைப் பார்வையிட்டு தேவையானவற்றை மட்டும் சேர்க்கவும்.",
      optionalAddons: "விருப்பச் சேர்க்கைகள்", addonsPrompt: "மேற்கோளில் சேர்க்க மாற்றியை இயக்கவும்.",
      priceSummary: "விலைச் சுருக்கம்", yourQuote: "உங்கள் விலை", monthlyPlan: "மாதாந்திர திட்டம்",
      addonMonthly: "மாதாந்திர சேர்க்கைகள்",
      priceDisclaimer: "பட்டியலின் குறைந்தபட்ச மாதக் கட்டணம் காட்டப்படுகிறது. சேமிப்பு விலை வரம்பின் வித்தியாசம்; கூடுதல் தொகுப்புத் தள்ளுபடி இல்லை.",
      installEstimate: "நிறுவல் மதிப்பீடு", installDays: "{days} நாட்கள் · தொகுப்பில் மிக நீண்ட நிறுவல் SLA",
      confirmOrder: "ஆர்டரை உறுதிசெய்", orderCreated: "உங்கள் ஆர்டர் சமர்ப்பிக்கப்பட்டது.",
      stepFourKicker: "படி 4 · உங்கள் ஆர்டர்", trackerHeading: "உங்கள் வணிகம் தொடங்கத் தயாராகிறது",
      trackerPrompt: "இணைப்பு தயாராகும் ஒவ்வொரு படியையும் கண்காணிக்கவும்.", orderId: "ஆர்டர் ID",
      activationEstimate: "செயல்படுத்தும் கால மதிப்பீடு", activateBy: "{days} நாட்களுக்குள் · சுமார் {date}",
      milestoneSubmitted: "ஆர்டர் சமர்ப்பிப்பு", milestoneKyc: "KYC சரிபார்ப்பு",
      milestoneDispatch: "களப் பணி அனுப்பப்பட்டது", milestoneActivated: "செயல்படுத்தப்பட்டது",
      trackerSubmitted: "ஆர்டர் சமர்ப்பிக்கப்பட்டது. சரிபார்ப்பு முன்னேற்றத்தைத் தெரிவிப்போம்.",
      trackerKycPending: "ஆர்டர் சமர்ப்பிக்கப்பட்டது. KYC-க்கு ஒப்புதலும் இரு ஆவணச் சரிபார்ப்புகளும் தேவை.",
      trackerKycDone: "KYC சரிபார்க்கப்பட்டது. களப் பணிக்கு ஆர்டர் தயாராக உள்ளது.",
      trackerDispatch: "களக் குழு அனுப்பப்பட்டது. செயல்படுத்தல் நடைபெறுகிறது.", trackerComplete: "சேவை செயல்படுத்தப்பட்டது. Airtel SYNC-க்கு வரவேற்கிறோம்!",
      trackerKycBlocked: "தொடர ஒப்புதலும் இரு ஆவணச் சரிபார்ப்புகளும் தேவை.",
      advanceTracker: "டெமோ கண்காணிப்பை முன்னேற்று", startAnother: "மற்றொரு விண்ணப்பத்தைத் தொடங்கு",
      trackerDemoNote: "டெமோ கண்காணிப்பு: படி முன்னேற்றம் இந்தப் பக்கத்தில் உருவகப்படுத்தப்படுகிறது.",
      footerProject: "ப்ராஜெக்ட் உதயம் டிஜிட்டல்", footerPrivacy: "உங்கள் தகவல் சரிபார்ப்பு மற்றும் இணைப்புக்கு மட்டுமே.",
      apiUnavailableError: "பின்தளத்தை அணுக முடியவில்லை. http://127.0.0.1:8000-ல் FastAPI-ஐத் தொடங்கி CORS-ஐச் சரிபார்க்கவும்.",
      recommendationError: "பரிந்துரையை உருவாக்க முடியவில்லை. படிவத்தையும் பின்தளத்தையும் சரிபார்த்து மீண்டும் முயலவும்.",
      addonUnavailable: "இந்த சுயவிவரத்திற்கு கிடைக்கவில்லை", addonCctv: "கிளவுட் CCTV",
      addonBackup: "கிளவுட் காப்பு 1 TB", addonPos: "POS SIM · கிளவுட் POS & பில்லிங்",
      perMonth: "/ மாதம்", setup: "அமைப்பு", genericError: "பிழை ஏற்பட்டது. மீண்டும் முயலவும்."
    }
  };

  const chatCopy = {
    en: {
      title: "Ask the AI Advisor",
      subtitle: "Answers grounded in the product catalogue",
      toggle: "Ask AI Advisor",
      close: "Close chat",
      placeholder: "Ask about products, pricing, or setup",
      send: "Send",
      welcome: "Ask me about product features, prices, eligibility, or your recommendation.",
      loading: "Thinking…",
      error: "I couldn’t reach the advisor. Please try again.",
      sources: "Catalogue sources",
      fallback: "Catalogue-based reply · local language model is not enabled or available."
    },
    hi: {
      title: "AI सलाहकार से पूछें",
      subtitle: "उत्पाद सूची पर आधारित जवाब",
      toggle: "AI सलाहकार",
      close: "चैट बंद करें",
      placeholder: "उत्पाद, कीमत या सेटअप के बारे में पूछें",
      send: "भेजें",
      welcome: "उत्पाद, कीमत, पात्रता या अपनी सिफारिश के बारे में पूछें।",
      loading: "सोच रहा है…",
      error: "सलाहकार से संपर्क नहीं हो सका। फिर कोशिश करें।",
      sources: "उत्पाद सूची के स्रोत",
      fallback: "उत्पाद सूची पर आधारित जवाब · स्थानीय भाषा मॉडल उपलब्ध नहीं है।"
    },
    te: {
      title: "AI సలహాదారుని అడగండి",
      subtitle: "ఉత్పత్తుల జాబితా ఆధారిత సమాధానాలు",
      toggle: "AI సలహాదారు",
      close: "చాట్ మూసివేయి",
      placeholder: "ఉత్పత్తులు, ధరలు లేదా సెటప్ గురించి అడగండి",
      send: "పంపండి",
      welcome: "ఉత్పత్తి లక్షణాలు, ధరలు, అర్హత లేదా మీ సిఫార్సు గురించి అడగండి.",
      loading: "ఆలోచిస్తోంది…",
      error: "సలహాదారుని చేరుకోలేకపోయాం. మళ్లీ ప్రయత్నించండి.",
      sources: "ఉత్పత్తుల జాబితా మూలాలు",
      fallback: "ఉత్పత్తుల జాబితా ఆధారిత సమాధానం · స్థానిక భాషా మోడల్ అందుబాటులో లేదు."
    },
    ta: {
      title: "AI ஆலோசகரிடம் கேளுங்கள்",
      subtitle: "தயாரிப்பு பட்டியல் அடிப்படையிலான பதில்கள்",
      toggle: "AI ஆலோசகர்",
      close: "அரட்டையை மூடு",
      placeholder: "தயாரிப்புகள், விலை அல்லது அமைப்பு பற்றி கேளுங்கள்",
      send: "அனுப்பு",
      welcome: "தயாரிப்பு அம்சங்கள், விலைகள், தகுதி அல்லது உங்கள் பரிந்துரையைப் பற்றி கேளுங்கள்.",
      loading: "சிந்திக்கிறது…",
      error: "ஆலோசகரை அணுக முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
      sources: "தயாரிப்பு பட்டியல் ஆதாரங்கள்",
      fallback: "தயாரிப்பு பட்டியல் அடிப்படையிலான பதில் · உள்ளூர் மொழி மாதிரி இல்லை."
    }
  };

  // Optional services are drawn from the product catalogue returned by the API.
  const addonDefinitions = [
    { id: "P23", label: "addonCctv" },
    { id: "P17", label: "addonBackup" },
    { id: "P19", label: "addonPos" }
  ];

  // Session-only data includes document results, never the uploaded image contents.
  const state = {
    language: "en",
    currentStep: 1,
    products: [],
    recommendation: null,
    profile: null,
    consentReceipt: null,
    gstRecord: null,
    udyamRecord: null,
    documents: { utility_bill: null, id: null },
    addons: new Set(),
    order: null,
    trackerStep: 0,
    toastTimer: null,
    chatMessages: [],
    chatBusy: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  function t(key, values = {}) {
    let message = (translations[state.language] || translations.en)[key] || translations.en[key] || key;
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
    return message;
  }

  function applyLanguage(language) {
    state.language = translations[language] ? language : "en";
    document.documentElement.lang = state.language;
    $$("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });
    $$("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    $$("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });
    const languageSelect = $("#language-select");
    languageSelect.value = state.language;
    languageSelect.setAttribute("aria-label", t("languageLabel"));
    renderRecommendation();
    renderCheckout();
    renderAddons();
    renderTracker();
    updateApiStatus();
    updateConsentGate();
    if (state.gstRecord) renderLookupResult("gstin");
    if (state.udyamRecord) renderLookupResult("udyam");
    updateChatLanguage();
  }

  // All backend requests share explicit connection and HTTP error handling.
  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, options);
    } catch (error) {
      updateApiStatus(false);
      throw new Error(t("apiUnavailableError"), { cause: error });
    }
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = typeof body.detail === "string" ? body.detail : "";
      } catch {
        detail = "";
      }
      throw Object.assign(new Error(detail || `Request failed (${response.status}).`), {
        status: response.status
      });
    }
    updateApiStatus(true);
    return response.json();
  }

  function updateApiStatus(connected = null) {
    const dot = $("#api-dot");
    const status = $("#api-status");
    if (connected === null) connected = state.products.length > 0;
    dot.classList.toggle("bg-emerald-500", connected);
    dot.classList.toggle("bg-rose-500", !connected);
    status.textContent = connected ? t("apiReady") : t("apiUnavailable");
    status.classList.toggle("text-rose-500", !connected);
    status.classList.toggle("text-slate-400", connected);
  }

  function showToast(message, isError = false) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }

  function showGlobalError(message) {
    const alert = $("#global-alert");
    alert.className = "mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800";
    alert.textContent = message;
    alert.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearGlobalError() {
    const alert = $("#global-alert");
    alert.className = "hidden";
    alert.textContent = "";
  }

  function setStep(step) {
    state.currentStep = step;
    $$(".wizard-panel").forEach((panel) => {
      panel.classList.toggle("hidden", Number(panel.dataset.step) !== step);
    });
    $$(".step-nav-item").forEach((item) => {
      const itemStep = Number(item.dataset.stepTarget);
      item.classList.toggle("is-active", itemStep === step);
      item.classList.toggle("is-complete", itemStep < step);
      item.setAttribute("aria-current", itemStep === step ? "step" : "false");
    });
    clearGlobalError();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getProduct(productId) {
    return state.products.find((product) => product.product_id === productId);
  }

  function formatMoney(value) {
    return currency.format(Number(value) || 0);
  }

  function createProductLine(item) {
    const wrapper = document.createElement("div");
    wrapper.className = "product-line";
    const description = document.createElement("div");
    const name = document.createElement("p");
    name.className = "product-line-name";
    name.textContent = item.product.product_name;
    const meta = document.createElement("p");
    meta.className = "product-line-meta";
    meta.textContent = `${t("productQuantity")}: ${item.quantity} · ${item.product.unit}`;
    description.append(name, meta);
    const price = document.createElement("p");
    price.className = "product-line-price";
    price.textContent = `${formatMoney(item.monthly_cost_inr)}${t("perMonth")}`;
    wrapper.append(description, price);
    return wrapper;
  }

  // Render server-calculated recommendations without trusting HTML from the API.
  function renderRecommendation() {
    const empty = $("#recommendation-empty");
    const result = $("#recommendation-result");
    const recommendation = state.recommendation;
    empty.classList.toggle("hidden", Boolean(recommendation));
    result.classList.toggle("hidden", !recommendation);
    if (!recommendation) return;

    $("#bundle-type").textContent = recommendation.bundle_type;
    $("#bundle-description").textContent = recommendation.bundle_description;
    const budgetBadge = $("#budget-badge");
    const fitsBudget = recommendation.within_monthly_budget;
    budgetBadge.textContent = t(fitsBudget ? "withinBudget" : "overBudget");
    budgetBadge.className = `rounded-full px-3 py-1 text-xs font-bold ${
      fitsBudget ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`;

    const productList = $("#recommended-products");
    productList.replaceChildren();
    recommendation.products.forEach((product) => productList.append(createProductLine(product)));
    if (recommendation.products.length === 0) {
      const emptyText = document.createElement("p");
      emptyText.className = "py-4 text-sm text-slate-500";
      emptyText.textContent = t("noProducts");
      productList.append(emptyText);
    }
    $("#monthly-total").textContent = formatMoney(recommendation.total_monthly_cost_inr);
    $("#setup-total").textContent = formatMoney(recommendation.setup_fee_inr);
    $("#savings-total").textContent = formatMoney(recommendation.bundle_savings_inr);

    let advisory = t(fitsBudget ? "advisoryWithin" : "advisoryOver");
    if (recommendation.unmet_needs?.length) {
      advisory += ` ${t("advisoryNeeds")}${recommendation.unmet_needs.join(", ")}.`;
    }
    $("#advisory-copy").textContent = advisory;
    $("#to-kyc-button").disabled = recommendation.products.length === 0;
    renderCheckout();
    renderAddons();
  }

  function getProfilePayload(form) {
    const formData = new FormData(form);
    return {
      business_type: String(formData.get("business_type")).trim(),
      employee_count: Number(formData.get("employee_count")),
      num_sites: Number(formData.get("num_sites")),
      city_tier: Number(formData.get("city_tier")),
      state: String(formData.get("state")).trim(),
      has_gstin: formData.get("has_gstin") === "true",
      monthly_budget: Number(formData.get("monthly_budget")),
      key_needs: formData.getAll("key_needs").map(String)
    };
  }

  async function submitProfile(event) {
    event.preventDefault();
    clearGlobalError();
    const button = $("#recommend-button");
    const status = $("#recommend-status");
    button.disabled = true;
    status.textContent = t("lookupChecking");
    try {
      const profile = getProfilePayload(event.currentTarget);
      const recommendation = await apiRequest("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      state.profile = profile;
      state.recommendation = recommendation;
      state.addons.clear();
      status.textContent = "";
      renderRecommendation();
    } catch (error) {
      status.textContent = "";
      showGlobalError(`${t("recommendationError")} ${error.message}`);
    } finally {
      button.disabled = false;
    }
  }

  function addonQuantity(product, profile) {
    if (product.unit === "per site" || product.unit === "per camera") {
      return profile.num_sites;
    }
    return 1;
  }

  function selectedAddonProducts() {
    return [...state.addons]
      .map((id) => getProduct(id))
      .filter(Boolean);
  }

  function renderAddons() {
    const list = $("#addon-list");
    if (!list || !state.recommendation || !state.profile) return;
    list.replaceChildren();
    addonDefinitions.forEach(({ id, label }) => {
      const product = getProduct(id);
      const row = document.createElement("div");
      row.className = "addon-row";
      const content = document.createElement("div");
      const name = document.createElement("p");
      name.className = "addon-name";
      name.textContent = t(label);
      const price = document.createElement("p");
      price.className = "addon-price";
      const available = Boolean(product);
      price.textContent = available
        ? `${formatMoney(product.price_min_inr_per_month * addonQuantity(product, state.profile))}${t("perMonth")} · ${formatMoney(product.one_time_setup_inr * addonQuantity(product, state.profile))} ${t("setup")}`
        : t("addonUnavailable");
      content.append(name, price);

      const toggleLabel = document.createElement("label");
      toggleLabel.className = "toggle";
      toggleLabel.setAttribute("aria-label", name.textContent);
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.addons.has(id);
      input.disabled = !available;
      input.addEventListener("change", () => {
        if (input.checked) state.addons.add(id);
        else state.addons.delete(id);
        renderCheckout();
      });
      const track = document.createElement("span");
      track.className = "toggle-track";
      toggleLabel.append(input, track);
      row.append(content, toggleLabel);
      list.append(row);
    });
    renderCheckout();
  }

  function getCheckoutTotals() {
    const recommendation = state.recommendation;
    if (!recommendation || !state.profile) return null;
    const selected = selectedAddonProducts().map((product) => {
      const quantity = addonQuantity(product, state.profile);
      return {
        product,
        quantity,
        monthly_cost_inr: product.price_min_inr_per_month * quantity,
        setup_fee_inr: product.one_time_setup_inr * quantity,
        monthly_savings_inr:
          (product.price_max_inr_per_month - product.price_min_inr_per_month) * quantity
      };
    });
    return {
      addons: selected,
      monthly: recommendation.total_monthly_cost_inr + selected.reduce((sum, item) => sum + item.monthly_cost_inr, 0),
      addonMonthly: selected.reduce((sum, item) => sum + item.monthly_cost_inr, 0),
      setup: recommendation.setup_fee_inr + selected.reduce((sum, item) => sum + item.setup_fee_inr, 0),
      savings: recommendation.bundle_savings_inr + selected.reduce((sum, item) => sum + item.monthly_savings_inr, 0)
    };
  }

  function renderCheckout() {
    const list = $("#checkout-products");
    if (!list) return;
    list.replaceChildren();
    if (!state.recommendation) return;
    state.recommendation.products.forEach((product) => list.append(createProductLine(product)));
    const totals = getCheckoutTotals();
    if (!totals) return;
    $("#checkout-monthly").textContent = formatMoney(state.recommendation.total_monthly_cost_inr);
    $("#checkout-addon-monthly").textContent = formatMoney(totals.addonMonthly);
    $("#checkout-total-monthly").textContent = formatMoney(totals.monthly);
    $("#checkout-setup").textContent = formatMoney(totals.setup);
    $("#checkout-savings").textContent = formatMoney(totals.savings);
    const installDays = [
      ...state.recommendation.products.map((item) => item.product.typical_install_days),
      ...totals.addons.map((item) => item.product.typical_install_days)
    ];
    const longestDays = installDays.length ? Math.max(...installDays) : 0;
    $("#checkout-install-days").textContent = t("installDays", { days: longestDays });
  }

  function setLookupMessage(kind, message, badgeClass = "") {
    const output = $(`#${kind}-result`);
    output.replaceChildren();
    if (badgeClass) {
      const badge = document.createElement("span");
      badge.className = `status-badge ${badgeClass}`;
      badge.textContent = message;
      output.append(badge);
    } else {
      output.textContent = message;
    }
  }

  function renderLookupResult(kind) {
    const record = kind === "gstin" ? state.gstRecord : state.udyamRecord;
    if (!record) return;
    const status = kind === "gstin" ? record.status : t("registryFound");
    const badgeClass = kind === "gstin" ? status.toLowerCase() : "active";
    const name = kind === "gstin" ? record.trade_name : record.enterprise_name;
    const details = document.createElement("span");
    details.className = "ml-2";
    details.textContent = `${t("registryName")}: ${name}`;
    const output = $(`#${kind}-result`);
    output.replaceChildren();
    const badge = document.createElement("span");
    badge.className = `status-badge ${badgeClass}`;
    badge.textContent = status;
    output.append(badge, details);
  }

  // Debounce registry queries and ignore responses for values the user has changed.
  const lookupTimers = { gstin: null, udyam: null };
  const lookupSequence = { gstin: 0, udyam: 0 };

  function lookupConfig(kind) {
    return kind === "gstin"
      ? {
          input: $("#gstin-lookup"),
          path: "/api/lookup/gstin/",
          isComplete: (value) => /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(value)
        }
      : {
          input: $("#udyam-lookup"),
          path: "/api/lookup/udyam/",
          isComplete: (value) => /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(value)
        };
  }

  async function runLookup(kind, fromBlur = false) {
    const config = lookupConfig(kind);
    const identifier = config.input.value.trim().toUpperCase();
    lookupSequence[kind] += 1;
    const sequence = lookupSequence[kind];
    if (!identifier) {
      if (kind === "gstin") state.gstRecord = null;
      else state.udyamRecord = null;
      setLookupMessage(kind, t("lookupWaiting"));
      return;
    }
    if (!config.isComplete(identifier)) {
      if (fromBlur) setLookupMessage(kind, t("lookupInvalid"));
      return;
    }
    setLookupMessage(kind, t("lookupChecking"), "loading");
    try {
      const result = await apiRequest(`${config.path}${encodeURIComponent(identifier)}`);
      if (sequence !== lookupSequence[kind]) return;
      if (kind === "gstin") state.gstRecord = result;
      else state.udyamRecord = result;
      renderLookupResult(kind);
    } catch (error) {
      if (sequence !== lookupSequence[kind]) return;
      if (kind === "gstin") state.gstRecord = null;
      else state.udyamRecord = null;
      setLookupMessage(kind, error.status === 404 ? t("lookupNotFound") : t("lookupFailed"));
    }
  }

  function scheduleLookup(kind) {
    window.clearTimeout(lookupTimers[kind]);
    lookupTimers[kind] = window.setTimeout(() => runLookup(kind), 450);
  }

  function updateConsentGate() {
    const consented = Boolean(
      state.consentReceipt &&
      state.consentReceipt.consent_given &&
      state.consentReceipt.data_minimization_ack
    );
    $$("#utility-file, #signatory-file").forEach((input) => {
      input.disabled = !consented;
      input.closest(".drop-zone").classList.toggle("is-disabled", !consented);
    });
    $("#upload-consent-gate").classList.toggle("hidden", consented);
  }

  // Consent is recorded before the UI enables any document upload.
  async function recordConsent() {
    const given = $("#consent-given").checked;
    const minimizationAck = $("#consent-minimization").checked;
    if (!given || !minimizationAck) {
      $("#consent-status").textContent = t("consentRequired");
      $("#consent-status").classList.add("text-rose-600");
      return;
    }
    const button = $("#consent-button");
    button.disabled = true;
    $("#consent-status").textContent = t("lookupChecking");
    try {
      state.consentReceipt = await apiRequest("/api/kyc/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: `WEB-${Date.now()}`,
          consent_given: true,
          purpose: "Business identity verification, eligibility checks, and onboarding.",
          timestamp: new Date().toISOString(),
          data_minimization_ack: true
        })
      });
      $("#consent-status").textContent = `${t("consentRecorded")} ${state.consentReceipt.consent_id}`;
      $("#consent-status").classList.remove("text-rose-600");
      updateConsentGate();
      renderTracker();
    } catch (error) {
      $("#consent-status").textContent = error.message;
      $("#consent-status").classList.add("text-rose-600");
    } finally {
      button.disabled = false;
    }
  }

  function renderDocumentResult(container, result, filename) {
    container.classList.remove("error");
    container.replaceChildren();
    const heading = document.createElement("div");
    heading.className = "flex items-center justify-between gap-2";
    const fileName = document.createElement("span");
    fileName.className = "truncate font-bold";
    fileName.textContent = filename;
    const badge = document.createElement("span");
    badge.className = `status-badge ${result.verification_status === "PASS" ? "pass" : "flagged"}`;
    badge.textContent = result.verification_status === "PASS" ? t("uploadPass") : t("uploadFlagged");
    heading.append(fileName, badge);
    container.append(heading);

    const fields = Object.entries(result.extracted_fields || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`);
    const details = document.createElement("p");
    details.className = "mt-2";
    details.textContent = fields.length ? `${t("extracted")}: ${fields.join(" · ")}` : t("noFields");
    container.append(details);
    const reasons = [...(result.flag_reasons || []), ...(result.drop_reasons || [])];
    if (reasons.length) {
      const reasonLine = document.createElement("p");
      reasonLine.className = "mt-1 text-rose-700";
      reasonLine.textContent = `${t("reasons")}: ${[...new Set(reasons)].join(" · ")}`;
      container.append(reasonLine);
    }
  }

  async function verifyDocument(file, docType) {
    if (!state.consentReceipt) {
      throw new Error(t("uploadConsentRequired"));
    }
    if (!file.type.startsWith("image/")) {
      throw new Error(t("uploadInvalidType"));
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(t("uploadTooLarge"));
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    if (state.gstRecord) formData.append("gstin", state.gstRecord.gstin);
    if (state.udyamRecord) formData.append("udyam_no", state.udyamRecord.udyam_number);
    const businessName = state.gstRecord?.trade_name || state.udyamRecord?.enterprise_name;
    if (businessName) formData.append("applicant_name", businessName);
    return apiRequest("/api/kyc/verify-document", { method: "POST", body: formData });
  }

  async function handleUpload(file, docType) {
    const resultContainer = docType === "utility_bill" ? $("#utility-result") : $("#signatory-result");
    resultContainer.classList.remove("error");
    resultContainer.textContent = t("uploadChecking");
    try {
      const result = await verifyDocument(file, docType);
      state.documents[docType] = result;
      renderDocumentResult(resultContainer, result, file.name);
      renderTracker();
    } catch (error) {
      state.documents[docType] = null;
      resultContainer.classList.add("error");
      resultContainer.textContent = error.message || t("genericError");
      renderTracker();
    }
  }

  // Drop zones share the same validation and upload path as the file pickers.
  function setupDropZones() {
    $$("[data-upload-zone]").forEach((zone) => {
      const input = $("input[type='file']", zone);
      const docType = zone.dataset.uploadZone;
      input.addEventListener("change", () => {
        if (input.files?.[0]) handleUpload(input.files[0], docType);
        input.value = "";
      });
      zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (!input.disabled) zone.classList.add("is-dragging");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("is-dragging");
        if (input.disabled) {
          showToast(t("uploadConsentRequired"), true);
          return;
        }
        const file = event.dataTransfer?.files?.[0];
        if (file) handleUpload(file, docType);
      });
    });
  }

  function randomOrderId() {
    const year = new Date().getFullYear();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${year}-${suffix}`;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(state.language, {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function isKycVerified() {
    return Boolean(
      state.order?.kycVerified ||
      (
        state.consentReceipt?.consent_given &&
        state.consentReceipt?.data_minimization_ack &&
        state.documents.utility_bill?.verification_status === "PASS" &&
        state.documents.id?.verification_status === "PASS"
      )
    );
  }

  function renderTracker() {
    const orderIdElement = $("#order-id");
    if (!orderIdElement) return;
    const order = state.order;
    if (!order) return;
    orderIdElement.textContent = order.orderId;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + order.installDays);
    $("#activation-date").textContent = t("activateBy", {
      days: order.installDays,
      date: formatDate(estimatedDate)
    });

    const kycPassed = isKycVerified();
    const effectiveStep = Math.min(state.trackerStep, kycPassed ? 3 : 0);
    $$(".timeline-step").forEach((stepElement) => {
      const milestone = Number(stepElement.dataset.milestone);
      stepElement.classList.toggle("is-current", milestone === effectiveStep);
      stepElement.classList.toggle("is-complete", milestone < effectiveStep);
    });
    let statusKey = "trackerSubmitted";
    if (effectiveStep === 0) statusKey = kycPassed ? "trackerSubmitted" : "trackerKycPending";
    if (effectiveStep === 1) statusKey = kycPassed ? "trackerKycDone" : "trackerKycPending";
    if (effectiveStep === 2) statusKey = "trackerDispatch";
    if (effectiveStep === 3) statusKey = "trackerComplete";
    $("#tracker-status").textContent = t(statusKey);
    const advanceButton = $("#advance-tracker");
    advanceButton.disabled = effectiveStep >= 3;
    advanceButton.classList.toggle("hidden", effectiveStep >= 3);
  }

  // Checkout totals are converted into a privacy-minimized local tracking record.
  function confirmOrder() {
    if (!state.recommendation) {
      showToast(t("recommendationError"), true);
      setStep(1);
      return;
    }
    const totals = getCheckoutTotals();
    const selectedItems = [
      ...state.recommendation.products,
      ...(totals?.addons || [])
    ];
    const orderId = randomOrderId();
    const installDays = Math.max(
      0,
      ...selectedItems.map((item) => item.product.typical_install_days || 0)
    );
    state.order = { orderId, installDays };
    state.order.kycVerified = isKycVerified();
    state.trackerStep = 0;
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({
        orderId,
        installDays,
        createdAt: new Date().toISOString(),
        bundleType: state.recommendation.bundle_type,
        kycVerified: state.order.kycVerified,
        trackerStep: state.trackerStep
      }));
    } catch (error) {
      console.warn("Order could not be saved in local storage.", error);
    }
    renderTracker();
    setStep(4);
    showToast(t("orderCreated"));
  }

  function advanceTracker() {
    if (state.trackerStep === 0 && !isKycVerified()) {
      showToast(t("trackerKycBlocked"), true);
      return;
    }
    state.trackerStep = Math.min(state.trackerStep + 1, 3);
    try {
      localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify({ ...state.order, trackerStep: state.trackerStep })
      );
    } catch (error) {
      console.warn("Order progress could not be saved in local storage.", error);
    }
    renderTracker();
  }

  // Keep the demo order identifier available for self-service tracking after refresh.
  function restoreSavedOrder() {
    try {
      const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
      if (!savedOrder) return;
      const parsedOrder = JSON.parse(savedOrder);
      if (
        typeof parsedOrder.orderId !== "string" ||
        typeof parsedOrder.installDays !== "number"
      ) {
        localStorage.removeItem(ORDER_STORAGE_KEY);
        return;
      }
      state.order = {
        orderId: parsedOrder.orderId,
        installDays: parsedOrder.installDays,
        kycVerified: parsedOrder.kycVerified === true
      };
      state.trackerStep = Number.isInteger(parsedOrder.trackerStep)
        ? Math.max(0, Math.min(3, parsedOrder.trackerStep))
        : 0;
      renderTracker();
      setStep(4);
    } catch (error) {
      console.warn("Saved demo order could not be restored.", error);
    }
  }

  function startAnotherApplication() {
    state.currentStep = 1;
    state.recommendation = null;
    state.profile = null;
    state.consentReceipt = null;
    state.gstRecord = null;
    state.udyamRecord = null;
    state.documents = { utility_bill: null, id: null };
    state.addons.clear();
    state.order = null;
    state.trackerStep = 0;
    $("#profile-form").reset();
    $("#gstin-lookup").value = "";
    $("#udyam-lookup").value = "";
    $("#consent-given").checked = false;
    $("#consent-minimization").checked = false;
    $("#consent-status").textContent = "";
    $("#utility-result").replaceChildren();
    $("#signatory-result").replaceChildren();
    $("#gstin-result").textContent = t("lookupWaiting");
    $("#udyam-result").textContent = t("lookupWaiting");
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (error) {
      console.warn("Saved demo order could not be cleared.", error);
    }
    updateConsentGate();
    renderRecommendation();
    setStep(1);
  }

  async function loadProducts() {
    try {
      state.products = await apiRequest("/api/products");
      updateApiStatus(true);
      renderAddons();
    } catch (error) {
      updateApiStatus(false);
      showGlobalError(`${t("apiUnavailableError")} ${error.message}`);
    }
  }

  function updateChatLanguage() {
    const copy = chatCopy[state.language] || chatCopy.en;
    $("#advisor-chat").setAttribute("aria-label", copy.title);
    $("#chat-title").textContent = copy.title;
    $("#chat-subtitle").textContent = copy.subtitle;
    $("#chat-toggle-label").textContent = copy.toggle;
    $("#chat-toggle").setAttribute("aria-label", copy.toggle);
    $("#chat-close").setAttribute("aria-label", copy.close);
    $("label[for='chat-input']").textContent = copy.placeholder;
    $("#chat-input").placeholder = copy.placeholder;
    $("#chat-send").textContent = copy.send;
    renderChatMessages();
  }

  function renderChatMessages() {
    const container = $("#chat-messages");
    const copy = chatCopy[state.language] || chatCopy.en;
    container.replaceChildren();

    if (state.chatMessages.length === 0) {
      const welcome = document.createElement("p");
      welcome.className = "chat-bubble chat-assistant";
      welcome.textContent = copy.welcome;
      container.append(welcome);
    }

    for (const message of state.chatMessages) {
      const bubble = document.createElement("article");
      bubble.className = `chat-bubble ${message.role === "user" ? "chat-user" : "chat-assistant"}`;
      const answer = document.createElement("p");
      answer.textContent = message.content;
      bubble.append(answer);
      if (message.sources?.length) {
        const sources = document.createElement("small");
        sources.textContent = `${copy.sources}: ${message.sources.join(", ")}`;
        bubble.append(sources);
      }
      if (message.mode === "catalogue_fallback") {
        const mode = document.createElement("small");
        mode.textContent = copy.fallback;
        bubble.append(mode);
      }
      container.append(bubble);
    }

    if (state.chatBusy) {
      const waiting = document.createElement("p");
      waiting.className = "chat-bubble chat-assistant chat-waiting";
      waiting.textContent = copy.loading;
      container.append(waiting);
    }
    container.scrollTop = container.scrollHeight;
  }

  function setChatOpen(open) {
    $("#chat-panel").hidden = !open;
    $("#chat-toggle").setAttribute("aria-expanded", String(open));
    if (open) $("#chat-input").focus();
  }

  async function sendChatMessage(event) {
    event.preventDefault();
    if (state.chatBusy) return;
    const input = $("#chat-input");
    const message = input.value.trim();
    if (!message) return;

    state.chatMessages.push({ role: "user", content: message });
    state.chatMessages = state.chatMessages.slice(-12);
    input.value = "";
    state.chatBusy = true;
    renderChatMessages();

    const recommendationProducts = state.recommendation?.products || [];
    const context = {
      step: state.currentStep,
      profile: state.profile,
      recommended_products: recommendationProducts.map((item) => ({
        product_id: item.product.product_id,
        product_name: item.product.product_name
      })),
      chat_history: state.chatMessages.slice(-7).map(({ role, content }) => ({
        role,
        content
      }))
    };

    try {
      const response = await apiRequest("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language: state.language, context })
      });
      state.chatMessages.push({
        role: "assistant",
        content: response.answer,
        sources: response.source_products,
        mode: response.mode
      });
    } catch (error) {
      const copy = chatCopy[state.language] || chatCopy.en;
      state.chatMessages.push({
        role: "assistant",
        content: error.message || copy.error
      });
    } finally {
      state.chatBusy = false;
      state.chatMessages = state.chatMessages.slice(-12);
      renderChatMessages();
    }
  }

  function bindEvents() {
    $("#language-select").addEventListener("change", (event) => applyLanguage(event.target.value));
    $("#profile-form").addEventListener("submit", submitProfile);
    $("#to-kyc-button").addEventListener("click", () => setStep(2));
    $("#consent-button").addEventListener("click", recordConsent);
    $("#confirm-order-button").addEventListener("click", confirmOrder);
    $("#advance-tracker").addEventListener("click", advanceTracker);
    $("#restart-button").addEventListener("click", startAnotherApplication);
    $("#chat-toggle").addEventListener("click", () => {
      setChatOpen($("#chat-panel").hidden);
    });
    $("#chat-close").addEventListener("click", () => setChatOpen(false));
    $("#chat-form").addEventListener("submit", sendChatMessage);
    $("#chat-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        $("#chat-form").requestSubmit();
      }
    });

    $$(".step-nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        const target = Number(button.dataset.stepTarget);
        if (target === 3 && !state.recommendation) {
          showToast(t("recommendationError"), true);
          return;
        }
        if (target === 4 && !state.order) {
          showToast(t("genericError"), true);
          return;
        }
        if (target === 3) renderCheckout();
        if (target === 4) renderTracker();
        setStep(target);
      });
    });

    $$("[data-step-back]").forEach((button) => {
      button.addEventListener("click", () => setStep(Number(button.dataset.stepBack)));
    });
    $$("[data-step-next]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.stepNext === "3" && !state.recommendation) {
          showToast(t("recommendationError"), true);
          setStep(1);
          return;
        }
        setStep(Number(button.dataset.stepNext));
      });
    });

    for (const kind of ["gstin", "udyam"]) {
      const config = lookupConfig(kind);
      config.input.addEventListener("input", () => {
        config.input.value = config.input.value.toUpperCase();
        lookupSequence[kind] += 1;
        if (kind === "gstin") state.gstRecord = null;
        else state.udyamRecord = null;
        setLookupMessage(
          kind,
          config.input.value.trim() ? t("lookupInvalid") : t("lookupWaiting")
        );
        scheduleLookup(kind);
      });
      config.input.addEventListener("blur", () => {
        window.clearTimeout(lookupTimers[kind]);
        runLookup(kind, true);
      });
    }
    setupDropZones();
  }

  applyLanguage("en");
  bindEvents();
  restoreSavedOrder();
  loadProducts();
})();
