const mysql = require("mysql");
const request = require("request");
const methods = require("./static-methods.js");
const connects = require("./connects.js");

class Data {
  constructor() {
    this._SQLopen();
    this.store = {};
    this.defaultSettings = {
      accessMember: false,
      widgetEnable: 0,
      widgetWeeks: 4,
      autoUpd: true,
      widgetAutoUpd: false,
      weekDay: [true, true, true, true, true, true, true],
      period: [
        new Date().getFullYear() + "-01-01",
        new Date().getFullYear() + 1 + "-12-31",
      ],
      blockedDays: [],
    };
    this._actualStore();
    const store_updater = setInterval(() => {
      this._actualStore();
    }, 1000 * 60 * 15);
  }
  _check_store() {
    console.dir(this.store);
    return Object.entries(this.store).map((el) => {
      const { users, setting, lastChanged, widgetToken } = el[1];
      return { group_id: el[0], users, setting, lastChanged, widgetToken };
    });
  }
  _SQLoperation(SQLquery) {
    //console.log("_SQLoperation")
    return new Promise((resolve, reject) => {
      this.mysqlConn = mysql.createConnection({
        ...connects.mysqlConnect,
        multipleStatements: true,
      });
      this.mysqlConn.connect();
      this.mysqlConn.query(SQLquery, (error, rows) => {
        if (error) {
          reject(error);
          throw error;
        }
        resolve(rows);
      });
      this.mysqlConn.end();
    });
  }
  _SQLopen() {
    let SQLquery =
      "CREATE TABLE IF NOT EXISTS `sessions` \
            ( i INT PRIMARY KEY AUTO_INCREMENT, \
            viewer_id INT, \
            api_id INT, \
            group_id INT, \
            first_name VARCHAR(80), \
            last_name VARCHAR(80), \
            photo_100 VARCHAR(200), \
            viewer_type VARCHAR(16), \
            can_access_closed TINYINT(1) \
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

    SQLquery +=
      "CREATE TABLE IF NOT EXISTS `selected_dates` \
            ( i INT PRIMARY KEY AUTO_INCREMENT, \
            group_id INT, \
            viewer_id INT, \
            date BIGINT \
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

    SQLquery +=
      "CREATE TABLE IF NOT EXISTS `settings_allowed` \
            ( i INT PRIMARY KEY AUTO_INCREMENT, \
            group_id INT, \
            option_name VARCHAR(32), \
            option_value VARCHAR(96) \
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

    SQLquery +=
      "CREATE TABLE IF NOT EXISTS `settings_blockedDays` \
            ( i INT PRIMARY KEY AUTO_INCREMENT, \
            group_id INT, \
            option_value VARCHAR(16) \
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

    this._SQLoperation(SQLquery);
  }
  _transform_selectedDates(group_id) {
    let selectedDatesCopy = {};
    Object.entries(this.store[group_id].users).forEach((viewer) => {
      if (viewer[1].hasOwnProperty("dates") && viewer[1].dates.length > 0)
        selectedDatesCopy[viewer[0]] = viewer[1].dates.map((date) =>
          methods.transformIntToISO(date)
        );
      else selectedDatesCopy[viewer[0]] = [];
    });
    return selectedDatesCopy;
  }
  _transform_sessions(group_id) {
    let sessionsCopy = {};
    Object.entries(this.store[group_id].users).forEach((viewer) => {
      sessionsCopy[viewer[0]] = viewer[1].session;
    });
    return sessionsCopy;
  }
  _actualStore() {
    console.log("_actualStore");
    this.store = {};
    this._actualSessions()
      .then((resultSession) => {
        this._actualDates()
          .then((resultDate) => {
            this._actualSettings()
              .then((resultSetting) => {
                this._actualTime();
              })
              .catch((error) => {
                throw error;
              });
          })
          .catch((error) => {
            throw error;
          });
      })
      .catch((error) => {
        throw error;
      });
  }
  _actualTime() {
    Object.keys(this.store).forEach((group_id) => {
      this.store[group_id].lastChanged = Date.now();
      if (!this.store[group_id].hasOwnProperty("widgetWorker"))
        this.store[group_id].widgetWorker = 0;
    });
  }
  _actualSessions() {
    //console.log("_actualSessions")
    return new Promise((resolve, reject) => {
      let SQLquery = "SELECT * FROM `sessions`";
      this._SQLoperation(SQLquery)
        .then((result) => {
          result.forEach((el) => {
            if (!this.store.hasOwnProperty(el.group_id))
              this.store[el.group_id] = {
                users: {},
                setting: {},
                lastChanged: 0,
              };
            if (!this.store[el.group_id].users.hasOwnProperty(el.viewer_id))
              this.store[el.group_id].users[el.viewer_id] = {
                dates: [],
                session: {},
              };

            const {
              viewer_id,
              first_name,
              last_name,
              photo_100,
              viewer_type,
              can_access_closed,
            } = el;
            this.store[el.group_id].users[el.viewer_id].session = {
              viewer_id,
              first_name,
              last_name,
              photo_100,
              viewer_type,
              can_access_closed,
            };
          });
          return resolve(true);
        })
        .catch((error) => {
          throw error;
        });
    });
  }
  _actualDates() {
    //console.log("_actualDates")
    return new Promise((resolve, reject) => {
      let SQLquery = "SELECT group_id, viewer_id, date FROM `selected_dates`";
      this._SQLoperation(SQLquery)
        .then((result) => {
          result.forEach((el) => {
            if (this.store.hasOwnProperty(el.group_id)) {
              if (
                this.store[el.group_id].users.hasOwnProperty(el.viewer_id) &&
                this.store[el.group_id].users[el.viewer_id].hasOwnProperty(
                  "dates"
                )
              ) {
                this.store[el.group_id].users[el.viewer_id].dates.push(el.date);
              } else {
                this.store[el.group_id].users[el.viewer_id] = {
                  dates: [el.date],
                  session: {},
                };
              }
            }
          });
          return resolve(true);
        })
        .catch((error) => {
          throw error;
        });
    });
  }
  _actualSettings() {
    //console.log("_actualSettings")
    return new Promise((resolve, reject) => {
      let SQLquery = "SELECT * FROM `settings_allowed`";
      this._SQLoperation(SQLquery)
        .then((result) => {
          let optionsBuffer = {};
          result.forEach((el) => {
            if (this.store.hasOwnProperty(el.group_id)) {
              if (!optionsBuffer.hasOwnProperty(el.group_id))
                optionsBuffer[el.group_id] = {};
              optionsBuffer[el.group_id][el.option_name] = el.option_value;
            }
          });
          let SQLquery = "SELECT * FROM `settings_blockedDays`";
          this._SQLoperation(SQLquery)
            .then((result) => {
              result.forEach((el) => {
                if (!optionsBuffer[el.group_id].hasOwnProperty("blockedDays"))
                  optionsBuffer[el.group_id].blockedDays = [];
                optionsBuffer[el.group_id].blockedDays.push(el.option_value);
              });
              Object.keys(this.store).forEach((group_id) => {
                if (!optionsBuffer.hasOwnProperty(group_id))
                  optionsBuffer[group_id] = {};
                if (!optionsBuffer[group_id].hasOwnProperty("blockedDays"))
                  optionsBuffer[group_id].blockedDays = [];

                const settingObj = methods.optionsToObj(
                  optionsBuffer[group_id]
                );
                if (settingObj.hasOwnProperty("widgetToken")) {
                  const widgetToken = settingObj.widgetToken;
                  this.store[group_id].widgetToken = widgetToken;
                  delete settingObj.widgetToken;
                }
                this.store[group_id].setting = settingObj;

                if (
                  this.store[group_id].hasOwnProperty("widgetToken") &&
                  this.store[group_id].widgetToken.length > 80
                ) {
                  this.create_setting_widget(
                    group_id,
                    this.store[group_id].setting.widgetEnable,
                    this.store[group_id].widgetToken,
                    this.store[group_id].setting.widgetWeeks
                  );
                }

                if (
                  !this.store[group_id].hasOwnProperty("setting") ||
                  !methods.issetOptions(this.store[group_id].setting)
                ) {
                  this.store[group_id].setting = this.defaultSettings;
                  this.save_setting(group_id);
                }
              });
              return resolve(true);
            })
            .catch((error) => {
              throw error;
            });
        })
        .catch((error) => {
          throw error;
        });
    });
  }
  update_setting(group_id) {
    return new Promise((resolve, reject) => {
      let SQLquery =
        "SELECT * FROM `settings_allowed` \
                WHERE `group_id` = " +
        group_id +
        "; ";
      this._SQLoperation(SQLquery)
        .then((result) => {
          let optionsBuffer = {
            [group_id]: {},
          };
          this.store[group_id].setting = {};
          result.forEach((el) => {
            optionsBuffer[el.group_id][el.option_name] = el.option_value;
          });
          let SQLquery =
            "SELECT * FROM `settings_blockedDays` \
                    WHERE `group_id` = " +
            group_id +
            "; ";
          this._SQLoperation(SQLquery)
            .then((result) => {
              optionsBuffer[group_id].blockedDays = [];
              result.forEach((el) => {
                optionsBuffer[el.group_id].blockedDays.push(el.option_value);
              });

              const settingObj = methods.optionsToObj(optionsBuffer[group_id]);
              if (settingObj.hasOwnProperty("widgetToken")) {
                const widgetToken = settingObj.widgetToken;
                this.store[group_id].widgetToken = widgetToken;
                delete settingObj.widgetToken;
              }
              this.store[group_id].setting = settingObj;

              if (
                this.store[group_id].hasOwnProperty("widgetToken") &&
                this.store[group_id].widgetToken.length > 80
              )
                this.create_setting_widget(
                  group_id,
                  this.store[group_id].setting.widgetEnable,
                  this.store[group_id].widgetToken,
                  this.store[group_id].setting.widgetWeeks
                );

              if (
                !this.store[group_id].hasOwnProperty("setting") ||
                !methods.issetOptions(this.store[group_id].setting)
              ) {
                this.store[group_id].setting = this.defaultSettings;
                this.save_setting(group_id);
              }
              return resolve(true);
            })
            .catch((error) => {
              throw error;
            });
        })
        .catch((error) => {
          throw error;
        });
    });
  }
  create_session(
    api_id = 0,
    group_id = 0,
    viewer_id = 0,
    first_name = "",
    last_name = "",
    photo_100 = "",
    viewer_type = ""
  ) {
    console.log("create_session");
    const can_access_closed = methods.getRights(viewer_type) > 1 ? 1 : 0;
    /*let SQLquery = " \
            INSERT INTO `sessions` ( `viewer_id`, `api_id`, `group_id`, `first_name`, `last_name`, `photo_100`, `viewer_type`, `can_access_closed`, `session_key` ) \
            SELECT * FROM (SELECT "+viewer_id+", "+api_id+", "+group_id+", '"+first_name+"', '"+last_name+"', '"+photo_100+"', "+viewer_type+", "+can_access_closed+", '"+session_key+"') AS tmp \
            WHERE NOT EXISTS ( \
                SELECT viewer_id, group_id FROM `sessions` \
                    WHERE viewer_id = "+viewer_id+" AND group_id = "+group_id+" \
            ) LIMIT 1; ";*/
    let SQLquery =
      "DELETE FROM `sessions` WHERE viewer_id = " +
      viewer_id +
      " AND group_id = " +
      group_id +
      "; ";
    SQLquery +=
      "INSERT INTO `sessions` ( `api_id`, `group_id`, `viewer_id`, `first_name`, `last_name`, `photo_100`, `viewer_type`, `can_access_closed` ) \
            VALUES ( " +
      api_id +
      ", " +
      group_id +
      ", " +
      viewer_id +
      ", '" +
      first_name +
      "', '" +
      last_name +
      "', '" +
      photo_100 +
      "', '" +
      viewer_type +
      "', " +
      can_access_closed +
      " ); ";

    this._SQLoperation(SQLquery);

    if (!this.store.hasOwnProperty(group_id))
      this.store[group_id] = {
        users: {},
        setting: {},
        lastChanged: Date.now(),
      };
    if (
      !this.store[group_id].hasOwnProperty("setting") ||
      !methods.issetOptions(this.store[group_id].setting)
    ) {
      this.store[group_id].setting = this.defaultSettings;
      this.update_setting(group_id);
    }

    if (!this.store[group_id].users.hasOwnProperty(viewer_id))
      this.store[group_id].users[viewer_id] = { dates: [], session: {} };

    this.store[group_id].users[viewer_id].session = {
      viewer_id,
      first_name,
      last_name,
      photo_100,
      viewer_type,
      can_access_closed,
    };
    const selectedDatesCopy = this._transform_selectedDates(group_id);

    return {
      userGroups: this.get_usergroups(viewer_id),
      selectedDates: selectedDatesCopy,
      sessions: this._transform_sessions(group_id),
      selectedUserDates: selectedDatesCopy[viewer_id],
      lastChanged: this.store[group_id].lastChanged,
      rights: methods.getRights(
        this.store[group_id].users[viewer_id].session.viewer_type
      ),
      ...this.store[group_id].setting,
      today: methods.timezoneFix(),
    };
  }
  write_selected_date(group_id = 1, viewer_id = 1, date = 0) {
    if (
      Date.now() - date > 24 * 60 * 60 * 1000 ||
      !this.store.hasOwnProperty(group_id) ||
      !this.store[group_id].users.hasOwnProperty(viewer_id)
    )
      return { lastChanged: false };

    const index = this.store[group_id].users[viewer_id].dates.indexOf(date);
    let SQLquery = "";

    if (index === -1) {
      SQLquery =
        "INSERT INTO `selected_dates` (`group_id`, `viewer_id`, `date`) \
                VALUES (" +
        group_id +
        ", " +
        viewer_id +
        ", " +
        date +
        "); ";
    } else {
      SQLquery =
        "DELETE FROM `selected_dates` WHERE group_id = " +
        group_id +
        " AND viewer_id = " +
        viewer_id +
        " AND date = " +
        date +
        "; ";
    }
    this._SQLoperation(SQLquery);

    if (index === -1) {
      this.store[group_id].users[viewer_id].dates.push(date);
    } else {
      this.store[group_id].users[viewer_id].dates.splice(index, 1);
    }
    this.store[group_id].lastChanged = Date.now();
    const selectedDatesCopy = this._transform_selectedDates(group_id);
    return {
      selectedDates: selectedDatesCopy,
      sessions: this._transform_sessions(group_id),
      selectedUserDates: selectedDatesCopy[viewer_id],
      lastChanged: this.store[group_id].lastChanged,
      rights: methods.getRights(
        this.store[group_id].users[viewer_id].session.viewer_type
      ),
      accessMember: this.store[group_id].setting.accessMember,
    };
    //selectedUserDates: this.store[group_id][viewer_id].concat(date).map(el=>methods.transformIntToISO(el)),
    //selectedUserDates: this.store[group_id][viewer_id].slice(0,index).concat( this.store[group_id][viewer_id].slice(index+1,this.store[group_id][viewer_id].length) ).map(el=>methods.transformIntToISO(el)),
  }
  get_current(group_id = 1, viewer_id = 1, last = 1) {
    if (
      !this.store.hasOwnProperty(group_id) ||
      !this.store[group_id].users.hasOwnProperty(viewer_id) ||
      last === this.store[group_id].lastChanged
    ) {
      return { lastChanged: false };
    } else {
      const selectedDatesCopy = this._transform_selectedDates(group_id);
      return {
        selectedDates: selectedDatesCopy,
        sessions: this._transform_sessions(group_id),
        selectedUserDates: selectedDatesCopy[viewer_id],
        lastChanged: this.store[group_id].lastChanged,
        //rights: this.store[group_id].users[viewer_id].session.viewer_type,
        //...this.store[group_id].setting,
        today: methods.timezoneFix(),
      };
    }
  }
  save_setting(
    group_id,
    accessMember = false,
    widgetEnable = 0,
    widgetWeeks = 4,
    widgetAutoUpd = 0,
    widgetToken = "",
    autoUpd = true,
    allowedDays1 = 1,
    allowedDays2 = 1,
    allowedDays3 = 1,
    allowedDays4 = 1,
    allowedDays5 = 1,
    allowedDays6 = 1,
    allowedDays7 = 1,
    allowedDaysMin = new Date().getFullYear() + "-01-01",
    allowedDaysMax = new Date().getFullYear() + 1 + "-12-31",
    blockedDays = []
  ) {
    console.log("save_setting");
    widgetWeeks = parseInt(widgetWeeks);
    let SQLquery = "";
    SQLquery +=
      "DELETE FROM `settings_allowed` WHERE group_id = " + group_id + "; ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'accessMember','" +
      (accessMember ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'widgetEnable','" +
      widgetEnable +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'widgetWeeks','" +
      widgetWeeks +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays1','" +
      (allowedDays1 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays2','" +
      (allowedDays2 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays3','" +
      (allowedDays3 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays4','" +
      (allowedDays4 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays5','" +
      (allowedDays5 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays6','" +
      (allowedDays6 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDays7','" +
      (allowedDays7 ? 1 : 0) +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDaysMin','" +
      allowedDaysMin +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'allowedDaysMax','" +
      allowedDaysMax +
      "'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'widgetAutoUpd','0'); ";
    SQLquery +=
      "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
      group_id +
      ",'autoUpd'," +
      (autoUpd ? 1 : 0) +
      "); ";

    if (widgetToken.length > 80)
      SQLquery +=
        "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
            VALUES (" +
        group_id +
        ",'widgetToken','" +
        widgetToken +
        "'); ";
    SQLquery +=
      "DELETE FROM `settings_blockedDays` WHERE group_id = " + group_id + "; ";
    blockedDays.forEach((date) => {
      SQLquery +=
        "INSERT INTO `settings_blockedDays` (`group_id`, `option_value`) \
            VALUES (" +
        group_id +
        ",'" +
        date +
        "'); ";
    });
    this._SQLoperation(SQLquery);

    this.store[group_id].setting = {
      accessMember,
      widgetEnable,
      widgetWeeks,
      widgetAutoUpd: !!widgetAutoUpd,
      weekDay: [
        !!allowedDays1,
        !!allowedDays2,
        !!allowedDays3,
        !!allowedDays4,
        !!allowedDays5,
        !!allowedDays6,
        !!allowedDays7,
      ],
      period: [allowedDaysMin, allowedDaysMax],
      autoUpd,
      blockedDays,
    };
    this.store[group_id].lastChanged = Date.now();
    if (widgetToken.length > 80)
      this.create_setting_widget(
        group_id,
        widgetEnable,
        widgetToken,
        widgetWeeks
      );

    return this.get_setting(group_id);
  }
  get_usergroups(viewer_id) {
    let userGroups = [];
    for (const [key, value] of Object.entries(this.store)) {
      for (const [user_key] of Object.entries(value.users)) {
        if (parseInt(user_key) === viewer_id) userGroups.push(key);
      }
    }

    return userGroups;
  }
  get_setting(group_id) {
    if (
      this.store[group_id].hasOwnProperty("setting") &&
      methods.issetOptions(this.store[group_id].setting)
    ) {
      return {
        ...this.store[group_id].setting,
        selectedDates: this._transform_selectedDates(group_id),
        today: methods.timezoneFix(),
      };
    } else {
      return this.update_setting(group_id)
        .then((result) => {
          return {
            ...this.store[group_id].setting,
            selectedDates: this._transform_selectedDates(group_id),
            today: methods.timezoneFix(),
          };
        })
        .catch((error) => {
          throw error;
        });
    }
    //return {...this.store[group_id].setting, selectedDates: this._transform_selectedDates(group_id), today: methods.timezoneFix() }
  }
  create_setting_widget(
    group_id,
    widgetEnable = 0,
    widgetToken = "",
    widgetWeeks = 4
  ) {
    if (
      typeof widgetToken !== "string" ||
      widgetToken.length < 80 ||
      widgetToken.length > 100 ||
      widgetWeeks < 1 ||
      widgetWeeks > 10 ||
      widgetEnable === 0
    ) {
      this.store[group_id].setting.widgetAutoUpd = false;
      return;
    }
    this.store[group_id].setting.widgetEnable = 2;
    this.store[group_id].widgetWorker = 0;
    clearTimeout(this.store[group_id].widgetWorker);

    const end_request = (
      group_id,
      widgetToken,
      widgetAutoUpd,
      time = 1000 * 60 * 5
    ) => {
      let SQLquery = "";
      SQLquery +=
        "DELETE FROM `settings_allowed` WHERE group_id = " +
        group_id +
        " AND option_name = 'widgetEnable'; ";
      SQLquery +=
        "DELETE FROM `settings_allowed` WHERE group_id = " +
        group_id +
        " AND option_name = 'widgetToken'; ";
      SQLquery +=
        "DELETE FROM `settings_allowed` WHERE group_id = " +
        group_id +
        " AND option_name = 'widgetAutoUpd'; ";
      SQLquery +=
        "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
                VALUES (" +
        group_id +
        ",'widgetEnable','2'); ";
      SQLquery +=
        "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
                VALUES (" +
        group_id +
        ",'widgetToken','" +
        widgetToken +
        "'); ";
      SQLquery +=
        "INSERT INTO `settings_allowed` (`group_id`, `option_name`, `option_value`) \
                VALUES (" +
        group_id +
        ",'widgetAutoUpd','" +
        (widgetAutoUpd ? 1 : 0) +
        "'); ";
      this._SQLoperation(SQLquery);
      this.store[group_id].widgetToken = widgetToken;
      this.store[group_id].setting.widgetAutoUpd = widgetAutoUpd;

      if (widgetAutoUpd) {
        console.log("widgetWorker: " + group_id);
        //const selectedDatesCopy = this._transform_selectedDates(group_id)
        this.store[group_id].widgetWorker = setTimeout(
          widget_update,
          time,
          group_id,
          widgetToken
        );
      } else {
        clearTimeout(this.store[group_id].widgetWorker);
      }
    };
    //const token = 'd04dfff761f778a7e3fc5f07c9f1a68df9cc09a1dd6f161a3336a40388982290c36f612557eae36748107'
    //const glob_token = '881ff904881ff904881ff9040688779a868881f881ff904d44d2e32db3a8e46303be4be'
    const widget_update = (group_id, widgetToken) => {
      const selectedDates = this._transform_selectedDates(group_id);
      const { widgetWeeks, blockedDays, period, weekDay } = this.store[
        group_id
      ].setting;

      const widget = methods.construct_widget(
        group_id,
        selectedDates,
        widgetWeeks,
        blockedDays,
        period,
        weekDay
      );
      const options = {
        url: "https://api.vk.com/method/appWidgets.update",
        form: {
          type: "table",
          access_token: widgetToken,
          code: widget,
          v: "5.92",
        },
        headers: { "Content-type": "application/x-www-form-urlencoded" },
      };

      request.post(options, (error, res, body) => {
        if (error) throw error;
        body = JSON.parse(body);

        const isSuc = res.statusCode === 200 && body.response === 1;
        end_request(group_id, widgetToken, isSuc);
        if (body.hasOwnProperty("error")) {
          if (body.error.error_code === 9) {
            end_request(group_id, widgetToken, true, 1000 * 60 * 10);
          } else {
            this.store[group_id].setting.widgetAutoUpd = false;
            return body.error.error_msg;
          }
        }
      });
    };
    const selectedDatesCopy = this._transform_selectedDates(group_id);
    widget_update(group_id, widgetToken, selectedDatesCopy);
  }
}

const data_obj = new Data();

exports.create_session = async ({
  api_id,
  group_id,
  viewer_id,
  first_name,
  last_name,
  photo_100,
  viewer_type,
}) =>
  await data_obj.create_session(
    api_id,
    group_id,
    viewer_id,
    first_name,
    last_name,
    photo_100,
    viewer_type
  );

exports.write_selected_date = async (group_id, viewer_id, selectedUserDate) =>
  await data_obj.write_selected_date(group_id, viewer_id, selectedUserDate);

exports.get_current = async (group_id, viewer_id, last) =>
  await data_obj.get_current(group_id, viewer_id, last);

exports.save_setting = async (
  group_id,
  accessMember,
  widgetEnable,
  widgetWeeks,
  widgetAutoUpd,
  widgetToken,
  autoUpd,
  allowedDays1,
  allowedDays2,
  allowedDays3,
  allowedDays4,
  allowedDays5,
  allowedDays6,
  allowedDays7,
  allowedDaysMin,
  allowedDaysMax,
  blockedDays
) =>
  await data_obj.save_setting(
    group_id,
    accessMember,
    widgetEnable,
    widgetWeeks,
    widgetAutoUpd,
    widgetToken,
    autoUpd,
    allowedDays1,
    allowedDays2,
    allowedDays3,
    allowedDays4,
    allowedDays5,
    allowedDays6,
    allowedDays7,
    allowedDaysMin,
    allowedDaysMax,
    blockedDays
  );

exports.usergroups = async (viewer_id) =>
  await data_obj.get_usergroups(viewer_id);

exports.get_setting = async (group_id) => await data_obj.get_setting(group_id);

exports.check_store = async () => await data_obj._check_store();

/*this.store = {
	[group_id]: {
		users: {
			[viewer_id]: {
                dates: [ 1551830400000, 1554940800000, 1555545600000, 1555113600000 ],
                session: {
                    viewer_id: 538581761,
                    first_name,
                    last_name,
                    photo_100,
                    viewer_type,
                    can_access_closed,
                    session_key: 'ihb7nqvuxh_177563473_538581761'
                }
            }
		}
		setting: {
			widgetEnable: 0,
            widgetWeeks: 4,
            widget: "",
            widgetAutoUpd: false,
            weekDay: [true,true,true,true,true,true,true],
            period: [new Date().getFullYear()+"-01-01",(new Date().getFullYear()+1)+"-12-31"],
            blockedDays: [],
            autoUpd: true
		},
        lastChanged: 0,
        widgetWorker: 0
        widgetToken: ''
    }
}*/
