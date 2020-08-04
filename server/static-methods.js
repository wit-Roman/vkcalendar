const connects = require("./connects.js");

exports.SQLoperation = (SQLquery) => {
  return new Promise((resolve, reject) => {
    const mysql = require("mysql");
    const mysqlConn = mysql.createConnection(connects.mysqlConnect);
    mysqlConn.connect();
    mysqlConn.query(SQLquery, (error, rows) => {
      if (error) {
        reject(error);
        throw error;
      }
      resolve(rows);
    });

    mysqlConn.end();
  });
};

const validateDate = (exports.validateDate = (string) =>
  /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])?$/.test(
    string
  ));

exports.transformIntToISO = (val = 0) => {
  const format = require("date-fns/format");
  const dateObj = new Date(val);
  return format(dateObj, "yyyy-MM-dd");
};

exports.validateSession = (query) =>
  !(
    !isNaN(query.app_id) &&
    !isNaN(query.group_id) &&
    !isNaN(query.viewer_id) &&
    ["none", "member", "moder", "editor", "admin"].includes(
      query.viewer_type
    ) &&
    query.first_name.length > 1 &&
    query.first_name.length < 80 &&
    query.last_name.length > 1 &&
    query.last_name.length < 80 &&
    query.photo_100.length < 200
  );

exports.validateSettings = (
  accessMember,
  widgetEnable,
  widgetWeeks,
  widgetToken,
  blockedDays,
  allowedDays1,
  allowedDays2,
  allowedDays3,
  allowedDays4,
  allowedDays5,
  allowedDays6,
  allowedDays7,
  allowedDaysMin,
  allowedDaysMax
) => {
  if (
    !(
      typeof widgetEnable === "number" &&
      !isNaN(widgetWeeks) &&
      parseInt(widgetWeeks) < 8 &&
      parseInt(widgetWeeks) > 1 &&
      typeof widgetToken === "string" &&
      widgetToken.length < 120 &&
      typeof accessMember === "boolean" &&
      typeof allowedDays1 === "boolean" &&
      typeof allowedDays2 === "boolean" &&
      typeof allowedDays3 === "boolean" &&
      typeof allowedDays4 === "boolean" &&
      typeof allowedDays5 === "boolean" &&
      typeof allowedDays6 === "boolean" &&
      typeof allowedDays7 === "boolean" &&
      validateDate(allowedDaysMin) &&
      validateDate(allowedDaysMax) &&
      Array.isArray(blockedDays)
    )
  )
    return false;

  return true;
};

exports.optionsToObj = (options) => {
  let _objSetting = {
    weekDay: [],
    period: [],
    blockedDays: [],
  };
  Object.entries(options).forEach((el) => {
    const option_name = el[0];
    const option_value = el[1];
    switch (option_name) {
      case "accessMember":
        _objSetting[option_name] = option_value === "1" ? true : false;
        break;
      case "widgetWeeks":
        _objSetting[option_name] = parseInt(option_value);
        break;
      case "widgetToken":
        _objSetting[option_name] =
          option_value.length > 80 && option_value.length < 100
            ? option_value
            : "";
        break;
      case "autoUpd":
        _objSetting[option_name] = option_value == "1" ? true : false;
        break;
      case "widgetEnable":
        _objSetting[option_name] = parseInt(option_value);
        break;
      case "allowedDays1":
        _objSetting.weekDay[0] = option_value == "1" ? true : false;
        break;
      case "allowedDays2":
        _objSetting.weekDay[1] = option_value == "1" ? true : false;
        break;
      case "allowedDays3":
        _objSetting.weekDay[2] = option_value == "1" ? true : false;
        break;
      case "allowedDays4":
        _objSetting.weekDay[3] = option_value == "1" ? true : false;
        break;
      case "allowedDays5":
        _objSetting.weekDay[4] = option_value == "1" ? true : false;
        break;
      case "allowedDays6":
        _objSetting.weekDay[5] = option_value == "1" ? true : false;
        break;
      case "allowedDays7":
        _objSetting.weekDay[6] = option_value == "1" ? true : false;
        break;
      case "allowedDaysMin":
        _objSetting.period[0] = option_value;
        break;
      case "allowedDaysMax":
        _objSetting.period[1] = option_value;
        break;
      case "blockedDays":
        _objSetting.blockedDays = Array.isArray(option_value)
          ? option_value
          : [];
        break;
    }
  });
  return _objSetting;
};

