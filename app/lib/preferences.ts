import { Button, Div, Base, Span } from '@codesuma/baseline'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'hi' | 'zh' | 'tr' | 'ja' | 'ru' | 'pt' | 'ko'

// Keep the language options ordered by common use, with each native language name shown in its own script.
const languages: { code: Language; name: string; locale: string }[] = [
    { code: 'en', name: 'English', locale: 'en' },
    { code: 'es', name: 'Español', locale: 'es' },
    { code: 'fr', name: 'Français', locale: 'fr' },
    { code: 'de', name: 'Deutsch', locale: 'de' },
    { code: 'ar', name: 'العربية', locale: 'ar' },
    { code: 'hi', name: 'हिन्दी', locale: 'hi' },
    { code: 'zh', name: '简体中文', locale: 'zh-CN' },
    { code: 'tr', name: 'Türkçe', locale: 'tr' },
    { code: 'ja', name: '日本語', locale: 'ja' },
    { code: 'ru', name: 'Русский', locale: 'ru' },
    { code: 'pt', name: 'Português', locale: 'pt' },
    { code: 'ko', name: '한국어', locale: 'ko' }
]

// These new keys cover the generated-link actions so the copy, open, and QR
// labels stay translated consistently across every language the app supports.
type TranslationKey =
    | 'language' | 'switchDark' | 'switchLight' | 'intro' | 'benefitsTitle'
    | 'fast' | 'fastDetail' | 'private' | 'privateDetail' | 'safe' | 'safeDetail'
    | 'resumable' | 'resumableDetail' | 'simple' | 'simpleDetail' | 'reliable' | 'reliableDetail'
    | 'aboutTitle' | 'aboutDescription' | 'expiryLabel' | 'hour' | 'day' | 'week'
    | 'protect' | 'passwordPlaceholder' | 'agree' | 'terms' | 'and' | 'privacy'
    | 'dropTitle' | 'dropHint' | 'resumeNote' | 'upload' | 'continueUpload' | 'discard'
    | 'preparingUpload' | 'assemblingParts' | 'sendingParts' | 'continuingUpload'
    | 'expirySummary' | 'linkExpiresAt' | 'copy' | 'copied' | 'openLink' | 'qrCode' | 'qrCodeTitle' | 'close' | 'tryAgain' | 'sendAnother'
    // These messages explain the consent gate and required upload password.
    | 'acceptBeforeSelect' | 'acceptBeforeUpload' | 'acceptBeforeUse' | 'passwordRequired' | 'tooLarge' | 'passwordTooShort' | 'uploadFailed'
    // Dedicated preview actions keep their labels consistent across locales.
    | 'loading' | 'protectedTitle' | 'protectedPrompt' | 'enterPassword' | 'unlock' | 'download' | 'preview' | 'backToShare' | 'previewUnavailable'
    | 'nothingHere' | 'linkDidNotWork' | 'pleaseEnterPassword' | 'missingTitle' | 'missingIntro' | 'sendFile'

type Dictionary = Record<TranslationKey, string>

