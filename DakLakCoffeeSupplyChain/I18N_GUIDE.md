# 🌍 Hướng dẫn i18n hóa ứng dụng DakLak Coffee Supply Chain

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Cấu trúc file ngôn ngữ](#cấu-trúc-file-ngôn-ngữ)
- [Quy tắc đặt tên key](#quy-tắc-đặt-tên-key)
- [Quy trình thực hiện](#quy-trình-thực-hiện)
- [Các component cần i18n hóa](#các-component-cần-i18n-hóa)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [Kiểm tra chất lượng](#kiểm-tra-chất-lượng)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

**Mục tiêu:** Chuyển đổi toàn bộ ứng dụng từ tiếng Việt hardcode sang hệ thống đa ngôn ngữ sử dụng `react-i18next` với cấu trúc key phân cấp rõ ràng.

**Công nghệ sử dụng:**
- `react-i18next` - Thư viện i18n chính
- JSON files - File ngôn ngữ
- TypeScript - Đảm bảo type safety

## 📁 Cấu trúc file ngôn ngữ

### File chính:
```
src/i18n/locales/
├── vi.json          # Tiếng Việt
└── en.json          # Tiếng Anh
```

### Cấu trúc phân cấp:
```json
{
  "processing": {
    "pages": {
      "farmerBatches": {
        "batchDetail": {
          "create": { ... },
          "edit": { ... },
          "UpdateAdvanprogress": { ... }
        },
        "progress": {
          "progressDetail": { ... }
        }
      },
      "farmerProgress": { ... },
      "farmerWaste": { ... }
    }
  }
}
```

## 🔑 Quy tắc đặt tên key

### 1. Cấu trúc phân cấp:
```
[module].[section].[subsection].[component].[element]
```

### 2. Ví dụ cụ thể:
```
processing.pages.farmerBatches.batchDetail.create.title
processing.pages.farmerBatches.batchDetail.edit.form.submit
processing.pages.farmerBatches.batchDetail.UpdateAdvanprogress.form.actions.submit
```

### 3. Quy tắc đặt tên:
- **Sử dụng camelCase** cho tất cả keys
- **Tên có ý nghĩa** và dễ hiểu
- **Nhất quán** trong toàn bộ ứng dụng
- **Tránh viết tắt** không rõ ràng

## ⚙️ Quy trình thực hiện

### Bước 1: Phân tích component
```tsx
// Xác định tất cả hardcode strings
<h1>Tạo lô mới</h1>                    // ✅ Cần i18n
<p>Thêm lô chế biến mới</p>            // ✅ Cần i18n
<span>{batch.totalOutputQuantity} kg</span>  // ❌ Không cần (số liệu)
```

### Bước 2: Thiết kế cấu trúc key
```json
// vi.json
{
  "processing": {
    "pages": {
      "farmerBatches": {
        "batchDetail": {
          "create": {
            "title": "Tạo lô mới",
            "description": "Thêm lô chế biến mới vào hệ thống",
            "form": {
              "submit": "Lưu",
              "cancel": "Hủy"
            }
          }
        }
      }
    }
  }
}
```

### Bước 3: Thêm keys vào file ngôn ngữ
- Thêm vào `vi.json` trước
- Copy cấu trúc sang `en.json`
- Dịch sang tiếng Anh

### Bước 4: Thay thế hardcode strings
```tsx
// Trước
export default function CreateBatchPage() {
  return (
    <div>
      <h1>Tạo lô mới</h1>
      <p>Thêm lô chế biến mới vào hệ thống</p>
      <Button>Lưu</Button>
    </div>
  );
}

// Sau
export default function CreateBatchPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('processing.pages.farmerBatches.batchDetail.create.title')}</h1>
      <p>{t('processing.pages.farmerBatches.batchDetail.create.description')}</p>
      <Button>{t('processing.pages.farmerBatches.batchDetail.create.form.submit')}</Button>
    </div>
  );
}
```

### Bước 5: Kiểm tra và test
- Kiểm tra JSON syntax
- Test component hoạt động
- Verify tất cả strings đã được thay thế

## 🧩 Các component cần i18n hóa

### ✅ Đã hoàn thành:
- `batches/[id]/edit/page.tsx` - Trang chỉnh sửa batch
- `AdvanceProcessingProgressForm.tsx` - Form cập nhật tiến trình

### 🔄 Đang thực hiện:
- `batches/create/page.tsx` - Trang tạo batch mới

### ⏳ Chưa thực hiện:
- `progresses/create/page.tsx` - Trang tạo tiến trình
- `progresses/[id]/page.tsx` - Trang chi tiết tiến trình
- `progresses/page.tsx` - Trang danh sách tiến trình

## 📝 Ví dụ thực tế

### 1. Component đơn giản:
```tsx
// Trước
<div className="alert">
  <h3>Thông báo quan trọng</h3>
  <p>Vui lòng kiểm tra lại thông tin trước khi lưu</p>
</div>

// Sau
<div className="alert">
  <h3>{t('processing.common.alerts.important.title')}</h3>
  <p>{t('processing.common.alerts.important.message')}</p>
</div>
```

### 2. Component phức tạp:
```tsx
// Trước
<div className="form-section">
  <h2>Thông tin cơ bản</h2>
  <div className="form-group">
    <label>Mã lô:</label>
    <input placeholder="Nhập mã lô..." />
  </div>
  <div className="form-group">
    <label>Số lượng đầu vào:</label>
    <input placeholder="Nhập số lượng..." />
  </div>
</div>

// Sau
<div className="form-section">
  <h2>{t('processing.pages.farmerBatches.batchDetail.form.basicInfo.title')}</h2>
  <div className="form-group">
    <label>{t('processing.pages.farmerBatches.batchDetail.form.basicInfo.batchCode')}:</label>
    <input placeholder={t('processing.pages.farmerBatches.batchDetail.form.basicInfo.batchCodePlaceholder')} />
  </div>
  <div className="form-group">
    <label>{t('processing.pages.farmerBatches.batchDetail.form.basicInfo.inputQuantity')}:</label>
    <input placeholder={t('processing.pages.farmerBatches.batchDetail.form.basicInfo.inputQuantityPlaceholder')} />
  </div>
</div>
```

### 3. Validation messages:
```tsx
// Trước
if (!batchCode) {
  setError('Mã lô không được để trống');
}

// Sau
if (!batchCode) {
  setError(t('processing.pages.farmerBatches.batchDetail.form.validation.batchCodeRequired'));
}
```

## ✅ Kiểm tra chất lượng

### Checklist:
- [ ] Không còn hardcode tiếng Việt
- [ ] Tất cả strings đều sử dụng `t('key')`
- [ ] Keys có ý nghĩa và dễ hiểu
- [ ] Cấu trúc phân cấp nhất quán
- [ ] JSON syntax hợp lệ
- [ ] Component hoạt động bình thường
- [ ] Không có lỗi TypeScript

### Kiểm tra JSON syntax:
```bash
# Kiểm tra vi.json
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/vi.json', 'utf8'))"

# Kiểm tra en.json  
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json', 'utf8'))"
```

## 🚨 Troubleshooting

### Lỗi thường gặp:

#### 1. JSON syntax error:
```
Error: Unexpected token in JSON
```
**Giải pháp:** Kiểm tra dấu phẩy, ngoặc nhọn, escape characters

#### 2. Key không tìm thấy:
```
Key "processing.pages.farmerBatches.create.title" not found
```
**Giải pháp:** Kiểm tra key đã được thêm vào file ngôn ngữ chưa

#### 3. Component không render:
**Giải pháp:** Kiểm tra import `useTranslation` và gọi `t()` function

#### 4. TypeScript error:
```
Property 't' does not exist on type 'UseTranslationResponse'
```
**Giải pháp:** Kiểm tra import và type definition

### Debug tips:
1. **Console.log** để kiểm tra key values
2. **React DevTools** để inspect component props
3. **Network tab** để kiểm tra file ngôn ngữ load
4. **TypeScript compiler** để phát hiện type errors

## 📚 Tài liệu tham khảo

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n-routing)

## 🤝 Đóng góp

Khi thêm keys mới:
1. Cập nhật cả `vi.json` và `en.json`
2. Kiểm tra JSON syntax
3. Test component hoạt động
4. Commit với message rõ ràng

---

**Lưu ý:** Luôn giữ nguyên logic nghiệp vụ, chỉ thay đổi text hiển thị. Đảm bảo ứng dụng hoạt động ổn định sau khi i18n hóa.
