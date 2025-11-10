# Change Log
## [V2.1.2]
- Fixed an issue where the CodeMirror editor would reset to blank when doing an "undo" after its mounted

## [V2.1.1]
- Fixed the field selector not displaying in full width in the condition builder

## [V2.1.0]
- Moved *sonner* and *zod* from dependencies to peer dependencies
- Added support for **XML** in the CodeMirror editor. This will allow you to modify the scripts of UI Macros and UI Pages in SnForm
- Added CSS Color support to the CodeMirror editor. Now when editing css fields you can use an embedded colour picker for colour related variables.
- Added support for the **Conditions** field type in SnForm. Allowing you to interactively modify conditions using a condition builder on records like Business Rules.
- Fixed an issue which stopped SnForm from saving when modifying a dotwalked field.
- Created a new component `SnDotwalkChoice`:
  - Allows you to dotwalk through reference fields when using a **Field Name** type field
  - In SnForm this only happens when the attribute *allow_references* is set to true. Like on a UI Policy Action.
- Created new components `SnPersonalise` and `SnPersonaliseList` which allow you to modify the list view of a table.

### BREAKING CHANGES
Since sonner and zod have both been moved to peer dependencies, please make sure you install them in your application if you havent already. 
Sonner should have a minimum version of V2.0.3 and zod should have a minimum version of V4.1.12

```bash
npm install sonner@^2.0.3 zod@^4.1.2
```

## [V2.0.5]
- matched prettier tabwidth into the indentation lines of the CodeMirror editor.
- Fixed an issue where autocomplete tooltips were appearing in nested structures inside the CodeMirror editor

## [V2.0.1]
- SnForm bug fixes
- Enabled support for scripted UI Policies
- Updates to the script editing engine for better linting and formatting. Enabled support for JSON field types.

## [V2.0.0] 
- Added a new standalone component SnScriptEditor which is a CodeMirror V6 script editor designed specifically to work with ServiceNow scripts
- Integrated SnScriptEditor into SnForm via the internal SnFieldScript component. This allows the following field types to be displayed: html_template, css, script, script_plain
- Bug fixes across table and form components

### BREAKING CHANGES

 Moved from a singular import from sn-shadcn-kit, to multiple export paths based on feature. E.g. to use the table widget previously you would use:

```ts
import SnTable from "sn-shadcn-kit"
```

However you now should use:
```ts
import SnTable from "sn-shadcn-kit/table"
```

## [V1.5.5]
Updates to SnForm:
- Added support for onSubmit client scripts
- mapped the following g_form methods: getActionName, save, submit

## [V1.5.3]
Updated prettier config to require semicolons for js files so the context of sn-scripts can be copied into scripted rest apis without any warnings.

## [V1.5.2]
Added signals to all exposed api classes instead of just AbortController

## [V1.5.1]
Exported skeleton loaders to make use of as placeholders for when you choose to fetch your own data instead of using one of the data loading components.

## [V1.5]
Moved SnForm from alpha state to beta. Mapped more g_form methods and implemented support for the following client side APIs:
- g_user
- g_scratchpad
- getMessage
- GlideAjax
- GlideRecord

Added support for the aysnchronous message bus web socket connection:
- *useRecordWatch* hook for getting notified of database updates

## [V1.4]
Recreated the condition builder from ServiceNow to allow for advanced filtering on tables
- `<SnFilter/>` - filter icon with the current query that opens into the condition builder
- `<SnConditionBuilder/>` - the condition builder component

## [V1.3]
Moved some of the features built into SnForm into their own standalone components:
- `<SnClippy/>` - View attachments for any given record
- `<SnActivity/>` - View the activity log for any given record
- `<SnTabs/>` - Render a list of tabs

## [V1.2]
Alpha version of `<SnForm/>` and `<SnFormWrapper/>`

## [V1.1]
Added components for interacting with group and user data
- `<SnAvatar/>` - display a users avatar/photo if available, else fall back to their initials
- `<SnUserCard/>` - user card with interactive contact buttons
- `<SnGroupCard >` / `<SnGroupWrapper/>` - group card with interactive contact buttons per member

## [V1.0]
- Initial release including the Tanstack data table components `<SnTable/>` and `<SnDataTable/>` for consuming database entries from ServiceNow