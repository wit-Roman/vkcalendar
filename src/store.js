import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import bridge from "@vkontakte/vk-bridge";

export const actionTypes = {
  LOAD: "LOAD",
  LOADSSE: "LOADSSE",
  BRIDGE: "BRIDGE",
  ADDCOM: "ADDCOM",
  PANEL: "PANEL",
  DATA: "DATA",
  UPD: "UPD",
  CHNG: "CHNG",
  OPTION: "OPTION",
  BLOCK: "BLOCK",
  USERGROUP: "USERGROUP",
  USERGROUPINFO: "USERGROUPINFO",
  GROUP: "GROUP",
  TOKEN: "TOKEN",
  WIDGET: "WIDGET",
};
const panels = ["homepage", "calendar", "settings"];
const group_roles = ["none", "member", "moder", "editor", "admin"];
const apiUrl = "https://api.apps-web.xyz";
const version = "5.61";
const dateNow = new Date();
const defaultPeriod = [
  dateNow.getFullYear() + "-01-01",
  dateNow.getFullYear() + 1 + "-12-31",
];

const InitialState = {
  url: !!window ? window.location.href : "",
  activePanel: panels[1],
  StoreLoading: true,
  BridgeLoading: true,
  CalendarLoading: true,
  AutoUpdEnabled: false,
  platform: [!!window && window.innerWidth < 480, "", ""],

  group_id: 0,
  group_role: group_roles[0],
  fetchedGroup_name: "",
  fetchedGroup_photo_100: "",
  rights: 0,
  viewer_id: 0,
  fetchedUser: {},
  app_id: 7121023,
  access_token: "",

  selectedDates: {},
  sessions: {},
  selectedUserDates: [],
  userGroups: [],
  userFetchedGroups: [],
  lastChanged: 0,

  accessMember: true,
  widgetEnable: 0,
  widgetWeeks: 4,
  widgetAutoUpd: false,
  widgetToken: "",
  autoUpd: true,
  weekDay: [true, true, true, true, true, true, true],
  period: defaultPeriod,
  blockedDays: [],
  currentDate: dateNow,
};

// REDUCERS
export const reducer = (state = InitialState, action) => {
  //console.log("store update "+action.type)
  switch (action.type) {
    case actionTypes.LOAD:
      return Object.assign({}, state, {
        StoreLoading: true,
      });
    case actionTypes.LOADSSE:
      return Object.assign({}, state, {
        AutoUpdEnabled: action.val,
      });
    case actionTypes.PANEL:
      return Object.assign({}, state, {
        activePanel: action.activePanel,
        StoreLoading: false,
      });
    case actionTypes.BRIDGE:
      return Object.assign({}, state, {
        app_id: action.app_id,
        fetchedUser: action.fetchedUser,
        group_id: action.group_id,
        group_role: action.group_role,
        rights: action.rights,
        viewer_id: action.viewer_id,
        activePanel: action.activePanel,
        BridgeLoading: false,
        StoreLoading: false,
        platform: action.platform,
      });
    case actionTypes.ADDCOM:
      return Object.assign({}, state, {
        group_id: action.group_id,
        group_role: action.group_role,
        fetchedGroup_name: action.fetchedGroup_name,
        fetchedGroup_photo_100: action.fetchedGroup_photo_100,
        rights: group_roles.indexOf(action.group_role),
        activePanel: action.activePanel,
      });
    case actionTypes.DATA:
      return Object.assign({}, state, {
        accessMember: action.val.accessMember,
        autoUpd: action.val.autoUpd,
        blockedDays: !!action.val.blockedDays ? action.val.blockedDays : [],
        lastChanged: action.val.lastChanged,
        period: !!action.val.period ? action.val.period : defaultPeriod,
        rights: action.val.rights,
        selectedDates: action.val.selectedDates,
        selectedUserDates: action.val.selectedUserDates,
        sessions: action.val.sessions,
        currentDate: new Date(action.val.today),
        weekDay: !!action.val.weekDay ? action.val.weekDay : [],
        widgetAutoUpd: action.val.widgetAutoUpd,
        widgetEnable: action.val.widgetEnable,
        widgetWeeks: action.val.widgetWeeks,
        userGroups: action.val.userGroups,
        CalendarLoading: false,
        StoreLoading: false,
      });
    case actionTypes.GROUP:
      return Object.assign({}, state, {
        group_id: action.group_id,
        group_role: action.group_role,
        rights: action.rights,
      });
    case actionTypes.CHNG:
      return Object.assign({}, state, {
        accessMember: action.val.accessMember,
        lastChanged: action.val.lastChanged,
        rights: action.val.rights,
        selectedDates: action.val.selectedDates,
        selectedUserDates: action.val.selectedUserDates,
        sessions: action.val.sessions,
      });
    case actionTypes.UPD:
      return Object.assign({}, state, {
        selectedDates: action.val.selectedDates,
        sessions: action.val.sessions,
        selectedUserDates: action.val.selectedUserDates,
        lastChanged: action.val.lastChanged,
        /*rights: action.val.rights,
        accessMember: action.val.accessMember,
        weekDay: action.val.weekDay,
        period: action.val.period,
        blockedDays: action.val.blockedDays,
        currentDate: new Date(action.val.currentDate).toUTCString()*/
      });
    case actionTypes.USERGROUP:
      return Object.assign({}, state, {
        userGroups: action.userGroups,
      });
    case actionTypes.USERGROUPINFO:
      return Object.assign({}, state, {
        fetchedGroup_name: action.fetchedGroup_name,
        fetchedGroup_photo_100: action.fetchedGroup_photo_100,
        userFetchedGroups: action.userFetchedGroups,
      });
    case actionTypes.OPTION:
      return Object.assign({}, state, {
        accessMember: action.val.accessMember,
        widgetAutoUpd: action.val.widgetAutoUpd,
        widgetEnable: action.val.widgetEnable,
        widgetWeeks: action.val.widgetWeeks,
        weekDay: action.val.weekDay,
        period: action.val.period,
        blockedDays: action.val.blockedDays,
        autoUpd: action.val.autoUpd,
      });
    case actionTypes.TOKEN:
      return Object.assign({}, state, {
        access_token: action.access_token,
      });
    case actionTypes.WIDGET:
      return Object.assign({}, state, {
        widgetToken: action.widgetToken,
        widgetAutoUpd: action.widgetAutoUpd,
      });

    default:
      return state;
  }
};