exports.issetOptions = (options) =>
  !!(
    options.hasOwnProperty("accessMember") &&
    options.hasOwnProperty("widgetEnable") &&
    options.hasOwnProperty("widgetWeeks") &&
    options.hasOwnProperty("weekDay") &&
    options.hasOwnProperty("period") &&
    options.hasOwnProperty("blockedDays") &&
    options.hasOwnProperty("autoUpd")
  );

const timezoneFix = (exports.timezoneFix = () => {
  let d = new Date();
  const nt = d.getUTCHours(); //+ 3
  d.setUTCHours(nt);
  return d.getTime();
});

exports.construct_widget = (
  group_id,
  selectedDates,
  widgetWeeks,
  blockedDays,
  period,
  weekDay
) => {
  const currentDate = timezoneFix();
  const {
    format,
    differenceInDays,
    startOfWeek,
    addWeeks,
    isBefore,
    isAfter,
    endOfYesterday,
    parse,
    endOfWeek,
    getDate,
    addDays,
  } = require("date-fns");

  const startDate = startOfWeek(currentDate, { weekStartsOn: 6 });
  //const monthEnd = dateFns.endOfMonth(currentDate)
  const periodEnd = addWeeks(startDate, widgetWeeks);
  const endDate = endOfWeek(periodEnd);
  const difference = differenceInDays(startDate, endDate);
  const startDateformated = format(startDate, "dd.MM.yyyy");
  const endDateformated = format(endDate, "dd.MM.yyyy");
  let day = startDate;
  const num_count = (w) => {
    const n = getDate(day);
    const d = format(day, "yyyy-MM-dd");
    let c = 0;
    Object.values(selectedDates).forEach((el) => {
      if (el.includes(d)) c++;
    });
    const innactive =
      blockedDays.includes(d) ||
      !weekDay[w] ||
      isBefore(
        parse(d, "yyyy-MM-dd", new Date()),
        endOfYesterday(currentDate)
      ) ||
      isBefore(
        parse(d, "yyyy-MM-dd", new Date()),
        parse(period[0], "yyyy-MM-dd", new Date())
      ) ||
      isAfter(
        parse(d, "yyyy-MM-dd", new Date()),
        parse(period[1], "yyyy-MM-dd", new Date())
      );
    if (innactive) c += " *";

    day = addDays(day, 1);
    return n + " | " + c;
  };
  let body = "";
  for (let i = 0; i < widgetWeeks; i++) {
    body +=
      '[{ \
            "text": "' +
      num_count(5) +
      " . . . . . . . . . . . " +
      num_count(6) +
      '", \
        }, \
        { \
            "text": "' +
      num_count(0) +
      '", \
        }, \
        { \
            "text": "' +
      num_count(1) +
      '", \
        }, \
        { \
            "text": "' +
      num_count(2) +
      '", \
        }, \
        { \
            "text": "' +
      num_count(3) +
      '", \
        }, \
        { \
            "text": "' +
      num_count(4) +
      '", \
        }, \
        ], \
        ';
  }
  const code =
    'return { \
        "title": "Календарь посещений на ' +
    startDateformated +
    " - " +
    endDateformated +
    '", \
        "title_counter": ' +
    difference +
    ', \
        "more": "Открыть в приложении ", \
        "more_url": "https://vk.com/public' +
    group_id +
    "?w=app7121023_-" +
    group_id +
    '", \
        "head": [ \
            { \
                "text": "СБ . . . . . . . . . . . . ВС", \
            }, { \
                "text": "ПН", \
            }, { \
                "text": "ВТ", \
            }, { \
                "text": "СР", \
            }, { \
                "text": "ЧТ", \
            }, { \
                "text": "ПТ", \
            }, \
        ], \
        "body": [ \
            ' +
    body +
    "\
        ] \
    };";
  return code;
};

exports.verification = (url) => {
  const qs = require("querystring");
  const crypto = require("crypto");

  const URL_PARAMS = url.split("?")[1];
  const urlParams = qs.parse(URL_PARAMS);
  const ordered = {};
  Object.keys(urlParams)
    .sort()
    .forEach((key) => {
      if (key.slice(0, 3) === "vk_") ordered[key] = urlParams[key];
    });
  const stringParams = qs.stringify(ordered);
  const paramsHash = crypto
    .createHmac("sha256", connects.secretKey)
    .update(stringParams)
    .digest()
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=$/, "");

  // console.log(urlParams.sign, paramsHash);

  return paramsHash === urlParams.sign;
};

exports.getRights = (role) =>
  ["none", "member", "moder", "editor", "admin"].indexOf(role);
