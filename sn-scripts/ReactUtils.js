/**
 * ReactUtils is a utility class for handling various operations related to React components
 * in ServiceNow, such as retrieving form metadata, reference display values, and activity data.
 *
 * It should be used in the global scope with the ES2021 option enabled.
 */
var ReactUtils = Class.create();
ReactUtils.prototype = {
  initialize: function () {
    this.$sp = new global.GlideSPScriptable();
  },

  getGlideForm: function (table, guid, qry, view) {
    return this.$sp.getForm(table, guid, qry, view);
  },

  getUserDateFormat: function () {
    return gs.getSession().getUser().getDateFormat();
  },

  triggerAiSearch: function (rpSysId, searchContextConfigId, searchTerm) {
    var searchInput = { rpSysId, searchContextConfigId, searchTerm };
    return new global.AISASearchUtil().search(searchInput);
  },

  getGlobalGr: function (table, initialise, workflow, sysFields, secure) {
    const gr = secure ? new GlideRecordSecure(table) : new GlideRecord(table);
    if (initialise) gr.initialize();
    if (workflow) gr.setWorkflow(false);
    if (sysFields) gr.autoSysFields(false);
    return gr;
  },

  getGlobalGa: function (table) {
    return new GlideAggregate(table);
  },

  grMethod: function (gr, fn, params) {
    return gr[fn].apply(gr, params);
  },

  getSimpleCount(table, query) {
    const ga = new GlideAggregate(table);
    if (query) ga.addQuery(query);
    ga.addAggregate('COUNT');
    ga.query();

    return ga.next() ? +ga.getAggregate('COUNT') : 0;
  },

  getInitials(grUser) {
    return grUser.getDisplayValue('first_name').charAt(0) + grUser.getDisplayValue('last_name').charAt(0);
  },

  getAppUser(userId = gs.getUserID()) {
    const grUser = new GlideRecord('sys_user');
    if (grUser.get(userId)) {
      return {
        guid: grUser.getUniqueValue(),
        name: grUser.getDisplayValue(),
        initials: this.getInitials(grUser),
        title: grUser.getDisplayValue('title'),
        photo: grUser.getDisplayValue('avatar') || grUser.getDisplayValue('photo')
      };
    }
  },

  getUserViaUsername(username) {
    const grUser = new GlideRecord('sys_user');
    return grUser.get('user_name', username) ? grUser : false;
  },

  getScopeName(table) {
    var grDb = new GlideRecord('sys_db_object');
    if (grDb.get('name', table)) {
      return grDb.sys_scope.scope.toString();
    }
  },

  getFormattedDate(gdtValue, format) {
    const gdt = new GlideDateTime(gdtValue);
    const userDate = gdt.getDisplayValueInternal().split(' ')[0];

    const gd = new GlideDate();
    gd.setValue(userDate);

    if (format === 'display') return gd.getDisplayValue();

    return gd.getByFormat(format || 'dd MMM, yyyy');
  },

  getLastUpdated(gr, format) {
    const grUser = this.getUserViaUsername(gr.getValue('sys_updated_by'));
    const updated =
      format === 'displayTime'
        ? gr.getDisplayValue('sys_updated_on')
        : this.getFormattedDate(gr.getValue('sys_updated_on'));

    if (grUser) {
      const initials = grUser.getValue('first_name').charAt(0) + grUser.getValue('last_name').charAt(0);

      return {
        initials,
        updated,
        guid: grUser.getUniqueValue(),
        name: grUser.getDisplayValue('name'),
        photo: grUser.getDisplayValue('avatar') || grUser.getDisplayValue('photo')
      };
    }

    return { updated };
  },

  getListMechanic: function (table, view) {
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
  },

  setListMechanic: function (table, fields, view) {
    lm = new ListMechanic();
    lm.setViewName(view || 'Default view');

    if (fields) {
      lm.saveList(table, fields);
    } else {
      lm.reset(table);
    }
  },

  dotWalkMethod(gr, field, method) {
    const parts = field.split('.');

    for (const p of parts) {
      gr = gr[p];
    }

    try {
      return gr[method]();
    } catch (e) {
      return null;
    }
  },

  getTableData: function (gr, page, pageSize, query, fieldList) {
    const gUser = gs.getUser();
    const table = gr.getTableName();
    const userTableView = gUser.getPreference(`${table}_list.view`) || '';

    let fields = fieldList || this.getListFields(table, userTableView, gUser.getID());

    gr.initialize();
    fields = fields
      .filter(f => f.element && !f.element.startsWith('.'))
      .map(f => ({
        name: f.element,
        label: this.dotWalkMethod(gr, f.element, 'getLabel')
      }));

    const grRecord = new GlideRecordSecure(table);
    if (query) grRecord.addEncodedQuery(query);
    grRecord.chooseWindow(page * pageSize, (page + 1) * pageSize);
    grRecord.query();

    const records = [];
    while (grRecord.next()) {
      const guid = grRecord.getUniqueValue();
      const item = {
        sys_id: {
          value: guid,
          display_value: guid
        }
      };

      fields.forEach(f => {
        item[f.name] = {
          value: (this.dotWalkMethod(grRecord, f.name, 'getValue') || '').substring(0, 200),
          display_value: (grRecord.getDisplayValue(f.name) || '').substring(0, 200)
        };
      });
      records.push(item);
    }

    const config = {
      hasTextIndex: this.$sp.hasTextIndex(table),
      displayField: grRecord.getDisplayName(),
      tableLabel: gr.getClassDisplayValue()
    };

    return {
      fields,
      records,
      config,
      totalCount: this.getSimpleCount(table, query)
    };
  },

  _getListGr: function (table, userTableView, userId) {
    const grList = new GlideRecord('sys_ui_list');
    grList.addQuery('name', table);
    grList.addQuery('view.name', userTableView);
    grList.addQuery('sys_user', userId).addOrCondition('sys_user', '');
    grList.addNullQuery('parent');
    grList.orderByDesc('sys_user');
    grList.orderByDesc('sys_created_on');
    grList.setLimit(1);
    grList.query();
    return grList;
  },

  getListFields: function (table, userTableView, userId) {
    let grList = this._getListGr(table, userTableView, userId);
    if (!grList.hasNext()) grList = this._getListGr(table, '', userId);

    const listId = grList.next() ? grList.getUniqueValue() : '';
    if (!listId) {
      const grDb = new GlideRecord('sys_db_object');
      if (!grDb.get('name', table)) return null;

      const parent = grDb.super_class.name.getValue();
      if (!parent) return null;

      return this.getListFields(parent, userTableView, userId);
    }

    const grElement = new GlideRecord('sys_ui_list_element');

    if (listId) {
      grElement.addQuery('list_id', listId);
    } else {
      grElement.addQuery('list_id.name', table);
      grElement.addQuery('list_id.parent', '');
      grElement.addQuery('list_id.sys_user', '');
      grElement.addQuery('list_id.view.name', '');
    }

    grElement.orderBy('position');
    grElement.query();

    let fields = [];
    while (grElement.next()) {
      fields.push({
        element: grElement.getValue('element'),
        position: grElement.getValue('position')
      });
    }

    return fields;
  },

  getReferenceDisplay: function (table) {
    var gr = new GlideRecord(table);
    return gr.getDisplayName();
  },

  hasActivity(formatters) {
    for (f in formatters) {
      let formatterName = formatters[f].formatter;
      if (formatterName === 'activity.xml') {
        return f;
      }
    }

    return false;
  },

  getActivityData: function (table, guid, fhType) {
    const meta = this.$sp.getStream(table, guid);
    const jFields = meta.journal_fields;
    const readable = jFields.filter(f => f.can_read).map(f => f.name);
    const writeable = jFields.filter(f => f.can_write).map(f => f.name);
    let entries = meta.entries; //.filter(f => !!f.value);

    const userImgMap = {};

    if (fhType == 'current' || fhType == 'previous') {
      const fieldsHistory = this.getFieldHistory(table, guid, fhType == 'previous');
      entries = entries.concat(fieldsHistory).sort(this._orderByCreated);
    }

    const grUser = new GlideRecord('sys_user');
    entries = entries.map(e => {
      if (userImgMap[e.user_sys_id]) {
        e.user_img = userImgMap[e.user_sys_id].photo;
        if (!e.initials) e.initials = userImgMap[e.user_sys_id].initials;
      } else if (grUser.get(e.user_sys_id)) {
        const initials = this.getInitials(grUser);
        const photo = grUser.getDisplayValue('avatar') || grUser.getDisplayValue('photo') || '';

        userImgMap[e.user_sys_id] = { initials, photo };

        if (!e.initials) e.initials = initials;
        if (!photo) return e;

        e.user_img = photo;
      }
      return e;
    });

    return {
      ...meta,
      raw: meta.entries,
      entries,
      readable,
      writeable,
      filterable: this.getFilterableActivityFields(table, guid)
    };
  },

  getActivityProp(table) {
    var propName = 'glide.ui.' + table + '_activity.fields';
    return gs.getProperty(propName) || null;
  },

  getUserActivityFields(table) {
    try {
      var userPref = gs.getUser().getPreference(table + '.activity.filter');
      if (userPref) {
        var parts = userPref.split(';');
        var active = parts.filter(p => p.includes(',true'));
        return active.map(field => field.split(',')[0]);
      }
    } catch (e) {
      return this.getActivityProp(table);
    }

    return this.getActivityProp(table);
  },

  getFilterableActivityFields(table, guid) {
    var systemFields = this.getActivityProp(table);

    if (!systemFields) return [];

    var grTarget = new GlideRecord(table);
    if (!grTarget.get(guid)) return [];

    return systemFields
      .split(',')
      .map(f => {
        if (f == '*Attachments*') return { name: f, label: 'Attachments' };
        if (f == '*EmailCorrespondence*') return { name: f, label: 'Emails - correspondence' };
        if (f == '*EmailAutogenerated*') return { name: f, label: 'Emails - autogenerated' };
        if (f == '*Sidebar discussion*') return { name: f, label: 'Sidebar discussion' };
        if (f == '*Sidebar posted message*') return { name: f, label: 'Sidebar posted message' };
        if (f == '*Relations*') return { name: f, label: 'Relationship changes' };

        if (f.includes('*')) return { name: f, label: f };

        return grTarget[f].canRead()
          ? {
              name: f,
              label: grTarget[f].getLabel()
            }
          : null;
      })
      .filter(Boolean);
  },

  getFieldHistory: function (table, id, showPreviousValues = false) {
    var fieldList = this.getUserActivityFields(table);
    var entries = [];

    if (!fieldList) return entries;

    var previousMessageNow = gs.getMessage('Now');
    var previousMessageWas = gs.getMessage('Was');
    var previousMessageEmpty = gs.getMessage('Empty');

    var grHistorySet = new GlideRecord('sys_history_set');
    grHistorySet.addQuery('table', table);
    grHistorySet.addQuery('id', id);
    grHistorySet.orderByDesc('sys_updated_on');
    grHistorySet.query();

    if (grHistorySet.next()) {
      var grHistoryItem = new GlideRecord('sys_history_line');
      grHistoryItem.addQuery('set', grHistorySet.getUniqueValue());
      grHistoryItem.addQuery('field', 'IN', fieldList);
      grHistoryItem.addQuery('type', 'audit');
      grHistoryItem.orderByDesc('update_time');
      grHistoryItem.query();

      while (grHistoryItem.next()) {
        var newValue = grHistoryItem.getValue('new');
        var oldValue = grHistoryItem.getValue('old') || previousMessageEmpty;
        entries.push({
          element: grHistoryItem.getValue('field'),
          field_label: grHistoryItem.getValue('label'),
          value: showPreviousValues
            ? previousMessageNow + ': ' + newValue + '\n' + previousMessageWas + ': ' + oldValue
            : newValue,
          name: grHistoryItem.getValue('user_name'),
          user_sys_id: grHistoryItem.getValue('user'),
          sys_created_on: grHistoryItem.update_time.toString(),
          sys_created_on_adjusted: grHistoryItem.getDisplayValue('update_time'),
          sys_id: grHistoryItem.getUniqueValue()
        });
      }
    }

    return entries;
  },

  getSecurity: function (gr, guid) {
    var access = {};

    if (guid == -1) {
      gr.initialize();
      var canCreate = gr.canCreate();
      access.canRead = canCreate;
      access.canWrite = canCreate;
    } else {
      access.canRead = gr.canRead();
      access.canWrite = gr.canWrite();
      access.canDelete = gr.canDelete();
    }

    return access;
  },

  getAttachments: function (table, guid, instance) {
    grAttach = new GlideRecordSecure('sys_attachment');
    grAttach.addQuery('table_name', table);
    grAttach.addQuery('table_sys_id', 'IN', guid);
    grAttach.orderBy('sys_created_on');
    grAttach.query();

    var attachments = [];
    while (grAttach.next()) {
      var id = grAttach.getUniqueValue();
      attachments.push({
        sys_id: id,
        url: instance + 'sys_attachment.do?sys_id=' + id,
        file_name: grAttach.getValue('file_name'),
        content_type: grAttach.getValue('content_type')
      });
    }

    return attachments;
  },

  getGlideUser: function () {
    const gsu = gs.getUser();

    return {
      roles: j2js(gsu.getAllRoles()),
      departmentID: gsu.getDeparmentID(),
      firstName: gsu.getFirstName(),
      lastName: gsu.getLastName(),
      fullName: gsu.getFullName(),
      userID: gsu.getID(),
      userName: gsu.getName()
    };
  },

  modifyFields(fields, activityData) {
    for (const f in fields) {
      const field = fields[f];

      if (field.type === 'glide_date' || field.type == 'glide_date_time') {
        if (field.value) {
          const gd = field.type == 'glide_date' ? new GlideDate() : new GlideDateTime();
          gd.setDisplayValue(field.value);
          field.value = gd.getDisplayValueInternal();
        }
      }

      if (activityData && field.type == 'journal_input') {
        field.visible = false;
        if (activityData.readable && !activityData.readable.includes(field.name)) {
          activityData.journal_fields.push({
            can_read: true,
            can_write: !field.readonly,
            color: 'transparent',
            label: field.label,
            name: field.name
          });

          activityData.readable.push(field.name);
          if (!field.readonly) activityData.writeable.push(field.name);
        }
      }
    }
  },

  modifyPolicies: function (policies, gr) {
    for (const p of policies) {
      for (const c of p.conditions) {
        if (c.reference_fields) {
          c.dotWalkedValue = this.dotwalkElement(gr, c.field);
        }
      }
    }
  },

  dotwalkElement: function (gr, fields) {
    var fieldList = fields.split('.');
    fieldList.forEach(f => {
      gr = gr[f];
    });
    return gr.toString();
  },

  getEsMode: function (gr, table, guid) {
    let jsVersion = () => {
      let scope = gr.sys_scope;

      //First try to get scope via target record
      if (scope) {
        const esMode = scope.js_level.getValue();
        return esMode == 'es_latest' ? 'latest' : 5;
      }

      //Next try to get scope via table
      const grDb = new GlideRecord('sys_db_object');
      if (grDb.get('name', table)) {
        scope = grDb.sys_scope;
        if (scope.toString() != 'global') {
          const ecma = grDb.get('name', table) ? scope.js_level.toString() : '5';
          return ecma == 'es_latest' ? 'latest' : 5;
        }
      }

      //Lastly get scope via users current application
      scope = gs.getCurrentApplicationId();
      if (scope == 'global') return 5;

      const grScope = new GlideRecord('sys_scope');
      if (grScope.get(scope)) {
        const esMode = grScope.getValue('js_level');
        return esMode == 'es_latest' ? 'latest' : 5;
      }
    };

    const jsv = jsVersion() || 5;
    if (guid == -1 || jsv == 'latest') return jsv;

    const grEsLatest = new GlideRecord('sys_es_latest_script');
    grEsLatest.addQuery('id', guid);
    grEsLatest.addQuery('use_es_latest', true);
    grEsLatest.query();

    return grEsLatest.next() ? 'latest' : jsv;
  },

  getLinting(gr, table, guid) {
    let jsVersion = this.getEsMode(gr, table, guid);

    return {
      env: {
        browser: true
      },
      parserOptions: {
        ecmaVersion: jsVersion,
        sourceType: 'script'
      },
      rules: {
        semi: ['warn', 'always'],
        'no-unused-vars': [
          'warn',
          {
            args: 'none'
          }
        ]
      }
    };
  },

  getDefaultPrettier() {
    return {
      semi: true,
      singleQuote: true,
      tabWidth: 4,
      printWidth: 120
    };
  },

  canImpersonate() {
    const impersonate = new GlideImpersonate();
    const isImpersonating = impersonate.isImpersonating();
    const canImpersonate = impersonate.canImpersonate(gs.getUserID());
    const realUser = gs.getImpersonatingUserName();

    return { canImpersonate, isImpersonating, realUser };
  },

  getImpersonation() {
    const impersonate = this.canImpersonate();
    const realUser = this._getRealUser(impersonate.isImpersonating);
    const recents = this._getRecentImpersonations(realUser.guid);

    return { ...impersonate, realUser, recents };
  },

  modifyGroup(group, members, groupFields) {
    if (!group) return false;

    const grGrp = new GlideRecord('sys_user_group');
    if (!grGrp.get(group)) return false;

    if (groupFields) {
      for (f in groupFields) {
        grGrp[f] = groupFields[f];
      }

      grGrp.update();
    }

    const existing = [];
    const sgu = new ScopedGlobalAPI();

    const grMember = new GlideRecord('sys_user_grmember');
    grMember.addQuery('group', group);
    grMember.addQuery('user', 'IN', toAdd);
    grMember.query();

    while (grMember.next()) {
      existing.push(grMember.getValue('user'));
    }

    const toAdd = members.filter(u => !existing.includes(u));
    const toRemove = existing.filter(u => !members.includes(u));

    sgu.deleteMembers(group, toRemove);
    sgu.insertMembers(group, toAdd);

    return true;
  },

  _getRealUser(isImpersonating) {
    if (isImpersonating) {
      const userName = gs.getImpersonatingUserName();
      const grUser = new GlideRecord('sys_user');
      if (!grUser.get('user_name', userName)) return null;

      return {
        userName,
        guid: grUser.getUniqueValue(),
        displayName: gs.getImpersonatingUserDisplayName()
      };
    } else {
      return {
        guid: gs.getUserID(),
        userName: gs.getUserName(),
        displayName: gs.getUserDisplayName()
      };
    }
  },

  _getRecentImpersonations(userID) {
    let recent = [];

    const grPref = new GlideRecord('sys_user_preference');
    grPref.addQuery('user', userID);
    grPref.addQuery('name', 'recent.impersonations');
    grPref.query();

    if (!grPref.next()) return recent;

    const userNames = grPref.getValue('value');
    if (!userNames) return recent;

    //Preserve order by looping through array of gets instead of GR query
    const grUser = new GlideRecord('sys_user');
    recent = userNames
      .split(',')
      .map(u => {
        if (!grUser.get('user_name', u)) return false;

        return {
          guid: grUser.getUniqueValue(),
          displayName: grUser.getValue('name'),
          userName: grUser.getValue('user_name'),
          photo: grUser.getDisplayValue('avatar') || grUser.getDisplayValue('photo'),
          initials: grUser.getDisplayValue('first_name').charAt(0) + grUser.getDisplayValue('last_name').charAt(0)
        };
      })
      .filter(Boolean);

    return recent;
  },

  _orderByCreated: function (a, b) {
    if (a.sys_created_on > b.sys_created_on) {
      return -1;
    }
    if (a.sys_created_on < b.sys_created_on) {
      return 1;
    }
    return 0;
  },

  type: 'ReactUtils'
};
