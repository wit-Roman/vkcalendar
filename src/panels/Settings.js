import React, { Component } from "react";
import { connect } from "react-redux";
import {
  changePanel,
  apiRequestChange,
  apiConnect,
  apiSaveSettings,
  addWidget,
} from "../store.js";

import {
  format,
  formatISO,
  endOfWeek,
  startOfWeek,
  endOfYesterday,
  addDays,
  isAfter,
  isBefore,
  startOfToday,
  addYears,
  addWeeks,
  differenceInDays,
  getDate,
  parse,
} from "date-fns";
import ruLocale from "date-fns/locale/ru";

import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Title,
  Group,
  Cell,
  Header,
  Checkbox,
  Button,
  Input,
  Switch,
  Snackbar,
} from "@vkontakte/vkui";
import Icon28ChevronBack from "@vkontakte/icons/dist/28/chevron_back";
import Icon28BugOutline from "@vkontakte/icons/dist/28/bug_outline";
import Icon28CheckCircleOutline from "@vkontakte/icons/dist/28/check_circle_outline";

import OptionCalendar from "../components/OptionCalendar.js";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props, snackbar: null };
  }
  blockDay = (day) => {
    const arr = this.state.blockedDays;
    const arrDay = arr.indexOf(day);
    if (arrDay === -1) {
      this.setState({ blockedDays: arr.concat(day) });
    } else {
      arr.splice(arrDay, 1);
      this.setState({ blockedDays: arr });
      //arr.concat( arr.slice(0, arrDay-1), arr.slice(arrDay+1, arr.length)
    }
  };
  handleAddWidget(check) {
    if (!check) return this.setState({ widgetEnable: 0 });

    const { selectedDates, group_id, app_id, currentDate } = this.props;
    const { widgetWeeks, blockedDays, weekDay, period } = this.state;
    const startDate = startOfWeek(currentDate, { weekStartsOn: 6 });
    //const monthEnd = endOfMonth(currentDate)
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
          parse(d, "yyyy-MM-dd", new Date(), { locale: ruLocale }),
          endOfYesterday(currentDate)
        ) ||
        isBefore(
          parse(d, "yyyy-MM-dd", new Date(), { locale: ruLocale }),
          parse(period[0], "yyyy-MM-dd", new Date(), { locale: ruLocale })
        ) ||
        isAfter(
          parse(d, "yyyy-MM-dd", new Date(), { locale: ruLocale }),
          parse(period[1], "yyyy-MM-dd", new Date(), { locale: ruLocale })
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
      "more_url": "https://vk.com/club' +
      group_id +
      "?w=app" +
      app_id +
      "_-" +
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

    this.props.addWidget(code).then((result) => {
      if (result) this.setState({ widgetEnable: 1 });
      else this.openSnackbar("Запрос не отправлен");
    });
  }

  handleSaveSettings = () => {
    this.props.apiSaveSettings(this.state).then((result) => {
      if (!!result) this.openSnackbar("Успешно сохранено");
    });
  };

  openSnackbar = (text) => {
    if (this.state.snackbar) return;
    this.setState({
      snackbar: (
        <Snackbar
          layout="vertical"
          onClose={() => this.setState({ snackbar: null })}
          before={
            text === "Успешно сохранено" ? (
              <Icon28CheckCircleOutline />
            ) : (
              <Icon28BugOutline />
            )
          }
        >
          {text}
        </Snackbar>
      ),
    });
  };

  render = () => (
    <Panel id={this.props.id}>
      <PanelHeader
        left={
          <PanelHeaderButton
            onClick={() => {
              this.props.changePanel(1);
            }}
          >
            <Icon28ChevronBack />
          </PanelHeaderButton>
        }
      >
        <Title level={this.props.platform[0] ? "3" : "2"} weight="regular">
          Настройки
        </Title>
      </PanelHeader>

      <Group title="Общие">
        <Cell indicator={this.props.currentDate.toISOString()}>
          Время сервера
        </Cell>
        <Cell
          indicator={this.state.accessMember ? "Вкл" : "Выкл"}
          asideContent={
            <Switch
              onChange={(e) => {
                this.setState({ accessMember: e.target.checked });
              }}
              defaultChecked={this.state.accessMember}
            />
          }
        >
          Разрешить запись только участникам сообщества
        </Cell>
        <Cell
          indicator={this.state.autoUpd ? "Вкл" : "Выкл"}
          asideContent={
            <Switch
              onChange={(e) => {
                this.setState({ autoUpd: e.target.checked });
              }}
              defaultChecked={this.state.autoUpd}
            />
          }
        >
          Автообновление записей каждые 8 секунд
        </Cell>
      </Group>

      <Group title="Виджет группы">
        <Cell
          indicator={
            this.state.widgetEnable && this.props.widgetAutoUpd ? "Вкл" : "Выкл"
          }
          asideContent={
            <Switch
              checked={this.state.widgetEnable}
              onChange={(e) => {
                this.handleAddWidget(e.currentTarget.checked);
              }}
            />
          }
        >
          Публикация виджета в сообществе, состояние:
        </Cell>
        <Cell
          asideContent={
            <Input
              className="setting_form_input_number"
              min="0"
              max="6"
              type="number"
              onChange={(e) => {
                this.setState({
                  widgetWeeks:
                    e.target.value > 0 &&
                    e.target.value < 7 &&
                    parseInt(e.target.value),
                });
              }}
              value={this.state.widgetWeeks}
            />
          }
        >
          Количество недель виджета
        </Cell>
      </Group>

      <Group>
        <Cell>
          Ограничение по дням недели
          <div className="row-wrap">
            <Checkbox
              checked={this.state.weekDay[0]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 0 ? !el : el
                  ),
                });
              }}
            >
              ПН
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[1]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 1 ? !el : el
                  ),
                });
              }}
            >
              ВТ
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[2]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 2 ? !el : el
                  ),
                });
              }}
            >
              СР
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[3]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 3 ? !el : el
                  ),
                });
              }}
            >
              ЧТ
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[4]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 4 ? !el : el
                  ),
                });
              }}
            >
              ПТ
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[5]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 5 ? !el : el
                  ),
                });
              }}
            >
              СБ
            </Checkbox>
            <Checkbox
              checked={this.state.weekDay[6]}
              onChange={() => {
                this.setState({
                  weekDay: this.state.weekDay.map((el, i) =>
                    i === 6 ? !el : el
                  ),
                });
              }}
            >
              ВС
            </Checkbox>
          </div>
        </Cell>
        <Cell
          asideContent={
            <div className={!this.props.platform[0] ? "row" : ""}>
              &nbsp;
              <Input
                type="date"
                value={this.state.period[0]}
                onChange={(e) => {
                  this.setState({
                    period: [e.target.value, this.state.period[1]],
                  });
                }}
                min={formatISO(startOfToday(this.props.currentDate), {
                  representation: "date",
                })}
                max={formatISO(addYears(this.props.currentDate, 1), {
                  representation: "date",
                })}
              />
              &nbsp;
              <Input
                type="date"
                value={this.state.period[1]}
                onChange={(e) => {
                  this.setState({
                    period: [this.state.period[0], e.target.value],
                  });
                }}
                min={formatISO(startOfToday(this.props.currentDate), {
                  representation: "date",
                })}
                max={formatISO(addYears(this.props.currentDate, 1), {
                  representation: "date",
                })}
              />
            </div>
          }
        >
          Задать временной промежуток
        </Cell>
        <Cell>
          <Button
            onClick={() => {
              this.handleSaveSettings();
            }}
            size="l"
            stretched
          >
            Сохранить настройки
          </Button>
        </Cell>
      </Group>

      <Group
        title="Заблокировать день"
        header={<Header mode="secondary">Заблокированные дни</Header>}
      >
        <OptionCalendar
          period={this.state.period}
          weekDay={this.state.weekDay}
          blockedDays={this.state.blockedDays}
          currentDate={this.props.currentDate}
          platform={this.props.platform}
          blockDay={(day) => {
            this.blockDay(day);
          }}
        />
      </Group>

      {this.state.snackbar}
    </Panel>
  );
}

const mapStateToProps = ({
  access_token,
  group_id,
  app_id,
  group_role,
  viewer_id,
  fetchedUser,
  accessMember,
  selectedDates,
  widgetEnable,
  widgetAutoUpd,
  widgetWeeks,
  autoUpd,
  weekDay,
  period,
  blockedDays,
  currentDate,
  AutoUpdEnabled,
  activePanel,
  platform,
}) => ({
  access_token,
  group_id,
  app_id,
  group_role,
  viewer_id,
  fetchedUser,
  accessMember,
  selectedDates,
  widgetEnable,
  widgetAutoUpd,
  widgetWeeks,
  autoUpd,
  weekDay,
  period,
  blockedDays,
  currentDate,
  AutoUpdEnabled,
  activePanel,
  platform,
});

const mapDispatchToProps = (dispatch) => ({
  changePanel: (panelNum) => dispatch(changePanel(panelNum), "PANEL"),
  apiRequestChange: (day) => dispatch(apiRequestChange(day), "CHNG"),
  apiConnect: (is_open) => dispatch(apiConnect(is_open), "UPD"),
  apiSaveSettings: (settings) => dispatch(apiSaveSettings(settings), "OPTION"),
  addWidget: (code) => dispatch(addWidget(code)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
