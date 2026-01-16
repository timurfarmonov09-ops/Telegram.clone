# MongoDB O'rnatish Ko'rsatmasi

MongoDB'ni o'rnatish uchun 2 ta variant mavjud:

## Variant 1: MongoDB Atlas (Cloud) - TAVSIYA ETILADI ✅

Bu eng oson va tez variant. Internet orqali ishlaydi, o'rnatish shart emas.

### Qadamlar:

1. **MongoDB Atlas saytiga kiring**
   - https://www.mongodb.com/cloud/atlas/register
   - Email bilan ro'yxatdan o'ting (BEPUL)

2. **Cluster yarating**
   - "Build a Database" tugmasini bosing
   - **FREE** (M0) variantni tanlang
   - Provider: AWS
   - Region: eng yaqin joyni tanlang (masalan: Frankfurt yoki Mumbai)
   - Cluster Name: `telegram-clone`
   - "Create" tugmasini bosing

3. **Database User yarating**
   - Username: `admin`
   - Password: kuchli parol yarating (masalan: `Admin123456`)
   - "Create User" tugmasini bosing

4. **IP Address qo'shing**
   - "Add My Current IP Address" tugmasini bosing
   - Yoki "Allow Access from Anywhere" (0.0.0.0/0) tanlang
   - "Finish and Close" tugmasini bosing

5. **Connection String oling**
   - "Connect" tugmasini bosing
   - "Connect your application" tanlang
   - "Driver: Node.js" va "Version: 5.5 or later" tanlang
   - Connection string ko'chirib oling, masalan:
   ```
   mongodb+srv://admin:<password>@telegram-clone.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **server/.env faylini yangilang**
   ```env
   MONGODB_URI=mongodb+srv://admin:Admin123456@telegram-clone.xxxxx.mongodb.net/telegram-clone?retryWrites=true&w=majority
   ```
   
   **MUHIM:** `<password>` o'rniga o'zingizning parolingizni yozing!

7. **Tayyor!** Endi serverni ishga tushiring:
   ```bash
   npm run dev
   ```

---

## Variant 2: Local MongoDB (Kompyuterga o'rnatish)

### Windows uchun:

1. **MongoDB Community Server yuklab oling**
   - https://www.mongodb.com/try/download/community
   - Version: 7.0.x (Latest)
   - Platform: Windows
   - Package: MSI
   - "Download" tugmasini bosing

2. **O'rnatish**
   - Yuklab olingan `.msi` faylni ishga tushiring
   - "Complete" installation tanlang
   - "Install MongoDB as a Service" - BELGILANGAN bo'lsin ✅
   - "Install MongoDB Compass" - BELGILANGAN bo'lsin ✅ (GUI tool)
   - "Next" va "Install" tugmalarini bosing

3. **MongoDB ishga tushganligini tekshiring**
   ```bash
   # PowerShell yoki CMD da:
   net start MongoDB
   ```

4. **Tekshirish**
   ```bash
   mongosh
   ```
   
   Agar `mongosh` ishlamasa:
   ```bash
   # MongoDB Compass dasturini oching
   # Connection string: mongodb://localhost:27017
   ```

5. **server/.env faylida**
   ```env
   MONGODB_URI=mongodb://localhost:27017/telegram-clone
   ```

6. **Tayyor!** Serverni ishga tushiring:
   ```bash
   npm run dev
   ```

---

## Qaysi variantni tanlash kerak?

| Variant | Afzalliklari | Kamchiliklari |
|---------|--------------|---------------|
| **MongoDB Atlas (Cloud)** | ✅ O'rnatish shart emas<br>✅ Har yerdan kirish mumkin<br>✅ Bepul 512MB<br>✅ Backup avtomatik | ❌ Internet kerak |
| **Local MongoDB** | ✅ Internet shart emas<br>✅ Tezroq ishlaydi<br>✅ To'liq nazorat | ❌ O'rnatish kerak<br>❌ Faqat shu kompyuterda |

**Tavsiya:** Agar internetingiz yaxshi bo'lsa, **MongoDB Atlas** ishlatish osonroq va tezroq.

---

## Muammolar va Yechimlar

### MongoDB Atlas bilan bog'lanish xatosi

**Xato:** `MongoServerError: bad auth`
- **Yechim:** Parolni to'g'ri kiriting, maxsus belgilar bo'lsa URL encode qiling

**Xato:** `MongooseServerSelectionError: connect ETIMEDOUT`
- **Yechim:** IP Address'ni tekshiring (0.0.0.0/0 qo'shing)

### Local MongoDB ishlamayapti

**Xato:** `mongod: command not found`
- **Yechim:** MongoDB to'g'ri o'rnatilmaganligini bildiradi, qaytadan o'rnating

**Xato:** `MongoNetworkError: connect ECONNREFUSED`
- **Yechim:** MongoDB service ishga tushmagan
  ```bash
  net start MongoDB
  ```

---

## Yordam kerakmi?

1. SETUP.md faylini o'qing
2. MongoDB Atlas videolarini YouTube'da qidiring: "MongoDB Atlas tutorial"
3. Telegram Clone loyihasini ishga tushirish uchun:
   ```bash
   npm run dev
   ```

Omad! 🚀
