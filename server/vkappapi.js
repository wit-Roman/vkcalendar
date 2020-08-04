const methods = require("./static-methods.js");
const connects = require("./connects.js");
const model = require("./model.js");
const express = require("express")();
const port = parseInt(process.env.PORT, 10) || 4007;
const dev = process.env.NODE_ENV !== "production";
require("events").EventEmitter.defaultMaxListeners = 256;

express.disable("x-powered-by");
express.use((req, res, next) => {
  //res.header("Access-Control-Allow-Origin", "*");

  if (connects.whitelist.includes(req.headers.origin))
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, X-Accel-Buffering"
  );

  next();
});
express.use("/img", require("express").static("server/img"));

express.get("/", (req, res) => {
  res.send("Hello World!");
});

express.post("/session", (req, res) => {
  req.accepts("application/json");
  //return res.status(200).send("ok");

  let bodyData = "";
  req.on("data", (data) => {
    bodyData += data;
  });
  req.on("end", () => {
    const body = JSON.parse(bodyData);

    if (!methods.validateSession(body) || !methods.verification(body.url))
      return res.status(400).send("400");

    const param = {
      api_id: parseInt(body.app_id),
      group_id: parseInt(body.group_id),
      viewer_id: parseInt(body.viewer_id),
      viewer_type: body.group_role.toString(),
      first_name: body.fetchedUser.first_name.toString(),
      last_name: body.fetchedUser.last_name.toString(),
      photo_100: body.fetchedUser.photo_100.toString(),
    };

    model
      .create_session(param)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        console.log(error);
        return res.status(404).send("404");
      });
  });
});

express.get("/change", (req, res) => {
  req.accepts("application/json");

  if (!methods.validateDate(req.query.d)) return res.status(400).send("400");
  const selectedUserDateInt = Date.parse(req.query.d);

  if (!req.query.hasOwnProperty("g") || isNaN(req.query.g) || !req.query.g)
    return res.status(400).send("400");
  const group_id = parseInt(req.query.g);

  if (!req.query.hasOwnProperty("v") || isNaN(req.query.v) || !req.query.v)
    return res.status(400).send("400");
  const viewer_id = parseInt(req.query.v);

  model
    .write_selected_date(group_id, viewer_id, selectedUserDateInt)
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((error) => {
      console.log(error);
      return res.status(404).send("404");
    });
});

//data: {"selectedDates":{"33198675":["2020-04-08","2020-04-09","2020-05-05","2020-04-07","2020-04-15","2020-04-25","2020-04-16"]},"sessions":{"33198675":{"viewer_id":33198675,"first_name":"Роман","last_name":"Булычёв","photo_50":"https://sun9-7.userapi.com/c854024/v854024793/176f16/MTFLTawbRtk.jpg?ava=1","viewer_type":4,"can_access_closed":1,"session_key":"blby7d1hmz_181462312_33198675"}},"selectedUserDates":["2020-04-08","2020-04-09","2020-05-05","2020-04-07","2020-04-15","2020-04-25","2020-04-16"],"lastChanged":1586640075871,"rights":4,"weekDay":[true,true,true,true,true,true,true],"period":["2020-01-01","2021-12-31"],"blockedDays":[],"accessMember":false,"widgetEnable":0,"widgetWeeks":4,"autoUpd":false,"today":1586650930353}

express.get("/val", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  if (!req.query.hasOwnProperty("g") || isNaN(req.query.g) || !req.query.g)
    return res.status(400).send("400");
  const group_id = parseInt(req.query.g);

  if (!req.query.hasOwnProperty("v") || isNaN(req.query.v) || !req.query.v)
    return res.status(400).send("400");
  const viewer_id = parseInt(req.query.v);

  let last = 0;
  const sendWorker = () => {
    model
      .get_current(group_id, viewer_id, last)
      .then((result) => {
        //console.log("SSE: "+viewer_id)
        if (!!result.lastChanged) {
          last = result.lastChanged;
          res.write(`data: ${JSON.stringify(result)}\n\n`);
          //res.flushHeaders();
        }
        //console.log("session:"+viewer_id, last, result.lastChanged)
      })
      .catch((error) => {
        console.log(error);
        clearTimeout(sendWorkerRepeat);
        return res.status(404).send("404");
      });

    const sendWorkerRepeat = setTimeout(sendWorker, 8000);
    req.on("close", () => {
      clearTimeout(sendWorkerRepeat);
    });
  };
  sendWorker();
});

express.get("/usergroups", (req, res) => {
  req.accepts("application/json");

  if (!req.query.hasOwnProperty("v") || isNaN(req.query.v) || !req.query.v)
    return res.status(400).send("400");

  const viewer_id = parseInt(req.query.v);

  model
    .usergroups(viewer_id)
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((error) => {
      console.log(error);
      return res.status(404).send("404");
    });
});
// {"weekDay":[true,true,true,true,true,true,true],"period":["2019-01-01","2020-12-31"],"blockedDays":["2019-10-17"],"accessMember":false,"widgetEnable":0,"widgetWeeks":4,"autoUpd":false,"selectedDates":{"33198675":["2019-10-18","2019-10-05","2019-10-19","2019-10-12","2019-12-19","2019-12-29","2020-02-25","2020-03-26","2020-02-26","2020-02-27","2020-03-24","2020-03-21","2020-04-09","2020-04-16","2020-04-22"],"541644989":["2019-12-31","2020-01-01","2020-01-03","2020-02-28"]},"today":1586685657246}
express.get("/setting", (req, res) => {
  req.accepts("application/json");

  if (!req.query.hasOwnProperty("g") || isNaN(req.query.g) || !req.query.g)
    return res.status(400).send("400");
  const group_id = parseInt(req.query.g);

  model
    .get_setting(group_id)
    .then((result) => {
      return res.status(200).send(result);
    })
    .catch((error) => {
      console.log(error);
      return res.status(404).send("Not Found");
    });
});

express.post("/setting", (req, res) => {
  req.accepts("application/json");

  let bodyData = "";
  req.on("data", (data) => {
    bodyData += data;
  });
  req.on("end", () => {
    //console.log(JSON.parse(bodyData))
    const {
      accessMember,
      widgetEnable,
      widgetWeeks,
      widgetAutoUpd,
      widgetToken,
      autoUpd,
      blockedDays,
      group_id,
      weekDay,
      period,
    } = JSON.parse(bodyData);
    const [
      allowedDays1,
      allowedDays2,
      allowedDays3,
      allowedDays4,
      allowedDays5,
      allowedDays6,
      allowedDays7,
    ] = weekDay;
    const [allowedDaysMin, allowedDaysMax] = period;

    if (!group_id || isNaN(group_id)) return res.status(400).send("400");
    if (
      !methods.validateSettings(
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
      )
    )
      return res.status(400).send("400");

    model
      .save_setting(
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
      )
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        console.log(error);
        return res.status(422).send("422");
      });
  });
});

express.get("/checkstore", (req, res) => {
  model
    .check_store()
    .then((result) => {
      return res.status(200).send(JSON.stringify(result));
    })
    .catch((error) => {
      console.log(error);
      return res.status(422).send("Unprocessable Entity");
    });
});

express.listen(port, () => {
  console.log("VkAppApi listening on port " + port);
});
