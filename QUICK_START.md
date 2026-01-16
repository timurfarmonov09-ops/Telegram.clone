# Tezkor Ishga Tushirish

## 1. MongoDB'ni sozlang

### Eng oson yo'l - MongoDB Atlas (Cloud):

1. https://www.mongodb.com/cloud/atlas/register - ro'yxatdan o'ting
2. FREE cluster yarating
3. Database user yarating (username: admin, password: o'zingizniki)
4. IP: 0.0.0.0/0 qo'shing (Allow from anywhere)
5. Connection string oling va `server/.env` ga qo'ying:

```env
MONGODB_URI=mongodb+srv://admin:PAROLINGIZ@cluster.xxxxx.mongodb.net/telegram-clone?retryWrites=true&w=majority
```

**Batafsil ko'rsatma:** `MONGODB_INSTALL.md` faylini o'qing

## 2. Paketlarni o'rnating

```bash
npm run install-all
```

## 3. Ishga tushiring

```bash
npm run dev
```

## 4. Brauzerda oching

http://localhost:5173

---

## Muammo bo'lsa?

### Port band bo'lsa:
```bash
# Barcha Node processlarni to'xtating
Get-Process -Name node | Stop-Process -Force

# Qaytadan ishga tushiring
npm run dev
```

### MongoDB bilan bog'lanish xatosi:
- `server/.env` faylidagi `MONGODB_URI` to'g'riligini tekshiring
- MongoDB Atlas'da IP address qo'shilganligini tekshiring
- Parol to'g'ri kiritilganligini tekshiring

### Boshqa muammolar:
- `SETUP.md` - to'liq o'rnatish ko'rsatmasi
- `MONGODB_INSTALL.md` - MongoDB o'rnatish ko'rsatmasi

---

Omad! 🚀
