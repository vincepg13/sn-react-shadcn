/**
 * This script retrieves the display name of a specified table. Useful for getting the display value
 * of a field such as a document_id when its unknown.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope.
 * 
 * Recommended path: GET /react_utils/reference_display/{table}
 *
 * @param {string} table - A dynamic path parameter, servicenow tables name (database value).
 *
 * @returns {object} - An object containing the display name of the table.
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.pathParams.table;
  const sgu = new global.ReactUtils();
  const displayField = sgu.getReferenceDisplay(table);

  if (!displayField) {
    return response.setError(new sn_ws_err.BadRequestError('Invalid table provided'));
  }

  response.setStatus(200);
  response.setBody({ display: sgu.getReferenceDisplay(table) });
})(request, response);