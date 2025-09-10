#Change Log
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