const translations: Partial<Record<Language, Dictionary>> = {
    en: {
        language: 'Language', switchDark: 'Switch to dark mode', switchLight: 'Switch to light mode',
        intro: 'Share a file in seconds. Send up to 1 GB and pick up interrupted uploads where they left off.',
        benefitsTitle: 'Why people use Linkify', fast: 'Fast', fastDetail: 'Send files quickly',
        private: 'Private', privateDetail: 'Only signed links see it', safe: 'Safe', safeDetail: 'Optional password protection',
        resumable: 'Resumable', resumableDetail: 'Resume interrupted uploads', simple: 'Simple', simpleDetail: 'No account required',
        reliable: 'Reliable', reliableDetail: 'Private links expire on time', aboutTitle: 'About Linkify',
        aboutDescription: 'Linkify is a simple way to send large files without creating an account. Uploads up to 1 GB can resume after interruptions, and every share link expires on the schedule you choose. Add optional password protection when a transfer needs extra privacy.',
        expiryLabel: 'Link expires after', hour: '1 hour', day: '1 day', week: '1 week', protect: 'Protect with password',
        passwordPlaceholder: 'Password (min 6 chars)', agree: 'I agree to the', terms: 'Terms of Service', and: 'and', privacy: 'Privacy Policy',
        dropTitle: 'Choose a file or drop it here', dropHint: 'Up to 1 GB. An interrupted upload picks up where it stopped.',
        resumeNote: 'We still have part of this file from an earlier attempt. Continuing will only send what is missing.',
        upload: 'Upload', continueUpload: 'Continue upload', discard: 'Start fresh', preparingUpload: 'Preparing the upload',
        assemblingParts: 'Putting the parts together', sendingParts: 'Sending {missing} of {total} parts',
        continuingUpload: 'Continuing an earlier upload, {sent} of {total} parts already sent',
        expirySummary: 'This link expires in {duration}.', linkExpiresAt: 'Link expires {date}', copy: 'Copy', copied: 'Copied', openLink: 'Open', qrCode: 'QR', qrCodeTitle: 'Scan this QR code', close: 'Close', tryAgain: 'Try again', sendAnother: 'Send another file',
        acceptBeforeSelect: 'Please accept the Terms of Service and Privacy Policy before selecting a file.',
        acceptBeforeUpload: 'Please accept the Terms of Service and Privacy Policy before uploading.',
        acceptBeforeUse: 'Check the box above to use this tool.',
        passwordRequired: 'The password is empty. Please enter a password.',
        tooLarge: '{name} is {size}. The limit is 1 GB.', passwordTooShort: 'Passwords must be at least 6 characters long.', uploadFailed: 'The upload failed',
        loading: 'Loading', protectedTitle: 'Protected file', protectedPrompt: 'Enter the password to preview and download this file.',
        enterPassword: 'Password', unlock: 'Unlock', download: 'Download', preview: 'Preview', backToShare: 'Back to share link', previewUnavailable: 'Your browser cannot preview this file type. Use Download to open it.', nothingHere: 'Nothing here', linkDidNotWork: 'This link did not work',
        pleaseEnterPassword: 'Please enter the password for this file.', missingTitle: 'Nothing at this address',
        missingIntro: 'The link may have been mistyped, or the file it pointed at is gone.', sendFile: 'Send a file'
    },
    es: {
        language: 'Idioma', switchDark: 'Cambiar al modo oscuro', switchLight: 'Cambiar al modo claro',
        intro: 'Comparte un archivo en segundos. Envía hasta 1 GB y reanuda las cargas interrumpidas.',
        benefitsTitle: 'Por qué usar Linkify', fast: 'Rápido', fastDetail: 'Envía archivos rápidamente',
        private: 'Privado', privateDetail: 'Solo funcionan enlaces firmados', safe: 'Seguro', safeDetail: 'Protección opcional con contraseña',
        resumable: 'Reanudable', resumableDetail: 'Continúa cargas interrumpidas', simple: 'Sencillo', simpleDetail: 'No necesitas una cuenta',
        reliable: 'Fiable', reliableDetail: 'Los enlaces privados caducan', aboutTitle: 'Acerca de Linkify',
        aboutDescription: 'Linkify permite enviar archivos grandes sin crear una cuenta. Las cargas de hasta 1 GB se pueden reanudar tras una interrupción y cada enlace caduca según el plazo que elijas. Añade una contraseña opcional para mayor privacidad.',
        expiryLabel: 'El enlace caduca en', hour: '1 hora', day: '1 día', week: '1 semana', protect: 'Proteger con contraseña',
        passwordPlaceholder: 'Contraseña (mín. 6 caracteres)', agree: 'Acepto los', terms: 'Términos del servicio', and: 'y la', privacy: 'Política de privacidad',
        dropTitle: 'Elige un archivo o suéltalo aquí', dropHint: 'Hasta 1 GB. Las cargas interrumpidas se pueden reanudar.',
        resumeNote: 'Hay partes de este archivo de un intento anterior. Al continuar solo se enviará lo que falta.',
        upload: 'Subir', continueUpload: 'Continuar carga', discard: 'Empezar de nuevo', preparingUpload: 'Preparando la carga',
        assemblingParts: 'Uniendo las partes', sendingParts: 'Enviando {missing} de {total} partes',
        continuingUpload: 'Continuando una carga anterior: {sent} de {total} partes enviadas',
        expirySummary: 'Este enlace caduca en {duration}.', linkExpiresAt: 'El enlace caduca el {date}', copy: 'Copiar', copied: 'Copiado', openLink: 'Abrir', qrCode: 'QR', qrCodeTitle: 'Escanea este código QR', close: 'Cerrar', tryAgain: 'Reintentar', sendAnother: 'Enviar otro archivo',
        acceptBeforeSelect: 'Acepta los Términos del servicio y la Política de privacidad antes de elegir un archivo.',
        acceptBeforeUpload: 'Acepta los Términos del servicio y la Política de privacidad antes de subir.',
        acceptBeforeUse: 'Marca la casilla de arriba para usar esta herramienta.',
        passwordRequired: 'La contraseña está vacía. Introduce una contraseña.',
        tooLarge: '{name} ocupa {size}. El límite es 1 GB.', passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.', uploadFailed: 'La carga ha fallado',
        loading: 'Cargando', protectedTitle: 'Archivo protegido', protectedPrompt: 'Introduce la contraseña para previsualizar y descargar este archivo.',
        enterPassword: 'Contraseña', unlock: 'Desbloquear', download: 'Descargar', preview: 'Vista previa', backToShare: 'Volver al enlace compartido', previewUnavailable: 'El navegador no puede previsualizar este tipo de archivo. Usa Descargar para abrirlo.', nothingHere: 'No hay nada aquí', linkDidNotWork: 'Este enlace no funciona',
        pleaseEnterPassword: 'Introduce la contraseña de este archivo.', missingTitle: 'No hay nada en esta dirección',
        missingIntro: 'Puede que el enlace esté mal escrito o que el archivo ya no exista.', sendFile: 'Enviar un archivo'
    },
    fr: {
        language: 'Langue', switchDark: 'Activer le mode sombre', switchLight: 'Activer le mode clair',
        intro: 'Partagez un fichier en quelques secondes. Envoyez jusqu’à 1 Go et reprenez les transferts interrompus.',
        benefitsTitle: 'Pourquoi choisir Linkify', fast: 'Rapide', fastDetail: 'Envoyez vos fichiers rapidement',
        private: 'Privé', privateDetail: 'Seuls les liens signés fonctionnent', safe: 'Sécurisé', safeDetail: 'Protection par mot de passe facultative',
        resumable: 'Reprenable', resumableDetail: 'Reprenez les transferts interrompus', simple: 'Simple', simpleDetail: 'Aucun compte requis',
        reliable: 'Fiable', reliableDetail: 'Les liens privés expirent à temps', aboutTitle: 'À propos de Linkify',
        aboutDescription: 'Linkify permet d’envoyer de gros fichiers sans créer de compte. Les transferts jusqu’à 1 Go peuvent reprendre après une interruption et chaque lien expire selon la durée choisie. Ajoutez un mot de passe facultatif pour plus de confidentialité.',
        expiryLabel: 'Expiration du lien', hour: '1 heure', day: '1 jour', week: '1 semaine', protect: 'Protéger par mot de passe',
        passwordPlaceholder: 'Mot de passe (6 caractères min.)', agree: 'J’accepte les', terms: 'Conditions d’utilisation', and: 'et la', privacy: 'Politique de confidentialité',
        dropTitle: 'Choisissez un fichier ou déposez-le ici', dropHint: 'Jusqu’à 1 Go. Un transfert interrompu peut reprendre.',
        resumeNote: 'Une partie de ce fichier provient d’un précédent envoi. Seuls les éléments manquants seront transférés.',
        upload: 'Envoyer', continueUpload: 'Reprendre l’envoi', discard: 'Recommencer', preparingUpload: 'Préparation du transfert',
        assemblingParts: 'Assemblage des parties', sendingParts: 'Envoi de {missing} sur {total} parties',
        continuingUpload: 'Reprise du transfert : {sent} parties sur {total} déjà envoyées',
        expirySummary: 'Ce lien expire dans {duration}.', linkExpiresAt: 'Le lien expire le {date}', copy: 'Copier', copied: 'Copié', openLink: 'Ouvrir', qrCode: 'QR', qrCodeTitle: 'Scannez ce code QR', close: 'Fermer', tryAgain: 'Réessayer', sendAnother: 'Envoyer un autre fichier',
        acceptBeforeSelect: 'Acceptez les Conditions d’utilisation et la Politique de confidentialité avant de choisir un fichier.',
        acceptBeforeUpload: 'Acceptez les Conditions d’utilisation et la Politique de confidentialité avant l’envoi.',
        acceptBeforeUse: 'Cochez la case ci-dessus pour utiliser cet outil.',
        passwordRequired: 'Le mot de passe est vide. Veuillez en saisir un.',
        tooLarge: '{name} fait {size}. La limite est de 1 Go.', passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.', uploadFailed: 'Échec du transfert',
        loading: 'Chargement', protectedTitle: 'Fichier protégé', protectedPrompt: 'Saisissez le mot de passe pour prévisualiser et télécharger ce fichier.',
        enterPassword: 'Mot de passe', unlock: 'Déverrouiller', download: 'Télécharger', preview: 'Aperçu', backToShare: 'Retour au lien de partage', previewUnavailable: 'Votre navigateur ne peut pas prévisualiser ce type de fichier. Utilisez Télécharger pour l’ouvrir.', nothingHere: 'Rien ici', linkDidNotWork: 'Ce lien ne fonctionne pas',
        pleaseEnterPassword: 'Saisissez le mot de passe de ce fichier.', missingTitle: 'Aucun contenu à cette adresse',
        missingIntro: 'Le lien est peut-être incorrect ou le fichier a été supprimé.', sendFile: 'Envoyer un fichier'
    },
    de: {
        language: 'Sprache', switchDark: 'Dunkelmodus aktivieren', switchLight: 'Hellmodus aktivieren',
        intro: 'Teile Dateien in Sekunden. Sende bis zu 1 GB und setze unterbrochene Uploads fort.',
        benefitsTitle: 'Warum Linkify?', fast: 'Schnell', fastDetail: 'Dateien schnell senden',
        private: 'Privat', privateDetail: 'Nur signierte Links funktionieren', safe: 'Sicher', safeDetail: 'Optionaler Passwortschutz',
        resumable: 'Fortsetzbar', resumableDetail: 'Unterbrochene Uploads fortsetzen', simple: 'Einfach', simpleDetail: 'Kein Konto erforderlich',
        reliable: 'Zuverlässig', reliableDetail: 'Private Links laufen planmäßig ab', aboutTitle: 'Über Linkify',
        aboutDescription: 'Mit Linkify kannst du große Dateien ohne Konto versenden. Uploads bis zu 1 GB lassen sich nach einer Unterbrechung fortsetzen. Jeder Freigabelink läuft nach dem gewählten Zeitraum ab. Bei Bedarf kannst du ein Passwort festlegen.',
        expiryLabel: 'Link läuft ab nach', hour: '1 Stunde', day: '1 Tag', week: '1 Woche', protect: 'Mit Passwort schützen',
        passwordPlaceholder: 'Passwort (mind. 6 Zeichen)', agree: 'Ich stimme den', terms: 'Nutzungsbedingungen', and: 'und der', privacy: 'Datenschutzerklärung',
        dropTitle: 'Datei auswählen oder hier ablegen', dropHint: 'Bis zu 1 GB. Unterbrochene Uploads können fortgesetzt werden.',
        resumeNote: 'Teile dieser Datei stammen aus einem früheren Versuch. Es werden nur die fehlenden Teile übertragen.',
        upload: 'Hochladen', continueUpload: 'Upload fortsetzen', discard: 'Neu beginnen', preparingUpload: 'Upload wird vorbereitet',
        assemblingParts: 'Dateiteile werden zusammengesetzt', sendingParts: '{missing} von {total} Teilen werden gesendet',
        continuingUpload: 'Vorheriger Upload wird fortgesetzt: {sent} von {total} Teilen bereits gesendet',
        expirySummary: 'Dieser Link läuft in {duration} ab.', linkExpiresAt: 'Link läuft ab am {date}', copy: 'Kopieren', copied: 'Kopiert', openLink: 'Öffnen', qrCode: 'QR', qrCodeTitle: 'Scanne diesen QR-Code', close: 'Schließen', tryAgain: 'Erneut versuchen', sendAnother: 'Weitere Datei senden',
        acceptBeforeSelect: 'Stimme den Nutzungsbedingungen und der Datenschutzerklärung zu, bevor du eine Datei auswählst.',
        acceptBeforeUpload: 'Stimme den Nutzungsbedingungen und der Datenschutzerklärung zu, bevor du Dateien hochlädst.',
        acceptBeforeUse: 'Aktiviere das Kontrollkästchen oben, um dieses Tool zu verwenden.',
        passwordRequired: 'Das Passwort ist leer. Bitte gib ein Passwort ein.',
        tooLarge: '{name} ist {size} groß. Das Limit beträgt 1 GB.', passwordTooShort: 'Das Passwort muss mindestens 6 Zeichen lang sein.', uploadFailed: 'Upload fehlgeschlagen',
        loading: 'Wird geladen', protectedTitle: 'Geschützte Datei', protectedPrompt: 'Gib das Passwort ein, um die Datei anzusehen und herunterzuladen.',
        enterPassword: 'Passwort', unlock: 'Entsperren', download: 'Herunterladen', preview: 'Vorschau', backToShare: 'Zurück zum Freigabelink', previewUnavailable: 'Dieser Dateityp kann im Browser nicht angezeigt werden. Öffnen Sie ihn über Herunterladen.', nothingHere: 'Hier ist nichts', linkDidNotWork: 'Dieser Link funktioniert nicht',
        pleaseEnterPassword: 'Gib das Passwort für diese Datei ein.', missingTitle: 'Unter dieser Adresse nichts gefunden',
        missingIntro: 'Der Link ist möglicherweise falsch oder die Datei wurde entfernt.', sendFile: 'Datei senden'
    },
    ar: {
        language: 'اللغة', switchDark: 'التبديل إلى الوضع الداكن', switchLight: 'التبديل إلى الوضع الفاتح',
        intro: 'شارك ملفًا خلال ثوانٍ. أرسل ملفات حتى 1 غيغابايت واستأنف الرفع المتوقف.',
        benefitsTitle: 'لماذا يستخدم الناس Linkify', fast: 'سريع', fastDetail: 'أرسل الملفات بسرعة',
        private: 'خاص', privateDetail: 'الروابط الموقعة فقط تعمل', safe: 'آمن', safeDetail: 'حماية اختيارية بكلمة مرور',
        resumable: 'قابل للاستئناف', resumableDetail: 'استأنف عمليات الرفع المتوقفة', simple: 'سهل', simpleDetail: 'لا حاجة إلى حساب',
        reliable: 'موثوق', reliableDetail: 'تنتهي صلاحية الروابط في موعدها', aboutTitle: 'حول Linkify',
        aboutDescription: 'يتيح لك Linkify إرسال الملفات الكبيرة دون إنشاء حساب. يمكن استئناف رفع الملفات حتى 1 غيغابايت بعد انقطاعه، وتنتهي صلاحية كل رابط مشاركة وفق المدة التي تختارها. أضف كلمة مرور اختيارية لمزيد من الخصوصية.',
        expiryLabel: 'تنتهي صلاحية الرابط بعد', hour: 'ساعة واحدة', day: 'يوم واحد', week: 'أسبوع واحد', protect: 'الحماية بكلمة مرور',
        passwordPlaceholder: 'كلمة المرور (6 أحرف على الأقل)', agree: 'أوافق على', terms: 'شروط الخدمة', and: 'و', privacy: 'سياسة الخصوصية',
        dropTitle: 'اختر ملفًا أو أسقطه هنا', dropHint: 'حتى 1 غيغابايت. يمكن استئناف الرفع المتوقف.',
        resumeNote: 'توجد أجزاء من هذا الملف من محاولة سابقة. سيتم إرسال الأجزاء الناقصة فقط.',
        upload: 'رفع', continueUpload: 'متابعة الرفع', discard: 'البدء من جديد', preparingUpload: 'جارٍ إعداد الرفع',
        assemblingParts: 'جارٍ تجميع الأجزاء', sendingParts: 'جارٍ إرسال {missing} من {total} أجزاء',
        continuingUpload: 'استئناف رفع سابق، تم إرسال {sent} من {total} أجزاء',
        expirySummary: 'تنتهي صلاحية هذا الرابط خلال {duration}.', linkExpiresAt: 'تنتهي صلاحية الرابط في {date}', copy: 'نسخ', copied: 'تم النسخ', openLink: 'فتح', qrCode: 'رمز QR', qrCodeTitle: 'امسح رمز الاستجابة السريعة هذا', close: 'إغلاق', tryAgain: 'حاول مجددًا', sendAnother: 'إرسال ملف آخر',
        acceptBeforeSelect: 'يرجى الموافقة على شروط الخدمة وسياسة الخصوصية قبل اختيار ملف.',
        acceptBeforeUpload: 'يرجى الموافقة على شروط الخدمة وسياسة الخصوصية قبل رفع الملف.',
        acceptBeforeUse: 'حدد المربع أعلاه لاستخدام هذه الأداة.',
        passwordRequired: 'كلمة المرور فارغة. يرجى إدخال كلمة مرور.',
        tooLarge: 'حجم {name} هو {size}. الحد الأقصى 1 غيغابايت.', passwordTooShort: 'يجب ألا تقل كلمة المرور عن 6 أحرف.', uploadFailed: 'تعذر رفع الملف',
        loading: 'جارٍ التحميل', protectedTitle: 'ملف محمي', protectedPrompt: 'أدخل كلمة المرور لمعاينة هذا الملف وتنزيله.',
        enterPassword: 'كلمة المرور', unlock: 'فتح القفل', download: 'تنزيل', preview: 'معاينة', backToShare: 'العودة إلى رابط المشاركة', previewUnavailable: 'لا يمكن للمتصفح معاينة هذا النوع من الملفات. استخدم زر التنزيل لفتحه.', nothingHere: 'لا يوجد شيء هنا', linkDidNotWork: 'هذا الرابط لا يعمل',
        pleaseEnterPassword: 'أدخل كلمة مرور هذا الملف.', missingTitle: 'لا يوجد شيء في هذا العنوان',
        missingIntro: 'قد يكون الرابط مكتوبًا بشكل خاطئ أو ربما حُذف الملف.', sendFile: 'إرسال ملف'
    },
    hi: {
        language: 'भाषा', switchDark: 'डार्क मोड चालू करें', switchLight: 'लाइट मोड चालू करें',
        intro: 'कुछ ही सेकंड में फ़ाइल साझा करें। 1 GB तक भेजें और रुके हुए अपलोड फिर से शुरू करें।',
        benefitsTitle: 'लोग Linkify क्यों इस्तेमाल करते हैं', fast: 'तेज़', fastDetail: 'फ़ाइलें जल्दी भेजें',
        private: 'निजी', privateDetail: 'केवल हस्ताक्षरित लिंक काम करते हैं', safe: 'सुरक्षित', safeDetail: 'वैकल्पिक पासवर्ड सुरक्षा',
        resumable: 'फिर शुरू करें', resumableDetail: 'रुके हुए अपलोड जारी रखें', simple: 'आसान', simpleDetail: 'खाते की ज़रूरत नहीं',
        reliable: 'भरोसेमंद', reliableDetail: 'निजी लिंक समय पर समाप्त होते हैं', aboutTitle: 'Linkify के बारे में',
        aboutDescription: 'Linkify बिना खाता बनाए बड़ी फ़ाइलें भेजने का आसान तरीका है। 1 GB तक के अपलोड रुकने पर फिर शुरू किए जा सकते हैं और हर साझा लिंक चुनी गई अवधि के बाद समाप्त हो जाता है। अतिरिक्त गोपनीयता के लिए पासवर्ड जोड़ें।',
        expiryLabel: 'लिंक की अवधि', hour: '1 घंटा', day: '1 दिन', week: '1 सप्ताह', protect: 'पासवर्ड से सुरक्षित करें',
        passwordPlaceholder: 'पासवर्ड (कम से कम 6 अक्षर)', agree: 'मैं सहमत हूँ:', terms: 'सेवा की शर्तें', and: 'और', privacy: 'गोपनीयता नीति',
        dropTitle: 'फ़ाइल चुनें या यहाँ छोड़ें', dropHint: '1 GB तक। रुका हुआ अपलोड वहीं से जारी हो सकता है।',
        resumeNote: 'पिछली कोशिश से इस फ़ाइल के कुछ हिस्से मौजूद हैं। जारी रखने पर केवल बाकी हिस्से भेजे जाएँगे।',
        upload: 'अपलोड करें', continueUpload: 'अपलोड जारी रखें', discard: 'फिर से शुरू करें', preparingUpload: 'अपलोड तैयार हो रहा है',
        assemblingParts: 'फ़ाइल के हिस्से जोड़े जा रहे हैं', sendingParts: '{total} में से {missing} हिस्से भेजे जा रहे हैं',
        continuingUpload: 'पिछला अपलोड जारी है, {total} में से {sent} हिस्से भेजे जा चुके हैं',
        expirySummary: 'यह लिंक {duration} में समाप्त होगा।', linkExpiresAt: 'लिंक की समय सीमा {date} है', copy: 'कॉपी करें', copied: 'कॉपी हो गया', openLink: 'खोलें', qrCode: 'QR', qrCodeTitle: 'इस QR कोड को स्कैन करें', close: 'बंद करें', tryAgain: 'फिर कोशिश करें', sendAnother: 'दूसरी फ़ाइल भेजें',
        acceptBeforeSelect: 'फ़ाइल चुनने से पहले सेवा की शर्तें और गोपनीयता नीति स्वीकार करें।',
        acceptBeforeUpload: 'अपलोड से पहले सेवा की शर्तें और गोपनीयता नीति स्वीकार करें।',
        acceptBeforeUse: 'इस टूल का उपयोग करने के लिए ऊपर वाला बॉक्स चेक करें।',
        passwordRequired: 'पासवर्ड खाली है। कृपया पासवर्ड दर्ज करें।',
        tooLarge: '{name} का आकार {size} है। अधिकतम सीमा 1 GB है।', passwordTooShort: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।', uploadFailed: 'अपलोड विफल हुआ',
        loading: 'लोड हो रहा है', protectedTitle: 'सुरक्षित फ़ाइल', protectedPrompt: 'फ़ाइल देखने और डाउनलोड करने के लिए पासवर्ड दर्ज करें।',
        enterPassword: 'पासवर्ड', unlock: 'अनलॉक करें', download: 'डाउनलोड करें', preview: 'पूर्वावलोकन', backToShare: 'शेयर लिंक पर वापस जाएँ', previewUnavailable: 'आपका ब्राउज़र इस फ़ाइल प्रकार का पूर्वावलोकन नहीं कर सकता। इसे खोलने के लिए डाउनलोड करें।', nothingHere: 'यहाँ कुछ नहीं है', linkDidNotWork: 'यह लिंक काम नहीं किया',
        pleaseEnterPassword: 'इस फ़ाइल का पासवर्ड दर्ज करें।', missingTitle: 'इस पते पर कुछ नहीं मिला',
        missingIntro: 'लिंक गलत हो सकता है या फ़ाइल हटाई जा चुकी है।', sendFile: 'फ़ाइल भेजें'
    },
    zh: {
        language: '语言', switchDark: '切换到深色模式', switchLight: '切换到浅色模式',
        intro: '几秒钟即可分享文件。最多发送 1 GB，并可继续未完成的上传。',
        benefitsTitle: '选择 Linkify 的理由', fast: '快速', fastDetail: '快速发送文件',
        private: '私密', privateDetail: '仅签名链接可以访问', safe: '安全', safeDetail: '可选密码保护',
        resumable: '支持续传', resumableDetail: '继续中断的上传', simple: '简单', simpleDetail: '无需注册账号',
        reliable: '可靠', reliableDetail: '私密链接按时过期', aboutTitle: '关于 Linkify',
        aboutDescription: 'Linkify 是一种无需注册即可发送大文件的简单方式。最大 1 GB 的上传在中断后可以继续，每个分享链接都会按所选时限过期。需要更多隐私时，可以添加密码保护。',
        expiryLabel: '链接有效期', hour: '1 小时', day: '1 天', week: '1 周', protect: '使用密码保护',
        passwordPlaceholder: '密码（至少 6 个字符）', agree: '我同意', terms: '服务条款', and: '和', privacy: '隐私政策',
        dropTitle: '选择文件或拖放到此处', dropHint: '最大 1 GB。中断的上传可以继续。',
        resumeNote: '检测到之前上传的部分内容。继续后只会发送缺少的部分。',
        upload: '上传', continueUpload: '继续上传', discard: '重新开始', preparingUpload: '正在准备上传',
        assemblingParts: '正在合并文件分块', sendingParts: '正在发送 {total} 个分块中的 {missing} 个',
        continuingUpload: '继续之前的上传，已发送 {total} 个分块中的 {sent} 个',
        expirySummary: '此链接将在 {duration} 后过期。', linkExpiresAt: '链接过期时间：{date}', copy: '复制', copied: '已复制', openLink: '打开', qrCode: '二维码', qrCodeTitle: '扫描此二维码', close: '关闭', tryAgain: '重试', sendAnother: '发送其他文件',
        acceptBeforeSelect: '选择文件前，请先同意服务条款和隐私政策。',
        acceptBeforeUpload: '上传前，请先同意服务条款和隐私政策。',
        acceptBeforeUse: '请勾选上方方框以使用此工具。',
        passwordRequired: '密码为空。请输入密码。',
        tooLarge: '{name} 大小为 {size}，上限为 1 GB。', passwordTooShort: '密码至少需要 6 个字符。', uploadFailed: '上传失败',
        loading: '正在加载', protectedTitle: '受保护的文件', protectedPrompt: '请输入密码以预览并下载此文件。',
        enterPassword: '密码', unlock: '解锁', download: '下载', preview: '预览', backToShare: '返回分享链接', previewUnavailable: '浏览器无法预览此文件类型。请使用“下载”打开。', nothingHere: '这里没有内容', linkDidNotWork: '此链接无法使用',
        pleaseEnterPassword: '请输入此文件的密码。', missingTitle: '此地址没有内容',
        missingIntro: '链接可能输入错误，或它指向的文件已不存在。', sendFile: '发送文件'
    }
}

