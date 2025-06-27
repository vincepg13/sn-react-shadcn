# sn-shadcn-kit

A tree shakeable collection of react components built using using [ShadCN UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/). Built and tested using React 19.

Designed to give ServiceNow developers easy access to react components on the platform. To find out more about creating a react environment inside of a ServiceNow instance visit [servicenow-react-app](https://github.com/elinsoftware/servicenow-react-app).

For a demonstration on an application that uses these components which you can install on your own ServiceNow instance visit [sn-react-shadcn-demo](https://github.com/vincepg13/sn-react-shadcn-demo).

---

## 📦 Installation

If you are installing from scratch then install the component and its peer dependencies:

```bash
npm install sn-shadcn-kit react react-dom @tanstack/react-table tailwindcss axios
```

---

## 🎨 CSS/Tailwind Setup (v4+)

To ensure Tailwind includes styles used in the component, add this to your global CSS file (e.g. `index.css`):

```css
@import 'tailwindcss';
@source "./node_modules/sn-shadcn-kit/dist";
```

The HTML editor used in the form component needs to have its own stylesheets imported. The easiest way to do this is to grab the entire styles folder from the demo repo then import it into your global css file.

```css
@import "./styles/tiptap/index.css";
```
---

## 🔑 Axios Setup (IMPORTANT)

Any components which fetch data from a ServiceNow instance (such as tables) use a **shared Axios instance**. You must configure Axios **in your app** to provide authentication.

Depending on your environment:

- **Development mode:** you can set basic auth credentials (`username` and `password`) directly.
- **Production mode:** you should set the `X-userToken` header after retrieving a session token.

You must then call `setAxiosInstance` (provided by this package) to inject your configured Axios instance.

✅ **Example Setup in Hosting Application:**

```tsx
import axios from 'axios'
import { setAxiosInstance } from 'sn-shadcn-kit'

if (import.meta.env.MODE === 'development') {
  axios.defaults.auth = {
    username: import.meta.env.VITE_REACT_APP_USER,
    password: import.meta.env.VITE_REACT_APP_PASSWORD,
  }
} else {
  const response = await axios.get(import.meta.env.VITE_TOKEN_PATH)
  axios.defaults.headers['X-userToken'] = response.data.result.sessionToken
}

// Important: inject the configured instance into sn-shadcn-kit
setAxiosInstance(axios)
```

---

## 🏓 Tables, Tables and More Tables

When using either of the data tables, it will display each fields display value in the corresponding cell. If you want to take control of the UI, you can do this by passing in your own column definitions to the table. To find out more about column definitions in Tanstack visit the [Column Definition Guide](https://tanstack.com/table/v8/docs/guide/column-defs).

Below is an example of how you would use the table but make all the short description values have red text.

```tsx
import { SnDataTable, SnRow } from 'sn-shadcn-kit'

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

| Prop                | Type                              | Description                               |
| ------------------- | --------------------------------- | ----------------------------------------- |
| `table`             | `string`                          | ServiceNow table name (e.g. `"incident"`) |
| `fields`            | `string[]`                        | List of field names to include            |
| `query`             | `string` (optional)               | Encoded query string                      |
| `defaultPageSize`   | `number` (optional)               | Default number of rows per page           |
| `onRowClick`        | `(row: SnRow) => void` (optional) | Callback when a row is clicked            |
| `columnDefinitions` | `ColumnDef<SnRow, SnRowItem>[]` (optional)   | Custom column definitions                 |

### `<SnTable />`

A wrapper to SnDataTable that inserts the fields array based on a SerivceNow List view.

This has more or less the same properties as SnDataTable with the exception that you **_no longer pass through fields_**. Instead the table will do the following:

- Display the last used view of the logged in user with any customisations to it
- If they have no list view pref for that table, it will display the default view
- You can pass in the view name of a specific view via the _view_ property

You may also noticed in the screenshot above the table includes a Condition Builder. This is a stand alone component <SnFilter/> which you can read more about in the Generic 

---

## 📝 ServiceNow Forms

If your'e familiar with the ServicePortal you know ServiceNow provide a method in the GlideScriptable API ($sp.getForm) that can return you the entire metadata for any given form. The below component set is a **alpha version** of how you can consume that metadata and recreate a ServiceNow form with the same layout as well as UI policies, Client Scripts and UI actions.

Since we have no access to any gForm object, it does mean remapping everything into logic that react can understand which will be very time consuming. However, it does work, with the limitation being it will only display field types that have been re-mapped or make use of ServiceNow client logic that has been re-mapped into Reacts world. This is why these components as in their alpha stage since I have only re-mapped a common set of fields and client logic and will be building this out over time. I will likely never get to the point where its an exact replica of all ServiceNow fields and client logic, but I believe covering the most common use cases will make this form component very useable in most cases.

This is where I currently stand with what works:

- **Fields**: The following field types have been remapped - strings, choices, booleans, references, lists, dates, date times, integers, floats and decimals
- **Form Layout**: The form will render in the layout provided by ServiceNow which includes tabbed sections and their respective columns
- **UI Policies**: The form will evaluate basic UI policies. By this I mean policies which do not include scripting or setting values. The standard mandatory/visible/readonly options will work however. Also, not every single condition predicate will be mapped, but the ones for common field types (dates, numerics, strings, references etc) should work.
- **Client Scripts**: onLoad and onChange scripts will attempt to be evaluated. If there are any g_form methods which have not been mapped the script will fail. Right now I have mapped what I consider the most common set of methods used in g_form but its only a fraction of whats available. These include: getValue, setValue, setReadOnly, setDisplay, setVisible, setMandatory, clearValue, getBooleanValue, isNewRecord, getTableName, addInfoMessage and addErrorMessage. Any other references to g_form methods or global objects (GlideAjax, UI scripts etc) will fail.

To use the form you must provide it with all necessary metadata, I do this via a scripted API call in the global scope making use of the *$sp.getForm* api method mentioned above. You can find this code in the sn_scripts folder of the repo: [getFormMetadata.js](./sn_scripts/getFormMetadata.js)

### `<SnFormWrapper />` && `<SnForm />`

Load a form using SnFormWrapper by giving it the api path to a scripted rest message above, the table name to load, and a guid (sysid)

SnFormWrapper props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `guid` | `string` | sys_id of a record |
| `table` | `string` | Table name the record belongs to |
| `onValueChange` | `string` | Resource path to metadata api |

This component will then consume the metadata from the api response and pass it to **`<SnForm/>`** to build the form

![SnFormDemo](/demo/SNDemoForm.png)
![SnFormRefs](/demo/SNDemoFormRefs.png)
![SnFormDates](/demo/SNDemoFormDates.png)
![SnFormMedia](/demo/SNDemoFormMedia.png)
![SnFormActivity](/demo/SNFormActivityDemo.png)

## 🧩 Standalone Components
Within both the table and form components I make use of various standalone components. These are can be dropped in anywhere and do not have to exist only within tables or forms.

## `<SnTabs />` 
A wrapper around the shadcn tab components which allow you to pass in an array of tabs to be rendered. Each tab just needs to set a label and the ReactNode element to be rendered, if there are any possibilities of duplicate labels among the tabs then also set a key.

SnTabs props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `tabs` | `string` | An Array of Tabs (`{label: string, key?: string, content: ReactNode}`) |
| `value` | `string` (Optional) | The tab to preset on load |
| `onValueChange` | `(val: string) => void` (Optional) | Callback method to execute when a tab changes |

## `<SnClippy/>`
Your own personal clippy to be used in ServiceNow. Just give it a table and record then click the paperclip icon to view all the attachments in a shadcn sheet. From here you can delete attachments or add new onces using the drop zone in the footer of the sheet.

SnClippy props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load attachments from |
| `guid` | `string` | The sys_id of the record to load attachments from |
| `instance` | `string` (Optional) | Only needed when testing on a dev server, but the SN instance name |

## `<SnActivity/>` 
Given the current users sys_id, a table and a record sys_id, this component will build the activity formatter. Currently the formatter will only display journal input field history and allow you to post directly to any of these fields. Field changes, attachment updates and html are not currently supported.

SnActivity props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load the activity formatter from |
| `guid` | `string` | The sys_id of the record to load the activity formatter from |
| `user` | `string` | The sys_id of the current user |
| `fullwidth` | `boolean` (Optional) | Setting this to true will display each row in the formatter in full width instead of the default left/right chat layout |

## `<SnFilter/>`
Used to display the condition builder of any given table. The component presents itself as a filter icon with the current query next to it. You can then click on the filter icon to open the full condition builder (Which is its own component you can also use, *<SnConditionBuilder />*).

SnFilter props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `table` | `string` | The table name of the record to load the conditions from |
| `encodedQuery` | `string` (optional) | The initial query to build |
| `initialOpenState` | `open OR closed` (optional) | Whether to have the condition builder open on first load. It will default to closed. |
| `onQueryBuilt` | `(encoded: string)` | The callback called when the user executes the built condition by pressing the Run button |


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
| `phone` | `string` (optional)| User's contact number |
| `image` | `string` (optional)| User's avatar image |
| `primaryInfo` | `string` (optional)| Information shown under the user's name |
| `im` | `string` (optional)| Instant messaging link to the user's contact |

### `<SnGroupWrapper />` && `<SnGroupCard />`

SnGroupWrapper is designed to be easily used by simply passing in a groups sys_id, page size and a callback to build the instant messaging link per user. This wrapper will then load all the metadata for a group and feed it into SnGroupCard. If you just want to quickly load a group, this wrapper is the easiest way. Alternatively if you are loading multiple groups or want any custom logic around the group metadata then use SnGroupCard directly and pass in all the necessary props instead.

SnGroupWrapper props:
| Prop | Type | Description |
|----------------|--------------------- |------------------------------------------------|
| `guid` | `string` | sys_id of a group record |
| `pagesize` | `number` | Number of members to show per page |
| `getImLink` | `callback` (optional)| Function to build each users IM link |

below is an example of how to use SnRecordPicker (which allows you to fetch data from a ServiceNow table in a drop down) to select a user and display their details

```ts
import { useState } from 'react'
import { SnRecordPicker, SnRecordPickerItem, SnUserCard } from 'sn-shadcn-kit'

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

## 📘 Types

This package exports helpful types for working with ServiceNow data:

```ts
import type { SnRow, SnRowItem } from 'sn-shadcn-kit'
import type { SnUser, SnGroup } from 'sn-shadcn-kit'
import type { SnRecordPickerItem, SnRecordPickerList } from 'sn-shadcn-kit'
```

- SnRowItem corresponds to a fields value which is simply an object with both its value and display_value. SnRow is a record (array) of SnRowItems.
- SnUser and SnGroup define the schema for a user and group object respectively
- SnRecordPickerItem represents all the data you will get back when selecting a record using the SnRecordPicker component, and SnRecordPickerList is an array of these items

---

## 🪪 License

MIT © Two Portal Guys

---
