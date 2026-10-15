/**
 * This script retrieves form metadata for a specified table and record ID. It includes everything that
 * should be passed to the SnForm component to operate.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope, with the "turn
 * on ECMAScript 2021" option enabled.
 * 
 * Recommended path: GET /react_utils/form_data/{table}/{id}
 *
 * @param {string} table - A servicenow tables name (database value).
 * @param {string} guid - The sys_id of the record to retrieve, or -1 for a new record.
 * @param {string} [qry] - An optional encoded query string to filter reference fields.
 * @param {string} [view] - An optional view name to render the form with.
 *
 * @returns {object} - An object containing the form metadata and related information.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.pathParams.table;
  const guid = request.pathParams.id;
  const qry = request.queryParams.qry || '';
  const view = request.queryParams.view || '';
  const fhType = request.queryParams.fh_type || '';

  if (!table || !guid) {
    return sendError('400', 'Table and id must be provided.');
  }

  const u = new ReactUtils();
  const grTarget = new GlideRecord(table);

  if (guid == -1 && !grTarget.canCreate())
    return sendError('400', 'You do not have access to create a record of this type: ' + table);
  if (guid != -1 && !grTarget.get(guid)) return sendError('400', 'Record not found.');
  if (guid != -1 && !grTarget.canRead()) return sendError('400', 'You are not authorised to view this record.');

  const instanceURI = gs.getProperty('glide.servlet.uri');
  const formData = new global.GlideSPScriptable().getForm(table, guid, qry, view);
  const hasActivityFormatter = u.hasActivity(formData._formatters);

  if (!!hasActivityFormatter && guid != -1) {
    formData.activity = u.getActivityData(table, guid, fhType);
    formData.activity.formatter = hasActivityFormatter;
  }

  formData.attachments = u.getAttachments(table, guid, instanceURI);
  u.modifyFields(formData._fields, formData.activity);
  u.modifyPolicies(formData.policy, grTarget);

  formData.react_config = {
    user: gs.getUserID(),
    base_url: instanceURI,
    glide_user: u.getGlideUser(),
    scope: u.getScopeName(table),
    security: u.getSecurity(grTarget),
    date_format: gs.getSession().getUser().getDateFormat(),
    prettier: {
      semi: true,
      singleQuote: true,
      tabWidth: 4,
      printWidth: 120
    },
    es_lint: u.getLinting(grTarget, table, guid)
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
