/**
 * This script can be used to save or reset a personalised list layout for a given table and view.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope, with the "turn
 * on EXMAScript 2021" option enabled.
 *
 * @param {string} table - A servicenow tables name (database value).
 * @param {string} [view] - An optional view name to render the list with.
 * @param {array} [fields] - An optional array of field names to save as the personalised list layout.
 *                           If not provided, the personalised layout will be reset.
 *
 * @returns {object} - success status.
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const { table, view, fields } = request.body.data;

  if (!table) {
    response.setError(new sn_ws_err.BadRequestError('A table must be provided.'));
  }

  lm = new ListMechanic();
  lm.setViewName(view || 'Default view');

  if (fields) {
    lm.saveList(table, fields);
  } else {
    lm.reset(table);
  }

  return response.setBody({ success: true });
})(request, response);
