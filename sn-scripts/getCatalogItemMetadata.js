/**
 * Returns the Service Portal ordering model required by SnCatalogForm.
 *
 * Configure this as a global Scripted REST resource with ECMAScript 2021 enabled.
 * Recommended path: GET /react_utils/catalog_item/{id}
 *
 * Producer submission intentionally uses ServiceNow's native endpoint:
 * POST /api/sn_sc/servicecatalog/items/{id}/submit_producer
 */
(function process(/* RESTAPIRequest */ request, /* RESTAPIResponse */ response) {
  const catalogItemId = `${request.pathParams.id || ''}`;

  if (!catalogItemId) return sendError('400', 'Catalog item id must be provided.');

  const producer = new GlideRecord('sc_cat_item_producer');
  if (!producer.get(catalogItemId)) return sendError('404', 'Record producer not found.');
  if (!producer.canRead()) return sendError('403', 'You are not authorised to view this record producer.');

  const catalogItem = new sn_sc.CatItem(catalogItemId);
  if (!catalogItem.canView()) return sendError('403', 'You are not authorised to view this record producer.');

  const portalApi = new global.GlideSPScriptable();
  const item = portalApi.getCatalogItem(catalogItemId, true);
  if (!item || item.sys_class_name !== 'sc_cat_item_producer') {
    return sendError('400', 'Only record producers are supported.');
  }

  const utils = new ReactUtils();
  const glideUser = utils.getGlideUser();
  glideUser.preferences = glideUser.preferences || {};

  const targetTable = item.target_table_name || 'sc_cat_item_producer';
  const runtime = {
    user: gs.getUserID(),
    base_url: gs.getProperty('glide.servlet.uri'),
    date_format: gs.getSession().getUser().getDateFormat(),
    scope: utils.getScopeName(targetTable) || '',
    glide_user: glideUser,
    scratchpad: item.g_scratchpad || {}
  };

  response.setStatus(200);
  response.setBody({ item, runtime });

  function sendError(code, message) {
    const error = new sn_ws_err.ServiceError();
    error.setStatus(code);
    error.setMessage(message);
    return error;
  }
})(request, response);
