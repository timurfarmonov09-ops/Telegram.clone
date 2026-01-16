# MongoDB'siz Test Qilish

Agar MongoDB o'rnatishni xohlamasangiz, quyidagi qadamlarni bajaring:

## Variant 1: MongoDB Atlas (2 daqiqa) - TAVSIYA ✅

1. **https://account.mongodb.com/account/register** ga kiring
2. Email va parol bilan ro'yxatdan o'ting
3. "Build a Database" tugmasini bosing
4. **M0 FREE** ni tanlang
5. Provider: AWS, Region: Frankfurt (yoki yaqin joy)
6. "Create" bosing
7. Username: `admin`, Password: `Admin123456` (yoki o'zingizniki)
8. "Create User" bosing
9. "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
10. "Database" → "Connect" → "Connect your application"
11. Connection string ni ko'chiring:
    ```
    mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```

12. `server/.env` faylini yangilang:
    ```env
    MONGODB_URI=mongodb+srv://admin:Admin123456@cluster0.xxxxx.mongodb.net/telegram-clone?retryWrites=true&w=majority
    ```
    
    **MUHIM:** `<password>` o'rniga o'z parolingizni yozing!

13. Serverni ishga tushiring:
    ```bash
    npm run dev
    ```

## Variant 2: Docker bilan MongoDB (agar Docker o'rnatilgan bo'lsa)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Keyin `server/.env` da:
```env
MONGODB_URI=mongodb://localhost:27017/telegram-clone
```

## Variant 3: Oddiy JSON file (Test uchun)

Agar hech narsa ishlamasa, men sizga oddiy JSON file bilan ishlaydigan versiyani tayyorlayman.

---

**Qaysi variantni tanladingiz?**
