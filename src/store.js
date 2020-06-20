import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import bridge from "@vkontakte/vk-bridge";

export const actionTypes = {
  LOAD: 'LOAD',
  LOADSSE: 'LOADSSE',
  BRIDGE: 'BRIDGE',
  ADDCOM: 'ADDCOM',
  PANEL: 'PANEL',
  DATA: 'DATA',
  UPD: 'UPD',
  CHNG: 'CHNG',
  OPTION: 'OPTION',
  BLOCK: 'BLOCK',
}
const panels = ['homepage', 'calendar', 'settings'];
const group_roles = ['none', 'member', 'moder', 'editor', 'admin'];
const apiUrl = "https://api.apps-web.xyz";
const access_token = "57be593557be593557be59355c57ce3a2d557be57be593509cdd01a0a819f0dabdc1ed3";
const version = "5.61";
const dateNow = new Date();
const defaultPeriod = [ dateNow.getFullYear() + "-01-01", (dateNow.getFullYear()+1) + "-12-31" ];

const InitialState = {
  url: !!window ? window.location.href : '',
  activePanel: panels[1],
  StoreLoading: true,
  BridgeLoading: true,
  CalendarLoading: true,
  AutoUpdEnabled: false,
  platform: [(!!window && window.innerWidth < 480),'',''],

  group_id: 0,
  group_role: group_roles[0],
  fetchedGroup: {},
  admin_level: 0,
  group_photo_100: '',
  rights: 0,
  viewer_id: 0,
  fetchedUser: {},
  app_id: 0,

  selectedDates: {},
  sessions: {},
  selectedUserDates: [],
  lastChanged: 0,
  
  accessMember: true,
  widgetEnable: 0,
  widgetWeeks: 4,
  widgetAutoUpd: true,
  widgetToken: '',
  autoUpd: true,
  weekDay: [true, true, true, true, true, true, true],
  period: defaultPeriod,
  blockedDays: [],
  currentDate: dateNow,
}

// REDUCERS
export const reducer = (state = InitialState, action) => {
  //console.log("store update "+action.type)
  switch (action.type) {
    case actionTypes.LOAD:
      return Object.assign({}, state, {
        StoreLoading: true
      })
    case actionTypes.LOADSSE:
      return Object.assign({}, state, {
        AutoUpdEnabled: action.val
      })
    case actionTypes.PANEL:
      return Object.assign({}, state, {
        activePanel: action.activePanel,
        StoreLoading: false
      })
    case actionTypes.BRIDGE:
      return Object.assign({}, state, {
        app_id: action.app_id,
        fetchedUser: action.fetchedUser,
        fetchedGroup: action.fetchedGroup,
        group_id: action.group_id,
        group_role: action.group_role,
        rights: group_roles.indexOf(action.group_role),
        viewer_id: action.viewer_id,
        activePanel: action.activePanel,
        admin_level: action.admin_level,
        BridgeLoading: false,
        StoreLoading: false,
        platform: action.platform
      })
    case actionTypes.ADDCOM:
      return Object.assign({}, state, {
        group_id: action.group_id,
        group_role: action.group_role,
        group_photo_100: action.group_photo_100,
        rights: group_roles.indexOf(action.group_role),
        activePanel: action.activePanel,
        StoreLoading: false
      })
    case actionTypes.DATA:
      return Object.assign({}, state, {
        accessMember: action.val.accessMember,
        autoUpd: action.val.autoUpd,
        blockedDays: action.val.blockedDays,
        lastChanged: action.val.lastChanged,
        period: action.val.period,
        rights: action.val.rights,
        selectedDates: action.val.selectedDates,
        selectedUserDates: action.val.selectedUserDates,
        sessions: action.val.sessions,
        currentDate: new Date(action.val.today),
        weekDay: action.val.weekDay,
        widgetAutoUpd: action.val.widgetAutoUpd,
        widgetEnable: action.val.widgetEnable,
        widgetWeeks: action.val.widgetWeeks,
        CalendarLoading: false,
        StoreLoading: false
      })
    case actionTypes.CHNG:
      return Object.assign({}, state, {
        accessMember: action.val.accessMember,
        lastChanged: action.val.lastChanged,
        rights: action.val.rights,
        selectedDates: action.val.selectedDates,
        selectedUserDates: action.val.selectedUserDates,
        sessions: action.val.sessions
      })
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
      })
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
      })

    default:
      return state
  }
}

// Store init
const store = createStore(
  reducer,
  InitialState,
  compose( applyMiddleware(thunk) )
);
export const getStore = () => store;

