/**
 * This script retrieves the display name of a specified table. Useful for getting the display value of a field such as a document_id when its unknown.
 * 
 *  It should be used in ServiceNow scripted REST message resource in the global scope.
 * 
 * @param {string} table - A servicenow tables name (database value).
 * @returns {object} - An object containing the display name of the table.
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.pathParams.table

  if (!table) {
    return sendError('400', 'Table must be provided')
  }

  var gr = new GlideRecord(table)
  response.setStatus(200)
  response.setBody({ display: gr.getDisplayName() })

  function sendError(code, msg) {
    var error = new sn_ws_err.ServiceError()
    error.setStatus(code)
    error.setMessage(msg)
    return error
  }
})(request, response)