// Provide complete interface copy for the five additional requested languages.
translations.tr = {
    ...translations.en!, language: 'Dil', switchDark: 'Koyu moda geç', switchLight: 'Açık moda geç',
    intro: 'Dosyaları saniyeler içinde paylaşın. 1 GB’a kadar gönderin ve kesilen yüklemelere kaldığınız yerden devam edin.',
    benefitsTitle: 'Linkify neden kullanılıyor?', fast: 'Hızlı', fastDetail: 'Dosyaları hızla gönderin',
    private: 'Gizli', privateDetail: 'Yalnızca imzalı bağlantılar çalışır', safe: 'Güvenli', safeDetail: 'İsteğe bağlı parola koruması',
    resumable: 'Devam edilebilir', resumableDetail: 'Kesilen yüklemeleri sürdürün', simple: 'Kolay', simpleDetail: 'Hesap gerekmez',
    reliable: 'Güvenilir', reliableDetail: 'Özel bağlantıların süresi dolar', aboutTitle: 'Linkify hakkında',
    aboutDescription: 'Linkify, hesap oluşturmadan büyük dosyalar göndermenin kolay bir yoludur. 1 GB’a kadar yüklemeler kesintiden sonra sürdürülebilir ve paylaşım bağlantıları seçtiğiniz sürede sona erer. Ek gizlilik için parola koruması ekleyin.',
    expiryLabel: 'Bağlantı süresi', hour: '1 saat', day: '1 gün', week: '1 hafta', protect: 'Parola ile koru',
    passwordPlaceholder: 'Parola (en az 6 karakter)', agree: 'Şunları kabul ediyorum:', terms: 'Hizmet Koşulları', and: 've', privacy: 'Gizlilik Politikası',
    dropTitle: 'Dosya seçin veya buraya bırakın', dropHint: 'En fazla 1 GB. Kesilen yüklemeler kaldığı yerden sürer.',
    resumeNote: 'Bu dosyanın önceki bir denemeden kalan bölümleri var. Devam edildiğinde yalnızca eksik bölümler gönderilir.',
    upload: 'Yükle', continueUpload: 'Yüklemeye devam et', discard: 'Baştan başla', preparingUpload: 'Yükleme hazırlanıyor',
    assemblingParts: 'Dosya parçaları birleştiriliyor', sendingParts: '{total} parçanın {missing} tanesi gönderiliyor',
    continuingUpload: 'Önceki yükleme sürüyor; {total} parçanın {sent} tanesi gönderilmiş',
    expirySummary: 'Bu bağlantının süresi {duration} içinde dolacak.', linkExpiresAt: 'Bağlantı sona erme tarihi: {date}',
    copy: 'Kopyala', copied: 'Kopyalandı', openLink: 'Aç', qrCode: 'QR', qrCodeTitle: 'Bu QR kodunu tarat', close: 'Kapat', tryAgain: 'Yeniden dene', sendAnother: 'Başka dosya gönder',
    acceptBeforeSelect: 'Dosya seçmeden önce Hizmet Koşulları ve Gizlilik Politikası’nı kabul edin.',
    acceptBeforeUpload: 'Yüklemeden önce Hizmet Koşulları ve Gizlilik Politikası’nı kabul edin.',
    acceptBeforeUse: 'Bu aracı kullanmak için yukarıdaki kutuyu işaretleyin.',
    passwordRequired: 'Parola boş. Lütfen bir parola girin.',
    tooLarge: '{name} dosyası {size}. Sınır 1 GB.', passwordTooShort: 'Parola en az 6 karakter olmalıdır.', uploadFailed: 'Yükleme başarısız oldu',
    loading: 'Yükleniyor', protectedTitle: 'Korumalı dosya', protectedPrompt: 'Dosyayı önizlemek ve indirmek için parolayı girin.',
    enterPassword: 'Parola', unlock: 'Kilidi aç', download: 'İndir', preview: 'Önizleme', backToShare: 'Paylaşım bağlantısına dön', previewUnavailable: 'Tarayıcınız bu dosya türünü önizleyemiyor. Açmak için İndir seçeneğini kullanın.', nothingHere: 'Burada bir şey yok', linkDidNotWork: 'Bu bağlantı çalışmadı',
    pleaseEnterPassword: 'Bu dosyanın parolasını girin.', missingTitle: 'Bu adreste bir şey yok',
    missingIntro: 'Bağlantı yanlış yazılmış olabilir veya işaret ettiği dosya kaldırılmıştır.', sendFile: 'Dosya gönder'
}

