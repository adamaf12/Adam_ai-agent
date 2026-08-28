# أدم - ADAM Personal AI Agent 🤖📱

تطبيق **أدم (ADAM AI Agent)** هو وكيل ذكاء اصطناعي محلي وشخصي متعدد المهام (Full-Stack AI Agent) مصمم خصيصاً للعمل بكفاءة عالية على الهواتف الذكية والأجهزة المكتبية والويب، مع دعم كامل للغة العربية والإنجليزية وتكامل مباشر مع خدمات **Google Workspace** و **Google Cloud**.

---

## ✨ المميزات الرئيسية (Key Features)

- 🔑 **تسجيل الدخول وربط Google OAuth 2.0**: ربط مباشر بحساب قوقل الشخصي ومزامنة البريد والتقويم والملفات.
- 🌐 **Google Workspace Integration**: إدارة وإستعلام Google Drive, Gmail Inbox Radar, Calendar, Contacts.
- 🌐 **البحث الحي المباشر (Live Web Search)**: جلب معلومات ومصادر ونتائج بحث محدثة لحظياً.
- 📅 **إدارة التقويم المتقدمة (Calendar & Scheduling)**: إنشاء وتعديل واسترجاع مواعيد التقويم.
- 🔔 **مركز المراقبة والتنبيهات في الخلفية (Background Messaging Radar)**: تنبيهات موقوتة وفحص المراسلات.
- 📝 **إدارة الملاحظات والذاكرة طويلة المدى (Notes & Long-term Memory)**: استخراج وحفظ الحقائق وتفضيلات المستخدم.
- 🎨 **استوديو الصور والفيديو المتقدم (Media Generation Studio)**: إنشاء وتعديل الصور والفيديوهات عبر النماذج الذكية.
- 📥 **محرك تحميل الفيديو الشامل (Universal Video Downloader)**: تحميل الفيديوهات من منصات التواصل الاجتماعي.
- 🎙️ **التفاعل الصوتي والمكالمات الحية (Live Voice & Speech Recognition)**: استجابة صوتية فورية وإدخال صوتی مباشر.
- 📲 **تصدير وبناء تطبيق أندرويد (Android APK Export)**: جاهز للبناء والتثبيت المباشر على الهواتف.

---

## 🚀 تشغيل وتطوير المشروع (Web Development)

1. **تثبيت الاعتماديات**:
   ```bash
   npm install
   ```

2. **تكوين متغبرات البيئة (.env)**:
   قم بإنشاء ملف `.env` بناءً على `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **تشغيل الخادم المحلي والتطبيق**:
   ```bash
   npm run dev
   ```
   افتح المتصفح على: `http://localhost:3000`

---

## 📱 بناء وتصدير تطبيق أندرويد (Android APK)

التطبيق مدعوم ومعد للتصدير المباشر عبر **Capacitor**:

1. **بناء النسخة المجمعة ومزامنة Capacitor**:
   ```bash
   npm run build
   npx cap sync android
   ```

2. **فتح المشروع في Android Studio لبناء ملف APK**:
   ```bash
   npx cap open android
   ```
   من داخل Android Studio اختر:
   `Build -> Build Bundle(s) / APK(s) -> Build APK(s)`

---

## 💻 بناء تطبيق سطح المكتب (Windows & Linux)

تم تضمين إعدادات **Electron** لبناء التطبيق كبرنامج مكتبي:

- **لنظام ويندوز (Windows .exe)**:
  ```bash
  npm run build:win
  ```
- **لنظام لينكس (Linux AppImage / .deb)**:
  ```bash
  npm run build:linux
  ```

---

## 🐙 خطوات النشر على GitHub (Publishing to GitHub)

1. **تهيئة مستودع Git والالتزام بالتغييرات**:
   ```bash
   git init
   git add .
   git commit -m "Initial Release: ADAM Personal AI Agent"
   ```

2. **الربط مع مستودع GitHub والدفع**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/adam-ai-agent.git
   git push -u origin main
   ```

---

### 👨‍💻 التطوير والإشراف
**تطوير وتصميم: آدم فيدات (Developed by Adam Feidat)**

