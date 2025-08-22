# 🚀 Hướng dẫn Deploy Next.js lên Vercel với GitHub Actions

## 📋 Yêu cầu trước khi deploy

1. **GitHub Repository**: Dự án phải được push lên GitHub
2. **Vercel Account**: Đăng ký tài khoản tại [vercel.com](https://vercel.com)
3. **Node.js**: Phiên bản 18+ (đã được cấu hình trong workflow)

## 🔧 Thiết lập Vercel

### Bước 1: Tạo Project trên Vercel

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository từ GitHub
4. Cấu hình project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (hoặc để trống)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Bước 2: Lấy thông tin cần thiết

Sau khi tạo project, lấy các thông tin sau từ Vercel:

1. **Vercel Token**:
   - Vào [Vercel Account Settings](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Đặt tên: `GitHub Actions Deploy`
   - Copy token

2. **Project ID**:
   - Vào project settings trên Vercel
   - Copy "Project ID"

3. **Organization ID**:
   - Vào [Vercel Dashboard](https://vercel.com/dashboard)
   - Copy "Team ID" (nếu có) hoặc để trống cho personal account

## 🔐 Thiết lập GitHub Secrets

Vào repository GitHub → Settings → Secrets and variables → Actions

Thêm các secrets sau:

| Secret Name | Value | Mô tả |
|-------------|-------|-------|
| `VERCEL_TOKEN` | `your_vercel_token` | Token từ Vercel Account Settings |
| `VERCEL_ORG_ID` | `your_org_id` | Organization ID (để trống nếu personal) |
| `VERCEL_PROJECT_ID` | `your_project_id` | Project ID từ Vercel |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com` | URL của backend API |

## 🔄 Workflow hoạt động

Khi push code lên branch `main` hoặc `develop`:

1. **Checkout**: Lấy code từ repository
2. **Setup Node.js**: Cài đặt Node.js 18
3. **Install Dependencies**: Chạy `npm ci`
4. **Lint**: Kiểm tra code với `npm run lint`
5. **Build**: Build ứng dụng với `npm run build`
6. **Deploy**: Deploy lên Vercel

## 📁 Cấu trúc file đã tạo

```
.github/
└── workflows/
    └── deploy.yml          # GitHub Actions workflow

vercel.json                 # Cấu hình Vercel
DEPLOYMENT.md              # File hướng dẫn này
```

## 🚀 Deploy lần đầu

1. Push code lên GitHub:
```bash
git add .
git commit -m "Add CI/CD deployment configuration"
git push origin main
```

2. Kiểm tra GitHub Actions:
   - Vào repository → Actions tab
   - Xem workflow "Deploy to Vercel" đang chạy

3. Kiểm tra Vercel:
   - Vào Vercel Dashboard
   - Xem deployment status

## 🔧 Troubleshooting

### Lỗi thường gặp:

1. **Build failed**:
   - Kiểm tra lỗi trong GitHub Actions logs
   - Đảm bảo tất cả dependencies đã được cài đặt

2. **Environment variables missing**:
   - Kiểm tra GitHub Secrets đã được set đúng
   - Đảm bảo `NEXT_PUBLIC_API_URL` đã được cấu hình

3. **Vercel deployment failed**:
   - Kiểm tra Vercel token có đúng không
   - Đảm bảo project ID và org ID chính xác

### Kiểm tra logs:

- **GitHub Actions**: Repository → Actions → Workflow runs
- **Vercel**: Dashboard → Project → Deployments

## 📝 Lưu ý quan trọng

1. **Environment Variables**: Chỉ `NEXT_PUBLIC_*` variables mới có thể sử dụng ở client-side
2. **Build Cache**: GitHub Actions sẽ cache `node_modules` để tăng tốc build
3. **Auto-deploy**: Mỗi push lên `main` sẽ trigger deployment tự động
4. **Preview Deployments**: Pull requests sẽ tạo preview deployments

## 🔗 Links hữu ích

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
