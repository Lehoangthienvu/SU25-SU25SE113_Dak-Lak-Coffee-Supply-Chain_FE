# 🔧 Hướng dẫn thiết lập Vercel chi tiết

## 📋 Bước 1: Tạo Vercel Token

1. Vào [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Đặt tên: `GitHub Actions Deploy`
4. Chọn scope: `Full Account`
5. **Copy token** (quan trọng!)

## 📋 Bước 2: Lấy Project ID

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click vào project của bạn
3. Vào tab "Settings"
4. Scroll xuống phần "General"
5. **Copy Project ID**

## 📋 Bước 3: Lấy Organization ID (nếu có)

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Nếu có team, copy "Team ID"
3. Nếu personal account, để trống

## 📋 Bước 4: Thiết lập GitHub Secrets

Vào repository GitHub → Settings → Secrets and variables → Actions

Thêm các secrets:

| Secret Name | Value | Ví dụ |
|-------------|-------|-------|
| `VERCEL_TOKEN` | Token từ bước 1 | `vercel_xxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | Org ID (để trống nếu personal) | `team_xxxxxxxx` |
| `VERCEL_PROJECT_ID` | Project ID từ bước 2 | `prj_xxxxxxxxxxxx` |
| `NEXT_PUBLIC_API_URL` | `https://daklak.coffee.techtheworld.id.vn/api` | URL backend |

## 🔍 Cách tìm thông tin:

### Vercel Token:
```
https://vercel.com/account/tokens
→ Create Token
→ Copy token
```

### Project ID:
```
https://vercel.com/dashboard
→ Click project
→ Settings
→ General
→ Project ID
```

### Team ID (nếu có):
```
https://vercel.com/dashboard
→ Team settings
→ General
→ Team ID
```
