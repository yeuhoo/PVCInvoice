# UI Design Reference - Modern Invoice System

This document shows what your new UI will look like with Shadcn/ui + Tailwind CSS

---

## 🎨 Design System Overview

### Color Scheme

**Primary Theme:** Professional Blue & White  
**Accent:** Your PVC brand color  
**Status Colors:**

- 🟢 Success/Paid: Green
- 🟡 Pending: Yellow/Amber
- 🔴 Overdue: Red
- 🔵 Draft: Blue

---

## 📱 Page Mockups (Text-Based)

### 1. Login Page

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              ┌─────────────────┐                   │
│              │  [PVC Logo]     │                   │
│              │   150x150       │                   │
│              └─────────────────┘                   │
│                                                     │
│         ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓              │
│         ┃  Welcome Back            ┃              │
│         ┃  Sign in to continue     ┃              │
│         ┃                          ┃              │
│         ┃  Email                   ┃              │
│         ┃  ┌──────────────────┐   ┃              │
│         ┃  │ admin@example... │   ┃              │
│         ┃  └──────────────────┘   ┃              │
│         ┃                          ┃              │
│         ┃  Password                ┃              │
│         ┃  ┌──────────────────┐   ┃              │
│         ┃  │ ••••••••••••     │   ┃              │
│         ┃  └──────────────────┘   ┃              │
│         ┃                          ┃              │
│         ┃  [ ] Remember me         ┃              │
│         ┃                          ┃              │
│         ┃  ┌──────────────────┐   ┃              │
│         ┃  │   Sign In   →    │   ┃              │
│         ┃  └──────────────────┘   ┃              │
│         ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**

- Centered card layout
- Large, clear inputs
- Smooth animations
- Error messages below fields
- Loading spinner on submit
- Gradient background

---

### 2. Dashboard (Main Page)

```
┌────┬────────────────────────────────────────────────────────────┐
│    │ PVC Invoice System          🔔  👤 John Admin (Admin) ▼   │
│    ├────────────────────────────────────────────────────────────┤
│ 📊 │                                                             │
│ 📝 │  Dashboard                                                  │
│ 📄 │  ┌─────────────────────────────────────────────────────┐  │
│ 👥 │  │ Stats Overview                                      │  │
│    │  │                                                     │  │
│▸   │  │  ┏━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━┓    │  │
│    │  │  ┃ 📄 Total   ┃ ┃ 💰 Revenue ┃ ┃ 🏢 Brokers ┃    │  │
│    │  │  ┃ Invoices   ┃ ┃            ┃ ┃            ┃    │  │
│    │  │  ┃    247     ┃ ┃  $125,430  ┃ ┃     12     ┃    │  │
│    │  │  ┃ +12% ↑     ┃ ┃  +8.2% ↑   ┃ ┃  Active    ┃    │  │
│    │  │  ┗━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━┛    │  │
│    │  │                                                     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Recent Invoices                         [+ New]     │  │
│    │  ├─────────────────────────────────────────────────────┤  │
│    │  │ ID     Client        Broker      Amount    Status  │  │
│    │  │ ─────────────────────────────────────────────────── │  │
│    │  │ #1234  ABC Corp     John B.     $2,450    🟢 Paid  │  │
│    │  │ #1235  XYZ Ltd      Sarah M.    $1,830    🟡 Pend  │  │
│    │  │ #1236  Tech Inc     Mike R.     $3,200    🟢 Paid  │  │
│    │  │ #1237  Global Co    John B.     $5,100    🔴 Over  │  │
│    │  │                                                     │  │
│    │  │                          [1] [2] [3] ... [10] →    │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

**Features:**

- Stat cards with trend indicators
- Quick actions
- Recent activity table
- Role-based content
- Responsive grid layout

---

### 3. Invoice List Page

```
┌────┬────────────────────────────────────────────────────────────┐
│    │ PVC Invoice System          🔔  👤 John Admin (Admin) ▼   │
│    ├────────────────────────────────────────────────────────────┤
│ 📊 │                                                             │
│ 📝 │  Invoices                                   [+ New Invoice] │
│ 📄 │  ┌─────────────────────────────────────────────────────┐  │
│ 👥 │  │ Search & Filters                                    │  │
│    │  │                                                     │  │
│▸   │  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐ │  │
│    │  │  │ 🔍 Search... │  │ Status ▼ │  │ Date Range ▼ │ │  │
│    │  │  └──────────────┘  └──────────┘  └──────────────┘ │  │
│    │  │                                                     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Invoice List                            247 results │  │
│    │  ├─────────────────────────────────────────────────────┤  │
│    │  │ ☐ │ # ↕    Client ↕      Amount ↕    Status ↕  ⚙  │  │
│    │  │───┼──────────────────────────────────────────────── │  │
│    │  │ ☐ │ #1234  ABC Corp      $2,450     🟢 Paid      ⋮ │  │
│    │  │ ☐ │ #1235  XYZ Ltd       $1,830     🟡 Pending   ⋮ │  │
│    │  │ ☐ │ #1236  Tech Inc      $3,200     🟢 Paid      ⋮ │  │
│    │  │ ☐ │ #1237  Global Co     $5,100     🔴 Overdue   ⋮ │  │
│    │  │ ☐ │ #1238  Startup LLC   $890       🔵 Draft     ⋮ │  │
│    │  │                                                     │  │
│    │  │  Showing 1-10 of 247     [<] [1][2][3]...[25] [>] │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

