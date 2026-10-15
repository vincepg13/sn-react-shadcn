/**
 * Modifies a group in ServiceNow by updating its members and fields.
 * 
 * Can be used as the callback for when a group changes whilst using the SnGroupEditor component.
 *
 * It should be used in ServiceNow scripted REST message resource in the global scope, with the "turn
 * on ECMAScript 2021" option enabled.
 *
 * Recommended path: POST /react_utils/modify_group/{group}
 *
 * @param {string} group - The sys_id of the group to modify.
 * @param {object[]} members - An array of member objects to add or remove from the group.
 * @param {object} fields - An object containing the fields to update on the group.
 *
 * @returns {object} - An object indicating the success of the operation.
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  const result = new ReactUtils().modifyGroup(
    request.pathParams.group,
    request.body.data.members,
    request.body.data.fields
  );

  response.setBody({ success: result });
})(request, response);