// XHR Middleware
let eventSource = null;
const sseMiddleware = (dispatch, is_open, url, type) => {
  if (is_open && !!window.EventSource ) {
    eventSource = new EventSource(url)
    eventSource.addEventListener("message", (e) => {
      const val = JSON.parse(e.data);
      dispatch({ type, val });
    })
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

  if ( !!window.EventSource && !is_open && !!eventSource ) {
    eventSource.close();
    eventSource = null;
  }

}

const ajaxMiddleware = async (dispatch, url, type, method="GET", body={}) => {
  let xhrOption = {
    method,
    headers: {'Content-Type' : 'application/json'}
  }

  if ( method === "POST" ) xhrOption.body = JSON.stringify(body);
  return await fetch( url, xhrOption)
    .then((response) => {
      //if ( url === '/setting' && method === "POST" ) alert( (response.ok) ? "Настройки успешно сохранены" : "Ошибка ввода, настройки не сохранены: "+response.status+response.statusText );
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    }).then((val) => {
      if ( val.lastChanged === false ) return;
      //console.log(type, val);
      dispatch({ type, val });
    })
    .catch((err) => console.log(err) );
}

// ACTIONS
export const loading = () => dispatch => {
  dispatch({type: actionTypes.LOAD});
}

export const changePanel = panelNum => dispatch => {
  //console.log(panelNum)
  dispatch({
    type: actionTypes.PANEL,
    activePanel: panels[panelNum]
  });
}

export const bridgeConnect = (platform) => async dispatch => {
  bridge.send("VKWebAppInit");
  bridge.subscribe(({ detail: { type, data }}) => {
    if (type === 'VKWebAppUpdateConfig') {
      const schemeAttribute = document.createAttribute('scheme');
      schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
      document.body.attributes.setNamedItem(schemeAttribute);
    }
  });
  
  const app_id = getParameterByName('vk_app_id','');
  const viewer_id = getParameterByName('vk_user_id','');
  const group_id = getParameterByName('vk_group_id','');
  const vk_platform = getParameterByName('vk_platform','');
  if ( !group_id ) dispatch({type: actionTypes.PANEL, activePanel: panels[0]});
  const fetchedUser = await bridge.send('VKWebAppGetUserInfo');

  let group_role = 'none';
  let activePanel = panels[0];
  let fetchedGroup = {};
  let admin_level = 0;
  //let is_closed = 0;

  if ( !!group_id ) {
    group_role = getParameterByName('vk_viewer_group_role', '');
    activePanel = panels[1];
    fetchedGroup = await bridge.send("VKWebAppCallAPIMethod", {
      "method": "groups.getById",
      "params": {
        "group_id": group_id,
        "v": version,
        "access_token": access_token
      }
    });
    if ( !!fetchedGroup.response )
      fetchedGroup = fetchedGroup.response[0];
  }

  dispatch({
    type: actionTypes.BRIDGE,
    app_id,
    viewer_id,
    group_id,
    group_role,
    admin_level,
    fetchedUser,
    fetchedGroup,
    activePanel,
    group_photo_100: null,
    platform: [(!!window && window.innerWidth < 480), vk_platform, platform]
  });

  return Promise.resolve(1);
}

export const bridgeAddToComm = () => dispatch => {
  bridge.send('VKWebAppAddToCommunity').then((value)=>{
    if(!!value.group_id) {
      bridge.send("VKWebAppCallAPIMethod", {
        "method": "groups.getById",
        "params": {
          "group_id": value.group_id,
          "v": version,
          "access_token": access_token
        }
      }).then((fetchedGroup)=>{
        let admin_level = 0;
        if ( fetchedGroup[0].is_admin )
          admin_level = fetchedGroup[0].admin_level;

        dispatch({
          type: actionTypes.ADDCOM,
          group_id: value.group_id,
          group_role: fetchedGroup[0],
          group_photo_100: value.photo_100,
          admin_level,
          fetchedGroup,
          activePanel: panels[1]
        });
      }).catch((error)=>{
        console.error(error);
      });      
    }
  }).catch((error)=>{
    console.error(error);
  });
}

export const apiRequestData = () => async dispatch => {
  const body = {};
  ({ fetchedUser: body.fetchedUser, app_id: body.app_id, viewer_id: body.viewer_id, group_id: body.group_id, group_role: body.group_role, url: body.url } = store.getState());

  return await ajaxMiddleware( dispatch, apiUrl + '/session', actionTypes.DATA, "POST", body);
}

export const apiConnect = is_open => dispatch => {
  const { group_id, viewer_id, lastChanged } = store.getState();
  if ( !!group_id && !!viewer_id ) {
    dispatch({ type: actionTypes.LOADSSE, val: is_open });
    const url = apiUrl + '/val?l=' + lastChanged + '&g=' + group_id + '&v=' + viewer_id;
    
    sseMiddleware(dispatch, is_open, url, actionTypes.UPD);
  }
}

export const apiRequestChange = day => async dispatch => {
  const { group_id, viewer_id } = store.getState();
  const query = apiUrl + '/change?d=' + day + '&g=' + group_id + '&v=' + viewer_id;

  return await ajaxMiddleware( dispatch, query, actionTypes.CHNG, "GET" );
}

export const apiSaveSettings = settings => async dispatch => {
  const { group_id } = store.getState();
  const { accessMember, widgetEnable, widgetWeeks, widgetAutoUpd, widgetToken, autoUpd, weekDay, period, blockedDays } = settings;
  return await ajaxMiddleware( dispatch, apiUrl + '/setting', actionTypes.OPTION, "POST", { accessMember, widgetEnable, widgetWeeks, widgetAutoUpd, widgetToken, autoUpd, weekDay, period, blockedDays, group_id } );
}

export const addWidget = code => async dispatch => {
  const { group_id } = store.getState();
  
  return bridge.send('VKWebAppShowCommunityWidgetPreviewBox', {
    "group_id": parseInt(group_id),
    "type": "table",
    "code": code
  }).then((result) => {
    return result.hasOwnProperty("result") ? Promise.resolve(result.result) : false;
  }).catch((error)=>{
    console.error(error);
  });
}

export const resolveWidget = () => async dispatch => {
  const { group_id, app_id } = store.getState();

  return bridge.send('VKWebAppGetCommunityAuthToken', {
    "app_id": parseInt(app_id),
    "group_id": parseInt(group_id),
    "scope": "app_widget"
  }).then((result) => {
    return ( result.hasOwnProperty("access_token") && !!result.access_token ) ? Promise.resolve(result.access_token) : false;
  }).catch((error)=>{
    console.error(error);
  });
}

//Supports
function getParameterByName(name, url) {
	if ( typeof url !== "string" || !url) url = window.location.href;
	if ( typeof window !== "object" || !url.includes(name) ) return null;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
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