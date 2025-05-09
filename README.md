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

## 🔑 Axios Setup (IMPORTANT)

Any components which fetch data from a ServiceNow instance (such as tables) use a **shared Axios instance**.  You must configure Axios **in your app** to provide authentication. 

*If you installed this package prior to Version 1.0.5 please update and make sure you include this step in the application that consumes it.* Otherwise you may notice an issue where ServiceNow asks for authentication details when using your app on the instance.

Depending on your environment:

- **Development mode:** you can set basic auth credentials (`username` and `password`) directly.
- **Production mode:** you should set the `X-userToken` header after retrieving a session token.

You must then call `setAxiosInstance` (provided by the package) to inject your configured Axios instance.

✅ **Example Setup:**

```tsx
import axios from 'axios';
import { setAxiosInstance } from 'sn-shadcn-kit';

if (import.meta.env.MODE === 'development') {
  axios.defaults.auth = {
    username: import.meta.env.VITE_REACT_APP_USER,
    password: import.meta.env.VITE_REACT_APP_PASSWORD,
  };
} else {
  const response = await axios.get(import.meta.env.VITE_TOKEN_PATH);
  axios.defaults.headers['X-userToken'] = response.data.result.sessionToken;
}

// Important: inject the configured instance into sn-shadcn-kit
setAxiosInstance(axios);
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
Below is an Example of what SnTable looks like with no UI modifications:
![Shadcn Components Demo](https://raw.githubusercontent.com/vincepg13/sn-react-shadcn-demo/refs/heads/main/assets/SN%20Table%20Demo.png)


### 🔧 Props

### `<SnDataTable />`

| Prop               | Type                                 | Description                              |
|--------------------|--------------------------------------|------------------------------------------|
| `table`            | `string`                             | ServiceNow table name (e.g. `"incident"`)|
| `fields`           | `string[]`                           | List of field names to include           |
| `query`            | `string` (optional)                  | Encoded query string                     |
| `defaultPageSize`  | `number` (optional)                  | Default number of rows per page          |
| `onRowClick`       | `(row: SnRow) => void` (optional)    | Callback when a row is clicked           |
| `columnDefinitions`| `ColumnDef<SnRow, SnRowItem>[]`      | Custom column definitions                |


### `<SnTable />`

A wrapper to SnDataTable that inserts the fields array based on a SerivceNow List view.

This has more or less the same properties as SnDataTable with the exception that you **_no longer pass through fields_**. Instead the table will do the following:
- Display the last used view of the logged in user with any customisations to it
- If they have no list view pref for that table, it will display the default view
- You can pass in the view name of a specific view via the *view* property

---
## ServiceNow Forms
If your'e familiar with the ServicePortal you know ServiceNow provide a method in the GlideScriptable API ($sp.getForm) that can return you the entire metadata for any given form. The below components is a very pre alpha version of how you can consume that metadata and recreate a ServiceNow form with the same layout as well as UI policies, Client Scripts and UI actions.

Since we have no access to any gForm object, it does mean remapping everything into logic that react can understand which will be very time consuming. However, it does work. To use the form you must provide it with all necessary metadata, I do this by a scripted API call in the global scope to the api method mentioned above. Below is the code I run in that endpoint:

```js
(function process( /*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    const table = request.pathParams.table;
    const guid = request.pathParams.id;

    if (!table || !guid) {
        return sendError("400", "Table and id must be provided");
    }

	const formData = new global.GlideSPScriptable().getForm(table, guid);
	const fields = formData._fields;

	for (f in fields) {
		var field = fields[f];

		if (field.type === "glide_date") {
			if (field.value) {
				var gd = new GlideDate();
				gd.setDisplayValue(field.value);
				field.value = gd.getValue();
			}
		}

		if (field.type === "glide_date_time") {
			if (field.value) {
				var gdt = new GlideDateTime();
				gdt.setDisplayValue(field.value);
				field.value = gdt.getValue();
			}
		}
	}

	formData.react_config = {
		date_format: gs.getSession().getUser().getDateFormat()
	};

	response.setStatus(200);
	response.setBody(formData);

    function sendError(code, msg) {
       var error = new sn_ws_err.ServiceError();
       error.setStatus(code);
       error.setMessage(msg);
       return error;
   }

})(request, response);
```

With the metadata available you can now make use of the components.

### `<SnFormWrapper />` && `<SnForm />`
Load a form using SnFormWrapper by giving it the api path to a scripted rest message above, the table name to load, and a guid (sysid)

SnFormWrapper props:
| Prop           | Type                 | Description                                    |
|----------------|--------------------- |------------------------------------------------|
| `guid`         | `string`             | sys_id of a record                             |
| `table`        | `string`             | Table name the record belongs to               |
| `api`          | `string`             | Resource path to metadata api                  |

This component will then consume the metadata from the api response and pass it to *<SnForm />* to build the form

![SnFormDemo](/demo/SNDemoForm.png)
![SnFormRefs](/demo/SNDemoFormRefs.png)
![SnFormDates](/demo/SNDemoFormDates.png)

---
## 👥 Interacting With User Data
### `<SnAvatar />`
Can be used to display a users avatar. This will show their photo as a thumbnail if supplied, else it will fall back to their initials
```ts
<SnAvatar name={name} image={image} className="size-12" />
```

### `<SnUserCard />`
This will display the details of a given user
| Prop           | Type               | Description                                    |
|----------------|------------------- |------------------------------------------------|
| `name`         | `string`           | User's name                                    |
| `email`        | `string`           | User's email address                           |
| `phone`        | `string` (optional)| User's contact number                          |
| `image`        | `string` (optional)| User's avatar image                            |
| `primaryInfo`  | `string` (optional)| Information shown under the user's name        |
| `im`           | `string` (optional)| Instant messaging link to the user's contact   |

### `<SnGroupWrapper />` && `<SnGroupCard />`
SnGroupWrapper is designed to be easily used by simply passing in a groups sys_id, page size and a callback to build the instant messaging link per user. This wrapper will then load all the metadata for a group and feed it into SnGroupCard. If you just want to quickly load a group, this wrapper is the easiest way. Alternatively if you are loading multiple groups or want any custom logic around the group metadata then use SnGroupCard directly and pass in all the necessary props instead.

SnGroupWrapper props:
| Prop           | Type                 | Description                                    |
|----------------|--------------------- |------------------------------------------------|
| `guid`         | `string`             | sys_id of a group record                       |
| `pagesize`     | `number`             | Number of members to show per page             |
| `getImLink`    | `callback` (optional)| Function to build each users IM link           |

below is an example of how to use SnRecordPicker (which allows you to fetch data from a ServiceNow table in a drop down) to select a user and display their details
```ts
import { useState } from "react";
import { SnRecordPicker, SnRecordPickerItem, SnUserCard } from "sn-shadcn-kit";

export default function ServicenowUI() {
  const [selected, setSelected] = useState<SnRecordPickerItem | null>(null);

  return (
    <div className="">
      <div className="max-w-[400px] flex flex-col gap-4">
        <SnRecordPicker
          table="sys_user"
          fields={["name", "email"]}
          metaFields={["title", "photo", "mobile_phone"]}
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
            image={`/${selected.meta.photo.display_value}`}
            primaryInfo={selected.meta.title.display_value}
          ></SnUserCard>
        )}
      </div>
    </div>
  );
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

SnRowItem corresponds to a fields value which is simply an object with both its value and display_value. SnRow is a record (array) of SnRowItems.

---

## 🪪 License

MIT © Two Portal Guys

---