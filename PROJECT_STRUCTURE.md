# Cấu trúc dự án Electron App - Quản lý chấm công

## 📁 Cấu trúc thư mục

```
electron-app/
├── src/
│   ├── main/                      # Main Process (Backend)
│   │   ├── index.ts              # Entry point
│   │   ├── handlers/             # IPC Handlers
│   │   │   └── attendanceHandlers.ts
│   │   ├── utils/                # Utilities
│   │   │   ├── attendanceGenerator.ts
│   │   │   ├── excelUtils.ts
│   │   │   └── dialogUtils.ts
│   │   └── types/                # Type definitions
│   │       └── attendance.ts
│   │
│   ├── renderer/                  # Renderer Process (Frontend)
│   │   └── src/
│   │       ├── App.tsx           # Root component
│   │       ├── pages/            # Pages
│   │       │   └── AttendancePage/
│   │       │       └── index.tsx
│   │       ├── components/       # Reusable components
│   │       │   ├── DateRangeSelector/
│   │       │   │   └── index.tsx
│   │       │   ├── EmployeeTransfer/
│   │       │   │   └── index.tsx
│   │       │   └── ExportButton/
│   │       │       └── index.tsx
│   │       ├── services/         # API services
│   │       │   └── attendanceService.ts
│   │       ├── types/            # Type definitions
│   │       │   └── employee.ts
│   │       └── data/             # Mock data
│   │           └── mockEmployees.ts
│   │
│   └── preload/                   # Preload scripts
│       ├── index.ts
│       └── index.d.ts
```

## 🎯 Kiến trúc ứng dụng

### Main Process (Backend)

- **handlers/**: Xử lý IPC requests từ renderer
- **utils/**: Các hàm tiện ích (tạo Excel, dialog, generator)
- **types/**: Type definitions cho TypeScript

### Renderer Process (Frontend)

- **pages/**: Các trang chính của ứng dụng
- **components/**: Components tái sử dụng
- **services/**: Layer giao tiếp với Electron API
- **types/**: Type definitions
- **data/**: Dữ liệu tĩnh/mock

## 🚀 Hướng dẫn mở rộng

### Thêm component mới

Tạo folder mới trong `src/renderer/src/components/`:

```tsx
// src/renderer/src/components/NewComponent/index.tsx
export const NewComponent: React.FC<Props> = (props) => {
  return <div>...</div>
}
```

### Thêm page mới

Tạo folder mới trong `src/renderer/src/pages/`:

```tsx
// src/renderer/src/pages/NewPage/index.tsx
export const NewPage: React.FC = () => {
  return <div>...</div>
}
```

### Thêm IPC handler mới

1. Tạo handler trong `src/main/handlers/`
2. Export function `registerXxxHandlers()`
3. Import và gọi trong `src/main/index.ts`

### Thêm service mới

Tạo file mới trong `src/renderer/src/services/`:

```tsx
// src/renderer/src/services/newService.ts
export const newApiCall = async (data: DataType) => {
  return await window.electron.ipcRenderer.invoke('channel-name', data)
}
```

## 📦 Dependencies

- **antd**: UI component library
- **date-fns**: Date manipulation
- **xlsx**: Excel generation
- **@ant-design/icons**: Icon library

## 🔧 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```