translations.ja = {
    ...translations.en!, language: '言語', switchDark: 'ダークモードに切り替え', switchLight: 'ライトモードに切り替え',
    intro: 'ファイルをすばやく共有できます。最大 1 GB のファイルを送信し、中断したアップロードを再開できます。',
    benefitsTitle: 'Linkify が選ばれる理由', fast: '高速', fastDetail: 'ファイルをすばやく送信',
    private: 'プライベート', privateDetail: '署名付きリンクのみアクセス可能', safe: '安全', safeDetail: 'パスワード保護（任意）',
    resumable: '再開可能', resumableDetail: '中断したアップロードを再開', simple: 'シンプル', simpleDetail: 'アカウント不要',
    reliable: '信頼性', reliableDetail: '共有リンクは期限切れになります', aboutTitle: 'Linkify について',
    aboutDescription: 'Linkify はアカウント登録なしで大容量ファイルを送信できるシンプルなサービスです。最大 1 GB のアップロードは中断後に再開でき、共有リンクは選択した期間が過ぎると無効になります。必要に応じてパスワードを設定できます。',
    expiryLabel: 'リンクの有効期間', hour: '1 時間', day: '1 日', week: '1 週間', protect: 'パスワードで保護',
    passwordPlaceholder: 'パスワード（6 文字以上）', agree: '以下に同意します：', terms: '利用規約', and: 'および', privacy: 'プライバシーポリシー',
    dropTitle: 'ファイルを選択するか、ここにドロップ', dropHint: '最大 1 GB。中断したアップロードは再開できます。',
    resumeNote: '前回のアップロードデータが残っています。再開すると不足分だけが送信されます。',
    upload: 'アップロード', continueUpload: 'アップロードを再開', discard: '最初からやり直す', preparingUpload: 'アップロードを準備中',
    assemblingParts: 'ファイルを結合中', sendingParts: '{total} 個中 {missing} 個のパーツを送信中',
    continuingUpload: '前回のアップロードを再開中：{total} 個中 {sent} 個を送信済み',
    expirySummary: 'このリンクは {duration} 後に期限切れになります。', linkExpiresAt: 'リンクの有効期限：{date}',
    copy: 'コピー', copied: 'コピーしました', openLink: '開く', qrCode: 'QR', qrCodeTitle: 'このQRコードをスキャン', close: '閉じる', tryAgain: '再試行', sendAnother: '別のファイルを送信',
    acceptBeforeSelect: 'ファイルを選択する前に利用規約とプライバシーポリシーに同意してください。',
    acceptBeforeUpload: 'アップロードする前に利用規約とプライバシーポリシーに同意してください。',
    acceptBeforeUse: 'このツールを使うには、上のチェックボックスをオンにしてください。',
    passwordRequired: 'パスワードが空です。入力してください。',
    tooLarge: '{name} のサイズは {size} です。上限は 1 GB です。', passwordTooShort: 'パスワードは 6 文字以上にしてください。', uploadFailed: 'アップロードに失敗しました',
    loading: '読み込み中', protectedTitle: '保護されたファイル', protectedPrompt: 'プレビューとダウンロードにはパスワードを入力してください。',
    enterPassword: 'パスワード', unlock: 'ロック解除', download: 'ダウンロード', preview: 'プレビュー', backToShare: '共有リンクに戻る', previewUnavailable: 'このファイル形式はブラウザーでプレビューできません。ダウンロードして開いてください。', nothingHere: 'ファイルがありません', linkDidNotWork: 'このリンクは利用できません',
    pleaseEnterPassword: 'このファイルのパスワードを入力してください。', missingTitle: 'このアドレスにページはありません',
    missingIntro: 'リンクが間違っているか、ファイルが削除された可能性があります。', sendFile: 'ファイルを送信'
}