// Store init
const store = createStore(
  reducer,
  InitialState,
  compose(applyMiddleware(thunk))
);
export const getStore = () => store;

// XHR Middleware
let eventSource = null;
const sseMiddleware = (dispatch, is_open, url, type) => {
  if (is_open && !!window.EventSource) {
    eventSource = new EventSource(url);
    eventSource.addEventListener("message", (e) => {
      const val = JSON.parse(e.data);
      dispatch({ type, val });
    });
    /*eventSource.addEventListener('open', () => {
      console.log("EventListenerOnOpen");
    }, false);
    eventSource.addEventListener('close', () => {
      console.log("EventListenerOnClose");
    }, false);
    eventSource.addEventListener('error', function(e) {
      console.log("EventListenerOnError",e);
    }, false);*/
  }

  if (!!window.EventSource && !is_open && !!eventSource) {
    eventSource.close();
    eventSource = null;
  }
};

const ajaxMiddleware = async (
  dispatch,
  url,
  type,
  method = "GET",
  body = {}
) => {
  let xhrOption = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (method === "POST") xhrOption.body = JSON.stringify(body);
  return await fetch(url, xhrOption)
    .then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    })
    .then((val) => {
      if (val.lastChanged === false) return;
      if (!dispatch || !type) return val;
      //console.log(type, val);
      dispatch({ type, val });
      return Promise.resolve(1);
    })
    .catch((err) => {
      console.log(err);
    });
};

// ACTIONS
export const loading = () => (dispatch) => {
  dispatch({ type: actionTypes.LOAD });
};

export const changePanel = (panelNum) => (dispatch) => {
  dispatch({
    type: actionTypes.PANEL,
    activePanel: panels[panelNum],
  });
};

//API
export const apiRequestData = (group_id = 0, group_role = "") => async (
  dispatch
) => {
  const body = {};
  ({
    fetchedUser: body.fetchedUser,
    app_id: body.app_id,
    viewer_id: body.viewer_id,
    group_id: body.group_id,
    group_role: body.group_role,
    url: body.url,
  } = store.getState());

  if (!!group_id && !!group_role) {
    body.group_id = group_id;
    body.group_role = group_role;

    dispatch({
      type: actionTypes.GROUP,
      group_id,
      group_role,
      rights: group_roles[group_role],
    });
  }

  return await ajaxMiddleware(
    dispatch,
    apiUrl + "/session",
    actionTypes.DATA,
    "POST",
    body
  );
};

export const apiUserGroups = (viewer_id = 0) => async (dispatch) => {
  if (!viewer_id) return false;
  const query = apiUrl + "/usergroups?v=" + viewer_id;
  const userFetchedGroups = await ajaxMiddleware(null, query, null, "GET");

  dispatch({
    type: actionTypes.USERGROUP,
    userGroups: userFetchedGroups,
  });
};

