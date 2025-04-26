# sn-shadcn-kit

A tree shakeable collection of react components built using using [ShadCN UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/).

Designed to give ServiceNow developers easy access to react components on the platform. To find out more about creating a react environment inside of a ServiceNow instance visit [servicenow-react-app](https://github.com/elinsoftware/servicenow-react-app).

For a demonstration on an application that uses these components which you can install on your own ServiceNow instance visit [sn-react-shadcn-demo](https://github.com/vincepg13/sn-react-shadcn-demo).

---

## 📦 Installation

If you are installing from scratch then install the component and its peer dependencies:

```bash
npm install sn-shadcn-kit react react-dom @tanstack/react-table tailwindcss axios
```

---

## 🎨 Tailwind Setup (v4+)

To ensure Tailwind includes styles used in the component, add this to your global CSS file (e.g. `index.css`):

```css
@import 'tailwindcss';
@source "./node_modules/sn-shadcn-kit/dist";
```
---

## 🏓 Tables, Tables and More Tables
When using either of the data tables, it will display each fields display value in the corresponding cell. If you want to take control of the UI, you can do this by passing in your own column definitions to the table. To find out more about column definitions in Tanstack visit the [Column Definition Guide](https://tanstack.com/table/v8/docs/guide/column-defs)

```tsx
import { SnDataTable, SnRow } from 'sn-shadcn-kit'

const columns = [
  {
    accessorKey: 'short_description',
    header: 'Short Description',
    cell: ({ getValue }) => getValue()?.display_value,
  },
]

<SnDataTable
  table="incident"
  fields={['short_description', 'priority', 'state']}
  columnDefinitions={columns}
/>
```

---

## 🔧 Props

### `<SnDataTable />`

| Prop               | Type                                 | Description                              |
|--------------------|--------------------------------------|------------------------------------------|
| `table`            | `string`                             | ServiceNow table name (e.g. `"incident"`)|
| `fields`           | `string[]`                           | List of field names to include           |
| `query`            | `string` (optional)                  | Encoded query string                     |
| `defaultPageSize`  | `number` (optional)                  | Default number of rows per page          |
| `onRowClick`       | `(row: SnRow) => void` (optional)    | Callback when a row is clicked           |
| `columnDefinitions`| `ColumnDef<SnRow, SnRowItem>[]`      | Custom column definitions                |

---

## 🧩 Also available

### `<SnTable />`

A wrapper to SnDataTable that inserts the fields array based on a SerivceNow List view.

This has more or less the same properties as SnDataTable with the exception that you **_no longer pass through fields_**. Instead the table will do the following:
- Display the last used view of the logged in user with any customisations to it
- If they have no list view pref for that table, it will display the default view
- You can pass in the view name of a specific view via the *view* property

---

## 📘 Types

This package exports helpful types for working with ServiceNow data:

```ts
import type { SnRow, SnRowItem } from 'sn-shadcn-kit'
```

SnRowItem corresponds to a fields value which is simply an object with both its value and display_value. SnRow is a record (array) of SnRowItems.

---

## 🪪 License

MIT © Two Portal Guys

---