translations.ru = {
    ...translations.en!, language: 'Язык', switchDark: 'Включить тёмную тему', switchLight: 'Включить светлую тему',
    intro: 'Делитесь файлами за секунды. Отправляйте файлы до 1 ГБ и продолжайте прерванную загрузку.',
    benefitsTitle: 'Почему выбирают Linkify', fast: 'Быстро', fastDetail: 'Быстрая отправка файлов',
    private: 'Приватно', privateDetail: 'Доступ только по подписанной ссылке', safe: 'Безопасно', safeDetail: 'Защита паролем по желанию',
    resumable: 'С продолжением', resumableDetail: 'Продолжайте прерванную загрузку', simple: 'Просто', simpleDetail: 'Аккаунт не нужен',
    reliable: 'Надёжно', reliableDetail: 'Срок действия ссылок истекает', aboutTitle: 'О Linkify',
    aboutDescription: 'Linkify помогает отправлять большие файлы без регистрации. Загрузку файлов до 1 ГБ можно продолжить после сбоя, а ссылка для доступа действует выбранный вами срок. Для дополнительной приватности можно установить пароль.',
    expiryLabel: 'Срок действия ссылки', hour: '1 час', day: '1 день', week: '1 неделя', protect: 'Защитить паролем',
    passwordPlaceholder: 'Пароль (не менее 6 символов)', agree: 'Я принимаю', terms: 'Условия использования', and: 'и', privacy: 'Политику конфиденциальности',
    dropTitle: 'Выберите или перетащите файл сюда', dropHint: 'До 1 ГБ. Прерванную загрузку можно продолжить.',
    resumeNote: 'Обнаружены части файла из предыдущей попытки. Будут отправлены только недостающие части.',
    upload: 'Загрузить', continueUpload: 'Продолжить загрузку', discard: 'Начать заново', preparingUpload: 'Подготовка загрузки',
    assemblingParts: 'Сборка частей файла', sendingParts: 'Отправка частей: {missing} из {total}',
    continuingUpload: 'Продолжение загрузки: отправлено {sent} из {total} частей',
    expirySummary: 'Срок действия ссылки истечёт через {duration}.', linkExpiresAt: 'Ссылка истекает: {date}',
    copy: 'Копировать', copied: 'Скопировано', openLink: 'Открыть', qrCode: 'QR', qrCodeTitle: 'Отсканируйте этот QR-код', close: 'Закрыть', tryAgain: 'Повторить', sendAnother: 'Отправить другой файл',
    acceptBeforeSelect: 'Перед выбором файла примите Условия использования и Политику конфиденциальности.',
    acceptBeforeUpload: 'Перед загрузкой примите Условия использования и Политику конфиденциальности.',
    acceptBeforeUse: 'Чтобы использовать инструмент, отметьте поле выше.',
    passwordRequired: 'Пароль не указан. Введите пароль.',
    tooLarge: 'Размер файла {name} — {size}. Максимум — 1 ГБ.', passwordTooShort: 'Пароль должен содержать не менее 6 символов.', uploadFailed: 'Не удалось загрузить файл',
    loading: 'Загрузка', protectedTitle: 'Защищённый файл', protectedPrompt: 'Введите пароль, чтобы просмотреть и скачать файл.',
    enterPassword: 'Пароль', unlock: 'Разблокировать', download: 'Скачать', preview: 'Предпросмотр', backToShare: 'Вернуться к ссылке', previewUnavailable: 'Браузер не может показать этот тип файла. Нажмите «Скачать», чтобы открыть его.', nothingHere: 'Здесь ничего нет', linkDidNotWork: 'Ссылка не работает',
    pleaseEnterPassword: 'Введите пароль для этого файла.', missingTitle: 'По этому адресу ничего нет',
    missingIntro: 'Возможно, ссылка указана неверно или файл удалён.', sendFile: 'Отправить файл'
}

