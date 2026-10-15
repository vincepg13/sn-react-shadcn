/**
 * Retrieves table data from the specified ServiceNow table. Supports pagination, custom fields, and query filtering.
 * 
 * When using the SnTable or SnDataTable components, they are responsible for fetching the table data themselves. 
 * You can also use the core DataTable component which makes no api requests itself. This is useful when you want
 * full control over the loading behaviour. If doing so, this script can be used to fetch the table data manually.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope, with the "turn
 * on ECMAScript 2021" option enabled.
 * 
 * Recommended path: GET /react_utils/table_data/{table}
 * 
 * @param {string} table - A servicenow tables name (database value).
 * @param {string} [query] - An optional encoded query string to filter the table data.
 * @param {number} [page] - The page number for pagination (default is 0).
 * @param {number} [pageSize] - The number of records per page (default is 10).
 * @param {string} [fields] - A comma-separated list of fields to include in the response.
 * 
 * @returns {object} - An object containing the table data, pagination info, and metadata.
 */

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const table = request.pathParams.table;
  const gr = new GlideRecord(table);

  if (!gr.isValid(table)) {
    return response.setError(new sn_ws_err.BadRequestError('A valid table name must be provided.'));
  }

  const canCreate = gr.canCreate();
  const query = request.queryParams.query || '';
  const page = +(request.queryParams.page || 0);
  const pageSize = +(request.queryParams.pageSize || 10);

  let fields = null;

  try {
    const fieldList = request.queryParams.fields.toString();
    if (fieldList) {
      fields = fieldList.split(',').map(f => {
        return { element: f };
      });
    }
  } catch (e) {
    gs.info('GS: Error passing custom table fields:\n' + e);
  }

  const sgu = new ReactUtils();
  const listMechanic = fields ? undefined : sgu.getListMechanic(table);
  const tableData = sgu.getTableData(gr, page, pageSize, query, fields);
  response.setBody({ ...tableData, canCreate, listMechanic });
})(request, response);
