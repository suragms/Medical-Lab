# 🏥 Thyrocare Lab - Internal Management System

A modern, fast, and efficient lab management system built for Thyrocare Lab - Kunnathpeedika.

## ✨ Features

### Core Features
- ✅ **Patient Management** - Fast registration with auto timestamps
- ✅ **Test Result Entry** - Quick entry with preloaded test master
- ✅ **Auto PDF Generation** - Thyrocare-styled professional reports
- ✅ **WhatsApp Sharing** - Free normal WhatsApp sharing
- ✅ **Email Sharing** - SMTP-based email delivery
- ✅ **Financial Tracking** - Revenue, expenses, and profit calculation
- ✅ **Staff Activity Logs** - Complete audit trail
- ✅ **Role-Based Access** - Admin and Staff roles
- ✅ **Offline Support** - Works with slow internet

### User Roles

**Admin (Owner - Awsin)**
- Full app control
- Manage test profiles, prices, and reference ranges
- View financial reports
- Add/manage staff
- Download backups
- Export data

**Staff (2 Members)**
- Register patients
- Mark sample collected/received
- Enter test results
- Generate and share reports
- Print reports

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
```bash
cd "c:\\Users\\ACER\\Desktop\\client Projects\\Thycare App LaB"
```

2. **Install dependencies** (Already done)
```bash
npm install
```

3. **Configure Firebase** (Optional - for production)
Edit `src/config/firebase.js` with your Firebase credentials

4. **Start development server**
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🔐 Demo Credentials

### Admin Access
- Email: `admin@thyrocare.com`
- Password: `admin123`

### Staff Access
- Email: `staff@thyrocare.com`
- Password: `staff123`

## 📁 Project Structure

```
thyrocare-lab/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Button, Card, Input etc.
│   │   └── Layout/        # Sidebar, Header
│   ├── pages/             # Main pages
│   │   ├── Dashboard/
│   │   ├── Login/
│   │   ├── Patients/
│   │   ├── Results/
│   │   ├── Financial/
│   │   └── Settings/
│   ├── store/             # Zustand state management
│   ├── data/              # Test master data
│   ├── config/            # Firebase config
│   ├── lib/               # Firebase initialization
│   └── index.css          # Global styles
├── package.json
└── vite.config.js
```

## 🎨 Design System

### Colors (Eye-Healthy Palette)
- **Primary Red**: `#c62828` - Main brand color
- **Primary Navy**: `#1a237e` - Secondary color
- **Primary Blue**: `#1976d2` - Accent color
- **Success**: `#2e7d32`
- **Warning**: `#f57c00`
- **Error**: `#c62828`

### Typography
- Font Family: System fonts (Segoe UI, Roboto, etc.)
- Reduced contrast for eye comfort
- Clear hierarchy

## 📦 Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM v6
- **State Management**: Zustand (with persistence)
- **UI Icons**: Lucide React
- **Notifications**: React Hot Toast
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Charts**: Recharts
- **Backend**: Firebase (Firestore + Auth + Storage)
- **Email**: Nodemailer (Gmail SMTP)

## 🔥 Key Features Details

### Test Master (Preloaded)
- **Haematology** - CBC with 14 parameters
- **Biochemistry** - Glucose, Creatinine, Urea, etc.
- **Lipid Profile** - Complete lipid panel
- **Liver Function (LFT)** - 10 parameters
- **Kidney Function (KFT)** - 6 parameters
- **Thyroid Profile** - T3, T4, TSH
- **Diabetes Profile** - FBS, PPBS, HbA1c
- **Vitamins** - D, B12
- **Electrolytes** - Na, K, Cl
- **Cardiac Markers** - Troponin, CPK, CK-MB

### Timestamps (Auto)
- Patient Created Time
- Sample Collected On
- Sample Received On
- Result Entered Time
- Reported On

### PDF Format
Matches Thyrocare style with:
- Lab header with contact
- Patient details
- Test results in categorized tables
- Reference ranges (gender-specific)
- Timestamps
- Staff signature
- Professional layout

## 📊 Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Complete financial module
- [ ] Automated WhatsApp notifications
- [ ] Google Drive backup integration
- [ ] Marketing tools
- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Inventory management

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Tests

Edit `src/data/testMaster.js` and add to the `TEST_MASTER` array:

```javascript
{
  id: 'UNIQUE_ID',
  name: 'Test Name',
  category: TEST_CATEGORIES.CATEGORY_NAME,
  unit: 'unit',
  referenceRange: 'range',
  visible: true
}
```

## 🔒 Security Notes

- Admin-only routes are protected
- Firebase rules should be configured for production
- SMTP credentials should be environment variables
- Patient data is sensitive - handle with care

## 📞 Support

For issues or questions, contact:
- **Lab Owner**: Awsin
- **Phone**: 7356865161

## 📄 License

This is a private internal application for Thyrocare Lab - Kunnathpeedika.

---

**Built with ❤️ for Thyrocare Lab - Kunnathpeedika**