**Features:**

- Advanced search
- Column sorting
- Filters (status, date, broker)
- Bulk selection
- Quick actions menu (⋮)
- Pagination
- Export button

**Actions Menu (⋮):**

```
┌──────────────┐
│ 👁 View      │
│ ✏ Edit       │
│ 📄 Download  │
│ 📧 Send      │
│ 🗑 Delete    │
└──────────────┘
```

---

### 4. Invoice Create/Edit Form

```
┌────┬────────────────────────────────────────────────────────────┐
│    │ PVC Invoice System          🔔  👤 John Admin (Admin) ▼   │
│    ├────────────────────────────────────────────────────────────┤
│ 📊 │                                                             │
│ 📝 │ ← Back to Invoices                                         │
│ 📄 │                                                             │
│ 👥 │  Create New Invoice                                        │
│    │                                                             │
│▸   │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Invoice Details                                     │  │
│    │  │                                                     │  │
│    │  │  Invoice Number          Invoice Date               │  │
│    │  │  ┌──────────────┐       ┌──────────────┐           │  │
│    │  │  │ INV-2024-001 │       │ 2024-03-25 ▼ │           │  │
│    │  │  └──────────────┘       └──────────────┘           │  │
│    │  │                                                     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Client Information                                  │  │
│    │  │                                                     │  │
│    │  │  Select Client *                                    │  │
│    │  │  ┌─────────────────────────────────────────────┐   │  │
│    │  │  │ ABC Corporation                             ▼│   │  │
│    │  │  └─────────────────────────────────────────────┘   │  │
│    │  │  🔍 Search or add new client...                    │  │
│    │  │                                                     │  │
│    │  │  Broker *                                           │  │
│    │  │  ┌─────────────────────────────────────────────┐   │  │
│    │  │  │ John Broker                                 ▼│   │  │
│    │  │  └─────────────────────────────────────────────┘   │  │
│    │  │                                                     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Line Items                          [+ Add Item]    │  │
│    │  ├─────────────────────────────────────────────────────┤  │
│    │  │ Description   Qty   Rate      Amount         ⚙     │  │
│    │  │──────────────────────────────────────────────────── │  │
│    │  │ Service A     10    $100.00   $1,000.00     🗑     │  │
│    │  │ Service B     5     $200.00   $1,000.00     🗑     │  │
│    │  │                                                     │  │
│    │  │                          Subtotal:   $2,000.00     │  │
│    │  │                               Tax:     $200.00     │  │
│    │  │                     ─────────────────────────       │  │
│    │  │                             Total:   $2,200.00     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │                    [Cancel]  [Save Draft]  [Create Invoice]│
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

**Features:**

- Multi-section form
- Autocomplete selects
- Dynamic line items
- Real-time calculations
- Validation feedback
- Save draft option
- Cancel confirmation

---

### 5. Invoice Records Table

```
┌────┬────────────────────────────────────────────────────────────┐
│    │ PVC Invoice System          🔔  👤 Broker1 (Broker) ▼     │
│    ├────────────────────────────────────────────────────────────┤
│ 📊 │                                                             │
│ 📄 │  Invoice Records                                           │
│    │  ┌─────────────────────────────────────────────────────┐  │
│▸   │  │ Advanced Filters                                    │  │
│    │  │                                                     │  │
│    │  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  📥    │  │
│    │  │ │Search  │ │Status  │ │Broker  │ │Date    │ Export │  │
│    │  │ └────────┘ └────────┘ └────────┘ └────────┘       │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
│    │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Records                                 432 results │  │
│    │  ├─────────────────────────────────────────────────────┤  │
│    │  │ Record ID ↕  Invoice ↕  Client ↕  Amount ↕  Status ⚙│  │
│    │  │──────────────────────────────────────────────────── │  │
│    │  │ #R-0001   #1234   ABC Corp   $2,450   🟢 Paid    ⋮ │  │
│    │  │ #R-0002   #1235   XYZ Ltd    $1,830   🟡 Pending ⋮ │  │
│    │  │ #R-0003   #1236   Tech Inc   $3,200   🟢 Paid    ⋮ │  │
│    │  │ #R-0004   #1237   Global Co  $5,100   🔴 Overdue ⋮ │  │
│    │  │                                                     │  │
│    │  │  [<] [1] [2] [3] ... [44] [>]    Show: 10 ▼       │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