translations.pt = {
    ...translations.en!, language: 'Idioma', switchDark: 'Ativar modo escuro', switchLight: 'Ativar modo claro',
    intro: 'Partilhe um ficheiro em segundos. Envie até 1 GB e retome carregamentos interrompidos.',
    benefitsTitle: 'Por que usar o Linkify', fast: 'Rápido', fastDetail: 'Envie ficheiros rapidamente',
    private: 'Privado', privateDetail: 'Apenas ligações assinadas dão acesso', safe: 'Seguro', safeDetail: 'Proteção opcional por palavra-passe',
    resumable: 'Retomável', resumableDetail: 'Retome carregamentos interrompidos', simple: 'Simples', simpleDetail: 'Não precisa de conta',
    reliable: 'Fiável', reliableDetail: 'As ligações privadas expiram', aboutTitle: 'Sobre o Linkify',
    aboutDescription: 'O Linkify permite enviar ficheiros grandes sem criar uma conta. Os carregamentos até 1 GB podem ser retomados após uma interrupção e cada ligação expira no prazo escolhido. Adicione uma palavra-passe opcional para maior privacidade.',
    expiryLabel: 'A ligação expira após', hour: '1 hora', day: '1 dia', week: '1 semana', protect: 'Proteger com palavra-passe',
    passwordPlaceholder: 'Palavra-passe (mín. 6 caracteres)', agree: 'Aceito os', terms: 'Termos de Serviço', and: 'e a', privacy: 'Política de Privacidade',
    dropTitle: 'Escolha um ficheiro ou largue-o aqui', dropHint: 'Até 1 GB. Um carregamento interrompido pode ser retomado.',
    resumeNote: 'Ainda existem partes deste ficheiro de uma tentativa anterior. Ao continuar, só serão enviadas as partes em falta.',
    upload: 'Carregar', continueUpload: 'Continuar carregamento', discard: 'Recomeçar', preparingUpload: 'A preparar o carregamento',
    assemblingParts: 'A juntar as partes', sendingParts: 'A enviar {missing} de {total} partes',
    continuingUpload: 'A continuar o carregamento anterior: {sent} de {total} partes enviadas',
    expirySummary: 'Esta ligação expira em {duration}.', linkExpiresAt: 'A ligação expira em {date}',
    copy: 'Copiar', copied: 'Copiado', openLink: 'Abrir', qrCode: 'QR', qrCodeTitle: 'Digitalize este código QR', close: 'Fechar', tryAgain: 'Tentar novamente', sendAnother: 'Enviar outro ficheiro',
    acceptBeforeSelect: 'Aceite os Termos de Serviço e a Política de Privacidade antes de escolher um ficheiro.',
    acceptBeforeUpload: 'Aceite os Termos de Serviço e a Política de Privacidade antes de carregar.',
    acceptBeforeUse: 'Marque a caixa acima para usar esta ferramenta.',
    passwordRequired: 'A palavra-passe está vazia. Introduza uma palavra-passe.',
    tooLarge: '{name} tem {size}. O limite é 1 GB.', passwordTooShort: 'A palavra-passe deve ter pelo menos 6 caracteres.', uploadFailed: 'O carregamento falhou',
    loading: 'A carregar', protectedTitle: 'Ficheiro protegido', protectedPrompt: 'Introduza a palavra-passe para pré-visualizar e transferir este ficheiro.',
    enterPassword: 'Palavra-passe', unlock: 'Desbloquear', download: 'Transferir', preview: 'Pré-visualizar', backToShare: 'Voltar à ligação partilhada', previewUnavailable: 'O navegador não consegue pré-visualizar este tipo de ficheiro. Use Transferir para o abrir.', nothingHere: 'Não há nada aqui', linkDidNotWork: 'Esta ligação não funcionou',
    pleaseEnterPassword: 'Introduza a palavra-passe deste ficheiro.', missingTitle: 'Não existe nada neste endereço',
    missingIntro: 'A ligação pode estar incorreta ou o ficheiro já não existe.', sendFile: 'Enviar um ficheiro'
}

