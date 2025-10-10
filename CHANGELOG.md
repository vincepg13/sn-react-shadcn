# Change Log

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