**Features:**

- Advanced filtering
- Export to CSV/Excel
- Quick view modal
- Edit inline or full page
- Delete (admin/super admin only)
- Pagination with page size

---

### 6. User Management (Super Admin)

```
┌────┬────────────────────────────────────────────────────────────┐
│    │ PVC Invoice System              👤 Super Admin ▼           │
│    ├────────────────────────────────────────────────────────────┤
│ 📊 │                                                             │
│ 📝 │  User Management                        [+ Create User]    │
│ 📄 │                                                             │
│ 👥 │  ┌─────────────────────────────────────────────────────┐  │
│    │  │ Users                                       12 users │  │
│▸   │  ├─────────────────────────────────────────────────────┤  │
│    │  │ Name           Email            Role        Status ⚙ │  │
│    │  │──────────────────────────────────────────────────── │  │
│    │  │ Admin User  admin@ex.com   🟣 Super Admin  🟢 Active⋮│  │
│    │  │ John Admin  john@ex.com    🔵 Admin        🟢 Active⋮│  │
│    │  │ Sarah Admin sarah@ex.com   🔵 Admin        🟢 Active⋮│  │
│    │  │ Broker 1    broker1@ex.com 🟡 Broker       🟢 Active⋮│  │
│    │  │   ↳ Linked to: Test Broker 1                       │  │
│    │  │ Broker 2    broker2@ex.com 🟡 Broker       🟢 Active⋮│  │
│    │  │   ↳ Linked to: wqewq                               │  │
│    │  │                                                     │  │
│    │  └─────────────────────────────────────────────────────┘  │
│    │                                                             │
└────┴─────────────────────────────────────────────────────────────┘
```

**Create User Dialog:**

```
┌─────────────────────────────────┐
│  Create New User            ✕   │
├─────────────────────────────────┤
│                                 │
│  Name *                         │
│  ┌───────────────────────────┐ │
│  │ John Doe                  │ │
│  └───────────────────────────┘ │
│                                 │
│  Email *                        │
│  ┌───────────────────────────┐ │
│  │ john@example.com          │ │
│  └───────────────────────────┘ │
│                                 │
│  Role *                         │
│  ┌───────────────────────────┐ │
│  │ Admin                    ▼│ │
│  └───────────────────────────┘ │
│  ○ Super Admin                 │
│  ● Admin                        │
│  ○ Broker                       │
│                                 │
│  [ ] Link to Broker Entity     │
│  ┌───────────────────────────┐ │
│  │ Select broker...         ▼│ │
│  └───────────────────────────┘ │
│                                 │
│  Password will be generated    │
│  and sent to user's email      │
│                                 │
│  [Cancel]     [Create User]    │
│                                 │
└─────────────────────────────────┘
```

