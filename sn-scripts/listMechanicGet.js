/**
 * This script retrieves metadata for a list layout. It uses the ListMechanic API to get the available
 * fields and selected fields for the specified table and view. Also indicates if the list is a user-specific
 * list.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope, with the "turn
 * on EXMAScript 2021" option enabled.
 *
 * @param {string} table - A servicenow tables name (database value).
 * @param {string} [view] - An optional view name to render the list with.
 *
 * @returns {object} - An object containing the currently selected and unselected fields, and whether the list is user-specific.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.queryParams.table;
  const view = request.queryParams.view || 'Default view';

  if (!table) {
    response.setError(new sn_ws_err.BadRequestError('A table must be provided.'));
  }

  return response.setBody({ ...getPersonalSn(table, view) });

  function getPersonalSn(table, view) {
    const lm = new ListMechanic();
    lm.setViewName(view || 'Default view');

    const sl = lm._getSysList(table);
    const cls = sl.getListSet();
    lm.applyRules(cls, table);

    const cols = j2js(cls.columns).map(c => ({ label: c.label, value: c.value }));
    const selected = j2js(cls.selected).map(s => ({ label: s.label, value: s.value }));

    return {
      unselected: cols,
      selected: selected,
      isUserList: sl.isUserList()
    };
  }
})(request, response);
