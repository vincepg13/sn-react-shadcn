/**
 * This script retrieves all the metadata required to make use of the <SnForm /> component.
 * 
 * It should be used in ServiceNow scripted REST message resource in the global scope.
 * 
 * @param {string} table - A servicenow tables name (database value).
 * @param {string} id - The sys_id of the record to retrieve metadata for (-1 for new record).
 * @param {string} qry (optional) - A query to preset values for a new record.
 * @param {string} view (optional) - The name of the view to use for the form.
 * 
 * @returns {object} - An object containing the form metadata, including fields, activity, attachments, and react configuration.
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.pathParams.table
  const guid = request.pathParams.id
  const qry = request.queryParams.qry || ''
  const view = request.queryParams.view || ''

  if (!table || !guid) {
    return sendError('400', 'Table and id must be provided')
  }

  var grTarget = new GlideRecordSecure(table)
  if (guid != -1 && !grTarget.get(guid)) {
    return sendError('400', 'Record was either not found or you are not authorised to view it.')
  }

  const instanceURI = gs.getProperty('glide.servlet.uri')
  const formData = new GlideSPScriptable().getForm(table, guid, qry, view)
  const hasActivityFormatter = hasActivity(formData._formatters)

  if (!!hasActivityFormatter && guid != -1) {
    formData.activity = getActivityData(table, guid, instanceURI)
    formData.activity.formatter = hasActivityFormatter
  }

  formData.attachments = getAttachments(table, guid, instanceURI)
  modifyFields(formData._fields, formData.activity)

  formData.react_config = {
    user: gs.getUserID(),
    base_url: instanceURI,
    security: getSecurity(grTarget),
    date_format: gs.getSession().getUser().getDateFormat(),
  }

  response.setStatus(200)
  response.setBody(formData)

  function sendError(code, msg) {
    var error = new sn_ws_err.ServiceError()
    error.setStatus(code)
    error.setMessage(msg)
    return error
  }

  function hasActivity(formatters) {
    for (f in formatters) {
      let formatterName = formatters[f].formatter
      if (formatterName === 'activity.xml') {
        return f
      }
    }

    return false
  }

  function getActivityData(table, guid, instance) {
    const meta = new GlideSPScriptable().getStream(table, guid)
    const jFields = meta.journal_fields
    const readable = jFields.filter(f => f.can_read).map(f => f.name)
    const writeable = jFields.filter(f => f.can_write).map(f => f.name)
    let entries = meta.entries.filter(f => !!f.value)

    const userImgMap = {}
    const grUser = new GlideRecord('sys_user')
    entries = entries.map(e => {
      if (userImgMap[e.user_sys_id]) {
        e.user_img = userImgMap[e.user_sys_id]
      } else if (grUser.get(e.user_sys_id)) {
        const userImg = grUser.getDisplayValue('avatar') || grUser.getDisplayValue('photo')
        if (!userImg) return e

        const photo = instance + userImg
        e.user_img = photo
        userImgMap[e.user_sys_id] = photo
      }
      return e
    })

    return {
      ...meta,
      entries,
      readable,
      writeable,
    }
  }

  function getSecurity(gr, guid) {
    var access = {}

    if (guid == -1) {
      gr.initialize()
      var canCreate = gr.canCreate()
      access.canRead = canCreate
      access.canWrite = canCreate
    } else {
      access.canRead = gr.canRead()
      access.canWrite = gr.canWrite()
      access.canDelete = gr.canDelete()
    }

    return access
  }

  function modifyFields(fields, activityData) {
    for (f in fields) {
      var field = fields[f]

      if (field.type === 'glide_date' || field.type == 'glide_date_time') {
        if (field.value) {
          var gd = field.type == 'glide_date' ? new GlideDate() : new GlideDateTime()
          gd.setDisplayValue(field.value)
          field.value = gd.getValue()
        }
      }

      if (activityData && field.type == 'journal_input') {
        field.visible = false
        if (activityData.readable && !activityData.readable.includes(field.name)) {
          activityData.journal_fields.push({
            can_read: true,
            can_write: !field.readonly,
            color: 'transparent',
            label: field.label,
            name: field.name,
          })

          activityData.readable.push(field.name)
          if (!field.readonly) activityData.writeable.push(field.name)
        }
      }
    }
  }

  function getAttachments(table, guid, instance) {
    grAttach = new GlideRecordSecure('sys_attachment')
    grAttach.addQuery('table_name', table)
    grAttach.addQuery('table_sys_id', 'IN', guid)
    grAttach.orderBy('sys_created_on')
    grAttach.query()

    var attachments = []
    while (grAttach.next()) {
      var id = grAttach.getUniqueValue()
      attachments.push({
        sys_id: id,
        url: instance + 'sys_attachment.do?sys_id=' + id,
        file_name: grAttach.getValue('file_name'),
        content_type: grAttach.getValue('content_type'),
      })
    }

    return attachments
  }
})(request, response)