**Features:**

- Modal dialogs for create/edit
- Role badges with colors
- Status indicators
- Broker linking visible
- Quick actions dropdown
- Password management

---

## 🎭 Component Library Preview

### Buttons

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Primary  │ │ Secondary│ │ Outline  │ │ Ghost    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ ⏳ Loading... │ │ ✓ Success    │ │ ✕ Danger     │
└──────────────┘ └──────────────┘ └──────────────┘

Sizes: [Extra Small] [Small] [Default] [Large]
```

### Inputs

```
Standard Input:
┌───────────────────────────────────┐
│ Enter text...                     │
└───────────────────────────────────┘

With Icon:
┌───────────────────────────────────┐
│ 🔍 Search invoices...             │
└───────────────────────────────────┘

Error State:
┌───────────────────────────────────┐
│ invalid@                          │
└───────────────────────────────────┘
⚠ Please enter a valid email

Success State:
┌───────────────────────────────────┐
│ john@example.com                ✓ │
└───────────────────────────────────┘
```

### Badges

```
🟢 Paid      🟡 Pending    🔴 Overdue    🔵 Draft

Roles:
🟣 Super Admin    🔵 Admin    🟡 Broker

Status:
🟢 Active    ⚪ Inactive    🔴 Suspended
```

### Cards

```
┌─────────────────────────────────────┐
│ Card Title                          │
│ ─────────────────────────────────── │
│                                     │
│ Card content goes here with nice   │
│ padding and borders. Can contain   │
│ any component.                      │
│                                     │
│ [Action Button] [Cancel]            │
└─────────────────────────────────────┘
```

### Toasts (Notifications)

```
Top-right corner:
┌─────────────────────────────────────┐
│ ✓ Success                       ✕   │
│ Invoice created successfully!       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚠ Warning                        ✕   │
│ Please check all required fields    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✕ Error                          ✕   │
│ Failed to save. Please try again.   │
└─────────────────────────────────────┘
```

### Select Dropdowns

```
Closed:
┌───────────────────────────────┐
│ Select an option...          ▼│
└───────────────────────────────┘

Open:
┌───────────────────────────────┐
│ Select an option...          ▲│
├───────────────────────────────┤
│ ✓ Option 1                    │
│   Option 2                    │
│   Option 3                    │
│ ─────────────────────────────│
│   + Add new...                │
└───────────────────────────────┘

With Search:
┌───────────────────────────────┐
│ 🔍 Search clients...         ▼│
├───────────────────────────────┤
│ ABC Corporation               │
│ XYZ Limited                   │
│ Tech Industries               │
└───────────────────────────────┘
```

### Data Tables

```
Standard:
┌──────────────────────────────────────────────────┐
│ Column 1 ↕  Column 2 ↕  Column 3 ↕      Actions │
├──────────────────────────────────────────────────┤
│ Data 1      Data 2      Data 3          ⋮       │
│ Data 1      Data 2      Data 3          ⋮       │
└──────────────────────────────────────────────────┘