export const apiConnect = (is_open) => (dispatch) => {
  const { group_id, viewer_id, lastChanged } = store.getState();
  if (!!group_id && !!viewer_id) {
    dispatch({ type: actionTypes.LOADSSE, val: is_open });
    const url =
      apiUrl + "/val?l=" + lastChanged + "&g=" + group_id + "&v=" + viewer_id;

    sseMiddleware(dispatch, is_open, url, actionTypes.UPD);
  }
};

export const apiRequestChange = (day) => async (dispatch) => {
  const { group_id, viewer_id } = store.getState();
  const query =
    apiUrl + "/change?d=" + day + "&g=" + group_id + "&v=" + viewer_id;

  return await ajaxMiddleware(dispatch, query, actionTypes.CHNG, "GET");
};

export const apiSaveSettings = (settings) => async (dispatch) => {
  const { group_id, widgetToken, widgetAutoUpd } = store.getState();
  const {
    accessMember,
    widgetEnable,
    widgetWeeks,
    autoUpd,
    weekDay,
    period,
    blockedDays,
  } = settings;

  return await ajaxMiddleware(
    dispatch,
    apiUrl + "/setting",
    actionTypes.OPTION,
    "POST",
    {
      accessMember,
      widgetEnable,
      widgetWeeks,
      widgetAutoUpd,
      widgetToken,
      autoUpd,
      weekDay,
      period,
      blockedDays,
      group_id,
    }
  );
};

//BRIDGE
export const bridgeConnect = (platform) => async (dispatch) => {
  bridge.send("VKWebAppInit");
  bridge.subscribe(({ detail: { type, data } }) => {
    if (type === "VKWebAppUpdateConfig") {
      const schemeAttribute = document.createAttribute("scheme");
      schemeAttribute.value = data.scheme ? data.scheme : "client_light";
      document.body.attributes.setNamedItem(schemeAttribute);
    }
  });

  const app_id = parseInt(getParameterByName("vk_app_id", ""));
  const viewer_id = parseInt(getParameterByName("vk_user_id", ""));
  const group_id = parseInt(getParameterByName("vk_group_id", ""));
  const vk_platform = getParameterByName("vk_platform", "");
  if (!group_id) dispatch({ type: actionTypes.PANEL, activePanel: panels[0] });

  const fetchedUser = await bridge.send("VKWebAppGetUserInfo");

  let group_role = "none";
  let activePanel = panels[0];
  let rights = 0;
  //let is_closed = 0;
  if (!!group_id) {
    group_role = getParameterByName("vk_viewer_group_role", "");
    activePanel = panels[1];
    rights = group_roles.indexOf(group_role);
  }

  dispatch({
    type: actionTypes.BRIDGE,
    app_id,
    viewer_id,
    group_id,
    group_role,
    rights,
    fetchedUser,
    activePanel,
    platform: [!!window && window.innerWidth < 480, vk_platform, platform],
  });

  return Promise.resolve(1);
};