translations.ko = {
    ...translations.en!, language: '언어', switchDark: '다크 모드로 전환', switchLight: '라이트 모드로 전환',
    intro: '몇 초 만에 파일을 공유하세요. 최대 1GB까지 보내고 중단된 업로드를 이어서 진행할 수 있습니다.',
    benefitsTitle: 'Linkify를 사용하는 이유', fast: '빠름', fastDetail: '파일을 빠르게 전송',
    private: '비공개', privateDetail: '서명된 링크만 접근 가능', safe: '안전', safeDetail: '선택 가능한 비밀번호 보호',
    resumable: '이어 올리기', resumableDetail: '중단된 업로드 이어서 진행', simple: '간편함', simpleDetail: '계정이 필요 없음',
    reliable: '안정적', reliableDetail: '비공개 링크는 만료됨', aboutTitle: 'Linkify 소개',
    aboutDescription: 'Linkify는 계정 없이 대용량 파일을 간편하게 보내는 서비스입니다. 최대 1GB 업로드는 중단 후 이어서 진행할 수 있으며, 공유 링크는 선택한 기간이 지나면 만료됩니다. 더 안전한 공유를 위해 비밀번호를 설정할 수 있습니다.',
    expiryLabel: '링크 만료 기간', hour: '1시간', day: '1일', week: '1주', protect: '비밀번호로 보호',
    passwordPlaceholder: '비밀번호 (6자 이상)', agree: '다음 항목에 동의합니다:', terms: '서비스 약관', and: '및', privacy: '개인정보 처리방침',
    dropTitle: '파일을 선택하거나 여기에 놓으세요', dropHint: '최대 1GB. 중단된 업로드는 이어서 진행할 수 있습니다.',
    resumeNote: '이전 시도에서 업로드된 파일 일부가 있습니다. 계속하면 누락된 부분만 전송합니다.',
    upload: '업로드', continueUpload: '업로드 계속하기', discard: '처음부터 다시 시작', preparingUpload: '업로드 준비 중',
    assemblingParts: '파일 조각을 합치는 중', sendingParts: '{total}개 중 {missing}개 조각 전송 중',
    continuingUpload: '이전 업로드 계속 진행 중, {total}개 중 {sent}개 전송 완료',
    expirySummary: '이 링크는 {duration} 후 만료됩니다.', linkExpiresAt: '링크 만료 시간: {date}',
    copy: '복사', copied: '복사됨', openLink: '열기', qrCode: 'QR', qrCodeTitle: '이 QR 코드를 스캔하세요', close: '닫기', tryAgain: '다시 시도', sendAnother: '다른 파일 보내기',
    acceptBeforeSelect: '파일을 선택하기 전에 서비스 약관과 개인정보 처리방침에 동의해 주세요.',
    acceptBeforeUpload: '업로드하기 전에 서비스 약관과 개인정보 처리방침에 동의해 주세요.',
    acceptBeforeUse: '이 도구를 사용하려면 위의 체크박스를 선택하세요.',
    passwordRequired: '비밀번호가 비어 있습니다. 비밀번호를 입력하세요.',
    tooLarge: '{name} 크기는 {size}입니다. 최대 크기는 1GB입니다.', passwordTooShort: '비밀번호는 6자 이상이어야 합니다.', uploadFailed: '업로드에 실패했습니다',
    loading: '불러오는 중', protectedTitle: '보호된 파일', protectedPrompt: '파일을 미리 보고 다운로드하려면 비밀번호를 입력하세요.',
    enterPassword: '비밀번호', unlock: '잠금 해제', download: '다운로드', preview: '미리보기', backToShare: '공유 링크로 돌아가기', previewUnavailable: '브라우저에서 이 파일 형식을 미리 볼 수 없습니다. 다운로드하여 여세요.', nothingHere: '항목이 없습니다', linkDidNotWork: '이 링크를 사용할 수 없습니다',
    pleaseEnterPassword: '이 파일의 비밀번호를 입력하세요.', missingTitle: '이 주소에 페이지가 없습니다',
    missingIntro: '링크가 잘못되었거나 파일이 삭제되었을 수 있습니다.', sendFile: '파일 보내기'
}