With Selection:
┌──────────────────────────────────────────────────┐
│ ☐   Column 1 ↕  Column 2 ↕  Column 3 ↕    ⚙    │
├──────────────────────────────────────────────────┤
│ ☐   Data 1      Data 2      Data 3        ⋮     │
│ ☑   Data 1      Data 2      Data 3        ⋮     │
│ ☐   Data 1      Data 2      Data 3        ⋮     │
└──────────────────────────────────────────────────┘
│ 2 of 247 selected         [Delete] [Export]      │
```

---

## 🎨 Color Examples

### Light Mode (Default)

- **Background:** White (#FFFFFF)
- **Card:** White with subtle shadow
- **Border:** Light gray (#E5E7EB)
- **Text:** Dark gray (#111827)
- **Primary Button:** Blue (#3B82F6)
- **Secondary Button:** Gray (#6B7280)

### Dark Mode (Optional Future Enhancement)

- **Background:** Dark gray (#0F172A)
- **Card:** Slightly lighter gray (#1E293B)
- **Border:** Dark border (#334155)
- **Text:** Light gray (#F1F5F9)
- **Primary Button:** Bright blue (#60A5FA)

---

## 📱 Responsive Behavior

### Mobile (< 640px)

```
Sidebar collapses to hamburger menu:
┌─────────────────────────┐
│ ☰  PVC Invoice    👤 ▼ │
├─────────────────────────┤
│                         │
│  Content flows full     │
│  width.                 │
│                         │
│  Tables scroll          │
│  horizontally.          │
│                         │
│  Forms stack            │
│  vertically.            │
│                         │
└─────────────────────────┘
```

### Tablet (640px - 1024px)

```
Sidebar visible but narrower:
┌──┬──────────────────────┐
│  │                      │
│📊│   Content adapts     │
│📝│   Tables may scroll  │
│📄│   2-column forms     │
│👥│                      │
│  │                      │
└──┴──────────────────────┘
```

### Desktop (> 1024px)

```
Full layout with sidebar:
┌────┬─────────────────────┐
│    │                     │
│ 📊 │  Content full width │
│ 📝 │  Tables responsive  │
│ 📄 │  Multi-column forms │
│ 👥 │  All features shown │
│    │                     │
└────┴─────────────────────┘
```

---

## 🎯 Design Principles

1. **Clarity Over Cleverness**
   - Clear labels
   - Obvious actions
   - No hidden features

2. **Consistency**
   - Same patterns everywhere
   - Predictable behavior
   - Unified color scheme

3. **Efficiency**
   - Keyboard shortcuts
   - Bulk actions
   - Quick filters

4. **Accessibility**
   - WCAG AA compliant
   - Keyboard navigation
   - Screen reader friendly
   - Focus indicators

5. **Responsiveness**
   - Mobile-first
   - Touch-friendly
   - Adaptive layouts

---

## 🔍 Before & After Comparison

### Current Invoice Record Page

- Basic table
- Limited filtering
- No status badges
- No sorting
- Plain styling

### New Invoice Record Page

- Advanced TanStack Table
- Multi-column filters
- Color-coded status badges
- Column sorting (all columns)
- Modern shadcn/ui design
- Pagination
- Export functionality
- Quick actions menu
- Responsive design
- Better mobile experience

---

## 📊 Expected User Experience Improvements

| Feature           | Current | New                | Improvement |
| ----------------- | ------- | ------------------ | ----------- |
| Form Validation   | Basic   | Real-time with Zod | ⭐⭐⭐⭐⭐  |
| Table Sorting     | None    | All columns        | ⭐⭐⭐⭐⭐  |
| Mobile Experience | Poor    | Excellent          | ⭐⭐⭐⭐⭐  |
| Loading States    | Basic   | Smooth skeleton    | ⭐⭐⭐⭐    |
| Error Messages    | Generic | Specific & helpful | ⭐⭐⭐⭐⭐  |
| Visual Appeal     | Basic   | Professional       | ⭐⭐⭐⭐⭐  |
| Data Entry Speed  | Slow    | Fast (validation)  | ⭐⭐⭐⭐    |
| Search/Filter     | Limited | Advanced           | ⭐⭐⭐⭐⭐  |

---

## 🎨 Custom Branding

### Logo Integration

- Sidebar: 80x80px with white background removed
- Login: 150x150px centered
- PDF: 150x150px (already implemented)
- Favicon: 32x32px

### Brand Colors

You can customize the primary color to match your PVC brand:

```css
/* In globals.css */
:root {
  --primary: 221 83% 53%; /* Change to your brand color */
  --primary-foreground: 210 40% 98%;
}
```

---

## ✨ Future Enhancements (Post-MVP)

### Phase 2 Features

- [ ] Dark mode toggle
- [ ] Advanced dashboard charts
- [ ] Email integration
- [ ] Bulk operations
- [ ] Advanced reporting
- [ ] Activity audit log
- [ ] File attachments
- [ ] Comments/notes system

### Phase 3 Features

- [ ] Multi-language support
- [ ] Custom themes per user
- [ ] Keyboard shortcuts panel
- [ ] Collaborative editing
- [ ] Real-time notifications
- [ ] Advanced analytics

---

**Ready to see this in action?** Let's build it! 🚀