export const bridgeAddToComm = () => (dispatch) => {
  const { access_token } = store.getState();

  bridge
    .send("VKWebAppAddToCommunity")
    .then((value) => {
      if (!!value.group_id) {
        bridge
          .send("VKWebAppCallAPIMethod", {
            method: "groups.getById",
            params: {
              group_id: value.group_id,
              v: version,
              access_token,
            },
          })
          .then((fetchedGroup) => {
            const group_id = fetchedGroup.response[0].id;

            //dispatch({ type: actionTypes.LOAD });
            dispatch({
              type: actionTypes.ADDCOM,
              group_id,
              group_role: "admin",
              fetchedGroup_name: fetchedGroup.response[0].fetchedGroup_name,
              fetchedGroup_photo_100:
                fetchedGroup.response[0].fetchedGroup_photo_100,
              activePanel: panels[1],
            });

            const body = { group_id, group_role: "admin" };
            ({
              fetchedUser: body.fetchedUser,
              app_id: body.app_id,
              viewer_id: body.viewer_id,
              url: body.url,
            } = store.getState());

            ajaxMiddleware(
              dispatch,
              apiUrl + "/session",
              actionTypes.DATA,
              "POST",
              body
            );
          })
          .catch((error) => {
            console.error(error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
    });
};

export const bridgeRequestToken = () => async (dispatch) => {
  const { app_id } = store.getState();

  return bridge
    .send("VKWebAppGetAuthToken", {
      scope: "groups",
      app_id,
    })
    .then(({ access_token }) => {
      dispatch({
        type: actionTypes.TOKEN,
        access_token,
      });
      return Promise.resolve(!!access_token);
    })
    .catch((error) => {
      console.error(error);
    });
};

export const bridgeRequestGroups = () => async (dispatch) => {
  const { group_id, access_token, userGroups } = store.getState();
  if (userGroups.includes(group_id)) userGroups.push(group_id);

  bridge
    .send("VKWebAppCallAPIMethod", {
      method: "groups.getById",
      params: {
        group_ids: userGroups.join(),
        v: version,
        access_token,
        fields: "description, role",
      },
    })
    .then((fetchedGroup) => {
      if (!!fetchedGroup.response) {
        let fetchedGroup_name = "",
          fetchedGroup_photo_100 = "";
        const userFetchedGroups = fetchedGroup.response.map(
          ({ id, name, description, photo_100, is_admin, is_member }) => {
            if (id === group_id) {
              fetchedGroup_name = name;
              fetchedGroup_photo_100 = photo_100;
            }
            const rights = is_admin ? 3 : is_member ? 1 : 0;
            return [id, name, description, photo_100, group_roles[rights]];
          }
        );

        dispatch({
          type: actionTypes.USERGROUPINFO,
          fetchedGroup_name,
          fetchedGroup_photo_100,
          userFetchedGroups,
        });
      }
    });
};

//WIDGET
export const addWidget = (code) => async (dispatch) => {
  const { group_id, app_id, platform } = store.getState();

  return bridge
    .send("VKWebAppGetCommunityAuthToken", {
      app_id,
      group_id,
      scope: "app_widget",
    })
    .then((result) => {
      if (!result.hasOwnProperty("access_token") || !result.access_token)
        return Promise.resolve(false);

      dispatch({
        type: actionTypes.WIDGET,
        widgetToken: result.access_token,
        widgetAutoUpd: true,
      });

      if (platform[1].includes("mobile")) return Promise.resolve(true);

      return bridge
        .send("VKWebAppShowCommunityWidgetPreviewBox", {
          type: "table",
          group_id,
          code,
        })
        .then((result) => Promise.resolve(result.hasOwnProperty("result")))
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
};

//Supports
function getParameterByName(name, url) {
  if (typeof url !== "string" || !url) url = window.location.href;
  if (typeof window !== "object" || !url.includes(name)) return null;
  name = name.replace(/[[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/*
https://vkapp.apps-web.xyz/?vk_access_token_settings=notify&vk_app_id=7365400&vk_are_notifications_enabled=0&vk_group_id=194124012&vk_is_app_user=1&vk_is_favorite=0&vk_language=ru&vk_platform=desktop_web&vk_ref=other&vk_user_id=541644989&vk_viewer_group_role=admin&sign=X7u6p9Pg87rs5279nUwwIggqsO4UVv1HG8mDQo02M-I

Settings
AutoUpdEnabled: true
CalendarLoading: false
StoreLoading: false
accessMember: true
activePanel: "settings"
admin_level: 0
apiConnect: is_open => {…}
apiRequestChange: day => {…}
apiSaveSettings: settings => {…}
autoUpd: true
blockedDays: []
changePanel: panelNum => {…}
currentDate: Thu Jun 04 2020 22:19:23 GMT+0300 (Moscow Standard Time) {}
fetchedUser: {id: 541644989, first_name: "Wittest", last_name: "Test", sex: 2, city: {…}, …}
group_id: "194124012"
group_role: "admin"
id: "settings"
lastChanged: 1591287160414
period: (2) ["2020-01-01", "2021-12-31"]
selectedDates: {33198675: Array(1), 538581761: Array(3), 541644989: Array(30)}
selectedUserDates: (30) ["2020-04-19", "2020-04-26", "2020-04-18", "2020-05-16", "2020-05-06", "2020-05-29", "2020-05-10", "2020-05-28", "2020-05-08", "2020-05-17", "2020-05-14", "2020-05-09", "2020-05-19", "2020-05-15", "2020-05-12", "2020-05-20", "2020-05-22", "2020-05-21", "2020-05-23", "2020-06-02", "2020-06-03", "2020-06-27", "2020-05-31", "2020-06-06", "2020-06-17", "2020-06-09", "2020-06-07", "2020-06-13", "2020-06-14", "2020-06-18"]
sessions: {33198675: {…}, 538581761: {…}, 541644989: {…}}
viewer_id: "541644989"
weekDay: (7) [true, true, true, true, true, true, true]
*/