// Read the saved language safely and fall back to English for unsupported values.
export function currentLanguage(): Language {
    try {
        const saved = localStorage.getItem('linkify-language')
        return languages.some(language => language.code === saved) ? saved as Language : 'en'
    } catch {
        return 'en'
    }
}

// Return translated UI copy, replacing named values in dynamic status strings.
export function t(key: TranslationKey, values: Record<string, string | number> = {}): string {
    const dictionary = translations[currentLanguage()] ?? translations.en
    let text = dictionary?.[key] ?? translations.en?.[key] ?? key
    for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, String(value))
    return text
}

// Apply persisted display preferences before routing creates the page.
export function initializePreferences(): void {
    const language = currentLanguage()
    let theme = 'light'
    try {
        theme = localStorage.getItem('linkify-theme') === 'dark' ? 'dark' : 'light'
    } catch {
        theme = 'light'
    }
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

// Provide persistent theme and language controls shared by each routed screen.
export function createPreferencesBar() {
    const bar = Div()
    bar.addClass('preferences-bar')

    const themeButton = Button('')
    themeButton.addClass('theme-toggle')
    const updateThemeButton = () => {
        const dark = document.documentElement.dataset.theme === 'dark'
        const label = t(dark ? 'switchLight' : 'switchDark')
        themeButton.text(dark ? '☀' : '☾')
        themeButton.el.title = label
        themeButton.el.setAttribute('aria-label', label)
        themeButton.el.setAttribute('aria-pressed', String(dark))
    }
    updateThemeButton()
    themeButton.on('click', () => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = theme
        try {
            localStorage.setItem('linkify-theme', theme)
        } catch {
            // Keep the current page usable when browser storage is unavailable.
        }
        updateThemeButton()
    })

    const languageLabel = Base('label')
    languageLabel.addClass('language-control')
    const globe = Span('')
    globe.addClass('globe-icon')
    globe.el.setAttribute('aria-hidden', 'true')
    const select = Base('select')
    select.addClass('language-select')
    select.el.setAttribute('aria-label', t('language'))
    select.el.title = t('language')
    for (const language of languages) {
        const option = Base('option')
        option.el.value = language.code
        option.el.textContent = language.name
        option.el.selected = language.code === currentLanguage()
        select.append(option)
    }
    select.on('change', () => {
        try {
            localStorage.setItem('linkify-language', select.el.value)
        } catch {
            // Reload with the current browser's default when storage is unavailable.
        }
        window.location.reload()
    })
    languageLabel.append(globe, select)
    bar.append(themeButton, languageLabel)
    return bar
}

// Translate the stable status messages emitted by the resumable upload helper.
export function translateUploadStatus(message: string): string {
    if (message === 'Preparing the upload') return t('preparingUpload')
    if (message === 'Putting the parts together') return t('assemblingParts')
    const sending = /^Sending (\d+) of (\d+) parts$/.exec(message)
    if (sending) return t('sendingParts', { missing: sending[1], total: sending[2] })
    const continuing = /^Continuing an earlier upload, (\d+) of (\d+) parts already sent$/.exec(message)
    if (continuing) return t('continuingUpload', { sent: continuing[1], total: continuing[2] })
    return message
}

export function languageLocale(): string {
    return languages.find(language => language.code === currentLanguage())?.locale ?? 'en'
}