# sn-shadcn-kit

A tree shakeable collection of react components built using [ShadCN UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/). Built and tested using React 19.

Designed to give ServiceNow developers easy access to react components on the platform. Visit [sn-shadkit-sdk](https://github.com/vincepg13/sn-shadkit-sdk) for a demo app which can be installed onto ServiceNow instances.

---

## 📦 Installation

If you are installing from scratch then install the component and its peer dependencies:

```bash
npm install sn-shadcn-kit react react-dom @tanstack/react-table tailwindcss axios
```

---

## ⚠️ V2 Breaking Changes

V2 of this package focuses on improving performance in consuming applications. To achieve this, TypeScript build and bundling options have been updated.

- **All dependencies are now externalized.**
- **Imports are split by feature path** to promote better tree-shaking and smaller bundle sizes.

Instead of importing everything from `sn-shadcn-kit`, use one of the available subpaths:

- **`sn-shadcn-kit`** – Root exports for core setup utilities like `setAxiosInstance` / `getAxiosInstance`.
- **`sn-shadcn-kit/amb`** – Functionality for ServiceNow’s _Asynchronous Message Bus_ (e.g., `useRecordWatch`).
- **`sn-shadcn-kit/form`** – Form components (relies on heavier deps like CodeMirror and TipTap). ⚡ Consider lazy-loading these in your app.
- **`sn-shadcn-kit/table`** – Components and utilities for working with ServiceNow tables.
- **`sn-shadcn-kit/user`** – User-related components (avatars, user cards, group cards).
- **`sn-shadcn-kit/skeleton`** – Placeholder skeletons and loaders.
- **`sn-shadcn-kit/script`** – Script editor logic, including linting, formatting, and editor integrations.
- **`sn-shadcn-kit/standalone`** – Lightweight components without heavy dependencies (e.g., attachments, record watchers).

If you are migrating to V2+, please make sure you update necessary imports in your application.

---

## 🎨 CSS/Tailwind Setup (v4+)

To ensure Tailwind includes styles used in the component, add this to your global CSS file (e.g. `index.css`):

```css
@import 'tailwindcss';
@source "./node_modules/sn-shadcn-kit/dist";
```

The HTML editor used in the form component needs to have its own stylesheets imported. The easiest way to do this is to grab the entire [tiptap styles folder](https://github.com/vincepg13/sn-shadkit-sdk/tree/main/src/client/styles/tiptap) from the demo repo then import it into your global css file.

```css
@import './styles/tiptap/index.css';
```

---

## 🔑 Axios Setup (IMPORTANT)

Components which fetch data from a ServiceNow instance (such as tables) use a **shared Axios instance**. In production, the authentication details will be automatically provided to axios via the ServiceNow session cookie. If you are using a devleopment server to test your app however, you must configure Axios to provide authentication to this package.

In development mode authentication can be provided via basic auth or via spoofing the ServiceNow session cookie of an active instance. For more details on how this works visit the [Environment Variables](https://github.com/vincepg13/sn-shadkit-template#-environment-variables) section of the Shadcn Kit Template repository

✅ **Example Setup in Hosting Application:**

```tsx
import axios from 'axios'
import { setAxiosInstance } from 'sn-shadcn-kit'

if (import.meta.env.MODE === 'development') {
  axios.defaults.auth = {
    username: import.meta.env.VITE_REACT_APP_USER,
    password: import.meta.env.VITE_REACT_APP_PASSWORD,
  }
}

// Important: inject the configured instance into sn-shadcn-kit
setAxiosInstance(axios)
```

---

## 🏓 Tables, Tables and More Tables

When using either of the data tables, it will display each fields display value in the corresponding cell. If you want to take control of the UI, you can do this by passing in your own column definitions to the table. To find out more about column definitions in Tanstack visit the [Column Definition Guide](https://tanstack.com/table/v8/docs/guide/column-defs).

Below is an example of how you would use the table but make all the short description values have red text.

```tsx
import { SnDataTable, SnRow } from 'sn-shadcn-kit/table'

const columns = [
  {
    accessorKey: 'short_description',
    header: 'Short Description',
    cell: ({ getValue }) => <div className="text-red-500">{getValue()?.display_value}</div>,
  },
]

<SnDataTable
  table="incident"
  fields={['short_description', 'priority', 'state']}
  columnDefinitions={columns}
/>
```

Below is an Example of what SnTable looks like with no UI modifications:
![SnTable Demo](/demo/SNDemoTableConditions.png)

### 🔧 Props

### `<SnDataTable />`

| Prop                      | Type                            | Description                               |
| ------------------------- | ------------------------------- | ----------------------------------------- |
| `table`                   | `string`                        | ServiceNow table name (e.g. `"incident"`) |
| `fields`                  | `string[]`                      | List of field names to include            |
| `query` **?**             | `string`                        | Encoded query string                      |
| `defaultPageSize` **?**   | `number`                        | Default number of rows per page           |
| `onRowClick` **?**        | `(row: SnRow) => void`          | Callback when a row is clicked            |
| `columnDefinitions` **?** | `ColumnDef<SnRow, SnRowItem>[]` | Custom column definitions                 |

### `<SnTable />`

A wrapper to SnDataTable that inserts the fields array based on a SerivceNow List view.

This has more or less the same properties as SnDataTable with the exception that you **_no longer pass through fields_**. Instead the table will do the following:

- Display the last used view of the logged in user with any customisations to it
- If they have no list view pref for that table, it will display the default view
- You can pass in the view name of a specific view via the _view_ property

You may also noticed in the screenshot above the table includes a Condition Builder. This is a stand alone component <SnFilter/> which you can read more about in the Generic

---

## 📝 ServiceNow Forms

If your'e familiar with widget development in the ServicePortal you'll know ServiceNow provide a method in the GlideScriptable API ($sp.getForm) that can return you the entire metadata for any given form. The below component set is a **beta version** of how you can consume that metadata and recreate a ServiceNow form with the same layout as well as UI policies, Client Scripts and UI actions.

My aim is to provide the same level of support for [Client Side APIs](https://www.servicenow.com/docs/bundle/xanadu-platform-user-interface/page/build/service-portal/reference/client-script-reference.html) that ServiceNow provide in the service portal.

Supported currently:

- **Fields**: Most(but not every) field types are supported. If the form encounters an unmapped field type it will be hidden.
- **Form Layout**: Form will render in the layout provided by ServiceNow which includes tabbed sections and their respective columns.
- **UI Policies**: None-scripted UI Policies using the standard mandatory/visible/readonly options. The set and clear value options are currently unsupported.
- **Client Scripts**: All will attempt to execute. Any unmapped g_form methods will send a warning to the console but still attempt to process the rest of the client script. Any failures will terminate the current client script and proceed to the next.

### `<SnFormWrapper />` && `<SnForm />`

Load a form using SnFormWrapper by giving it the api path to a scripted rest message above, the table name to load, and a guid (sysid)

SnFormWrapper props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `guid` | `string` | sys_id of a record |
| `table` | `string` | Table name the record belongs to |
| `apis` | `SnFormApis` | Resource path to metadata apis |
| `snInsert` **?** | (guid: string) => void | Optional callback triggered on record insert |
| `snUpdate` **?** | (guid: string) => void | Optional callback triggered on record insert |

To use the form you must provide it with all necessary metadata, I do this via a scripted API calls in the global scope. The apis property should be an object which stores these endpoints e.g:

```js
{
  formData: '/api/659318/react_form/fd/problem/-1?view=',
  refDisplay: '/api/659318/react_form/ref_display'
}
```

You can find this code in the sn-scripts folder of the repo: [getFormMetadata.js](./sn-scripts/getFormMetadata.js), [getReferenceDisplay.js](./sn-scripts/getReferenceDisplay.js)

This component will then consume the metadata from the api response and pass it to **`<SnForm/>`** to build the form

![SnFormDemo](/demo/SNDemoForm.png)
![SnFormRefs](/demo/SNDemoFormRefs.png)
![SnFormDates](/demo/SNDemoFormDates.png)

## 🧩 Standalone Components

Within both the table and form components I make use of various standalone components. These are can be dropped in anywhere and do not have to exist only within tables or forms.

## `<SnTabs />`

A wrapper around the shadcn tab components which allow you to pass in an array of tabs to be rendered. Each tab just needs to set a label and the ReactNode element to be rendered, if there are any possibilities of duplicate labels among the tabs then also set a key.

SnTabs props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `tabs` | `string` | An Array of Tabs (`{label: string, key?: string, content: ReactNode}`) |
| `value` **?** | `string` | The tab to preset on load |
| `onValueChange` **?** | `(val: string) => void` | Callback method to execute when a tab changes |

## `<SnClippy/>`

Your own personal clippy to be used in ServiceNow. Just give it a table and record then click the paperclip icon to view all the attachments in a shadcn sheet. From here you can delete attachments or add new onces using the drop zone in the footer of the sheet.

SnClippy props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load attachments from |
| `guid` | `string` | The sys_id of the record to load attachments from |
| `instance` **?** | `string` | Only needed when testing on a dev server, but the SN instance name |

## `<SnActivity/>`

Given the current users sys_id, a table and a record sys_id, this component will build the activity formatter. Currently the formatter will only display journal input field history and allow you to post directly to any of these fields. Field changes, attachment updates and html are not currently supported.

SnActivity props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load the activity formatter from |
| `guid` | `string` | The sys_id of the record to load the activity formatter from |
| `user` | `string` | The sys_id of the current user |
| `fullwidth` **?** | `boolean` | Setting this to true will display each row in the formatter in full width instead of the default left/right chat layout |

## `<SnFilter/>`

Used to display the condition builder of any given table. The component presents itself as a filter icon with the current query next to it. You can then click on the filter icon to open the full condition builder (Which is its own component you can also use, **`<SnConditionBuilder />`**).

SnFilter props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load the conditions from |
| `encodedQuery` **?** | `string` | The initial query to build |
| `initialOpenState` **?** | `open OR closed` | Whether to have the condition builder open on first load. It will default to closed. |
| `onQueryBuilt` **?** | `(encoded: string)` | The callback called when the user executes the built condition by pressing the Run button |

## `<SnScriptEditor />`

A modern script editor built using CodeMirror V6, designed to work seamlessly with ServiceNow script fields. This editor includes formatting, jslint, themeing, plus all the built in codemirror commands such as searching and commenting etc.

SnScriptEditor props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record containing a script field |
| `snType`  | `SnScriptFieldType` | The script field type based on the fields dictionary record (script/script_plain/html_template/css)  |
| `fieldName` | `string` | The database column name of the script field |
| `content` **?** | `string` | Initial value |
| `readonly` **?** | `boolean` | When true the script field is locked |
| `esLintConfig` **?** | `ESLintConfigAny` | An es lint config object in either V8 or V9 format |
| `onChange` **?** | `(value: string) => void` | The callback called when a script is changed (runs on blur) |

![SnScript](/demo/SNDemoScriptEditor.png)
![SnActivity](/demo/SNActivityDemo.png)
![SnFormAttachments](/demo/SNDemoFormAttachments.png)

## 👥 Interacting With User Data

### `<SnAvatar />`

Can be used to display a users avatar. This will show their photo as a thumbnail if supplied, else it will fall back to their initials

```ts
<SnAvatar name={name} image={image} className="size-12" />
```

### `<SnUserCard />`

This will display the details of a given user
| Prop | Type | Description |
|----------------|------------------- |------------------------------------------------|
| `name` | `string` | User's name |
| `email` | `string` | User's email address |
| `phone` **?** | `string` | User's contact number |
| `image` **?**| `string` | User's avatar image |
| `primaryInfo` **?** | `string` | Information shown under the user's name |
| `im` **?** | `string` | Instant messaging link to the user's contact |

### `<SnGroupWrapper />` && `<SnGroupCard />`

SnGroupWrapper is designed to be easily used by simply passing in a groups sys_id, page size and a callback to build the instant messaging link per user. This wrapper will then load all the metadata for a group and feed it into SnGroupCard. If you just want to quickly load a group, this wrapper is the easiest way. Alternatively if you are loading multiple groups or want any custom logic around the group metadata then use SnGroupCard directly and pass in all the necessary props instead.

SnGroupWrapper props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `guid` | `string` | sys_id of a group record |
| `pagesize` | `number` | Number of members to show per page |
| `getImLink` **?** | `callback` | Function to build each users IM link |

below is an example of how to use SnRecordPicker (which allows you to fetch data from a ServiceNow table in a drop down) to select a user and display their details

```ts
import { useState } from 'react'
import { SnUserCard } from "sn-shadcn-kit/user";
import { SnRecordPicker, SnRecordPickerItem } from 'sn-shadcn-kit/standalone'

export default function ServicenowUI() {
  const [selected, setSelected] = useState<SnRecordPickerItem | null>(null)

  return (
    <div className="">
      <div className="max-w-[400px] flex flex-col gap-4">
        <SnRecordPicker
          table="sys_user"
          fields={['name', 'email']}
          metaFields={['title', 'avatar', 'mobile_phone']}
          query="active=true^nameSTARTSWITHVince"
          value={selected}
          onChange={setSelected}
          placeholder="Select a user to view their card..."
        ></SnRecordPicker>
        {selected?.meta && (
          <SnUserCard
            name={selected.meta!.name.display_value}
            im={`https://teams.microsoft.com/l/chat/0/0?users=${selected.meta.email.value}`}
            email={selected.meta.email.value}
            phone={selected.meta.mobile_phone.value}
            image={`/${selected.meta.avatar.display_value}`}
            primaryInfo={selected.meta.title.display_value}
          ></SnUserCard>
        )}
      </div>
    </div>
  )
}
```

![SnUserCardDemo](https://github.com/vincepg13/sn-react-shadcn-demo/blob/main/assets/SnGroupUser%20Cards.png?raw=true)

---

## Hooks

A useful hook exported by this package which allows you to react to database changes in ServiceNow is **`useRecordWatch`**

This hook makes use of the same web socket connection ServicePortal and UI Builder use to provide real time updates. Just give it a table, query and a callback function, then when updates to watched records are made your callback function will be triggered with a message object of type SnAmbMessage. This will provide all information related to the database change.

Example use:

```ts
import { SnAmbMessage, useRecordWatch } from 'sn-shadcn-kit/amb'

export function ServicenowAmb() {
  const watcherCallback = (message: SnAmbMessage) => {
    console.log('Record changed: ', message)
  }

  useRecordWatch('problem', 'active=true', watcherCallback)
}
```

---

## 📘 Types

This package exports helpful types for working with ServiceNow data:

```ts
import type { SnRow, SnRowItem } from 'sn-shadcn-kit/table'
import type { SnUser, SnGroup } from 'sn-shadcn-kit/user'
import type { SnRecordPickerItem, SnRecordPickerList } from 'sn-shadcn-kit/standalone'
```

- SnRowItem corresponds to a fields value which is simply an object with both its value and display_value. SnRow is a record (array) of SnRowItems.
- SnUser and SnGroup define the schema for a user and group object respectively
- SnRecordPickerItem represents all the data you will get back when selecting a record using the SnRecordPicker component, and SnRecordPickerList is an array of these items

---

## 🪪 License

MIT © Two Portal Guys

---
