#!/bin/bash

# 🚀 Script Deploy Next.js lên Vercel
# Sử dụng: ./scripts/deploy.sh

echo "🚀 Bắt đầu quá trình deploy..."

# Kiểm tra git status
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Có thay đổi chưa commit. Bạn có muốn commit trước khi deploy? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "📝 Nhập commit message:"
        read -r commit_message
        git add .
        git commit -m "$commit_message"
    else
        echo "❌ Deploy bị hủy. Vui lòng commit thay đổi trước."
        exit 1
    fi
fi

# Push lên GitHub
echo "📤 Pushing code lên GitHub..."
git push origin main

echo "✅ Code đã được push lên GitHub!"
echo "🔍 Kiểm tra GitHub Actions tại: https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo "🌐 Kiểm tra Vercel deployment tại: https://vercel.com/dashboard"

echo "🎉 Deploy process hoàn tất!"
